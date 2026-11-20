import { prisma } from "@/lib/db";
import { NotificationType } from "./generated/prisma/enums";
import {
  getAdminBasePath,
  getCatalogBasePath,
  getContentTypeMeta,
  getItemHref,
} from "@/lib/content-type";

export async function createNotification(
  userId: string,
  data: {
    title: string;
    message: string;
    type: NotificationType;
    actionUrl?: string;
  },
) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title: data.title,
        message: data.message,
        type: (data.type || "INFO") as NotificationType,
        actionUrl: data.actionUrl || null,
      },
    });

    console.log(`Notification created for user ${userId}:`, notification.id);
    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    throw error;
  }
}

export async function notifyUserEnrolled(
  userId: string,
  courseName: string,
  contentType?: string | null,
  slug?: string | null,
) {
  const meta = getContentTypeMeta(contentType);
  return createNotification(userId, {
    title: `${meta.singular} Enrolled`,
    message: `You have successfully enrolled in "${courseName}"`,
    type: "COURSE_ENROLLED",
    actionUrl: slug
      ? getItemHref(contentType, slug)
      : getCatalogBasePath(contentType),
  });
}

export async function notifyUserRegistered(userName: string) {
  return createNotification("admin", {
    title: "New User Registered",
    message: `${userName} has joined the platform`,
    type: "USER_REGISTERED",
    actionUrl: "/admin/users",
  });
}

export async function notifyCoursePublished(
  userId: string,
  courseName: string,
  contentType?: string | null,
) {
  const meta = getContentTypeMeta(contentType);
  return createNotification(userId, {
    title: `${meta.singular} Published`,
    message: `Your ${meta.singular.toLowerCase()} "${courseName}" has been published`,
    type: "COURSE_PUBLISHED",
    actionUrl: getAdminBasePath(contentType),
  });
}

export async function notifyCourseCompleted(
  userId: string,
  courseName: string,
  contentType?: string | null,
) {
  const meta = getContentTypeMeta(contentType);
  return createNotification(userId, {
    title: `${meta.singular} Completed`,
    message: `Congratulations! You have completed "${courseName}"`,
    type: "COURSE_COMPLETED",
    actionUrl: "/certificates",
  });
}

export async function notifySystemAlert(userId: string, message: string) {
  return createNotification(userId, {
    title: "System Alert",
    message: message,
    type: "SYSTEM_ALERT",
  });
}

export async function notifyReviewPosted(
  instructorId: string,
  courseName: string,
  rating: number,
  contentType?: string | null,
) {
  return createNotification(instructorId, {
    title: "New Review",
    message: `${rating}-star review posted on "${courseName}"`,
    type: "REVIEW_POSTED",
    actionUrl: getAdminBasePath(contentType),
  });
}
