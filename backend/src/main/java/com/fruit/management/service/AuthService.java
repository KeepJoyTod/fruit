package com.fruit.management.service;

import com.fruit.management.common.BusinessException;
import com.fruit.management.domain.UserRole;
import com.fruit.management.dto.CurrentUserResponse;
import com.fruit.management.dto.LoginResponse;
import com.fruit.management.dto.RegisterRequest;
import com.fruit.management.entity.UserEntity;
import com.fruit.management.entity.UserSessionEntity;
import com.fruit.management.repository.jpa.UserJpaRepository;
import com.fruit.management.repository.jpa.UserSessionJpaRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {
    private final UserJpaRepository userRepository;
    private final UserSessionJpaRepository sessionRepository;
    private final PasswordService passwordService;
    private final Duration sessionTtl;

    public AuthService(UserJpaRepository userRepository,
                       UserSessionJpaRepository sessionRepository,
                       PasswordService passwordService,
                       @Value("${fruit.auth.session-ttl-minutes:10080}") long sessionTtlMinutes) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.passwordService = passwordService;
        this.sessionTtl = Duration.ofMinutes(sessionTtlMinutes);
    }

    @Transactional
    public LoginResponse login(String username, String password) {
        UserEntity user = userRepository.findByUsername(normalizeUsername(username))
                .orElseThrow(() -> new BusinessException(401, "username or password is incorrect"));
        if (!Boolean.TRUE.equals(user.getEnabled()) || !passwordService.matches(password, user.getPasswordHash())) {
            throw new BusinessException(401, "username or password is incorrect");
        }
        String token = createSession(user.getId());
        return toLoginResponse(token, user);
    }

    @Transactional
    public LoginResponse register(RegisterRequest request) {
        UserRole role = request.role() == UserRole.VENDOR ? UserRole.VENDOR : UserRole.CUSTOMER;
        UserEntity user = createUser(request.username(), request.password(), request.nickname(), role);
        String token = createSession(user.getId());
        return toLoginResponse(token, user);
    }

    @Transactional
    public UserEntity createUser(String username, String password, String nickname, UserRole role) {
        String normalizedUsername = normalizeUsername(username);
        if (userRepository.existsByUsername(normalizedUsername)) {
            throw new BusinessException(409, "username already exists");
        }
        Instant now = Instant.now();
        UserEntity user = new UserEntity();
        user.setOpenid(normalizedUsername);
        user.setUsername(normalizedUsername);
        user.setPasswordHash(passwordService.hash(password));
        user.setRole(role);
        user.setNickname(nickname == null || nickname.isBlank() ? normalizedUsername : nickname.trim());
        user.setEnabled(true);
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        return userRepository.save(user);
    }

    @Transactional
    public Optional<CurrentUser> findUserByToken(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }
        Optional<UserSessionEntity> session = sessionRepository.findById(token);
        if (session.isEmpty()) {
            return Optional.empty();
        }
        UserSessionEntity entity = session.get();
        if (Instant.now().isAfter(entity.getExpiresAt())) {
            sessionRepository.delete(entity);
            return Optional.empty();
        }
        return userRepository.findById(entity.getUserId())
                .filter(user -> Boolean.TRUE.equals(user.getEnabled()))
                .map(user -> new CurrentUser(user.getId(), user.getUsername(), user.getNickname(), user.getRole()));
    }

    public CurrentUserResponse toCurrentUserResponse(CurrentUser user) {
        return new CurrentUserResponse(user.id(), user.username(), user.nickname(), user.role());
    }

    private String createSession(Long userId) {
        String token = UUID.randomUUID().toString().replace("-", "");
        Instant now = Instant.now();
        UserSessionEntity session = new UserSessionEntity();
        session.setToken(token);
        session.setUserId(userId);
        session.setOpenid(userRepository.findById(userId).map(UserEntity::getOpenid).orElse(null));
        session.setExpiresAt(now.plus(sessionTtl));
        session.setCreatedAt(now);
        session.setUpdatedAt(now);
        sessionRepository.save(session);
        sessionRepository.deleteByExpiresAtBefore(now);
        return token;
    }

    private LoginResponse toLoginResponse(String token, UserEntity user) {
        return new LoginResponse(token, user.getId(), user.getUsername(), user.getNickname(), user.getRole());
    }

    private String normalizeUsername(String username) {
        if (username == null || username.isBlank()) {
            throw new BusinessException(400, "username is required");
        }
        return username.trim().toLowerCase(Locale.ROOT);
    }
}
