# 管理员系统完整指南

## 📋 系统概述

这是一个完整的在线教育平台管理员系统，用于管理学生、教师账号，发布公告，以及管理评论违规词（敏感词）。

## 🚀 快速开始

### 1. 安装依赖

```bash
cd administrator
npm install element-plus @element-plus/icons-vue axios
```

### 2. 启动前端

```bash
npm run dev
```

访问: http://localhost:5174

### 3. 启动后端

```bash
cd project
mvn spring-boot:run
```

后端运行在: http://localhost:8080

### 4. 登录系统

- 用户名: `admin`
- 密码: `123`

---

## 📁 项目结构

### 前端结构 (administrator/)

```
administrator/
├── src/
│   ├── api/                          # API 接口层
│   │   ├── request.ts                # Axios 封装，统一请求配置
│   │   ├── auth.ts                   # 认证相关接口
│   │   ├── user.ts                   # 用户管理接口（学生/教师）
│   │   ├── announcement.ts           # 公告管理接口
│   │   └── sensitive.ts              # 敏感词管理接口
│   │
│   ├── views/                        # 页面组件
│   │   ├── Login.vue                 # 登录页面
│   │   ├── Layout.vue                # 主布局（侧边栏+头部）
│   │   ├── Dashboard.vue             # 仪表盘（统计数据）
│   │   ├── StudentManagement.vue     # 学生管理页面
│   │   ├── TeacherManagement.vue     # 教师管理页面
│   │   ├── AnnouncementManagement.vue # 公告管理页面
│   │   └── SensitiveWordManagement.vue # 敏感词管理页面
│   │
│   ├── router/                       # 路由配置
│   │   └── index.ts                  # 路由定义和守卫
│   │
│   ├── App.vue                       # 根组件
│   └── main.ts                       # 应用入口
│
├── .env                              # 环境变量配置
├── package.json                      # 依赖配置
└── SETUP.md                          # 安装说明
```

### 后端结构 (project/)

```
project/src/main/java/com/example/project/controller/admin/
├── AdminAuthController.java          # 管理员认证
├── AdminUserController.java          # 用户管理（学生/教师）
├── AdminAnnouncementController.java  # 公告管理
└── AdminSensitiveWordController.java # 敏感词管理
```

---

## 🎯 核心功能

### 1. 登录认证

**功能**:
- 管理员登录验证
- Token 生成和存储
- 路由守卫（未登录自动跳转）

**实现**:
- 前端: `src/views/Login.vue`
- 后端: `AdminAuthController.java`
- API: `POST /api/admin/login`

**流程**:
```
用户输入账号密码
    ↓
前端验证表单
    ↓
调用登录 API
    ↓
后端验证账号密码
    ↓
生成 Token
    ↓
返回 Token 和用户信息
    ↓
前端存储到 localStorage
    ↓
跳转到仪表盘
```

---

### 2. 学生管理

**功能**:
- ✅ 查看学生列表（分页、搜索、筛选）
- ✅ 添加新学生
- ✅ 编辑学生信息
- ✅ 删除学生（单个/批量）
- ✅ 启用/禁用学生账号
- ✅ 重置学生密码

**页面**: `StudentManagement.vue`

**API 接口**:
```
GET    /api/admin/students              # 获取学生列表
GET    /api/admin/students/{id}         # 获取学生详情
POST   /api/admin/students              # 创建学生
PUT    /api/admin/students/{id}         # 更新学生
DELETE /api/admin/students/{id}         # 删除学生
POST   /api/admin/students/batch-delete # 批量删除
PUT    /api/admin/students/{id}/status  # 切换状态
PUT    /api/admin/students/{id}/reset-password # 重置密码
```

**数据结构**:
```typescript
interface Student {
  id: number
  studentId: string      // 学号
  studentName: string    // 姓名
  email: string          // 邮箱
  phone: string          // 电话
  major: string          // 专业
  grade: string          // 年级
  status: number         // 状态 (0:禁用 1:正常)
  createTime: string     // 创建时间
}
```

---

### 3. 教师管理

**功能**:
- ✅ 查看教师列表（分页、搜索、筛选）
- ✅ 添加新教师
- ✅ 编辑教师信息
- ✅ 删除教师（单个/批量）
- ✅ 启用/禁用教师账号
- ✅ 重置教师密码

**页面**: `TeacherManagement.vue`

