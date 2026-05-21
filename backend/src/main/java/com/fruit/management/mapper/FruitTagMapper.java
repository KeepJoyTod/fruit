package com.fruit.management.mapper;

import com.fruit.management.entity.FruitTagEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface FruitTagMapper {
    int insert(FruitTagEntity entity);
    
    int batchInsert(@Param("list") List<FruitTagEntity> list);
    
    List<FruitTagEntity> selectByFruitId(Long fruitId);
    
    List<FruitTagEntity> selectByTag(String tag);
    
    int deleteByFruitId(Long fruitId);
}