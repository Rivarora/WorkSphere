
import prisma from "../config/prisma.js";
import logActivity from "../utils/activityLogger.js";
// Add a member to a project
export const addProjectMember = async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    const userId = Number(req.body.userId);

    if (
      !Number.isInteger(projectId) || projectId <= 0 ||
      !Number.isInteger(userId) || userId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid project ID and user ID are required"
      });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          select: { id: true }
        }
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    // Only owner or admin can add members
    if (
      req.user.role !== "ADMIN" &&
      project.ownerId !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the project owner or admin can add members"
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Prevent duplicate membership
    if (project.members.some(member => member.id === userId)) {
      return res.status(409).json({
        success: false,
        message: "User is already a project member"
      });
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        members: {
          connect: { id: userId }
        }
      },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    await logActivity({
      userId: req.user.id,
      action: "MEMBER_ADDED",
      description: `Added ${user.name} to project: ${project.name}`,
      entityType: "Project",
      entityId: project.id,
      projectId: project.id,
      recipientUserIds: [
        project.ownerId,
        ...project.members.map(member => member.id),
        userId
      ],
      io: req.app.get("io")
    });

    return res.status(200).json({
      success: true,
      message: "Member added successfully",
      data: updatedProject
    });

  } catch (error) {
    next(error);
  }
};


export const getAllMembers = async (req, res) => {
  try {
    const userId = req.user.id;

    // Admin can see all users
    if (req.user.role === "ADMIN") {
      const members = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        },
        orderBy: {
          createdAt: "desc"
        }
      });

      return res.status(200).json({
        success: true,
        count: members.length,
        data: members
      });
    }

    // Find projects accessible to this user
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          {
            members: {
              some: { id: userId }
            }
          }
        ]
      },
      select: {
        ownerId: true,
        members: {
          select: {
            id: true
          }
        }
      }
    });

    // Collect project owners and members
    const allowedUserIds = new Set([userId]);

    projects.forEach((project) => {
      allowedUserIds.add(project.ownerId);

      project.members.forEach((member) => {
        allowedUserIds.add(member.id);
      });
    });

    const members = await prisma.user.findMany({
      where: {
        id: {
          in: [...allowedUserIds]
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.status(200).json({
      success: true,
      count: members.length,
      data: members
    });

  } catch (error) {
    console.error("Get Members Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch members"
    });
  }
};

// Remove a member from a project
export const removeProjectMember = async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    const userId = Number(req.params.userId);

    if (
      !Number.isInteger(projectId) || projectId <= 0 ||
      !Number.isInteger(userId) || userId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid project ID and user ID are required"
      });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          select: { id: true, name: true }
        }
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    // Only project owner or admin can remove members
    if (
      req.user.role !== "ADMIN" &&
      project.ownerId !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the project owner or admin can remove members"
      });
    }

    // Project owner cannot be removed as a member
    if (project.ownerId === userId) {
      return res.status(400).json({
        success: false,
        message: "Project owner cannot be removed"
      });
    }

    const member = project.members.find(
      (item) => item.id === userId
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "User is not a member of this project"
      });
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        members: {
          disconnect: { id: userId }
        }
      },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    await logActivity({
      userId: req.user.id,
      action: "MEMBER_REMOVED",
      description: `Removed ${member.name} from project: ${project.name}`,
      entityType: "Project",
      entityId: project.id,
      projectId: project.id,
      recipientUserIds: [
        project.ownerId,
        ...project.members.map((item) => item.id),
        userId
      ],
      io: req.app.get("io")
    });

    return res.status(200).json({
      success: true,
      message: "Member removed successfully",
      data: updatedProject
    });

  } catch (error) {
    next(error);
  }
};
