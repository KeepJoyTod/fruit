package com.fruit.management.dto;

import com.fruit.management.domain.UserRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank String username,
        @NotBlank @Size(min = 6, max = 64) String password,
        String nickname,
        UserRole role
) {
}