**API 接口**:
```
GET    /api/admin/teachers              # 获取教师列表
GET    /api/admin/teachers/{id}         # 获取教师详情
POST   /api/admin/teachers              # 创建教师
PUT    /api/admin/teachers/{id}         # 更新教师
DELETE /api/admin/teachers/{id}         # 删除教师
POST   /api/admin/teachers/batch-delete # 批量删除
PUT    /api/admin/teachers/{id}/status  # 切换状态
PUT    /api/admin/teachers/{id}/reset-password # 重置密码
```

**数据结构**:
```typescript
interface Teacher {
  id: number
  teacherId: string      // 工号
  teacherName: string    // 姓名
  email: string          // 邮箱
  phone: string          // 电话
  department: string     // 院系
  title: string          // 职称
  status: number         // 状态 (0:禁用 1:正常)
  createTime: string     // 创建时间
}
```

---

### 4. 公告管理

**功能**:
- ✅ 查看公告列表（分页、搜索、筛选）
- ✅ 发布新公告
- ✅ 编辑公告
- ✅ 删除公告
- ✅ 发布/撤回公告
- ✅ 查看公告详情

**页面**: `AnnouncementManagement.vue`

**公告类型**:
- `SYSTEM` - 系统公告
- `NOTICE` - 通知
- `URGENT` - 紧急公告

**目标用户**:
- `ALL` - 所有人
- `STUDENT` - 仅学生
- `TEACHER` - 仅教师

**API 接口**:
```
GET    /api/admin/announcements           # 获取公告列表
GET    /api/admin/announcements/{id}      # 获取公告详情
POST   /api/admin/announcements           # 创建公告
PUT    /api/admin/announcements/{id}      # 更新公告
DELETE /api/admin/announcements/{id}      # 删除公告
PUT    /api/admin/announcements/{id}/publish  # 发布公告
PUT    /api/admin/announcements/{id}/withdraw # 撤回公告
```

**数据结构**:
```typescript
interface Announcement {
  id: number
  title: string          // 标题
  content: string        // 内容
  type: string           // 类型 (SYSTEM/NOTICE/URGENT)
  target: string         // 目标 (ALL/STUDENT/TEACHER)
  status: number         // 状态 (0:草稿 1:已发布)
  publishTime: string    // 发布时间
  createTime: string     // 创建时间
}
```

---

### 5. 敏感词管理

**功能**:
- ✅ 查看敏感词列表（分页、搜索、筛选）
- ✅ 添加敏感词
- ✅ 编辑敏感词
- ✅ 删除敏感词（单个/批量）
- ✅ 批量导入敏感词
- ✅ 启用/禁用敏感词
- ✅ 测试文本检测

**页面**: `SensitiveWordManagement.vue`

**敏感词分类**:
- `PROFANITY` - 脏话
- `POLITICAL` - 政治敏感
- `VIOLENCE` - 暴力内容
- `OTHER` - 其他

**敏感词级别**:
- `1` - 轻度
- `2` - 中度
- `3` - 严重

**处理方式**:
- `REPLACE` - 替换为指定词
- `BLOCK` - 直接屏蔽
- `WARN` - 警告但不屏蔽

**API 接口**:
```
GET    /api/admin/sensitive-words              # 获取敏感词列表
GET    /api/admin/sensitive-words/{id}         # 获取敏感词详情
POST   /api/admin/sensitive-words              # 创建敏感词
PUT    /api/admin/sensitive-words/{id}         # 更新敏感词
DELETE /api/admin/sensitive-words/{id}         # 删除敏感词
POST   /api/admin/sensitive-words/batch-delete # 批量删除
POST   /api/admin/sensitive-words/import       # 批量导入
PUT    /api/admin/sensitive-words/{id}/status  # 切换状态
POST   /api/admin/sensitive-words/test         # 测试文本
```

**数据结构**:
```typescript
interface SensitiveWord {
  id: number
  word: string           // 敏感词
  category: string       // 分类
  level: number          // 级别 (1-3)
  action: string         // 处理方式
  replacement: string    // 替换词（action=REPLACE时使用）
  status: number         // 状态 (0:禁用 1:启用)
  createTime: string     // 创建时间
}
```

---

## 🔧 技术实现

### 前端技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全
- **Element Plus** - UI 组件库
- **Vue Router** - 路由管理
- **Axios** - HTTP 客户端
- **Pinia** - 状态管理（可选）

### 后端技术栈

