"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getCommentDataInclude, PostData } from "@/lib/types";
import { createCommentSchema } from "@/lib/validation";

/**
 * 提交评论
 */
export async function submitComment({
  post,
  content,
}: {
  post: PostData;
  content: string;
}) {
  const { user } = await validateRequest();

  if (!user) throw new Error("Unauthorized");

  const { content: contentValidated } = createCommentSchema.parse({ content });

  // 用户提交评论 然后创建通知
  const [newComment] = await prisma.$transaction([
    prisma.comment.create({
      data: {
        content: contentValidated, // 评论内容，经过验证
        postId: post.id, // 关联的帖子ID
        userId: user.id, // 提交评论的用户ID
      },
      include: getCommentDataInclude(user.id), // 包含与评论相关的额外数据
    }),
    ...(post.user.id !== user.id
      ? [
          prisma.notification.create({
            data: {
              issuerId: user.id, // 发出通知的用户ID（评论的用户）
              recipientId: post.user.id, // 接收通知的用户ID（帖子作者）
              postId: post.id, // 关联的帖子ID
              type: "COMMENT", // 通知类型为评论
            },
          }),
        ]
      : []),
  ]);

  return newComment;
}

/**
 * 删除评论
 */
export async function deleteComment(id: string) {
  const { user } = await validateRequest();

  if (!user) throw new Error("Unauthorized");

  const comment = await prisma.comment.findUnique({
    where: { id },
  });

  if (!comment) throw new Error("Comment not found");

  if (comment.userId !== user.id) throw new Error("Unauthorized");

  const deletedComment = await prisma.comment.delete({
    where: { id },
    include: getCommentDataInclude(user.id),
  });

  return deletedComment;
}
