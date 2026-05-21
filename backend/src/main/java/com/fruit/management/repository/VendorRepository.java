package com.fruit.management.repository;

import com.fruit.management.domain.Vendor;

import java.util.List;
import java.util.Optional;

public interface VendorRepository {
    Vendor save(Vendor vendor);

    Optional<Vendor> findById(Long id);

    Optional<Vendor> findByOpenid(String openid);

    List<Vendor> findAllEnabled();
}
