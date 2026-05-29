package com.fruit.management.repository;

import com.fruit.management.domain.Fruit;

import java.util.List;
import java.util.Optional;

public interface FruitRepository {
    Fruit save(Fruit fruit);

    Optional<Fruit> findById(Long id);

    Optional<Fruit> findByIdAndVendorId(Long id, Long vendorId);

    List<Fruit> findByVendorId(Long vendorId);

    List<Fruit> findPublicFruits(Long vendorId, String tag);
}
