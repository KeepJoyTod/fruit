package com.fruit.management.web;

import com.fruit.management.common.ApiResponse;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class UploadController {

    @PostMapping("/files/images")
    public ApiResponse<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        String placeholderUrl = "https://example.invalid/uploads/" + file.getOriginalFilename();
        return ApiResponse.ok(Map.of("url", placeholderUrl));
    }
}
