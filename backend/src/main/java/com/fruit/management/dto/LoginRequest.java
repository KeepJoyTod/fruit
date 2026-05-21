package com.fruit.management.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(@NotBlank String code) {
}
