package com.fruit.management.dto;

import jakarta.validation.constraints.NotNull;

public record VendorEnabledRequest(@NotNull Boolean enabled) {
}
