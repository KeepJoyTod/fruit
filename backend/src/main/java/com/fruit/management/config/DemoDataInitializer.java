package com.fruit.management.config;

import com.fruit.management.domain.Fruit;
import com.fruit.management.domain.FruitStatus;
import com.fruit.management.domain.Vendor;
import com.fruit.management.dto.FruitCreateRequest;
import com.fruit.management.dto.VendorUpsertRequest;
import com.fruit.management.repository.FruitRepository;
import com.fruit.management.service.FruitService;
import com.fruit.management.service.VendorService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@ConditionalOnProperty(prefix = "fruit.demo-data", name = "enabled", havingValue = "true", matchIfMissing = true)
public class DemoDataInitializer implements CommandLineRunner {
    private static final String DEMO_OPENID = "dev-vendor-001";

    private final VendorService vendorService;
    private final FruitService fruitService;
    private final FruitRepository fruitRepository;

    public DemoDataInitializer(VendorService vendorService, FruitService fruitService, FruitRepository fruitRepository) {
        this.vendorService = vendorService;
        this.fruitService = fruitService;
        this.fruitRepository = fruitRepository;
    }

    @Override
    public void run(String... args) {
        Vendor vendor = vendorService.upsertCurrentVendor(DEMO_OPENID, new VendorUpsertRequest(
                "老王鲜果摊",
                "学校东门临街 3 号摊位",
                39.9087,
                116.4713,
                "13800138000"
        ));

        createFruitIfMissing(vendor, "阳光玫瑰葡萄", "18.80", "斤", FruitStatus.ON_SALE,
                List.of(),
                List.of("新鲜到货", "可试吃"),
                "皮薄汁多，今天早上刚到货。");
        createFruitIfMissing(vendor, "海南小台芒", "12.50", "斤", FruitStatus.LIMITED,
                List.of(),
                List.of("新鲜到货", "香甜"),
                "软糯香甜，适合现吃。");
        createFruitIfMissing(vendor, "冰糖心苹果", "9.90", "斤", FruitStatus.ON_SALE,
                List.of(),
                List.of("脆甜", "家庭装"),
                "口感清脆，适合带回宿舍慢慢吃。");
    }

    private void createFruitIfMissing(Vendor vendor,
                                      String name,
                                      String price,
                                      String unit,
                                      FruitStatus status,
                                      List<String> images,
                                      List<String> tags,
                                      String description) {
        Fruit existing = fruitRepository.findByVendorId(vendor.getId())
                .stream()
                .filter(fruit -> name.equals(fruit.getName()))
                .findFirst()
                .orElse(null);
        if (existing != null) {
            if (existing.getStatus() != status) {
                fruitService.updateStatus(DEMO_OPENID, existing.getId(), status);
            }
            return;
        }

        Fruit fruit = fruitService.createFruit(DEMO_OPENID, new FruitCreateRequest(
                name,
                new BigDecimal(price),
                unit,
                images,
                tags,
                description
        ));
        if (fruit.getStatus() != status) {
            fruitService.updateStatus(DEMO_OPENID, fruit.getId(), status);
        }
    }
}
