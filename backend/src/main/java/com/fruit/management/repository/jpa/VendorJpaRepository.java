package com.fruit.management.repository.jpa;

import com.fruit.management.entity.VendorEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VendorJpaRepository extends JpaRepository<VendorEntity, Long> {
    Optional<VendorEntity> findByOpenid(String openid);
    List<VendorEntity> findByEnabledTrue();
}