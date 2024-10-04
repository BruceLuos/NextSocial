import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

// 用于部分更新现有资源（将未读通知标记为已读），而不是创建新资源或获取数据
export async function PATCH() {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 将当前用户的所有未读通知标记为已读
    await prisma.notification.updateMany({
      where: {
        recipientId: user.id, // 查询条件：接收者ID为当前用户的ID
        read: false, // 查询条件：只选择未读的通知
      },
      data: {
        read: true, // 更新数据：将未读通知的状态设置为已读
      },
    });

    return new Response();
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
