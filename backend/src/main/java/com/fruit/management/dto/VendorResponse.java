package com.fruit.management.dto;

import com.fruit.management.domain.Vendor;

import java.time.Instant;

public record VendorResponse(
        Long id,
        String stallName,
        String address,
        Double latitude,
        Double longitude,
        String phone,
        boolean enabled,
        Instant createdAt,
        Instant updatedAt
) {
    public static VendorResponse from(Vendor vendor) {
        return new VendorResponse(
                vendor.getId(),
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
