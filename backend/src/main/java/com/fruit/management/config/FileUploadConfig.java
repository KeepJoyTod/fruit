package com.fruit.management.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class FileUploadConfig implements WebMvcConfigurer {

    @Value("${fruit.upload.image-dir:./uploads/images}")
    private String imageDir;

    @Value("${fruit.upload.image-url-prefix:/images}")
    private String imageUrlPrefix;

    @PostConstruct
    public void init() throws IOException {
        Path uploadPath = Paths.get(imageDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path imagePath = Paths.get(imageDir).toAbsolutePath().normalize();
        registry.addResourceHandler(imageUrlPrefix + "/**")
                .addResourceLocations("file:" + imagePath + "/");
    }

    public String getImageDir() {
        return imageDir;
    }

    public String getImageUrlPrefix() {
        return imageUrlPrefix;
    }
}