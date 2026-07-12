# email-cf-d1 API 文档

## 基础信息

**Base URL**: 
- 本地开发: `http://localhost:8788`
- 生产环境: `https://email-cf-d1.pages.dev`
- 自定义域名: `https://x-y.cc.cd`

**Content-Type**: `application/json`

**认证方式**: 
- 大部分接口: 无需认证
- 上传接口: Bearer Token (API Key)

## 响应格式

所有接口统一使用以下响应格式：

### 成功响应
```json
{
  "success": true,
  "data": { ... }
}
```

### 失败响应
```json
{
  "success": false,
  "error": "错误信息"
}
```

## 接口列表

### 1. 获取邮箱列表

获取所有邮箱账号信息。

**请求**
```
GET /api/emails
```

**响应示例**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "test@example.com",
      "password": "password123",
      "description": "测试账号",
      "created_at": "2024-01-01 12:00:00",
      "updated_at": "2024-01-01 12:00:00"
    },
    {
      "id": 2,
      "email": "demo@example.com",
      "password": "demopass",
      "description": "演示账号",
      "created_at": "2024-01-02 10:30:00",
      "updated_at": "2024-01-02 10:30:00"
    }
  ]
}
```

**字段说明**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer | 邮箱记录 ID |
| email | string | 邮箱地址 |
| password | string | 密码 |
| description | string | 备注说明 |
| created_at | string | 创建时间 |
| updated_at | string | 更新时间 |

**cURL 示例**
```bash
curl http://localhost:8788/api/emails
```

---

### 2. 添加邮箱

创建一条新的邮箱记录。

**请求**
```
POST /api/emails
Content-Type: application/json
```

**请求体**
```json
{
  "email": "new@example.com",
  "password": "newpassword",
  "description": "备注信息"
}
```

**参数说明**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | ✅ | 邮箱地址 |
| password | string | ✅ | 密码 |
| description | string | ❌ | 备注信息 |

**响应示例**
```json
{
  "success": true,
  "data": {
    "id": 3
  }
}
```

**错误响应**
```json
{
  "success": false,
  "error": "Email and password are required"
}
```

**cURL 示例**
```bash
curl -X POST http://localhost:8788/api/emails \
  -H "Content-Type: application/json" \
  -d '{
    "email": "new@example.com",
    "password": "newpassword",
    "description": "新账号"
  }'
```

**JavaScript 示例**
```javascript
const response = await fetch('/api/emails', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'new@example.com',
    password: 'newpassword',
    description: '新账号'
  })
});

const result = await response.json();
console.log(result);
```

---

### 3. 更新邮箱

更新指定 ID 的邮箱记录。

**请求**
```
PUT /api/emails/:id
Content-Type: application/json
```

**路径参数**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | integer | 邮箱记录 ID |

**请求体**
```json
{
  "email": "updated@example.com",
  "password": "updatedpassword",
  "description": "更新后的备注"
}
```

**参数说明**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | ✅ | 邮箱地址 |
| password | string | ✅ | 密码 |
| description | string | ❌ | 备注信息 |

**响应示例**
```json
{
  "success": true
}
```

**错误响应**
```json
{
  "success": false,
  "error": "Email and password are required"
}
```

**cURL 示例**
```bash
curl -X PUT http://localhost:8788/api/emails/1 \
  -H "Content-Type: application/json" \
  -d '{
    "email": "updated@example.com",
    "password": "newpass123",
    "description": "更新的备注"
  }'
```

**JavaScript 示例**
```javascript
const response = await fetch('/api/emails/1', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'updated@example.com',
    password: 'newpass123',
    description: '更新的备注'
  })
});

const result = await response.json();
```

---

### 4. 删除邮箱

删除指定 ID 的邮箱记录。

**请求**
```
DELETE /api/emails/:id
```

**路径参数**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | integer | 邮箱记录 ID |

**响应示例**
```json
{
  "success": true
}
```

**错误响应**
```json
{
  "success": false,
  "error": "Failed to delete email"
}
```

**cURL 示例**
```bash
curl -X DELETE http://localhost:8788/api/emails/1
```

**JavaScript 示例**
```javascript
const response = await fetch('/api/emails/1', {
  method: 'DELETE'
});

const result = await response.json();
```

---

### 5. 批量/单个上传（需要认证）

批量导入多条邮箱记录或单个上传。此接口需要 API Key 认证。

**请求**
```
POST /api/upload
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**请求头**
| 字段 | 值 | 说明 |
|------|------|------|
| Authorization | Bearer YOUR_API_KEY | API Key 认证 |
| Content-Type | application/json | 请求格式 |

#### 方式1: 批量上传

**请求体**
```json
{
  "emails": [
    {
      "email": "test1@example.com",
      "password": "password1",
      "description": "账号1"
    },
    {
      "email": "test2@example.com",
      "password": "password2",
      "description": "账号2"
    },
    {
      "email": "test3@example.com",
      "password": "password3",
      "description": "账号3"
    }
  ]
}
```

