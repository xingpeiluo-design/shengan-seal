import { test, expect, request } from '@playwright/test';

/**
 * 后端 API 接口测试
 * 测试范围：产品 API、设置 API、认证 API
 */

const API_BASE = process.env.API_BASE_URL || 'http://139.224.186.15:8082/api';

test.describe('产品 API', () => {
  test('GET /api/products 返回产品列表', async ({ request }) => {
    const response = await request.get(`${API_BASE}/products`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);
    
    // 验证产品数据结构
    const product = data[0];
    expect(product).toHaveProperty('id');
    expect(product).toHaveProperty('name');
    expect(product).toHaveProperty('short_name');
    expect(product).toHaveProperty('border_color');
  });

  test('GET /api/products/:id 返回单个产品', async ({ request }) => {
    const response = await request.get(`${API_BASE}/products/1`);
    expect(response.ok()).toBeTruthy();
    
    const product = await response.json();
    expect(product.id).toBe(1);
    expect(product.name).toBeTruthy();
  });

  test('GET /api/products/999 返回 404', async ({ request }) => {
    const response = await request.get(`${API_BASE}/products/999`);
    expect(response.status()).toBe(404);
  });
});

test.describe('设置 API', () => {
  test('GET /api/settings 返回网站设置', async ({ request }) => {
    const response = await request.get(`${API_BASE}/settings`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    // 验证关键设置字段
    expect(data).toHaveProperty('hotline');
    expect(data).toHaveProperty('factory_phone');
    
    // 验证联系方式正确
    expect(data.hotline).toContain('13507402179');
    expect(data.factory_phone).toContain('0731-86869145');
  });
});

test.describe('认证 API', () => {
  test('POST /api/auth/login 正确凭证返回 token', async ({ request }) => {
    const response = await request.post(`${API_BASE}/auth/login`, {
      data: {
        user: 'admin',
        pass: 'shengan2026',
      },
    });
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('token');
  });

  test('POST /api/auth/login 错误凭证返回 401', async ({ request }) => {
    const response = await request.post(`${API_BASE}/auth/login`, {
      data: {
        user: 'admin',
        pass: 'wrong_password',
      },
    });
    expect(response.status()).toBe(401);
  });
});
