package com.fruit.management.web;

import com.fruit.management.common.ApiResponse;
import com.fruit.management.dto.CurrentUserResponse;
import com.fruit.management.dto.LoginRequest;
import com.fruit.management.dto.LoginResponse;
import com.fruit.management.dto.RegisterRequest;
import com.fruit.management.service.CurrentUserService;
import com.fruit.management.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AuthController {
    private final AuthService authService;
    private final CurrentUserService currentUserService;

    public AuthController(AuthService authService, CurrentUserService currentUserService) {
        this.authService = authService;
        this.currentUserService = currentUserService;
    }

    @PostMapping("/auth/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok(authService.login(request.username(), request.password()));
    }

    @PostMapping("/auth/register")
    public ApiResponse<LoginResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.ok(authService.register(request));
    }

    @GetMapping("/auth/me")
    public ApiResponse<CurrentUserResponse> me(HttpServletRequest request) {
        return ApiResponse.ok(authService.toCurrentUserResponse(currentUserService.currentUser(request)));
    }
}
