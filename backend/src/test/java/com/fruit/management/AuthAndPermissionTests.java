package com.fruit.management;

import com.fruit.management.common.ApiResponse;
import com.fruit.management.common.BusinessException;
import com.fruit.management.domain.Fruit;
import com.fruit.management.domain.UserRole;
import com.fruit.management.domain.Vendor;
import com.fruit.management.dto.FruitCreateRequest;
import com.fruit.management.dto.LoginResponse;
import com.fruit.management.dto.VendorAdminResponse;
import com.fruit.management.dto.VendorUpsertRequest;
import com.fruit.management.repository.jpa.UserSessionJpaRepository;
import com.fruit.management.service.AuthService;
import com.fruit.management.service.FruitService;
import com.fruit.management.service.VendorService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class AuthAndPermissionTests {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private VendorService vendorService;

    @Autowired
    private FruitService fruitService;

    @Autowired
    private AuthService authService;

    @Autowired
    private UserSessionJpaRepository sessionRepository;

    @Test
    void registerVendorAndLoginReturnsToken() {
        ResponseEntity<ApiResponse<LoginResponse>> registerResponse = register("vendor-auth-a", "pass123456", UserRole.VENDOR);

        assertThat(registerResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(registerResponse.getBody()).isNotNull();
        LoginResponse registered = registerResponse.getBody().data();
        assertThat(registered.token()).isNotBlank();
        assertThat(registered.role()).isEqualTo(UserRole.VENDOR);
        assertThat(sessionRepository.findById(registered.token()))
                .isPresent()
                .get()
                .extracting("userId")
                .isEqualTo(registered.userId());

        ResponseEntity<ApiResponse<LoginResponse>> loginResponse = login("vendor-auth-a", "pass123456");

        assertThat(loginResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(loginResponse.getBody()).isNotNull();
        assertThat(loginResponse.getBody().data().username()).isEqualTo("vendor-auth-a");
        assertThat(loginResponse.getBody().data().role()).isEqualTo(UserRole.VENDOR);
    }

    @Test
    void protectedVendorApiRequiresBearerToken() {
        ResponseEntity<ApiResponse<Void>> response = restTemplate.exchange(
                baseUrl() + "/api/vendor/profile",
                HttpMethod.GET,
                HttpEntity.EMPTY,
                new ParameterizedTypeReference<>() {
                }
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().code()).isEqualTo(401);
    }

    @Test
    void vendorCannotUpdateAnotherVendorsFruit() {
        register("vendor-owner-a", "pass123456", UserRole.VENDOR);
        register("vendor-owner-b", "pass123456", UserRole.VENDOR);
        vendorService.upsertCurrentVendor("vendor-owner-a", vendor("A"));
        vendorService.upsertCurrentVendor("vendor-owner-b", vendor("B"));
        Fruit fruit = fruitService.createFruit("vendor-owner-a", new FruitCreateRequest(
                "苹果",
                new BigDecimal("8.80"),
                "斤",
                List.of(),
                List.of("脆甜"),
                "A vendor fruit"
        ));
        String tokenB = loginToken("vendor-owner-b", "pass123456");

        ResponseEntity<ApiResponse<Void>> response = restTemplate.exchange(
                baseUrl() + "/api/fruits/" + fruit.getId(),
                HttpMethod.PUT,
                new HttpEntity<>("""
                        {
                          "name": "越权苹果",
                          "price": 9.90,
                          "unit": "斤",
                          "images": [],
                          "tags": [],
                          "description": "should fail"
                        }
                        """, bearerJsonHeaders(tokenB)),
                new ParameterizedTypeReference<>() {
                }
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().code()).isEqualTo(403);
    }

    @Test
    void vendorCannotReadAnotherVendorsPrivateFruitDetail() {
        register("vendor-reader-a", "pass123456", UserRole.VENDOR);
        register("vendor-reader-b", "pass123456", UserRole.VENDOR);
        vendorService.upsertCurrentVendor("vendor-reader-a", vendor("ReaderA"));
        vendorService.upsertCurrentVendor("vendor-reader-b", vendor("ReaderB"));
        Fruit fruit = fruitService.createFruit("vendor-reader-a", new FruitCreateRequest(
                "梨",
                new BigDecimal("6.80"),
                "斤",
                List.of(),
                List.of("清甜"),
                "A private vendor fruit"
        ));
        String tokenB = loginToken("vendor-reader-b", "pass123456");

        ResponseEntity<ApiResponse<Void>> response = restTemplate.exchange(
                baseUrl() + "/api/vendor/fruits/" + fruit.getId(),
                HttpMethod.GET,
                new HttpEntity<>(bearerJsonHeaders(tokenB)),
                new ParameterizedTypeReference<>() {
                }
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().code()).isEqualTo(403);
    }

    @Test
    void superAdminCanDisableVendor() {
        authService.createUser("admin-test-a", "pass123456", "Admin", UserRole.SUPER_ADMIN);
        Vendor vendor = vendorService.upsertCurrentVendor("managed-vendor-a", vendor("Managed"));
        String token = loginToken("admin-test-a", "pass123456");

        ResponseEntity<ApiResponse<VendorAdminResponse>> response = restTemplate.exchange(
                baseUrl() + "/api/admin/vendors/" + vendor.getId() + "/enabled",
                HttpMethod.POST,
                new HttpEntity<>("{\"enabled\":false}", bearerJsonHeaders(token)),
                new ParameterizedTypeReference<>() {
                }
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().data().enabled()).isFalse();
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> vendorService.getPublicVendor(vendor.getId()))
                .isInstanceOf(BusinessException.class)
                .hasMessage("vendor not found");
    }

    private ResponseEntity<ApiResponse<LoginResponse>> register(String username, String password, UserRole role) {
        return restTemplate.exchange(
                baseUrl() + "/api/auth/register",
                HttpMethod.POST,
                new HttpEntity<>("""
                        {
                          "username": "%s",
                          "password": "%s",
                          "nickname": "%s",
                          "role": "%s"
                        }
                        """.formatted(username, password, username, role.name()), jsonHeaders()),
                new ParameterizedTypeReference<>() {
                }
        );
    }

    private ResponseEntity<ApiResponse<LoginResponse>> login(String username, String password) {
        return restTemplate.exchange(
                baseUrl() + "/api/auth/login",
                HttpMethod.POST,
                new HttpEntity<>("""
                        {
                          "username": "%s",
                          "password": "%s"
                        }
                        """.formatted(username, password), jsonHeaders()),
                new ParameterizedTypeReference<>() {
                }
        );
    }

    private String loginToken(String username, String password) {
        ResponseEntity<ApiResponse<LoginResponse>> response = login(username, password);
        assertThat(response.getBody()).isNotNull();
        return response.getBody().data().token();
    }

    private VendorUpsertRequest vendor(String suffix) {
        return new VendorUpsertRequest("摊位" + suffix, "地址" + suffix, 39.9, 116.4, "13800138000");
    }

    private HttpHeaders jsonHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_TYPE, "application/json");
        return headers;
    }

    private HttpHeaders bearerJsonHeaders(String token) {
        HttpHeaders headers = jsonHeaders();
        headers.setBearerAuth(token);
        return headers;
    }

    private String baseUrl() {
        return "http://localhost:" + port;
    }
}
