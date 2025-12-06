# 端口配置说明

## 📡 端口分配

本项目使用以下端口配置：

| 服务 | 端口 | 访问地址 | 说明 |
|------|------|----------|------|
| 学生/教师前端 | 5173 | http://localhost:5173 | answer_web 项目 |
| 管理员前端 | 5174 | http://localhost:5174 | administrator 项目 |
| 后端 API | 8088 | http://localhost:8088 | Spring Boot 后端 |

## 🔧 配置文件

### 1. answer_web 端口配置

**文件**: `answer_web/vite.config.js`

```javascript
export default defineConfig({
  // ...
  server: {
    port: 5173,
    host: true
  }
})
```

### 2. administrator 端口配置

**文件**: `administrator/vite.config.ts`

```typescript
export default defineConfig({
  // ...
  server: {
    port: 5174,
    host: true
  }
})
```

### 3. 后端端口配置

**文件**: `project/src/main/resources/application.yml`

```yaml
server:
  port: 8088
```

## 🚀 启动服务

### 启动学生/教师前端
```bash
cd answer_web
npm run dev
# 访问: http://localhost:5173
```

### 启动管理员前端
```bash
cd administrator
npm install element-plus @element-plus/icons-vue axios  # 首次需要安装依赖
npm run dev
# 访问: http://localhost:5174
```

### 启动后端
```bash
cd project
mvn spring-boot:run
# API 地址: http://localhost:8088
```

## 🔄 修改端口

如果需要修改端口，请按以下步骤操作：

### 修改前端端口

1. 编辑对应的 `vite.config.js` 或 `vite.config.ts`
2. 修改 `server.port` 的值
3. 重启开发服务器

### 修改后端端口

1. 编辑 `project/src/main/resources/application.yml`
2. 修改 `server.port` 的值
3. 同时需要修改前端的 API 地址配置：
   - `answer_web/src/api/request.js` 中的 `API_BASE_URL`
   - `administrator/.env` 中的 `VITE_API_BASE_URL`
4. 重启后端服务

## ⚠️ 注意事项

1. **端口冲突**: 如果端口被占用，请检查是否有其他服务正在使用该端口
2. **防火墙**: 确保防火墙允许这些端口的访问
3. **跨域配置**: 后端已配置 CORS，允许前端跨域访问
4. **生产环境**: 生产环境建议使用 Nginx 反向代理，统一端口访问

## 🌐 生产环境建议

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name example.com;
    
    # 学生/教师端
    location / {
        root /var/www/answer_web/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # 管理员端
    location /admin {
        alias /var/www/administrator/dist;
        try_files $uri $uri/ /admin/index.html;
    }
    
    # API 代理
    location /api {
        proxy_pass http://localhost:8088;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📝 快速检查

运行以下命令检查端口是否被占用：

### Windows
```bash
netstat -ano | findstr :5173
netstat -ano | findstr :5174
netstat -ano | findstr :8088
```

### Linux/Mac
```bash
lsof -i :5173
lsof -i :5174
lsof -i :8088
```

## 🔗 相关链接

- [Vite 配置文档](https://vitejs.dev/config/)
- [Spring Boot 配置文档](https://docs.spring.io/spring-boot/docs/current/reference/html/application-properties.html)
