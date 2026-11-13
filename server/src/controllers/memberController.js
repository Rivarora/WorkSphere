
import prisma from "../config/prisma.js";
import logActivity from "../utils/activityLogger.js";

// ============================================
// ADD A MEMBER TO A PROJECT
// ============================================
export const addProjectMember = async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    const userId = Number(req.body.userId);

    if (
      !Number.isInteger(projectId) ||
      projectId <= 0 ||
      !Number.isInteger(userId) ||
      userId <= 0
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

    // Only project owner or admin can add members
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


// ============================================
// GET ALL REGISTERED TEAM MEMBERS
// ============================================
export const getAllMembers = async (req, res) => {
  try {
    // Admins and Project Managers can see all registered users
    if (
      req.user.role === "ADMIN" ||
      req.user.role === "PROJECT_MANAGER"
    ) {
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

    // Other users see themselves and users
    // connected through their accessible projects
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
        ownerId: true,
        members: {
          select: { id: true }
        }
      }
    });

    const allowedUserIds = new Set([req.user.id]);

    projects.forEach(project => {
      allowedUserIds.add(project.ownerId);

      project.members.forEach(member => {
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


// ============================================
// REMOVE A MEMBER FROM A PROJECT
// ============================================
export const removeProjectMember = async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    const userId = Number(req.params.userId);

    if (
      !Number.isInteger(projectId) ||
      projectId <= 0 ||
      !Number.isInteger(userId) ||
      userId <= 0
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
          select: {
            id: true,
            name: true
          }
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

    // Project owner cannot be removed
    if (project.ownerId === userId) {
      return res.status(400).json({
        success: false,
        message: "Project owner cannot be removed"
      });
    }

    const member = project.members.find(
      item => item.id === userId
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
        ...project.members.map(item => item.id),
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
