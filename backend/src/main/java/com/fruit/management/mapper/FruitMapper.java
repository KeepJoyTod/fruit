package com.fruit.management.mapper;

import com.fruit.management.entity.FruitEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface FruitMapper {
    int insert(FruitEntity entity);
    
    int update(FruitEntity entity);
    
    FruitEntity selectById(Long id);
    
    List<FruitEntity> selectByVendorId(Long vendorId);
    
    List<FruitEntity> selectPublicFruits(@Param("vendorId") Long vendorId);
    
    List<FruitEntity> selectPublicFruitsWithTag(@Param("vendorId") Long vendorId, @Param("tag") String tag);
    
    int updateViewCount(@Param("id") Long id, @Param("viewCount") Long viewCount);
}