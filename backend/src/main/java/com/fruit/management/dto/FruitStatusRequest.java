package com.fruit.management.dto;

import com.fruit.management.domain.FruitStatus;
import jakarta.validation.constraints.NotNull;

public record FruitStatusRequest(@NotNull FruitStatus status) {
}
