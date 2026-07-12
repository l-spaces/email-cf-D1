# email-cf-d1 - 邮箱账号管理系统

基于 Cloudflare Pages + D1 数据库的邮箱账号管理系统。

## 🚀 在线演示

- **生产地址**: https://email-cf-d1.pages.dev
- **自定义域名**: https://x-y.cc.cd
- **API 文档**: [查看完整 API 文档](./docs/API文档.md)

## ✨ 功能特性

- ✅ 邮箱账号 CRUD 操作
- ✅ 批量导入/单个上传（支持两种格式）
- ✅ 重复邮箱自动跳过，避免重复保存
- ✅ API Key 认证保护上传接口
- ✅ 响应式 Web 界面
- ✅ RESTful API 接口
- ✅ D1 数据库持久化存储
- ✅ GitHub 自动部署

## 📦 技术栈

- **前端**: HTML + CSS + JavaScript (Vanilla)
- **后端**: Cloudflare Pages Functions (TypeScript)
- **数据库**: Cloudflare D1 (SQLite)
- **部署**: Cloudflare Pages
- **图标**: Lucide Icons

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

详细的部署步骤请参考 [部署指南](./docs/部署指南.md)。

### 快速部署（命令行方式）

```bash
# 1. 更新 Wrangler
npm install --save-dev wrangler@latest --legacy-peer-deps

# 2. 登录 Cloudflare
npx wrangler login

# 3. 创建 D1 数据库
npx wrangler d1 create email-database
# 记录返回的 database_id，并更新到 wrangler.toml

# 4. 初始化远程数据库
npx wrangler d1 execute email-database --remote --file=schema.sql

# 5. 创建 Pages 项目
npx wrangler pages project create email-cf-d1 --production-branch=main

# 6. 部署项目
npx wrangler pages deploy

# 7. 在 Dashboard 中绑定 D1 数据库（必须手动操作）
# 访问: https://dash.cloudflare.com/
# Workers & Pages > email-cf-d1 > Settings > Functions > D1 database bindings
# 添加: Variable name = DB, D1 database = email-database

# 8. 配置 API_KEY
$key = 'your-api-key-here'
$key | npx wrangler pages secret put API_KEY --project-name=email-cf-d1
```

### GitHub 自动部署（推荐）

完整步骤请查看 [部署指南](./docs/部署指南.md)。

## 📖 API 接口

完整的 API 文档请查看：[API 文档](./docs/API文档.md)

### 快速示例

#### 查询所有邮箱
```bash
curl https://email-cf-d1.pages.dev/api/emails
```

#### 添加邮箱
```bash
curl -X POST https://email-cf-d1.pages.dev/api/emails \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123","description":"测试"}'
```

#### 批量上传（需要 API Key）
```bash
curl -X POST https://email-cf-d1.pages.dev/api/upload \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "emails": [
      {"email":"test1@example.com","password":"pass1","description":"账号1"},
      {"email":"test2@example.com","password":"pass2","description":"账号2"}
    ]
  }'
```

#### 单个上传（需要 API Key）
```bash
curl -X POST https://email-cf-d1.pages.dev/api/upload \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"single@example.com","password":"pass","description":"单个"}'
```

### 测试结果

✅ 所有功能已在生产环境测试通过：

| 测试项 | 状态 | 说明 |
|--------|------|------|
| 单个上传 | ✅ | 成功添加记录 |
| 批量上传 | ✅ | 一次性添加多条记录 |
| 重复检测 | ✅ | 重复邮箱自动跳过 |
| 数据持久化 | ✅ | D1 数据库保存成功 |
| API Key 验证 | ✅ | 错误的 key 返回 401 |

## 📚 文档

- [API 文档](./docs/API文档.md) - 完整的 API 接口说明
- [部署指南](./docs/部署指南.md) - 详细的部署步骤
- [开发指南](./docs/开发指南.md) - 本地开发和扩展功能
- [项目需求文档](./docs/项目需求文档.md) - 项目需求和功能说明

## 🔒 安全建议

1. **保护 API Key**: 
   - 不要将 `.dev.vars` 文件提交到 Git
   - 使用强随机字符串作为 API Key
   - 定期更换 API Key

2. **使用 HTTPS**: 
   - Cloudflare 自动提供免费 SSL 证书
   - 始终使用 HTTPS 访问 API

3. **访问控制**: 
   - 考虑添加 IP 白名单
   - 实施速率限制防止滥用
   - 使用 Cloudflare Access 保护整个应用

4. **数据安全**: 
   - 生产环境建议对敏感数据加密存储
   - 定期备份 D1 数据库
   - 监控异常访问和操作

## 🎯 使用场景

- 邮箱账号集中管理
- 测试账号批量创建
- 多平台账号统一维护
- API 集成到其他系统

## 📝 许可证

MIT
