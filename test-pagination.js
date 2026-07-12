/**
 * 测试分页功能
 */

const BASE_URL = 'http://localhost:8788';

async function testPagination() {
  console.log('开始测试分页功能...\n');

  try {
    // 测试1: 获取第一页
    console.log('测试1: 获取第一页（默认20条）');
    const response1 = await fetch(`${BASE_URL}/api/emails?page=1&limit=20`);
    const data1 = await response1.json();

    if (response1.status === 401) {
      console.log('❌ 需要身份验证，请先登录');
      console.log('提示：在浏览器中访问 http://localhost:8788 并登录后再运行此脚本\n');
      return;
    }

    console.log('响应状态:', response1.status);
    console.log('数据条数:', data1.data?.length || 0);
    console.log('分页信息:', data1.pagination);
    console.log('✓ 测试1完成\n');

    // 测试2: 获取第二页
    console.log('测试2: 获取第二页');
    const response2 = await fetch(`${BASE_URL}/api/emails?page=2&limit=10`);
    const data2 = await response2.json();
    console.log('响应状态:', response2.status);
    console.log('数据条数:', data2.data?.length || 0);
    console.log('分页信息:', data2.pagination);
    console.log('✓ 测试2完成\n');

    // 测试3: 搜索功能
    console.log('测试3: 搜索功能');
    const response3 = await fetch(`${BASE_URL}/api/emails?search=test`);
    const data3 = await response3.json();
    console.log('响应状态:', response3.status);
    console.log('数据条数:', data3.data?.length || 0);
    console.log('分页信息:', data3.pagination);
    console.log('✓ 测试3完成\n');

    // 测试4: 边界测试
    console.log('测试4: 边界测试（limit=100）');
    const response4 = await fetch(`${BASE_URL}/api/emails?page=1&limit=100`);
    const data4 = await response4.json();
    console.log('响应状态:', response4.status);
    console.log('数据条数:', data4.data?.length || 0);
    console.log('分页信息:', data4.pagination);
    console.log('✓ 测试4完成\n');

    console.log('✅ 所有测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testPagination();
