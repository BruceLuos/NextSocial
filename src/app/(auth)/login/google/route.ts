import { google } from "@/auth";
import { generateCodeVerifier, generateState } from "arctic";
import { cookies } from "next/headers";

export async function GET() {
  const state = generateState(); // 生成随机状态字符串，用于防止 CSRF 攻击
  const codeVerifier = generateCodeVerifier(); // 生成代码验证器，用于 PKCE 流程

  // google 授权callback地址
  const url = await google.createAuthorizationURL(state, codeVerifier, {
    scopes: ["profile", "email"], // 请求的权限范围
  });

  // 设置 cookies，存储状态和代码验证器
  cookies().set("state", state, {
    path: "/",
    secure: process.env.NODE_ENV === "production", // 仅在生产环境中使用安全 cookie
    httpOnly: true, // 防止客户端 JavaScript 访问 cookie
    maxAge: 60 * 10, // cookie 有效期为 10 分钟
    sameSite: "lax", // 防止 CSRF 攻击
  });

  cookies().set("code_verifier", codeVerifier, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  });

  return Response.redirect(url); // 重定向用户到 Google 的授权页面
}
