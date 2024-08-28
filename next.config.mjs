/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30, // nextjs15以前页面默认会缓存，现在nextjs15需要配置才会启动缓存，这里设置30秒缓存，减少tag数据多次请求
    }
  },
  serverExternalPackages: ["@node-rs/argon2"], // 指定服务器组件所需的外部包，lucia-auth中使用了argon2进行密码hash处理a，需要指定
};

export default nextConfig;
