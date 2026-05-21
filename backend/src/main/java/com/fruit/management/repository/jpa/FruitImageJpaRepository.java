package com.fruit.management.repository.jpa;

import com.fruit.management.entity.FruitImageEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FruitImageJpaRepository extends JpaRepository<FruitImageEntity, Long> {
    List<FruitImageEntity> findByFruitIdOrderBySortOrder(Long fruitId);
    void deleteByFruitId(Long fruitId);
}
