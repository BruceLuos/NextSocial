import { validateRequest } from "@/auth";
import streamServerClient from "@/lib/stream";

export async function GET() {
  try {
    const { user } = await validateRequest();

    console.log("Calling get-token for user: ", user?.id);

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const expirationTime = Math.floor(Date.now() / 1000) + 60 * 60; // 包含当前时间加上1小时后的时间戳，表示令牌的过期时间。

    const issuedAt = Math.floor(Date.now() / 1000) - 60; // 包含当前时间减去1分钟后的时间戳，表示令牌的签发时间。

    // 创建一个token来验证当前登录user
    const token = streamServerClient.createToken(
      user.id,
      expirationTime,
      issuedAt,
    );

    return Response.json({ token });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
