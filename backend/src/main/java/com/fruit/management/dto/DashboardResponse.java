package com.fruit.management.dto;

public record DashboardResponse(long totalFruits, long onSaleFruits, long soldOutFruits, long totalViews) {
}
