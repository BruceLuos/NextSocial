import { Prisma } from "@prisma/client";

export function getUserDataSelect(loggedInUserId: string) {
  return {
    id: true,
    username: true,
    displayName: true,
    avatarUrl: true,
    bio: true, // 获取用户简介
    createdAt: true, // 获取用户创建时间
    // 获取关注者信息
    followers: {
      where: {
        followerId: loggedInUserId,
      },
      select: {
        followerId: true,
      },
    },

    _count: {
      select: {
        posts: true, // 获取帖子数量
        followers: true, // 获取关注者数量
      },
    },
  } satisfies Prisma.UserSelect; // satisfies 确保类型兼容
}

// 帖子数据包含用户信息和附件
export function getPostDataInclude(loggedInUserId: string) {
  return {
    user: {
      select: getUserDataSelect(loggedInUserId),
    },
    attachments: true,
    // 帖子点赞
    likes: {
      where: {
        userId: loggedInUserId,
      },
      select: {
        userId: true,
      },
    },
    _count: {
      select: {
        likes: true,
      },
    },
  } satisfies Prisma.PostInclude;
}

// PostData 包含其他需要的数据
export type PostData = Prisma.PostGetPayload<{
  include: ReturnType<typeof getPostDataInclude>;
}>;

export interface PostsPage {
  posts: PostData[];
  nextCursor: string | null;
}

/** 关注者信息 */
export interface FollowerInfo {
  followers: number;
  isFollowedByUser: boolean;
}

// 用户信息
export type UserData = Prisma.UserGetPayload<{
  select: ReturnType<typeof getUserDataSelect>;
}>;


/** 点赞相关信息 */
export interface LikeInfo {
  likes: number;
  isLikedByUser: boolean;
}
