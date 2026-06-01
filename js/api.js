/**
 * API 工具函数 —— 统一封装后端请求
 * 所有模块通过此函数与 Cloudflare Worker 通信
 */

const API = {
  // 使用相对路径，通过 Pages Functions 代理转发到后端 Worker
  BASE: '',

  /**
   * 通用 fetch 封装
   * @param {string} endpoint - API 路径，如 '/api/login'
   * @param {object} options  - fetch options
   * @returns {Promise<any>}
   */
  async request(endpoint, options = {}) {
    const url = `${this.BASE}${endpoint}`;
    const defaultOptions = {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'omit',
    };
    const finalOptions = { ...defaultOptions, ...options };
    if (finalOptions.body && typeof finalOptions.body === 'object') {
      finalOptions.body = JSON.stringify(finalOptions.body);
    }
    const resp = await fetch(url, finalOptions);
    const data = await resp.json();
    if (!resp.ok) {
      throw new Error(data.error || `请求失败（${resp.status}）`);
    }
    return data;
  },

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  },

  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body });
  },
};

// 导出给各模块使用
window.API = API;
