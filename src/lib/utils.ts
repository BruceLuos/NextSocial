import { type ClassValue, clsx } from "clsx";
import { formatDate, formatDistanceToNowStrict } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a relative date based on the given date.
 *
 * @param from - The date to format relative to.
 * @returns The formatted relative date.
 */
export function formatRelativeDate(from: Date) {
  const currentDate = new Date();
  // 不足 24 小时，显示相对时间
  if (currentDate.getTime() - from.getTime() < 24 * 60 * 60 * 1000) {
    return formatDistanceToNowStrict(from, { addSuffix: true });
  } else {
    // 超过 24 小时，显示日期，如果是今年的日期，不显示年份
    if (currentDate.getFullYear() === from.getFullYear()) {
      return formatDate(from, "MMM d");
    } else {
      return formatDate(from, "MMM d, yyy");
    }
  }
}

/**
 * 将一个数字格式化为紧凑的字符串表示形式
 */
export function formatNumber(n: number): string {
  return Intl.NumberFormat("en-US", {
    notation: "compact", // 使用紧凑表示法 1000 -> 1K
    maximumFractionDigits: 1, // 最多保留一位小数
  }).format(n);
}