**参数说明**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| emails | array | ✅ | 邮箱数组 |
| emails[].email | string | ✅ | 邮箱地址 |
| emails[].password | string | ✅ | 密码 |
| emails[].description | string | ❌ | 备注信息 |

#### 方式2: 单个上传

**请求体**
```json
{
  "email": "single@example.com",
  "password": "password123",
  "description": "单个账号"
}
```

**参数说明**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | ✅ | 邮箱地址 |
| password | string | ✅ | 密码 |
| description | string | ❌ | 备注信息 |

**响应示例**
```json
{
  "success": true,
  "data": {
    "total": 5,
    "success": 3,
    "skipped": 2,
    "failed": 0
  }
}
```

**包含跳过和失败详情的响应**
```json
{
  "success": true,
  "data": {
    "total": 10,
    "success": 5,
    "skipped": 3,
    "failed": 2,
    "skippedItems": [
      "duplicate1@example.com",
      "duplicate2@example.com",
      "duplicate3@example.com"
    ],
    "failedItems": [
      {
        "email": "invalid@example.com",
        "reason": "Database error"
      },
      {
        "email": "unknown",
        "reason": "Missing email or password"
      }
    ]
  }
}
```

**响应字段说明**
| 字段 | 类型 | 说明 |
|------|------|------|
| total | integer | 总记录数 |
| success | integer | 成功添加的记录数 |
| skipped | integer | 跳过的重复邮箱数 |
| failed | integer | 失败的记录数 |
| skippedItems | string[] | 被跳过的邮箱地址列表（仅当有跳过时返回） |
| failedItems | object[] | 失败的记录详情（仅当有失败时返回） |

**认证失败响应**
```json
{
  "error": "Unauthorized"
}
```
HTTP Status: 401

**错误响应**
```json
{
  "success": false,
  "error": "Invalid data format. Expected {\"email\": \"...\", \"password\": \"...\"} or {\"emails\": [...]}"
}
```

**cURL 示例（批量上传）**
```bash
curl -X POST http://localhost:8788/api/upload \
  -H "Authorization: Bearer your-secret-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "emails": [
      {
        "email": "test1@example.com",
        "password": "pass1",
        "description": "测试1"
      },
      {
        "email": "test2@example.com",
        "password": "pass2",
        "description": "测试2"
      }
    ]
  }'
```

**cURL 示例（单个上传）**
```bash
curl -X POST http://localhost:8788/api/upload \
  -H "Authorization: Bearer your-secret-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "single@example.com",
    "password": "singlepass",
    "description": "单个测试账号"
  }'
```

**JavaScript 示例（批量）**
```javascript
const response = await fetch('/api/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-secret-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    emails: [
      {
        email: 'test1@example.com',
        password: 'pass1',
        description: '测试1'
      },
      {
        email: 'test2@example.com',
        password: 'pass2',
        description: '测试2'
      }
    ]
  })
});

const result = await response.json();
console.log(result);
```

**JavaScript 示例（单个）**
```javascript
const response = await fetch('/api/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-secret-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'single@example.com',
    password: 'singlepass',
    description: '单个账号'
  })
});

const result = await response.json();
console.log(result);
```

**Python 示例（批量）**
```python
import requests

url = 'http://localhost:8788/api/upload'
headers = {
    'Authorization': 'Bearer your-secret-api-key',
    'Content-Type': 'application/json'
}
data = {
    'emails': [
        {
            'email': 'test1@example.com',
            'password': 'pass1',
            'description': '测试1'
        },
        {
            'email': 'test2@example.com',
            'password': 'pass2',
            'description': '测试2'
        }
    ]
}

response = requests.post(url, headers=headers, json=data)
print(response.json())
```

**Python 示例（单个）**
```python
import requests

url = 'http://localhost:8788/api/upload'
headers = {
    'Authorization': 'Bearer your-secret-api-key',
    'Content-Type': 'application/json'
}
data = {
    'email': 'single@example.com',
    'password': 'singlepass',
    'description': '单个测试账号'
}

response = requests.post(url, headers=headers, json=data)
print(response.json())
```

---

## HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 认证失败 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 错误码说明

### 常见错误

**400 Bad Request**
```json
{
  "success": false,
  "error": "Email and password are required"
}
```
原因：缺少必填参数

**401 Unauthorized**
```json
{
  "error": "Unauthorized"
}
```
原因：API Key 缺失或错误

**404 Not Found**
```json
{
  "success": false,
  "error": "Email not found"
}
```
原因：指定 ID 的记录不存在

**500 Internal Server Error**
```json
{
  "success": false,
  "error": "Failed to fetch emails"
}
```
原因：数据库查询失败或服务器错误

## 认证说明

### API Key 配置

**本地开发**
在 `.dev.vars` 文件中设置：
```
API_KEY=your-local-api-key
```

**生产环境**
在 Cloudflare Dashboard 设置环境变量：
```
Settings > Environment variables > Add variable
Name: API_KEY
Value: your-production-api-key
```

