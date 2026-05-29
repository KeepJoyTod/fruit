package com.fruit.management.service;

import com.fruit.management.common.BusinessException;
import com.fruit.management.domain.UserRole;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {
    private static final String BEARER_PREFIX = "Bearer ";

    private final AuthService authService;

    public CurrentUserService(AuthService authService) {
        this.authService = authService;
    }

    public CurrentUser currentUser(HttpServletRequest request) {
        String authorization = request.getHeader("Authorization");
        if (authorization == null || !authorization.startsWith(BEARER_PREFIX)) {
            throw new BusinessException(401, "missing Authorization bearer token");
        }
        String token = authorization.substring(BEARER_PREFIX.length()).trim();
        return authService.findUserByToken(token)
                .orElseThrow(() -> new BusinessException(401, "invalid or expired token"));
    }

    public String currentUsername(HttpServletRequest request) {
        return currentUser(request).username();
    }

    public CurrentUser requireRole(HttpServletRequest request, UserRole role) {
        CurrentUser user = currentUser(request);
        if (user.role() != role) {
            throw new BusinessException(403, "permission denied");
        }
        return user;
    }
}
