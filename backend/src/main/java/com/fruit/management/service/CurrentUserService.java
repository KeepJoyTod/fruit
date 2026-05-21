package com.fruit.management.service;

import com.fruit.management.common.BusinessException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {
    private static final String BEARER_PREFIX = "Bearer ";

    private final AuthService authService;

    public CurrentUserService(AuthService authService) {
        this.authService = authService;
    }

    public String currentOpenid(HttpServletRequest request) {
        String authorization = request.getHeader("Authorization");
        if (authorization == null || !authorization.startsWith(BEARER_PREFIX)) {
            throw new BusinessException(401, "missing Authorization bearer token");
        }
        String token = authorization.substring(BEARER_PREFIX.length()).trim();
        return authService.findOpenidByToken(token)
                .orElseThrow(() -> new BusinessException(401, "invalid or expired token"));
    }
}
