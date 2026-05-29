package com.fruit.management.repository.jpa;

import com.fruit.management.entity.FruitTagEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FruitTagJpaRepository extends JpaRepository<FruitTagEntity, Long> {
    List<FruitTagEntity> findByFruitId(Long fruitId);
    void deleteByFruitId(Long fruitId);
    List<FruitTagEntity> findByTag(String tag);
}
