
import prisma from "../config/prisma.js";

const logActivity = async ({
  userId,
  action,
  description,
  entityType,
  entityId,
  projectId,
  io,
  recipientUserIds = []
}) => {
  try {
    // 1. Save activity
    const activity = await prisma.activity.create({
      data: {
        userId,
        action,
        description,
        entityType,
        entityId,
        projectId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // 2. Identify unique recipients
    const recipients = [...new Set([
      userId,
      ...recipientUserIds
    ])];
    
    // Get notification preferences for all recipients
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: recipients
        }
      },
      select: {
        id: true,
        taskNotifications: true,
        projectNotifications: true
      }
    });

    // Determine which preference applies to this activity
    const preferenceField = action.startsWith("TASK_")
      ? "taskNotifications"
      : action.startsWith("PROJECT_") ||
        action === "MEMBER_ADDED"
        ? "projectNotifications"
        : null;

    // Filter recipients according to their preferences
    const allowedRecipients = users
      .filter((user) => {
        if (!preferenceField) return true;
        return user[preferenceField];
      })
      .map((user) => user.id);


    // 3. Create individual notification records
    const notifications = await Promise.all(
      allowedRecipients.map((recipientId) =>
        prisma.notification.create({
          data: {
            userId: recipientId,
            activityId: activity.id
          },
          include: {
            activity: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    role: true
                  }
                }
              }
            }
          }
        })
      )
    );

    // 4. Emit real-time events
    
    // 4. Emit real-time events
    if (io) {

      // Activity Feed: notify all relevant project users
      recipients.forEach((recipientId) => {
        io.to(`user:${recipientId}`).emit(
          "newActivity",
          activity
        );
      });

      // Notification Bell: respect user preferences
      notifications.forEach((notification) => {
        io.to(`user:${notification.userId}`).emit(
          "newNotification",
          notification
        );
      });

    }


    return activity;

  } catch (error) {
    console.error("Activity Logging Error:", error);
  }
};

export default logActivity;
