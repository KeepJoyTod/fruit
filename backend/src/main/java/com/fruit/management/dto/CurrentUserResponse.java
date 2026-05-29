package com.fruit.management.dto;

import com.fruit.management.domain.UserRole;

public record CurrentUserResponse(
        Long userId,
        String username,
        String nickname,
        UserRole role
) {
}
