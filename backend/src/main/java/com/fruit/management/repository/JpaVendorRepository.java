package com.fruit.management.repository;

import com.fruit.management.domain.Vendor;
import com.fruit.management.entity.VendorEntity;
import com.fruit.management.repository.jpa.VendorJpaRepository;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
@Primary
public class JpaVendorRepository implements VendorRepository {
    private final VendorJpaRepository jpaRepository;

    public JpaVendorRepository(VendorJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Vendor save(Vendor vendor) {
        VendorEntity entity = toEntity(vendor);
        VendorEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<Vendor> findById(Long id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public Optional<Vendor> findByOpenid(String openid) {
        return jpaRepository.findByOpenid(openid).map(this::toDomain);
    }

    @Override
    public List<Vendor> findAllEnabled() {
        return jpaRepository.findByEnabledTrue().stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Vendor> findAll() {
        return jpaRepository.findAll().stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    private VendorEntity toEntity(Vendor domain) {
        VendorEntity entity = new VendorEntity();
        entity.setId(domain.getId());
        entity.setOpenid(domain.getOpenid());
        entity.setStallName(domain.getStallName());
        entity.setAddress(domain.getAddress());
        entity.setLatitude(domain.getLatitude());
        entity.setLongitude(domain.getLongitude());
        entity.setPhone(domain.getPhone());
        entity.setEnabled(domain.isEnabled());
        entity.setCreatedAt(domain.getCreatedAt());
        entity.setUpdatedAt(domain.getUpdatedAt());
        return entity;
    }

    private Vendor toDomain(VendorEntity entity) {
        Vendor domain = new Vendor();
        domain.setId(entity.getId());
        domain.setOpenid(entity.getOpenid());
        domain.setStallName(entity.getStallName());
        domain.setAddress(entity.getAddress());
        domain.setLatitude(entity.getLatitude());
        domain.setLongitude(entity.getLongitude());
        domain.setPhone(entity.getPhone());
        domain.setEnabled(entity.getEnabled());
        domain.setCreatedAt(entity.getCreatedAt());
        domain.setUpdatedAt(entity.getUpdatedAt());
        return domain;
    }
}
