import { google, lucia } from "@/auth";
import kyInstance from "@/lib/ky";
import prisma from "@/lib/prisma";
import streamServerClient from "@/lib/stream";
import { slugify } from "@/lib/utils";
import { OAuth2RequestError } from "arctic";
import { generateIdFromEntropySize } from "lucia";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");

  const storedState = cookies().get("state")?.value;
  const storedCodeVerifier = cookies().get("code_verifier")?.value;

  if (
    !code ||
    !state ||
    !storedState ||
    !storedCodeVerifier ||
    state !== storedState
  ) {
    return new Response(null, { status: 400 });
  }

  try {
    // google 校验登录成功后拿到token
    const tokens = await google.validateAuthorizationCode(
      code,
      storedCodeVerifier,
    );

    // 用token获取到google用户信息
    const googleUser = await kyInstance
      .get("https://www.googleapis.com/oauth2/v1/userinfo", {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      })
      .json<{
        id: string;
        name: string;
        // email: string
      }>();

    const existingUser = await prisma.user.findUnique({
      where: {
        googleId: googleUser.id,
      },
    });

    // 用户已存在数据库 正常设置cookie并重定向
    if (existingUser) {
      const session = await lucia.createSession(existingUser.id, {});
      const sessionCookie = lucia.createSessionCookie(session.id);
      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/",
        },
      });
    }

    // 用户还未存入数据库
    // 生成user id
    const userId = generateIdFromEntropySize(10);
    // 处理用户名
    const username = slugify(googleUser.name) + "-" + userId.slice(0, 4);

    // 事务进行处理用户数据库的录入和stream chat的录入
    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: userId,
          username,
          displayName: googleUser.name,
          // email: googleUser.email,
          googleId: googleUser.id,
        },
      });
      await streamServerClient.upsertUser({
        id: userId,
        username,
        name: username,
      });
    });

    // 创建新用户的cookie信息，并重定向到首页
    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
      },
    });
  } catch (error) {
    console.error(error);
    if (error instanceof OAuth2RequestError) {
      return new Response(null, {
        status: 400,
      });
    }
    return new Response(null, {
      status: 500,
    });
  }
}
