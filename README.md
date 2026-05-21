# 水果管理微信小程序

这是一个按企业级分层落地的水果摊管理小程序骨架，包含：

- `backend`：Spring Boot 3 后端，提供摊位、水果、上传、顾客浏览接口。
- `miniprogram`：微信原生小程序，包含顾客端和摊主端页面。
- `docs/sql/schema.sql`：MySQL 企业级表结构。
- `docker-compose.yml`：本地 MySQL、Redis 基础设施。

## 本地运行后端

```bash
docker compose up -d mysql
cd backend
mvn test
mvn spring-boot:run
```

后端默认端口是 `8080`。默认数据源是 Docker MySQL：`jdbc:mysql://localhost:3307/fruit_management`，账号密码默认是 `root` / `123456`，可通过 `MYSQL_HOST`、`MYSQL_PORT`、`MYSQL_DATABASE`、`MYSQL_USERNAME`、`MYSQL_PASSWORD` 环境变量覆盖。`mvn test` 使用测试环境 H2 内存库，不依赖本机 MySQL。

鉴权使用小程序 `wx.login()` 获取 code，后端调用微信 `code2Session` 换取 openid 后签发服务端 token，并将会话持久化到 `user_sessions` 表。启动前需要配置 `WECHAT_APPID` 和 `WECHAT_SECRET`，接口请求携带 `Authorization: Bearer <token>`。token 默认 10080 分钟过期，可通过 `FRUIT_SESSION_TTL_MINUTES` 调整。默认启动时会写入演示摊位和水果数据，可设置 `FRUIT_DEMO_DATA_ENABLED=false` 关闭。

## 小程序运行

1. 打开微信开发者工具。
2. 导入 `miniprogram` 目录。
3. 确认 `miniprogram/app.js` 中的 `apiBaseUrl` 指向 `http://localhost:8080/api`。
4. 先进入“摊主管理”，点击“初始化”，再上架水果。
5. 返回“逛水果”查看顾客端展示。

## 企业级改造路线

当前后端默认使用 MySQL 持久化，本地可通过 `docker-compose.yml` 启动 MySQL、Redis 基础设施。生产化时：

1. 用 `docs/sql/schema.sql` 初始化 MySQL。
2. 根据生产环境管理策略调整 `spring.jpa.hibernate.ddl-auto`，避免由应用自动变更生产表结构。
3. 将图片上传接口接入腾讯云 COS、阿里云 OSS 或微信云存储。
4. 可按部署规模将数据库会话切换为 Redis 会话，并完善刷新策略。
5. 增加 Redis 缓存、接口限流、操作日志、监控告警和数据库备份。
