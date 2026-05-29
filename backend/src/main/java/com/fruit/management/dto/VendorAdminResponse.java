package com.fruit.management.dto;

import com.fruit.management.domain.Vendor;

import java.time.Instant;

public record VendorAdminResponse(
        Long id,
        String username,
        String stallName,
        String address,
        Double latitude,
        Double longitude,
        String phone,
        boolean enabled,
        Instant createdAt,
        Instant updatedAt
) {
    public static VendorAdminResponse from(Vendor vendor) {
        return new VendorAdminResponse(
                vendor.getId(),
                vendor.getOpenid(),
                vendor.getStallName(),
                vendor.getAddress(),
                vendor.getLatitude(),
                vendor.getLongitude(),
                vendor.getPhone(),
                vendor.isEnabled(),
                vendor.getCreatedAt(),
                vendor.getUpdatedAt()
        );
    }
}
