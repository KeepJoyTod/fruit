package com.fruit.management.service;

import com.fruit.management.domain.UserRole;

public record CurrentUser(
        Long id,
        String username,
        String nickname,
        UserRole role
) {
}
