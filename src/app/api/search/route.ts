import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude, PostsPage } from "@/lib/types";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q") || "";
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;

    const searchQuery = q.split(" ").join(" & ");

    const pageSize = 10;

    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const posts = await prisma.post.findMany({
      where: {
        OR: [
          {
            content: {
              search: searchQuery, // 在帖子内容中搜索
            },
          },
          {
            user: {
              displayName: {
                search: searchQuery, // 在用户显示名称中搜索
              },
            },
          },
          {
            user: {
              username: {
                search: searchQuery, // 在用户用户名中搜索
              },
            },
          },
        ],
      },
      include: getPostDataInclude(user.id), // 包含与帖子相关的额外数据
      orderBy: { createdAt: "desc" }, // 按创建时间降序排列
      take: pageSize + 1, // 限制返回的帖子数量
      cursor: cursor ? { id: cursor } : undefined, // 使用游标进行分页
    });

    const nextCursor = posts.length > pageSize ? posts[pageSize].id : null;

    const data: PostsPage = {
      posts: posts.slice(0, pageSize),
      nextCursor,
    };

    return Response.json(data);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
