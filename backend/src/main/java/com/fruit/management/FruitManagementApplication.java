package com.fruit.management;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.fruit.management.mapper")
public class FruitManagementApplication {

    public static void main(String[] args) {
        SpringApplication.run(FruitManagementApplication.class, args);
    }
}
