import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { postDataInclude, PostsPage } from "@/lib/types";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // 获取下一页的游标
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    // 每页的帖子数量
    const pageSize = 10;

    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const posts = await prisma.post.findMany({
      include: postDataInclude,
      orderBy: { createdAt: "desc" },
      take: pageSize + 1, // 获取多一个以便判断是否有下一页
      cursor: cursor ? { id: cursor } : undefined, // 游标分页，从 cursor 开始查询
    });

    // 如果帖子数量大于 pageSize，说明有下一页
    const nextCursor = posts.length > pageSize ? posts[pageSize].id : null;

    const data: PostsPage = {
      posts: posts.slice(0, pageSize), // 只获取 pageSize 个帖子
      nextCursor, // 下一页的游标
    };

    return Response.json(data);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
