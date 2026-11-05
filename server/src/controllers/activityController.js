
import prisma from "../config/prisma.js";

// GET ACTIVITIES
export const getActivities = async (req, res) => {
  try {
    let whereCondition = {};

    if (req.user.role !== "ADMIN") {

      // Find projects owned by or shared with the user
      const projects = await prisma.project.findMany({
        where: {
          OR: [
            { ownerId: req.user.id },
            {
              members: {
                some: { id: req.user.id }
              }
            }
          ]
        },
        select: {
          id: true
        }
      });

      const projectIds = projects.map(
        (project) => project.id
      );

      whereCondition = {
        OR: [
          // Activities performed by this user
          {
            userId: req.user.id
          },

          // All activities belonging to their projects
          {
            projectId: {
              in: projectIds
            }
          }
        ]
      };
    }

    const activities = await prisma.activity.findMany({
      where: whereCondition,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 50
    });

    return res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });

  } catch (error) {
    console.error("Get Activities Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch activities"
    });
  }
};
