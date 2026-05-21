package com.fruit.management.repository;

import com.fruit.management.domain.Vendor;
import org.springframework.stereotype.Repository;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Repository
public class InMemoryVendorRepository implements VendorRepository {
    private final ConcurrentHashMap<Long, Vendor> vendors = new ConcurrentHashMap<>();
    private final AtomicLong idGenerator = new AtomicLong(1000);

    @Override
    public Vendor save(Vendor vendor) {
        if (vendor.getId() == null) {
            vendor.setId(idGenerator.incrementAndGet());
        }
        vendors.put(vendor.getId(), vendor);
        return vendor;
    }

    @Override
    public Optional<Vendor> findById(Long id) {
        return Optional.ofNullable(vendors.get(id));
    }

    @Override
    public Optional<Vendor> findByOpenid(String openid) {
        return vendors.values()
                .stream()
                .filter(vendor -> vendor.getOpenid().equals(openid))
                .findFirst();
    }

    @Override
    public List<Vendor> findAllEnabled() {
        return vendors.values()
                .stream()
                .filter(Vendor::isEnabled)
                .sorted(Comparator.comparing(Vendor::getUpdatedAt).reversed())
                .toList();
    }
}