- **Spring Boot** - Java 后端框架
- **MyBatis Plus** - ORM 框架
- **MySQL** - 数据库
- **JWT** - 身份验证（建议实现）

---

## 🔐 安全建议

### 1. 身份验证
```java
// 建议使用 JWT 替代简单 Token
// 在 AdminAuthController 中实现
@PostMapping("/login")
public Result<Map<String, Object>> login(@RequestBody LoginRequest request) {
    // 1. 验证用户名密码
    // 2. 生成 JWT Token
    String token = JwtUtil.generateToken(admin);
    // 3. 返回 Token
    return Result.success(Map.of("token", token));
}
```

### 2. 密码加密
```java
// 使用 BCrypt 加密密码
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
String hashedPassword = encoder.encode("123");
```

### 3. 权限控制
```java
// 添加权限注解
@PreAuthorize("hasRole('ADMIN')")
@DeleteMapping("/students/{id}")
public Result<Void> deleteStudent(@PathVariable Long id) {
    // ...
}
```

---

## 📊 数据库设计建议

### 1. 管理员表
```sql
CREATE TABLE admin_user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    role VARCHAR(20) DEFAULT 'ADMIN',
    status INT DEFAULT 1,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 插入默认管理员
INSERT INTO admin_user (username, password, email) 
VALUES ('admin', '$2a$10$...', 'admin@example.com');
```

### 2. 公告表
```sql
CREATE TABLE announcement (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(20) NOT NULL,
    target VARCHAR(20) NOT NULL,
    status INT DEFAULT 0,
    publish_time DATETIME,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 3. 敏感词表
```sql
CREATE TABLE sensitive_word (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    word VARCHAR(100) NOT NULL,
    category VARCHAR(20) NOT NULL,
    level INT NOT NULL,
    action VARCHAR(20) NOT NULL,
    replacement VARCHAR(100),
    status INT DEFAULT 1,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_word (word)
);
```

### 4. 为现有表添加状态字段
```sql
-- 学生表添加状态字段
ALTER TABLE student ADD COLUMN status INT DEFAULT 1 COMMENT '状态 0:禁用 1:正常';

-- 教师表添加状态字段
ALTER TABLE teacher ADD COLUMN status INT DEFAULT 1 COMMENT '状态 0:禁用 1:正常';
```

---

## 🎨 界面预览

### 登录页面
- 简洁的登录表单
- 渐变背景
- 表单验证

### 仪表盘
- 统计卡片（学生数、教师数、公告数、敏感词数）
- 快速操作按钮

### 管理页面
- 搜索和筛选
- 数据表格
- 分页
- 批量操作
- 添加/编辑对话框

---

## 🚀 部署指南

### 前端部署

```bash
# 1. 构建生产版本
cd administrator
npm run build

# 2. 部署 dist 目录到 Nginx
# nginx.conf 配置示例:
server {
    listen 80;
    server_name admin.example.com;
    
    location / {
        root /var/www/admin/dist;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:8080;
    }
}
```

### 后端部署

```bash
# 1. 打包
cd project
mvn clean package

# 2. 运行
java -jar target/project-0.0.1-SNAPSHOT.jar

# 3. 或使用 Docker
docker build -t admin-backend .
docker run -p 8080:8080 admin-backend
```

---

## 📝 开发建议

### 1. 完善后端实现
当前后端接口为示例代码，需要：
- 实现数据库 CRUD 操作
- 添加参数验证
- 实现 JWT 认证
- 添加异常处理
- 实现敏感词检测算法

### 2. 添加更多功能
- 操作日志记录
- 数据统计图表
- 系统配置管理
- 数据导出功能
- 邮件通知功能

### 3. 优化用户体验
- 添加加载动画
- 优化表格性能
- 添加快捷键支持
- 实现暗黑模式

---

## 🐛 常见问题

### Q1: 登录后刷新页面需要重新登录？
A: 检查 localStorage 中的 token 是否正确存储，确保路由守卫正确读取 token。

### Q2: API 请求失败？
A: 检查 `.env` 文件中的 API 地址是否正确，确保后端服务已启动。

### Q3: 如何修改默认密码？
A: 修改 `AdminAuthController.java` 中的密码验证逻辑。

### Q4: 如何添加新的管理功能？
A: 参考现有功能的实现方式，创建新的 API、页面组件和路由。

---

## 📞 联系方式

如有问题或建议，请查看项目文档或联系开发团队。

---

**最后更新**: 2024-01-01
