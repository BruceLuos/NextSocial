/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // 该配置主要影响 Dynamic Functions（如动态路由）的缓存行为
    // 在 Next.js 15 中，默认禁用了动态路由的缓存
    // 设置 staleTimes 后会启用缓存
    staleTimes: {
      dynamic: 30, // nextjs15以前页面默认会缓存，现在nextjs15需要配置才会启动缓存，这里设置30秒缓存，减少tag数据多次请求
    },
  },
  serverExternalPackages: ["@node-rs/argon2"], // 指定服务器组件所需的外部包，lucia-auth中使用了argon2进行密码hash处理a，需要指定
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
        pathname: `/a/${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}/*`,
      },
    ],
  },
  rewrites: () => {
    return [
      // 点击帖子#tag链接重定向到搜索页并带上query
      {
        source: "/hashtag/:tag",
        destination: "/search?q=%23:tag",
      },
    ];
  },
};

export default nextConfig;
