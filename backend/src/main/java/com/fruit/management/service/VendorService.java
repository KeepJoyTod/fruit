package com.fruit.management.service;

import com.fruit.management.common.BusinessException;
import com.fruit.management.domain.Vendor;
import com.fruit.management.dto.DashboardResponse;
import com.fruit.management.dto.VendorUpsertRequest;
import com.fruit.management.repository.FruitRepository;
import com.fruit.management.repository.VendorRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

import static com.fruit.management.domain.FruitStatus.ON_SALE;
import static com.fruit.management.domain.FruitStatus.SOLD_OUT;

@Service
public class VendorService {
    private final VendorRepository vendorRepository;
    private final FruitRepository fruitRepository;

    public VendorService(VendorRepository vendorRepository, FruitRepository fruitRepository) {
        this.vendorRepository = vendorRepository;
        this.fruitRepository = fruitRepository;
    }

    public Vendor upsertCurrentVendor(String openid, VendorUpsertRequest request) {
        Instant now = Instant.now();
        Vendor vendor = vendorRepository.findByOpenid(openid).orElseGet(Vendor::new);
        if (vendor.getId() == null) {
            vendor.setOpenid(openid);
            vendor.setCreatedAt(now);
            vendor.setEnabled(true);
        }
        vendor.setStallName(request.stallName());
        vendor.setAddress(request.address());
        vendor.setLatitude(request.latitude());
        vendor.setLongitude(request.longitude());
        vendor.setPhone(request.phone());
        vendor.setUpdatedAt(now);
        return vendorRepository.save(vendor);
    }

    public Vendor getCurrentVendor(String openid) {
        return vendorRepository.findByOpenid(openid)
                .orElseThrow(() -> new BusinessException(404, "vendor profile not found"));
    }

    public Vendor getPublicVendor(Long vendorId) {
        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new BusinessException(404, "vendor not found"));
        if (!vendor.isEnabled()) {
            throw new BusinessException(404, "vendor not found");
        }
        return vendor;
    }

    public List<Vendor> listPublicVendors() {
        return vendorRepository.findAllEnabled();
    }

    public DashboardResponse getDashboard(String openid) {
        Vendor vendor = getCurrentVendor(openid);
        var fruits = fruitRepository.findByVendorId(vendor.getId());
        long onSale = fruits.stream().filter(fruit -> fruit.getStatus() == ON_SALE).count();
        long soldOut = fruits.stream().filter(fruit -> fruit.getStatus() == SOLD_OUT).count();
        long totalViews = fruits.stream().mapToLong(fruit -> fruit.getViewCount()).sum();
        return new DashboardResponse(fruits.size(), onSale, soldOut, totalViews);
    }
}
