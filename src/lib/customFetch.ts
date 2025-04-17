// 自动日期转换

// 自动将以 "At" 结尾的字段转换为 Date 对象
// 超时处理

// 默认 10 秒超时
// 可配置超时时间
// 自动重试

// 默认重试 3 次
// 重试间隔时间递增
// 错误处理

// HTTP 状态码检查
// 超时错误处理
// 网络错误处理
// 灵活配置

// 支持基础 URL
// 自定义请求头
// 可配置重试次数

type ExtendedRequestInit = RequestInit & {
  searchParams?: Record<string, string> | URLSearchParams;
};

type FetchConfig = {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  headers?: HeadersInit;
};

class CustomFetch {
  private config: FetchConfig;
  private abortControllers: Map<string, AbortController>; // 用于存储每个请求的 AbortController

  constructor(config: FetchConfig = {}) {
    this.config = {
      timeout: 10000,
      retries: 3,
      ...config,
    };
    this.abortControllers = new Map();
  }

  // 生成请求的唯一标识
  private generateRequestKey(url: string, options: RequestInit = {}): string {
    return `${options.method || "GET"}-${url}`;
  }

  private cancelPreviousRequest(requestKey: string) {
    const controller = this.abortControllers.get(requestKey);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(requestKey);
    }
  }

  private async fetchWithTimeout(url: string, options: RequestInit = {}) {
    const requestKey = this.generateRequestKey(url, options);
    // 取消之前的相同请求
    this.cancelPreviousRequest(requestKey);

    const controller = new AbortController();
    this.abortControllers.set(requestKey, controller);

    // 设置超时
    // 如果请求超过指定时间，则取消请求
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...this.config.headers,
          ...options.headers,
        },
      });
      clearTimeout(timeoutId);
      this.abortControllers.delete(requestKey);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      this.abortControllers.delete(requestKey);
      if (error.name === "AbortError") {
        throw new Error(`Request timeout after ${this.config.timeout}ms`);
      }
      throw error;
    }
  }

  private parseJSON(text: string) {
    return JSON.parse(text, (key, value) => {
      if (key.endsWith("At") && typeof value === "string") {
        return new Date(value);
      }
      return value;
    });
  }

  private buildURL(url: string, options: ExtendedRequestInit): string {
    const fullUrl = this.config.baseURL ? `${this.config.baseURL}${url}` : url;
    
    if (options.searchParams) {
      const searchParams = new URLSearchParams(options.searchParams);
      return `${fullUrl}${fullUrl.includes('?') ? '&' : '?'}${searchParams.toString()}`;
    }
    
    return fullUrl;
  }

  async request(url: string, options: ExtendedRequestInit = {}) {
    const { searchParams, ...fetchOptions } = options;
    const finalUrl = this.buildURL(url, options);

    for (let i = 0; i < this.config.retries!; i++) {
      try {
        const response = await this.fetchWithTimeout(finalUrl, fetchOptions);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text();
        return text.length ? this.parseJSON(text) : null;
      } catch (error) {
        if (i === this.config.retries! - 1) throw error;
        // 如果请求失败，等待一段时间后重试
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  async get(url: string, options: ExtendedRequestInit = {}) {
    return this.request(url, { ...options, method: "GET" });
  }

  async post(url: string, data?: any, options: ExtendedRequestInit = {}) {
    return this.request(url, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  }

  async put(url: string, data?: any, options: ExtendedRequestInit = {}) {
    return this.request(url, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  }

  async delete(url: string, options: ExtendedRequestInit = {}) {
    return this.request(url, { ...options, method: "DELETE" });
  }

  async patch(url: string, data?: any, options: ExtendedRequestInit = {}) {
    return this.request(url, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  }
}

// 创建实例
const fetchInstance = new CustomFetch({
  timeout: 5000,
  retries: 3,
  headers: {
    "Content-Type": "application/json",
  },
});

export default fetchInstance;

// // GET 请求带查询参数
// const response = await fetchInstance.get('/api/posts/for-you', {
//   searchParams: { cursor: 'some-cursor' }
// });

// // POST 请求带数据
// const newPost = await fetchInstance.post('/api/posts', {
//   content: 'Hello world'
// });

// // PUT 请求
// const updatedPost = await fetchInstance.put('/api/posts/123', {
//   content: 'Updated content'
// });

// // DELETE 请求
// await fetchInstance.delete('/api/posts/123');

// // PATCH 请求
// const patchedPost = await fetchInstance.patch('/api/posts/123', {
//   content: 'Partially updated content'
// });
