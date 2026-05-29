package com.fruit.management.mapper;

import com.fruit.management.entity.FruitImageEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface FruitImageMapper {
    int insert(FruitImageEntity entity);
    
    int batchInsert(@Param("list") List<FruitImageEntity> list);
    
    List<FruitImageEntity> selectByFruitId(Long fruitId);
    
    int deleteByFruitId(Long fruitId);
}