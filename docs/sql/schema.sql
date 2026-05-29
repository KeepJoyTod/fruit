CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(64) NOT NULL UNIQUE,
    password_hash VARCHAR(128) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'CUSTOMER',
    nickname VARCHAR(64),
    enabled TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE user_sessions (
    token VARCHAR(64) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_sessions_user_id (user_id),
    INDEX idx_user_sessions_expires_at (expires_at),
    CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE vendors (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    openid VARCHAR(64) NOT NULL UNIQUE COMMENT '关联 users.username，保留字段名兼容旧代码',
    stall_name VARCHAR(80) NOT NULL,
    address VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    enabled TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_vendors_location (latitude, longitude)
);

CREATE TABLE fruits (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    vendor_id BIGINT NOT NULL,
    name VARCHAR(80) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(16) NOT NULL,
    status VARCHAR(32) NOT NULL,
    description VARCHAR(500),
    view_count BIGINT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    INDEX idx_fruits_vendor_status (vendor_id, status),
    INDEX idx_fruits_updated_at (updated_at),
    CONSTRAINT fk_fruits_vendor FOREIGN KEY (vendor_id) REFERENCES vendors (id)
);

CREATE TABLE fruit_images (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    fruit_id BIGINT NOT NULL,
    image_url VARCHAR(512) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_fruit_images_fruit (fruit_id),
    CONSTRAINT fk_fruit_images_fruit FOREIGN KEY (fruit_id) REFERENCES fruits (id)
);

CREATE TABLE fruit_tags (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    fruit_id BIGINT NOT NULL,
    tag VARCHAR(32) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_fruit_tag (fruit_id, tag),
    INDEX idx_fruit_tags_tag (tag),
    CONSTRAINT fk_fruit_tags_fruit FOREIGN KEY (fruit_id) REFERENCES fruits (id)
);

CREATE TABLE favorite_vendors (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    openid VARCHAR(64) NOT NULL,
    vendor_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_favorite_vendor (openid, vendor_id),
    INDEX idx_favorite_vendors_openid (openid),
    CONSTRAINT fk_favorite_vendor_vendor FOREIGN KEY (vendor_id) REFERENCES vendors (id)
);

CREATE TABLE view_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    openid VARCHAR(64),
    fruit_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_view_logs_fruit_time (fruit_id, created_at),
    CONSTRAINT fk_view_logs_fruit FOREIGN KEY (fruit_id) REFERENCES fruits (id)
);

CREATE TABLE operation_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    openid VARCHAR(64) NOT NULL,
    target_type VARCHAR(32) NOT NULL,
    target_id BIGINT NOT NULL,
    action VARCHAR(64) NOT NULL,
    detail JSON,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_operation_logs_target (target_type, target_id),
    INDEX idx_operation_logs_openid_time (openid, created_at)
);
