package com.fruit.management;

import com.fruit.management.common.ApiResponse;
import com.fruit.management.domain.Fruit;
import com.fruit.management.dto.FruitCreateRequest;
import com.fruit.management.dto.LoginResponse;
import com.fruit.management.dto.VendorUpsertRequest;
import com.fruit.management.repository.jpa.UserSessionJpaRepository;
import com.fruit.management.service.FruitService;
import com.fruit.management.service.VendorService;
import com.github.tomakehurst.wiremock.WireMockServer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
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
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.math.BigDecimal;
import java.util.List;

import static com.github.tomakehurst.wiremock.client.WireMock.get;
import static com.github.tomakehurst.wiremock.client.WireMock.getRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.equalTo;
import static com.github.tomakehurst.wiremock.client.WireMock.okJson;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathEqualTo;
import static com.github.tomakehurst.wiremock.core.WireMockConfiguration.wireMockConfig;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class AuthAndPermissionTests {
    private static final WireMockServer WIRE_MOCK = new WireMockServer(wireMockConfig().dynamicPort());

    static {
        WIRE_MOCK.start();
    }

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private VendorService vendorService;

    @Autowired
    private FruitService fruitService;

    @Autowired
    private UserSessionJpaRepository sessionRepository;

    @DynamicPropertySource
    static void authProperties(DynamicPropertyRegistry registry) {
        registry.add("fruit.wechat.appid", () -> "test-appid");
        registry.add("fruit.wechat.secret", () -> "test-secret");
        registry.add("fruit.wechat.code2-session-url", () -> WIRE_MOCK.baseUrl() + "/sns/jscode2session");
    }

    @BeforeEach
    void resetWireMock() {
        WIRE_MOCK.resetAll();
    }

    @AfterAll
    static void stopWireMock() {
        WIRE_MOCK.stop();
    }

    @Test
    void loginCallsWechatCode2SessionAndReturnsToken() {
        WIRE_MOCK.stubFor(get(urlPathEqualTo("/sns/jscode2session"))
                .willReturn(okJson("{\"openid\":\"openid-vendor-a\",\"session_key\":\"session-a\"}")));

        ResponseEntity<ApiResponse<LoginResponse>> response = restTemplate.exchange(
                baseUrl() + "/api/auth/login",
                HttpMethod.POST,
                new HttpEntity<>("{\"code\":\"wx-code-a\"}", jsonHeaders()),
                new ParameterizedTypeReference<>() {
                }
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        String token = response.getBody().data().token();
        assertThat(token).isNotBlank();
        assertThat(sessionRepository.findById(token))
                .isPresent()
                .get()
                .extracting("openid")
                .isEqualTo("openid-vendor-a");
        WIRE_MOCK.verify(getRequestedFor(urlPathEqualTo("/sns/jscode2session"))
                .withQueryParam("appid", equalTo("test-appid"))
                .withQueryParam("secret", equalTo("test-secret"))
                .withQueryParam("js_code", equalTo("wx-code-a"))
                .withQueryParam("grant_type", equalTo("authorization_code")));
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
        vendorService.upsertCurrentVendor("openid-vendor-a", vendor("A"));
        vendorService.upsertCurrentVendor("openid-vendor-b", vendor("B"));
        Fruit fruit = fruitService.createFruit("openid-vendor-a", new FruitCreateRequest(
                "苹果",
                new BigDecimal("8.80"),
                "斤",
                List.of(),
                List.of("脆甜"),
                "A vendor fruit"
        ));
        String tokenB = login("openid-vendor-b", "wx-code-b");

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

    private String login(String openid, String code) {
        WIRE_MOCK.stubFor(get(urlPathEqualTo("/sns/jscode2session"))
                .withQueryParam("js_code", equalTo(code))
                .willReturn(okJson("{\"openid\":\"" + openid + "\",\"session_key\":\"session\"}")));
        ResponseEntity<ApiResponse<LoginResponse>> response = restTemplate.exchange(
                baseUrl() + "/api/auth/login",
                HttpMethod.POST,
                new HttpEntity<>("{\"code\":\"" + code + "\"}", jsonHeaders()),
                new ParameterizedTypeReference<>() {
                }
        );
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
