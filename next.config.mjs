/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30, // nextjs15以前页面默认会缓存，现在nextjs15需要配置才会启动缓存，这里设置30秒缓存，减少tag数据多次请求
    },
  },
};

export default nextConfig;
