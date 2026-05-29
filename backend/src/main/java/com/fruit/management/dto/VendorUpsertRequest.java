package com.fruit.management.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record VendorUpsertRequest(
        @NotBlank String stallName,
        @NotBlank String address,
        @NotNull Double latitude,
        @NotNull Double longitude,
        @NotBlank @Pattern(regexp = "^1[3-9]\\d{9}$", message = "must be a valid mainland China mobile number") String phone
) {
}
