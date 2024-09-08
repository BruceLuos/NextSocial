"use client";

import useFollowerInfo from "@/hooks/useFollowerInfo";
import { FollowerInfo } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

interface FollowerCountProps {
  userId: string;
  initialState: FollowerInfo;
}

/**
 * 关注者数量组件
 * @param userId 用户ID
 * @param initialState 初始状态
 * @returns 关注者数量组件
 */
export default function FollowerCount({
  userId,
  initialState,
}: FollowerCountProps) {
  // 使用useFollowerInfo hook获取关注者信息
  const { data } = useFollowerInfo(userId, initialState);

  return (
    <span>
      Followers:{" "}
      <span className="font-semibold">{formatNumber(data.followers)}</span>
    </span>
  );
}
