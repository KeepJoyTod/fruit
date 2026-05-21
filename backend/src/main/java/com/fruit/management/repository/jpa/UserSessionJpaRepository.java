package com.fruit.management.repository.jpa;

import com.fruit.management.entity.UserSessionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;

@Repository
public interface UserSessionJpaRepository extends JpaRepository<UserSessionEntity, String> {
    long deleteByExpiresAtBefore(Instant now);

    long deleteByUserId(Long userId);
}
