// 完整的 CRUD 测试
const BASE_URL = 'http://localhost:8788';

async function testCRUD() {
  console.log('🧪 测试完整的 CRUD 操作\n');

  let testId = null;

  // CREATE
  console.log('📝 测试 CREATE: 添加测试记录');
  try {
    const response = await fetch(`${BASE_URL}/api/emails`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'crud-test@example.com',
        password: 'original-password',
        description: '原始描述'
      })
    });
    const data = await response.json();
    testId = data.data.id;
    console.log('✅ 创建成功, ID:', testId);
  } catch (error) {
    console.log('❌ 创建失败:', error.message);
    return;
  }

  console.log('\n---\n');

  // READ
  console.log('📝 测试 READ: 查询记录');
  try {
    const response = await fetch(`${BASE_URL}/api/emails`);
    const data = await response.json();
    const record = data.data.find(r => r.id === testId);
    if (record) {
      console.log('✅ 查询成功:', JSON.stringify(record, null, 2));
    } else {
      console.log('❌ 未找到记录');
    }
  } catch (error) {
    console.log('❌ 查询失败:', error.message);
  }

  console.log('\n---\n');

  // UPDATE
  console.log(`📝 测试 UPDATE: 更新记录 ID=${testId}`);
  try {
    const response = await fetch(`${BASE_URL}/api/emails/${testId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'crud-test-updated@example.com',
        password: 'updated-password',
        description: '更新后的描述'
      })
    });
    const data = await response.json();
    console.log('✅ 更新成功:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('❌ 更新失败:', error.message);
  }

  console.log('\n---\n');

  // READ AGAIN
  console.log('📝 测试 READ: 验证更新结果');
  try {
    const response = await fetch(`${BASE_URL}/api/emails`);
    const data = await response.json();
    const record = data.data.find(r => r.id === testId);
    if (record) {
      console.log('✅ 更新验证成功:');
      console.log('  - 邮箱:', record.email);
      console.log('  - 密码:', record.password);
      console.log('  - 描述:', record.description);
      console.log('  - 更新时间:', record.updated_at);
    }
  } catch (error) {
    console.log('❌ 验证失败:', error.message);
  }

  console.log('\n---\n');

  // DELETE
  console.log(`📝 测试 DELETE: 删除记录 ID=${testId}`);
  try {
    const response = await fetch(`${BASE_URL}/api/emails/${testId}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    console.log('✅ 删除成功:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('❌ 删除失败:', error.message);
  }

  console.log('\n---\n');

  // VERIFY DELETE
  console.log('📝 测试 VERIFY: 确认删除成功');
  try {
    const response = await fetch(`${BASE_URL}/api/emails`);
    const data = await response.json();
    const record = data.data.find(r => r.id === testId);
    if (!record) {
      console.log('✅ 删除验证成功: 记录已不存在');
    } else {
      console.log('❌ 删除验证失败: 记录仍然存在');
    }
  } catch (error) {
    console.log('❌ 验证失败:', error.message);
  }

  console.log('\n✨ CRUD 测试完成！');
}

testCRUD();
