# 管理员系统安装说明

## 1. 安装依赖

在 `administrator` 目录下运行：

```bash
npm install element-plus @element-plus/icons-vue axios
```

## 2. 启动开发服务器

```bash
npm run dev
```

访问地址: http://localhost:5174

## 3. 登录信息

- 用户名: `admin`
- 密码: `123`

## 4. 功能说明

### 已实现功能

1. **登录认证**
   - 管理员登录
   - Token 验证
   - 路由守卫

2. **仪表盘**
   - 统计数据展示
   - 快速操作入口

3. **学生管理**
   - 学生列表查询
   - 添加/编辑/删除学生
   - 启用/禁用学生账号
   - 重置学生密码
   - 批量删除

4. **教师管理**
   - 教师列表查询
   - 添加/编辑/删除教师
   - 启用/禁用教师账号
   - 重置教师密码
   - 批量删除

5. **公告管理**
   - 发布公告
   - 编辑/删除公告
   - 公告类型：系统公告、通知、紧急
   - 目标用户：所有人、学生、教师
   - 发布/撤回公告

6. **敏感词管理**
   - 添加/编辑/删除敏感词
   - 敏感词分类：脏话、政治、暴力、其他
   - 敏感词级别：轻度、中度、严重
   - 处理方式：替换、屏蔽、警告
   - 批量导入敏感词
   - 测试文本检测

## 5. 后端接口

后端接口已创建在 `project/src/main/java/com/example/project/controller/admin/` 目录下：

- `AdminAuthController.java` - 认证接口
- `AdminUserController.java` - 用户管理接口
- `AdminAnnouncementController.java` - 公告管理接口
- `AdminSensitiveWordController.java` - 敏感词管理接口

**注意**: 当前后端接口为示例代码，需要根据实际数据库结构实现具体的业务逻辑。

## 6. 目录结构

```
administrator/
├── src/
│   ├── api/                    # API 接口定义
│   │   ├── request.ts          # Axios 封装
│   │   ├── auth.ts             # 认证接口
│   │   ├── user.ts             # 用户管理接口
│   │   ├── announcement.ts     # 公告管理接口
│   │   └── sensitive.ts        # 敏感词管理接口
│   │
│   ├── views/                  # 页面组件
│   │   ├── Login.vue           # 登录页
│   │   ├── Layout.vue          # 布局页
│   │   ├── Dashboard.vue       # 仪表盘
│   │   ├── StudentManagement.vue        # 学生管理
│   │   ├── TeacherManagement.vue        # 教师管理
│   │   ├── AnnouncementManagement.vue   # 公告管理
│   │   └── SensitiveWordManagement.vue  # 敏感词管理
│   │
│   ├── router/                 # 路由配置
│   │   └── index.ts
│   │
│   ├── App.vue                 # 根组件
│   └── main.ts                 # 入口文件
│
├── .env                        # 环境变量
└── package.json
```

## 7. 开发建议

1. **数据库设计**
   - 创建 `admin_user` 表存储管理员信息
   - 创建 `announcement` 表存储公告
   - 创建 `sensitive_word` 表存储敏感词
   - 为 `student` 和 `teacher` 表添加 `status` 字段

2. **安全性**
   - 使用 JWT 进行身份验证
   - 密码使用 BCrypt 加密
   - 添加操作日志记录
   - 实现权限控制

3. **功能扩展**
   - 添加数据统计图表
   - 实现操作日志查看
   - 添加系统配置管理
   - 实现数据导出功能

## 8. 常见问题

### Q: 如何修改 API 地址？
A: 修改 `.env` 文件中的 `VITE_API_BASE_URL`

### Q: 如何添加新的管理功能？
A: 
1. 在 `src/api/` 下创建新的 API 文件
2. 在 `src/views/` 下创建新的页面组件
3. 在 `src/router/index.ts` 中添加路由
4. 在 `Layout.vue` 中添加菜单项

### Q: 如何部署到生产环境？
A:
```bash
npm run build
```
将 `dist` 目录部署到 Web 服务器即可。

## 9. 技术栈

- Vue 3 + TypeScript
- Element Plus (UI 组件库)
- Vue Router (路由)
- Axios (HTTP 客户端)
- Pinia (状态管理)

## 10. 联系方式

如有问题，请查看项目文档或联系开发团队。
