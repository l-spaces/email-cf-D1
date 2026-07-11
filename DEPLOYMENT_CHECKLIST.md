# 部署前检查清单

## ✅ 本地测试完成

### 代码完整性
- [x] 所有代码文件存在且完整
- [x] TypeScript 编译无错误
- [x] 依赖安装成功 (59 packages)

### 功能测试
- [x] GET /api/emails - 查询邮箱列表
- [x] POST /api/emails - 添加邮箱
- [x] PUT /api/emails/:id - 更新邮箱
- [x] DELETE /api/emails/:id - 删除邮箱
- [x] POST /api/upload - 单个上传
- [x] POST /api/upload - 批量上传
- [x] 重复邮箱检测（跳过重复）
- [x] API Key 认证

### 安全测试
- [x] 参数化查询（防 SQL 注入）
- [x] API Key 验证工作正常
- [x] .dev.vars 在 .gitignore 中
- [x] 无 API Key 请求被拒绝
- [x] 错误 API Key 请求被拒绝

### 性能测试
- [x] API 响应时间 < 500ms
- [x] 批量上传正常处理多条记录

---

## 📋 部署准备

### 1. GitHub 仓库
- [ ] 创建 GitHub 仓库
- [ ] 推送代码到仓库
- [ ] 确认 .dev.vars 未被提交

### 2. Cloudflare 配置
- [ ] 登录 Cloudflare Dashboard
- [ ] 创建 D1 数据库（生产）
- [ ] 获取 database_id
- [ ] 更新 wrangler.toml 中的 database_id
- [ ] 执行数据库初始化 SQL

### 3. Pages 项目设置
- [ ] 连接 GitHub 仓库
- [ ] 配置构建设置
  - Project name: `email-cf-d1`
  - Build command: 留空
  - Build output directory: `public`
- [ ] 绑定 D1 数据库
  - Variable name: `DB`
  - D1 database: `email-database`
- [ ] 设置环境变量
  - `API_KEY`: 生产密钥（强密码）

### 4. 域名配置（可选）
- [ ] 添加自定义域名
- [ ] 配置 DNS 记录
- [ ] 等待 SSL 证书生成

---

## 🔐 生产环境安全建议

### 必须执行
1. **生成强 API Key**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   在 Cloudflare Dashboard 设置此密钥

2. **禁用调试信息**
   - 确保生产环境不输出敏感日志

### 建议执行
1. **密码加密**
   - 当前密码明文存储
   - 建议使用 bcrypt 或 AES 加密

2. **添加速率限制**
   - 防止 API 滥用
   - 可使用 Cloudflare Rate Limiting

3. **添加访问控制**
   - 如需保护 UI，添加 Cloudflare Access
   - 或实施 HTTP Basic Auth

4. **定期备份**
   - 使用 `wrangler d1 export` 导出数据
   - 设置自动备份计划

---

## 📝 部署命令速查

### 创建生产数据库
```bash
wrangler d1 create email-database
# 复制返回的 database_id 到 wrangler.toml
```

### 初始化生产数据库
```bash
npm run db:init
# 或
wrangler d1 execute email-database --file=./schema.sql
```

### 部署到 Cloudflare Pages
```bash
npm run deploy
# 或
wrangler pages deploy public
```

### 查看部署列表
```bash
wrangler pages deployment list
```

### 查看实时日志
```bash
wrangler pages deployment tail
```

---

## 🧪 生产环境测试

部署完成后，测试以下内容：

### 基础功能
- [ ] 访问生产 URL，页面加载正常
- [ ] UI 增删改查功能正常
- [ ] API 接口响应正常

### 上传接口
```bash
# 替换为你的生产 URL 和 API Key
curl -X POST https://email-cf-d1.pages.dev/api/upload \
  -H "Authorization: Bearer YOUR_PRODUCTION_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "prod-test@example.com",
    "password": "testpass",
    "description": "生产测试"
  }'
```

### 验证结果
- [ ] 单个上传成功
- [ ] 批量上传成功
- [ ] 重复检测工作正常
- [ ] 无 API Key 请求被拒绝

---

## 📊 监控建议

### Cloudflare Dashboard 监控
1. **Metrics** 标签
   - 请求量
   - 错误率
   - 响应时间

2. **Logs** 标签
   - 实时日志
   - 错误日志

3. **D1 Database**
   - 存储使用量
   - 查询次数

### 设置告警（可选）
- 错误率超过阈值
- 请求量异常
- 存储空间告警

---

## 📦 交付清单

### 代码仓库
- [x] README.md - 项目说明
- [x] docs/项目需求文档.md
- [x] docs/开发指南.md
- [x] docs/部署指南.md
- [x] docs/API文档.md
- [x] TEST_REPORT.md - 测试报告
- [x] DEPLOYMENT_CHECKLIST.md - 本清单

### 运行环境
- [ ] 生产数据库创建
- [ ] Pages 项目部署
- [ ] API Key 配置
- [ ] 环境变量设置

### 验证完成
- [ ] 生产环境功能测试通过
- [ ] 文档齐全
- [ ] 访问地址可用

---

## 🎯 成功标准

部署成功的标志：

1. ✅ 访问 `https://email-cf-d1.pages.dev` 正常显示 UI
2. ✅ UI 可以正常进行增删改查操作
3. ✅ 上传接口 API Key 认证正常
4. ✅ 重复邮箱自动跳过
5. ✅ 所有 API 返回正确的响应格式

---

## 📞 问题排查

### 常见问题

**Q: 部署后 API 返回 500 错误**
- 检查 D1 是否绑定
- 检查数据库是否初始化
- 查看 Cloudflare Logs

**Q: 上传接口返回 401**
- 检查 API_KEY 环境变量是否设置
- 确认请求头格式正确

**Q: 页面显示 404**
- 检查 Build output directory 设置
- 确认为 `public`

**Q: GitHub 自动部署未触发**
- 检查 GitHub 集成状态
- 查看 Webhook 配置
- 重新连接 GitHub

---

**清单版本**: v1.0  
**更新日期**: 2026-07-12  
**状态**: 本地测试完成，待生产部署
