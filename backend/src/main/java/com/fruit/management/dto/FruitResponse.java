package com.fruit.management.dto;

import com.fruit.management.domain.Fruit;
import com.fruit.management.domain.FruitStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record FruitResponse(
        Long id,
        Long vendorId,
        String name,
        BigDecimal price,
        String unit,
        List<String> images,
        FruitStatus status,
        List<String> tags,
        String description,
        long viewCount,
        Instant createdAt,
        Instant updatedAt
) {
    public static FruitResponse from(Fruit fruit) {
        return new FruitResponse(
                fruit.getId(),
                fruit.getVendorId(),
                fruit.getName(),
                fruit.getPrice(),
                fruit.getUnit(),
                fruit.getImages(),
                fruit.getStatus(),
                fruit.getTags(),
                fruit.getDescription(),
                fruit.getViewCount(),
                fruit.getCreatedAt(),
                fruit.getUpdatedAt()
        );
    }
}
