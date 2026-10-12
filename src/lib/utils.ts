import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import prisma from "./prisma";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateReportId(type: "LST" | "FND"): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `LL-${type}-${year}-${randomNum}`;
}

export async function createNotification({
  userId,
  title,
  message,
  type,
  linkUrl,
}: {
  userId: string;
  title: string;
  message: string;
  type: "MATCH" | "CLAIM_STATUS" | "INFO_REQUEST" | "RECOVERY" | "SYSTEM";
  linkUrl?: string;
}) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        linkUrl,
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}
