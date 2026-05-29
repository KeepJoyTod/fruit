package com.fruit.management.repository;

import com.fruit.management.domain.Fruit;
import com.fruit.management.domain.FruitStatus;
import com.fruit.management.entity.FruitEntity;
import com.fruit.management.entity.FruitImageEntity;
import com.fruit.management.entity.FruitTagEntity;
import com.fruit.management.repository.jpa.FruitImageJpaRepository;
import com.fruit.management.repository.jpa.FruitJpaRepository;
import com.fruit.management.repository.jpa.FruitTagJpaRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Tuple;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
@Primary
@Transactional
public class JpaFruitRepository implements FruitRepository {
    private final FruitJpaRepository fruitJpaRepository;
    private final FruitImageJpaRepository imageJpaRepository;
    private final FruitTagJpaRepository tagJpaRepository;
    private final EntityManager entityManager;

    public JpaFruitRepository(FruitJpaRepository fruitJpaRepository,
                              FruitImageJpaRepository imageJpaRepository,
                              FruitTagJpaRepository tagJpaRepository,
                              EntityManager entityManager) {
        this.fruitJpaRepository = fruitJpaRepository;
        this.imageJpaRepository = imageJpaRepository;
        this.tagJpaRepository = tagJpaRepository;
        this.entityManager = entityManager;
    }

    @Override
    public Fruit save(Fruit fruit) {
        FruitEntity entity = toEntity(fruit);
        FruitEntity saved = fruitJpaRepository.save(entity);
        
        imageJpaRepository.deleteByFruitId(saved.getId());
        imageJpaRepository.flush();
        if (fruit.getImages() != null) {
            for (int i = 0; i < fruit.getImages().size(); i++) {
                FruitImageEntity imageEntity = new FruitImageEntity();
                imageEntity.setFruit(saved);
                imageEntity.setImageUrl(fruit.getImages().get(i));
                imageEntity.setSortOrder(i);
                imageEntity.setCreatedAt(Instant.now());
                imageJpaRepository.save(imageEntity);
            }
        }
        
        tagJpaRepository.deleteByFruitId(saved.getId());
        tagJpaRepository.flush();
        if (fruit.getTags() != null) {
            for (String tag : fruit.getTags()) {
                FruitTagEntity tagEntity = new FruitTagEntity();
                tagEntity.setFruit(saved);
                tagEntity.setTag(tag);
                tagEntity.setCreatedAt(Instant.now());
                tagJpaRepository.save(tagEntity);
            }
        }
        
        return toDomain(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Fruit> findById(Long id) {
        return fruitJpaRepository.findById(id).map(this::toDomainWithRelations);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Fruit> findByIdAndVendorId(Long id, Long vendorId) {
        return fruitJpaRepository.findByIdAndVendorId(id, vendorId).map(this::toDomainWithRelations);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Fruit> findByVendorId(Long vendorId) {
        return fruitJpaRepository.findByVendorId(vendorId).stream()
                .map(this::toDomainWithRelations)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<Fruit> findPublicFruits(Long vendorId, String tag) {
        List<FruitEntity> fruits = fruitJpaRepository.findPublicFruits(vendorId);
        
        if (tag != null && !tag.isBlank()) {
            List<Long> fruitIdsWithTag = tagJpaRepository.findByTag(tag).stream()
                    .map(t -> t.getFruit().getId())
                    .collect(Collectors.toList());
            fruits = fruits.stream()
                    .filter(f -> fruitIdsWithTag.contains(f.getId()))
                    .collect(Collectors.toList());
        }
        
        return fruits.stream()
                .map(this::toDomainWithRelations)
                .collect(Collectors.toList());
    }

    private FruitEntity toEntity(Fruit domain) {
        FruitEntity entity = new FruitEntity();
        entity.setId(domain.getId());
        entity.setVendorId(domain.getVendorId());
        entity.setName(domain.getName());
        entity.setPrice(domain.getPrice());
        entity.setUnit(domain.getUnit());
        entity.setStatus(domain.getStatus() != null ? domain.getStatus().name() : FruitStatus.ON_SALE.name());
        entity.setDescription(domain.getDescription());
        entity.setViewCount(domain.getViewCount());
        entity.setCreatedAt(domain.getCreatedAt());
        entity.setUpdatedAt(domain.getUpdatedAt());
        return entity;
    }

    private Fruit toDomain(FruitEntity entity) {
        Fruit domain = new Fruit();
        domain.setId(entity.getId());
        domain.setVendorId(entity.getVendorId());
        domain.setName(entity.getName());
        domain.setPrice(entity.getPrice());
        domain.setUnit(entity.getUnit());
        domain.setStatus(FruitStatus.valueOf(entity.getStatus()));
        domain.setDescription(entity.getDescription());
        domain.setViewCount(entity.getViewCount());
        domain.setCreatedAt(entity.getCreatedAt());
        domain.setUpdatedAt(entity.getUpdatedAt());
        return domain;
    }

    private Fruit toDomainWithRelations(FruitEntity entity) {
        Fruit domain = toDomain(entity);
        
        List<String> images = imageJpaRepository.findByFruitIdOrderBySortOrder(entity.getId()).stream()
                .map(FruitImageEntity::getImageUrl)
                .collect(Collectors.toList());
        domain.setImages(images);
        
        List<String> tags = tagJpaRepository.findByFruitId(entity.getId()).stream()
                .map(FruitTagEntity::getTag)
                .collect(Collectors.toList());
        domain.setTags(tags);
        
        return domain;
    }
}
