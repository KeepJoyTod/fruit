package com.fruit.management.dto;

import com.fruit.management.domain.UserRole;

public record LoginResponse(
        String token,
        Long userId,
        String username,
        String nickname,
        UserRole role
) {
}
