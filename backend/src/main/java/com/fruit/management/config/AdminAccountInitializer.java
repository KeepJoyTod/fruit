package com.fruit.management.config;

import com.fruit.management.domain.UserRole;
import com.fruit.management.repository.jpa.UserJpaRepository;
import com.fruit.management.service.AuthService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class AdminAccountInitializer implements CommandLineRunner {
    private final AuthService authService;
    private final UserJpaRepository userRepository;
    private final String username;
    private final String password;

    public AdminAccountInitializer(AuthService authService,
                                   UserJpaRepository userRepository,
                                   @Value("${fruit.admin.username:admin}") String username,
                                   @Value("${fruit.admin.password:admin123}") String password) {
        this.authService = authService;
        this.userRepository = userRepository;
        this.username = username;
        this.password = password;
    }

    @Override
    public void run(String... args) {
        String normalizedUsername = username.trim().toLowerCase(java.util.Locale.ROOT);
        if (userRepository.existsByUsername(normalizedUsername)) {
            return;
        }
        authService.createUser(username, password, "超级管理员", UserRole.SUPER_ADMIN);
    }
}
