import { prisma } from "@/lib/db";
import { NotificationType } from "./generated/prisma/enums";

export async function createNotification(
  userId: string,
  data: {
    title: string;
    message: string;
    type: NotificationType;
    actionUrl?: string;
  }
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

export async function notifyUserEnrolled(userId: string, courseName: string) {
  return createNotification(userId, {
    title: "Course Enrolled",
    message: `You have successfully enrolled in "${courseName}"`,
    type: "COURSE_ENROLLED",
    actionUrl: "/courses",
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
  courseName: string
) {
  return createNotification(userId, {
    title: "Course Published",
    message: `Your course "${courseName}" has been published`,
    type: "COURSE_PUBLISHED",
    actionUrl: `/admin/courses`,
  });
}

export async function notifyCourseCompleted(
  userId: string,
  courseName: string
) {
  return createNotification(userId, {
    title: "Course Completed",
    message: `Congratulations! You have completed "${courseName}"`,
    type: "COURSE_COMPLETED",
    actionUrl: "/profile",
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
  rating: number
) {
  return createNotification(instructorId, {
    title: "New Review",
    message: `${rating}-star review posted on "${courseName}"`,
    type: "REVIEW_POSTED",
    actionUrl: `/admin/courses`,
  });
}
