package com.fruit.management.service;

import com.fruit.management.common.BusinessException;
import com.fruit.management.domain.Fruit;
import com.fruit.management.domain.FruitStatus;
import com.fruit.management.domain.Vendor;
import com.fruit.management.dto.FruitCreateRequest;
import com.fruit.management.dto.FruitUpdateRequest;
import com.fruit.management.repository.FruitRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class FruitService {
    private final FruitRepository fruitRepository;
    private final VendorService vendorService;

    public FruitService(FruitRepository fruitRepository, VendorService vendorService) {
        this.fruitRepository = fruitRepository;
        this.vendorService = vendorService;
    }

    public Fruit createFruit(String openid, FruitCreateRequest request) {
        Vendor vendor = vendorService.getCurrentVendor(openid);
        Instant now = Instant.now();
        Fruit fruit = new Fruit();
        fruit.setVendorId(vendor.getId());
        fruit.setName(request.name());
        fruit.setPrice(request.price());
        fruit.setUnit(request.unit());
        fruit.setImages(request.images());
        fruit.setTags(request.tags());
        fruit.setDescription(request.description());
        fruit.setStatus(FruitStatus.ON_SALE);
        fruit.setCreatedAt(now);
        fruit.setUpdatedAt(now);
        return fruitRepository.save(fruit);
    }

    public Fruit updateFruit(String openid, Long fruitId, FruitUpdateRequest request) {
        Fruit fruit = getOwnedFruit(openid, fruitId);
        fruit.setName(request.name());
        fruit.setPrice(request.price());
        fruit.setUnit(request.unit());
        fruit.setImages(request.images());
        fruit.setTags(request.tags());
        fruit.setDescription(request.description());
        fruit.setUpdatedAt(Instant.now());
        return fruitRepository.save(fruit);
    }

    public Fruit updateStatus(String openid, Long fruitId, FruitStatus status) {
        Fruit fruit = getOwnedFruit(openid, fruitId);
        fruit.setStatus(status);
        fruit.setUpdatedAt(Instant.now());
        return fruitRepository.save(fruit);
    }

    public void deleteFruit(String openid, Long fruitId) {
        updateStatus(openid, fruitId, FruitStatus.DELETED);
    }

    public List<Fruit> listVendorFruits(String openid) {
        Vendor vendor = vendorService.getCurrentVendor(openid);
        return fruitRepository.findByVendorId(vendor.getId());
    }

    public List<Fruit> listPublicFruits(Long vendorId, String tag) {
        return fruitRepository.findPublicFruits(vendorId, tag);
    }

    public Fruit getPublicFruit(Long fruitId) {
        Fruit fruit = fruitRepository.findById(fruitId)
                .orElseThrow(() -> new BusinessException(404, "fruit not found"));
        if (fruit.getStatus() != FruitStatus.ON_SALE && fruit.getStatus() != FruitStatus.LIMITED) {
            throw new BusinessException(404, "fruit not found");
        }
        fruit.setViewCount(fruit.getViewCount() + 1);
        return fruitRepository.save(fruit);
    }

    private Fruit getOwnedFruit(String openid, Long fruitId) {
        Vendor vendor = vendorService.getCurrentVendor(openid);
        return fruitRepository.findByIdAndVendorId(fruitId, vendor.getId())
                .orElseThrow(() -> new BusinessException(403, "cannot operate this fruit"));
    }
}
