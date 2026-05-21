package com.fruit.management.web;

import com.fruit.management.common.ApiResponse;
import com.fruit.management.config.FileUploadConfig;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class UploadController {

    private final FileUploadConfig fileUploadConfig;

    public UploadController(FileUploadConfig fileUploadConfig) {
        this.fileUploadConfig = fileUploadConfig;
    }

    @PostMapping("/files/images")
    public ApiResponse<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("上传文件不能为空");
        }
        
        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        String newFilename = UUID.randomUUID().toString() + extension;
        
        Path uploadPath = Paths.get(fileUploadConfig.getImageDir()).toAbsolutePath().normalize();
        Path filePath = uploadPath.resolve(newFilename);
        
        Files.copy(file.getInputStream(), filePath);
        
        String imageUrl = fileUploadConfig.getImageUrlPrefix() + "/" + newFilename;
        return ApiResponse.ok(Map.of("url", imageUrl));
    }

    @DeleteMapping("/files/images/{filename}")
    public ApiResponse<Void> deleteImage(@PathVariable String filename) throws IOException {
        Path uploadPath = Paths.get(fileUploadConfig.getImageDir()).toAbsolutePath().normalize();
        Path filePath = uploadPath.resolve(filename).normalize();
        
        if (!filePath.startsWith(uploadPath)) {
            throw new SecurityException("非法文件路径");
        }
        
        if (Files.exists(filePath)) {
            Files.delete(filePath);
        }
        
        return ApiResponse.ok();
    }

    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return ".jpg";
        }
        return filename.substring(filename.lastIndexOf("."));
    }
}