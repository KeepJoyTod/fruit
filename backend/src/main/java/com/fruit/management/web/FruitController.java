package com.fruit.management.web;

import com.fruit.management.common.ApiResponse;
import com.fruit.management.dto.FruitCreateRequest;
import com.fruit.management.dto.FruitResponse;
import com.fruit.management.dto.FruitStatusRequest;
import com.fruit.management.dto.FruitUpdateRequest;
import com.fruit.management.service.CurrentUserService;
import com.fruit.management.service.FruitService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class FruitController {
    private final FruitService fruitService;
    private final CurrentUserService currentUserService;

    public FruitController(FruitService fruitService, CurrentUserService currentUserService) {
        this.fruitService = fruitService;
        this.currentUserService = currentUserService;
    }

    @PostMapping("/fruits")
    public ApiResponse<FruitResponse> createFruit(
            HttpServletRequest httpRequest,
            @Valid @RequestBody FruitCreateRequest request
    ) {
        String openid = currentUserService.currentOpenid(httpRequest);
        return ApiResponse.ok(FruitResponse.from(fruitService.createFruit(openid, request)));
    }

    @PutMapping("/fruits/{fruitId}")
    public ApiResponse<FruitResponse> updateFruit(
            HttpServletRequest httpRequest,
            @PathVariable("fruitId") Long fruitId,
            @Valid @RequestBody FruitUpdateRequest request
    ) {
        String openid = currentUserService.currentOpenid(httpRequest);
        return ApiResponse.ok(FruitResponse.from(fruitService.updateFruit(openid, fruitId, request)));
    }

    @PatchMapping("/fruits/{fruitId}/status")
    public ApiResponse<FruitResponse> updateStatus(
            HttpServletRequest httpRequest,
            @PathVariable("fruitId") Long fruitId,
            @Valid @RequestBody FruitStatusRequest request
    ) {
        String openid = currentUserService.currentOpenid(httpRequest);
        return ApiResponse.ok(FruitResponse.from(fruitService.updateStatus(openid, fruitId, request.status())));
    }

    @DeleteMapping("/fruits/{fruitId}")
    public ApiResponse<Void> deleteFruit(HttpServletRequest httpRequest, @PathVariable("fruitId") Long fruitId) {
        String openid = currentUserService.currentOpenid(httpRequest);
        fruitService.deleteFruit(openid, fruitId);
        return ApiResponse.ok(null);
    }

    @GetMapping("/vendor/fruits")
    public ApiResponse<List<FruitResponse>> listVendorFruits(HttpServletRequest httpRequest) {
        String openid = currentUserService.currentOpenid(httpRequest);
        return ApiResponse.ok(fruitService.listVendorFruits(openid)
                .stream()
                .map(FruitResponse::from)
                .toList());
    }

    @GetMapping("/fruits")
    public ApiResponse<List<FruitResponse>> listPublicFruits(
            @RequestParam(name = "vendorId", required = false) Long vendorId,
            @RequestParam(name = "tag", required = false) String tag
    ) {
        return ApiResponse.ok(fruitService.listPublicFruits(vendorId, tag)
                .stream()
                .map(FruitResponse::from)
                .toList());
    }

    @GetMapping("/fruits/{fruitId}")
    public ApiResponse<FruitResponse> getPublicFruit(@PathVariable("fruitId") Long fruitId) {
        return ApiResponse.ok(FruitResponse.from(fruitService.getPublicFruit(fruitId)));
    }
}
