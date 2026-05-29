package com.fruit.management.mapper;

import com.fruit.management.entity.VendorEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface VendorMapper {
    int insert(VendorEntity entity);
    
    int update(VendorEntity entity);
    
    VendorEntity selectById(Long id);
    
    VendorEntity selectByOpenid(String openid);
    
    List<VendorEntity> selectAllEnabled();
}