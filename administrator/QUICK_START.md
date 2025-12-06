# 快速启动指南

## ⚠️ 登录失败？请按以下步骤检查

### 1. 确保后端服务已启动

**启动后端**:
```bash
cd project
mvn spring-boot:run
```

**验证后端是否运行**:
- 访问: http://localhost:8080
- 或在浏览器控制台查看网络请求

### 2. 检查端口配置

**前端端口**: 5174 (administrator)
**后端端口**: 8080

**检查端口是否被占用**:

Windows:
```bash
netstat -ano | findstr :8080
netstat -ano | findstr :5174
```

Linux/Mac:
```bash
lsof -i :8080
lsof -i :5174
```

### 3. 测试后端 API

**使用 curl 测试登录接口**:
```bash
curl -X POST http://localhost:8080/api/admin/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"123\"}"
```

**预期响应**:
```json
{
  "success": true,
  "code": 200,
  "message": "操作成功",
  "data": {
    "token": "admin_token_...",
    "adminInfo": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "role": "ADMIN"
    }
  }
}
```

### 4. 检查浏览器控制台

打开浏览器开发者工具 (F12)，查看:
- **Console** 标签: 查看 JavaScript 错误
- **Network** 标签: 查看 API 请求状态

### 5. 常见问题

#### 问题 1: 网络错误 (ERR_CONNECTION_REFUSED)
**原因**: 后端服务未启动
**解决**: 启动后端服务

#### 问题 2: CORS 错误
**原因**: 跨域配置问题
**解决**: 确保后端控制器有 `@CrossOrigin(origins = "*")` 注解

#### 问题 3: 404 错误
**原因**: API 路径不正确
**解决**: 检查 API 路径是否为 `/api/admin/login`

#### 问题 4: 500 错误
**原因**: 后端代码错误
**解决**: 查看后端控制台日志

## 🚀 完整启动流程

### 步骤 1: 启动后端
```bash
# 进入后端目录
cd project

# 启动 Spring Boot
mvn spring-boot:run

# 等待看到类似输出:
# Started ProjectApplication in X.XXX seconds
```

### 步骤 2: 启动前端
```bash
# 新开一个终端，进入管理员前端目录
cd administrator

# 如果是第一次运行，先安装依赖
npm install element-plus @element-plus/icons-vue axios

# 启动开发服务器
npm run dev

# 看到输出:
# ➜  Local:   http://localhost:5174/
```

### 步骤 3: 访问系统
1. 打开浏览器访问: http://localhost:5174
2. 输入用户名: `admin`
3. 输入密码: `123`
4. 点击登录

## 🔍 调试技巧

### 查看 API 请求
打开浏览器控制台 (F12)，在 Network 标签中:
1. 点击登录按钮
2. 查找 `login` 请求
3. 查看请求详情:
   - **Request URL**: 应该是 `http://localhost:8080/api/admin/login`
   - **Status**: 应该是 `200`
   - **Response**: 查看返回的数据

### 查看控制台日志
在 Console 标签中查看:
- 登录请求的详细信息
- API 地址
- 错误信息

## 📝 环境变量

**文件**: `administrator/.env`
```
VITE_API_BASE_URL=http://localhost:8080/api
```

如果后端运行在不同的端口，修改此文件。

## ✅ 验证清单

- [ ] 后端服务已启动 (端口 8080)
- [ ] 前端服务已启动 (端口 5174)
- [ ] 浏览器可以访问 http://localhost:5174
- [ ] 浏览器控制台没有错误
- [ ] Network 标签显示 login 请求成功

## 🆘 仍然无法登录？

1. **重启后端服务**
2. **清除浏览器缓存** (Ctrl+Shift+Delete)
3. **检查防火墙设置**
4. **查看后端日志** 是否有错误信息
5. **使用 Postman 或 curl** 直接测试 API

## 📞 获取帮助

如果以上步骤都无法解决问题，请提供:
1. 浏览器控制台的错误截图
2. Network 标签的请求详情
3. 后端控制台的日志
