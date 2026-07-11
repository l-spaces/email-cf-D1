// 简单的 API 测试脚本
const BASE_URL = 'http://localhost:8788';

async function testAPI() {
  console.log('🧪 开始测试 API...\n');

  // 测试 1: 获取邮箱列表
  console.log('📝 测试 1: GET /api/emails');
  try {
    const response = await fetch(`${BASE_URL}/api/emails`);
    const data = await response.json();
    console.log('✅ 响应:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('❌ 错误:', error.message);
  }

  console.log('\n---\n');

  // 测试 2: 添加邮箱
  console.log('📝 测试 2: POST /api/emails');
  try {
    const response = await fetch(`${BASE_URL}/api/emails`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        description: '测试账号'
      })
    });
    const data = await response.json();
    console.log('✅ 响应:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('❌ 错误:', error.message);
  }

  console.log('\n---\n');

  // 测试 3: 单个上传
  console.log('📝 测试 3: POST /api/upload (单个)');
  try {
    const response = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-api-key',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'upload1@example.com',
        password: 'pass123',
        description: '单个上传测试'
      })
    });
    const data = await response.json();
    console.log('✅ 响应:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('❌ 错误:', error.message);
  }

  console.log('\n---\n');

  // 测试 4: 批量上传
  console.log('📝 测试 4: POST /api/upload (批量)');
  try {
    const response = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-api-key',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        emails: [
          { email: 'batch1@example.com', password: 'pass1', description: '批量1' },
          { email: 'batch2@example.com', password: 'pass2', description: '批量2' },
          { email: 'batch3@example.com', password: 'pass3', description: '批量3' }
        ]
      })
    });
    const data = await response.json();
    console.log('✅ 响应:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('❌ 错误:', error.message);
  }

  console.log('\n---\n');

  // 测试 5: 重复邮箱检测
  console.log('📝 测试 5: POST /api/upload (重复检测)');
  try {
    const response = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-api-key',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        emails: [
          { email: 'batch1@example.com', password: 'pass1', description: '重复' },
          { email: 'new@example.com', password: 'newpass', description: '新的' }
        ]
      })
    });
    const data = await response.json();
    console.log('✅ 响应:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('❌ 错误:', error.message);
  }

  console.log('\n---\n');

  // 测试 6: 最终列表
  console.log('📝 测试 6: GET /api/emails (查看最终结果)');
  try {
    const response = await fetch(`${BASE_URL}/api/emails`);
    const data = await response.json();
    console.log('✅ 响应:', JSON.stringify(data, null, 2));
    if (data.success && data.data) {
      console.log(`\n📊 总共 ${data.data.length} 条记录`);
    }
  } catch (error) {
    console.log('❌ 错误:', error.message);
  }

  console.log('\n✨ 测试完成！');
}

testAPI();
