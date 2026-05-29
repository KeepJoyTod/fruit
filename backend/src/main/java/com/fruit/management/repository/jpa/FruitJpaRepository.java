package com.fruit.management.repository.jpa;

import com.fruit.management.entity.FruitEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FruitJpaRepository extends JpaRepository<FruitEntity, Long> {
    Optional<FruitEntity> findByIdAndVendorId(Long id, Long vendorId);

    @Query("SELECT f FROM FruitEntity f WHERE f.vendorId = :vendorId AND f.status <> 'DELETED' ORDER BY f.updatedAt DESC")
    List<FruitEntity> findByVendorId(@Param("vendorId") Long vendorId);
    
    @Query("SELECT f FROM FruitEntity f WHERE f.status IN ('ON_SALE', 'LIMITED') " +
           "AND (:vendorId IS NULL OR f.vendorId = :vendorId) " +
           "ORDER BY f.updatedAt DESC")
    List<FruitEntity> findPublicFruits(@Param("vendorId") Long vendorId);
}
