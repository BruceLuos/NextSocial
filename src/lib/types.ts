import { Prisma } from "@prisma/client";

export function getUserDataSelect(loggedInUserId: string) {
  return {
    id: true,
    username: true,
    displayName: true,
    avatarUrl: true,
    // 获取关注者信息
    followers: {
      where: {
        followerId: loggedInUserId,
      },
      select: {
        followerId: true,
      },
    },
    // 获取关注者数量
    _count: {
      select: {
        followers: true,
      },
    },
  } satisfies Prisma.UserSelect; // satisfies 确保类型兼容
}

export function getPostDataInclude(loggedInUserId: string) {
  return {
    user: {
      select: getUserDataSelect(loggedInUserId),
    },
  } satisfies Prisma.PostInclude;
}

// PostData 包含用户信息
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
