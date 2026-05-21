package com.fruit.management.service;

import com.fruit.management.common.BusinessException;
import com.fruit.management.dto.LoginResponse;
import com.fruit.management.dto.WechatSessionResponse;
import com.fruit.management.entity.UserSessionEntity;
import com.fruit.management.repository.jpa.UserSessionJpaRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {
    private static final String GRANT_TYPE = "authorization_code";

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;
    private final String appid;
    private final String secret;
    private final String code2SessionUrl;
    private final Duration sessionTtl;
    private final UserSessionJpaRepository sessionRepository;

    public AuthService(RestTemplateBuilder restTemplateBuilder,
                       ObjectMapper objectMapper,
                       UserSessionJpaRepository sessionRepository,
                       @Value("${fruit.wechat.appid:}") String appid,
                       @Value("${fruit.wechat.secret:}") String secret,
                       @Value("${fruit.wechat.code2-session-url:https://api.weixin.qq.com/sns/jscode2session}") String code2SessionUrl,
                       @Value("${fruit.auth.session-ttl-minutes:10080}") long sessionTtlMinutes) {
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(3))
                .setReadTimeout(Duration.ofSeconds(5))
                .build();
        this.objectMapper = objectMapper;
        this.sessionRepository = sessionRepository;
        this.appid = appid;
        this.secret = secret;
        this.code2SessionUrl = code2SessionUrl;
        this.sessionTtl = Duration.ofMinutes(sessionTtlMinutes);
    }

    @Transactional
    public LoginResponse login(String code) {
        if (appid.isBlank() || secret.isBlank()) {
            throw new BusinessException(500, "wechat appid or secret is not configured");
        }
        WechatSessionResponse response = requestWechatSession(code);
        if (response == null) {
            throw new BusinessException(502, "wechat login returned empty response");
        }
        if (response.errcode() != null && response.errcode() != 0) {
            throw new BusinessException(401, "wechat login failed: " + response.errmsg());
        }
        if (response.openid() == null || response.openid().isBlank()) {
            throw new BusinessException(502, "wechat login missing openid");
        }
        String token = UUID.randomUUID().toString().replace("-", "");
        Instant now = Instant.now();
        UserSessionEntity session = new UserSessionEntity();
        session.setToken(token);
        session.setOpenid(response.openid());
        session.setExpiresAt(now.plus(sessionTtl));
        session.setCreatedAt(now);
        session.setUpdatedAt(now);
        sessionRepository.save(session);
        sessionRepository.deleteByExpiresAtBefore(now);
        return new LoginResponse(token);
    }

    @Transactional
    public Optional<String> findOpenidByToken(String token) {
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
        return Optional.of(entity.getOpenid());
    }

    private WechatSessionResponse requestWechatSession(String code) {
        URI uri = UriComponentsBuilder.fromHttpUrl(code2SessionUrl)
                .queryParam("appid", appid)
                .queryParam("secret", secret)
                .queryParam("js_code", code)
                .queryParam("grant_type", GRANT_TYPE)
                .build()
                .toUri();
        try {
            String response = restTemplate.getForObject(uri, String.class);
            return objectMapper.readValue(response, WechatSessionResponse.class);
        } catch (RestClientException exception) {
            throw new BusinessException(502, "wechat login request failed: " + sanitizeErrorMessage(exception, code));
        } catch (JsonProcessingException exception) {
            throw new BusinessException(502, "wechat login response parse failed");
        }
    }

    private String sanitizeErrorMessage(RestClientException exception, String code) {
        String message = exception.getClass().getSimpleName();
        if (exception.getMessage() != null && !exception.getMessage().isBlank()) {
            message = message + ": " + exception.getMessage();
        }
        return message
                .replace(appid, "***")
                .replace(secret, "***")
                .replace(code, "***");
    }
}
