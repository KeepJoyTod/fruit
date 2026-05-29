package com.fruit.management.repository;

import com.fruit.management.domain.Fruit;
import com.fruit.management.domain.FruitStatus;
import org.springframework.stereotype.Repository;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Repository
public class InMemoryFruitRepository implements FruitRepository {
    private final ConcurrentHashMap<Long, Fruit> fruits = new ConcurrentHashMap<>();
    private final AtomicLong idGenerator = new AtomicLong(2000);

    @Override
    public Fruit save(Fruit fruit) {
        if (fruit.getId() == null) {
            fruit.setId(idGenerator.incrementAndGet());
        }
        fruits.put(fruit.getId(), fruit);
        return fruit;
    }

    @Override
    public Optional<Fruit> findById(Long id) {
        return Optional.ofNullable(fruits.get(id));
    }

    @Override
    public Optional<Fruit> findByIdAndVendorId(Long id, Long vendorId) {
        return findById(id)
                .filter(fruit -> fruit.getVendorId().equals(vendorId));
    }

    @Override
    public List<Fruit> findByVendorId(Long vendorId) {
        return fruits.values()
                .stream()
                .filter(fruit -> fruit.getVendorId().equals(vendorId))
                .filter(fruit -> fruit.getStatus() != FruitStatus.DELETED)
                .sorted(Comparator.comparing(Fruit::getUpdatedAt).reversed())
                .toList();
    }

    @Override
    public List<Fruit> findPublicFruits(Long vendorId, String tag) {
        return fruits.values()
                .stream()
                .filter(fruit -> fruit.getStatus() == FruitStatus.ON_SALE || fruit.getStatus() == FruitStatus.LIMITED)
                .filter(fruit -> vendorId == null || fruit.getVendorId().equals(vendorId))
                .filter(fruit -> tag == null || tag.isBlank() || fruit.getTags().contains(tag))
                .sorted(Comparator.comparing(Fruit::getUpdatedAt).reversed())
                .toList();
    }
}
