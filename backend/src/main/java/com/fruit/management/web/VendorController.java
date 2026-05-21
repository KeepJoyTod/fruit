package com.fruit.management.web;

import com.fruit.management.common.ApiResponse;
import com.fruit.management.domain.UserRole;
import com.fruit.management.dto.DashboardResponse;
import com.fruit.management.dto.VendorAdminResponse;
import com.fruit.management.dto.VendorEnabledRequest;
import com.fruit.management.dto.VendorResponse;
import com.fruit.management.dto.VendorUpsertRequest;
import com.fruit.management.service.CurrentUserService;
import com.fruit.management.service.VendorService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class VendorController {
    private final VendorService vendorService;
    private final CurrentUserService currentUserService;

    public VendorController(VendorService vendorService, CurrentUserService currentUserService) {
        this.vendorService = vendorService;
        this.currentUserService = currentUserService;
    }

    @PostMapping("/vendor/profile")
    public ApiResponse<VendorResponse> upsertProfile(
            HttpServletRequest httpRequest,
            @Valid @RequestBody VendorUpsertRequest request
    ) {
        String username = currentUserService.requireRole(httpRequest, UserRole.VENDOR).username();
        return ApiResponse.ok(VendorResponse.from(vendorService.upsertCurrentVendor(username, request)));
    }

    @GetMapping("/vendor/profile")
    public ApiResponse<VendorResponse> getCurrentProfile(HttpServletRequest httpRequest) {
        String username = currentUserService.requireRole(httpRequest, UserRole.VENDOR).username();
        return ApiResponse.ok(VendorResponse.from(vendorService.getCurrentVendor(username)));
    }

    @GetMapping("/vendor/dashboard")
    public ApiResponse<DashboardResponse> getDashboard(HttpServletRequest httpRequest) {
        String username = currentUserService.requireRole(httpRequest, UserRole.VENDOR).username();
        return ApiResponse.ok(vendorService.getDashboard(username));
    }

    @GetMapping("/vendors")
    public ApiResponse<List<VendorResponse>> listVendors() {
        return ApiResponse.ok(vendorService.listPublicVendors()
                .stream()
                .map(VendorResponse::from)
                .toList());
    }

    @GetMapping("/vendors/{vendorId}")
    public ApiResponse<VendorResponse> getVendor(@PathVariable("vendorId") Long vendorId) {
        return ApiResponse.ok(VendorResponse.from(vendorService.getPublicVendor(vendorId)));
    }

    @GetMapping("/admin/vendors")
    public ApiResponse<List<VendorAdminResponse>> listAllVendors(HttpServletRequest httpRequest) {
        currentUserService.requireRole(httpRequest, UserRole.SUPER_ADMIN);
        return ApiResponse.ok(vendorService.listAllVendors()
                .stream()
                .map(VendorAdminResponse::from)
                .toList());
    }

    @PatchMapping("/admin/vendors/{vendorId}/enabled")
    public ApiResponse<VendorAdminResponse> patchVendorEnabled(
            HttpServletRequest httpRequest,
            @PathVariable("vendorId") Long vendorId,
            @Valid @RequestBody VendorEnabledRequest request
    ) {
        return updateVendorEnabled(httpRequest, vendorId, request);
    }

    @PostMapping("/admin/vendors/{vendorId}/enabled")
    public ApiResponse<VendorAdminResponse> updateVendorEnabled(
            HttpServletRequest httpRequest,
            @PathVariable("vendorId") Long vendorId,
            @Valid @RequestBody VendorEnabledRequest request
    ) {
        currentUserService.requireRole(httpRequest, UserRole.SUPER_ADMIN);
        return ApiResponse.ok(VendorAdminResponse.from(vendorService.updateVendorEnabled(vendorId, request.enabled())));
    }
}