或使用命令行：
```bash
# 方法1: 交互式输入
npx wrangler pages secret put API_KEY --project-name=email-cf-d1

# 方法2: 从变量设置
$key = 'your-api-key-here'
$key | npx wrangler pages secret put API_KEY --project-name=email-cf-d1
```

⚠️ **注意**: 设置 API_KEY 后需要重新部署才能生效：
```bash
npx wrangler pages deploy --project-name=email-cf-d1
```

### 使用 API Key

在请求头中添加 Authorization：
```
Authorization: Bearer YOUR_API_KEY
```

**注意**:
- 仅 `/api/upload` 接口需要认证
- 其他接口无需认证（如需保护，可修改 `_middleware.ts`）

## 速率限制

目前未实施速率限制，建议自行实现：

**简单限制示例**（在 `_middleware.ts` 中）：
```typescript
const requestCounts = new Map();

export const onRequest: PagesFunction = async (context) => {
  const ip = context.request.headers.get('CF-Connecting-IP');
  const count = requestCounts.get(ip) || 0;
  
  if (count > 100) {  // 100 次/分钟
    return new Response(
      JSON.stringify({ error: 'Too Many Requests' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  requestCounts.set(ip, count + 1);
  setTimeout(() => requestCounts.delete(ip), 60000);
  
  return context.next();
};
```

## CORS 支持

当前未配置 CORS，如需跨域访问，在 `_middleware.ts` 添加：

```typescript
export const onRequest: PagesFunction = async (context) => {
  const response = await context.next();
  
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
};
```

## 最佳实践

### 1. 错误处理
始终检查 `success` 字段：
```javascript
const response = await fetch('/api/emails');
const result = await response.json();

if (result.success) {
  console.log('成功:', result.data);
} else {
  console.error('错误:', result.error);
}
```

### 2. 批量操作
使用 `/api/upload` 接口，支持批量和单个上传：

**批量上传**：
```javascript
// ✅ 推荐 - 批量
await fetch('/api/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ emails: [...] })
});
```

**单个上传**：
```javascript
// ✅ 也可以 - 单个
await fetch('/api/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'pass123',
    description: '备注'
  })
});
```

**不推荐**：
```javascript
// ❌ 不推荐 - 多次调用
for (const email of emails) {
  await fetch('/api/emails', {
    method: 'POST',
    body: JSON.stringify(email)
  });
}
```

### 3. 安全传输
生产环境始终使用 HTTPS：
```javascript
// ✅ 正确
const response = await fetch('https://your-project.pages.dev/api/emails');

// ❌ 错误
const response = await fetch('http://your-project.pages.dev/api/emails');
```

### 4. API Key 保护
不要在前端代码中暴露 API Key：
```javascript
// ❌ 危险
const API_KEY = 'your-secret-key';  // 会被用户看到

// ✅ 安全
// 在后端或服务器端调用 /api/upload
```

## Postman 集合

### 导入 Postman

创建 `Email-CF-D1.postman_collection.json`：
```json
{
  "info": {
    "name": "email-cf-d1 API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:8788",
      "type": "string"
    },
    {
      "key": "apiKey",
      "value": "your-api-key-here",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "获取邮箱列表",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/emails"
      }
    },
    {
      "name": "添加邮箱",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/emails",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"password123\",\n  \"description\": \"测试账号\"\n}"
        }
      }
    },
    {
      "name": "更新邮箱",
      "request": {
        "method": "PUT",
        "url": "{{baseUrl}}/api/emails/1",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"updated@example.com\",\n  \"password\": \"newpass\",\n  \"description\": \"更新后\"\n}"
        }
      }
    },
    {
      "name": "删除邮箱",
      "request": {
        "method": "DELETE",
        "url": "{{baseUrl}}/api/emails/1"
      }
    },
    {
      "name": "批量上传",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/upload",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{apiKey}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"emails\": [\n    {\n      \"email\": \"test1@example.com\",\n      \"password\": \"pass1\",\n      \"description\": \"账号1\"\n    },\n    {\n      \"email\": \"test2@example.com\",\n      \"password\": \"pass2\",\n      \"description\": \"账号2\"\n    }\n  ]\n}"
        }
      }
    },
    {
      "name": "单个上传",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/upload",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{apiKey}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"single@example.com\",\n  \"password\": \"singlepass\",\n  \"description\": \"单个账号\"\n}"
        }
      }
    }
  ]
}
```

## 更新日志

### v1.1 (2026-07-12)
- ✅ 生产环境部署成功
- ✅ D1 数据库配置完成
- ✅ API_KEY 认证测试通过
- ✅ 批量上传功能验证
- ✅ 重复邮箱自动跳过
- ✅ 添加自定义域名支持

### v1.0 (2026-07-12)
- 初始版本
- 实现基础 CRUD 接口
- 实现批量/单个上传接口
- 添加 API Key 认证
- 上传失败时返回详细错误信息
- 自动跳过重复邮箱，不保存重复数据

---

**文档版本**: v1.0  
**最后更新**: 2026-07-12  
**联系方式**: [待补充]
