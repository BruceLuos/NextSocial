import { Prisma } from "@prisma/client";

export const userDataSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

export const postDataInclude = {
  user: {
    select: userDataSelect,
  },
} satisfies Prisma.PostInclude; // satisfies 关键字确保 postDataInclude 对象符合 Prisma.PostInclude 类型

// PostData 包含用户信息
export type PostData = Prisma.PostGetPayload<{
  include: typeof postDataInclude;
}>;
