# email-cf-d1 - 邮箱账号管理系统

基于 Cloudflare Pages + Workers + D1 的邮箱账号管理系统。

## 功能特性

- ✅ 增删改查邮箱账号
- ✅ 批量/单个上传接口（需要 API Key）
- ✅ 自动跳过重复邮箱，避免重复保存
- ✅ 响应式 UI 界面
- ✅ GitHub 自动部署

## 技术栈

- **前端**: 纯 HTML/CSS/JavaScript
- **后端**: Cloudflare Workers (Functions)
- **数据库**: Cloudflare D1 (SQLite)
- **部署**: Cloudflare Pages

## 本地开发

### 1. 安装依赖

\`\`\`bash
npm install
\`\`\`

### 2. 创建 D1 数据库

\`\`\`bash
npm run db:create
\`\`\`

复制返回的 `database_id`，更新 `wrangler.toml` 中的 `database_id` 字段。

### 3. 初始化数据库

\`\`\`bash
npm run db:local
\`\`\`

### 4. 配置环境变量

编辑 `.dev.vars` 文件，设置你的 API Key：

\`\`\`
API_KEY=your-secret-api-key-here
\`\`\`

### 5. 启动开发服务器

\`\`\`bash
npm run dev
\`\`\`

访问 http://localhost:8788

## 生产部署

### 方式 1: GitHub 自动部署（推荐）

1. 将代码推送到 GitHub 仓库
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
3. 进入 **Workers & Pages** > **Create application** > **Pages**
4. 连接 GitHub 仓库
5. 构建配置：
   - **Project name**: `email-cf-d1`
   - **Build command**: 留空
   - **Build output directory**: `public`
6. 环境变量设置：
   - 添加 `API_KEY`（用于上传接口）
7. 绑定 D1 数据库：
   - 在项目设置中添加 D1 binding
   - Variable name: `DB`
   - D1 database: 选择你创建的数据库
8. 部署完成后，在生产数据库执行初始化：

\`\`\`bash
wrangler d1 execute email-database --file=./schema.sql
\`\`\`

### 方式 2: 命令行部署

\`\`\`bash
# 初始化生产数据库
npm run db:init

# 部署到 Cloudflare Pages
npm run deploy
\`\`\`

## API 接口

### 查询所有邮箱
\`\`\`
GET /api/emails
\`\`\`

### 添加邮箱
\`\`\`
POST /api/emails
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123",
  "description": "备注信息"
}
\`\`\`

### 更新邮箱
\`\`\`
PUT /api/emails/:id
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "newpassword",
  "description": "新备注"
}
\`\`\`

### 删除邮箱
\`\`\`
DELETE /api/emails/:id
\`\`\`

### 批量上传（需要 API Key）
\`\`\`
POST /api/upload
Authorization: Bearer your-api-key-here
Content-Type: application/json

{
  "emails": [
    {
      "email": "test1@example.com",
      "password": "pass1",
      "description": "备注1"
    },
    {
      "email": "test2@example.com",
      "password": "pass2",
      "description": "备注2"
    }
  ]
}
\`\`\`

## 安全建议

1. **保护 API Key**: 不要将 `.dev.vars` 文件提交到 Git
2. **使用 HTTPS**: Cloudflare 自动提供 SSL 证书
3. **限制访问**: 考虑添加 IP 白名单或基础认证
4. **密码加密**: 生产环境建议对密码进行加密存储

## 许可证

MIT
