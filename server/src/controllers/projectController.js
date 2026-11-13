
import prisma from "../config/prisma.js";
import logActivity from "../utils/activityLogger.js";
// GET ALL PROJECTS

export const getProjects = async (req, res, next) => {
  try {
    let whereCondition = {};

    // Admin can see all projects
    if (req.user.role === "ADMIN") {
      whereCondition = {};
    }

    // Other users see projects they own or belong to
    else {
      whereCondition = {
        OR: [
          { ownerId: req.user.id },
          {
            members: {
              some: {
                id: req.user.id
              }
            }
          }
        ]
      };
    }

    const projects = await prisma.project.findMany({
      where: whereCondition,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        members: true,
        tasks: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });

  } catch (error) {
    next(error);
  }
};


// CREATE PROJECT

export const createProject = async (req, res, next) => {
  try {
    const { name, description, deadline } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Project name is required"
      });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId: req.user.id,
        deadline: deadline ? new Date(deadline) : null
      }
    });
    await logActivity({
  userId: req.user.id,
  action: "PROJECT_CREATED",
  description: `Created project: ${project.name}`,
  entityType: "Project",
  entityId: project.id,
  projectId: project.id,
  io: req.app.get("io")
});
    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: project
    });

  } catch (error) {
    next(error);
  }
};


// UPDATE PROJECT

export const updateProject = async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    const { name, description, status, deadline } = req.body;

    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID"
      });
    }

    const existingProject = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    const isAdmin = req.user.role === "ADMIN";
    const isOwner = existingProject.ownerId === req.user.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Only the project owner or admin can update this project"
      });
    }

    const validStatuses = [
      "PLANNING",
      "IN_PROGRESS",
      "COMPLETED",
      "ON_HOLD"
    ];

    if (status !== undefined && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project status"
      });
    }

    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
      return res.status(400).json({
        success: false,
        message: "Project name cannot be empty"
      });
    }

    if (
      deadline !== undefined &&
      deadline !== null &&
      (typeof deadline !== "string" || isNaN(Date.parse(deadline)))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid project deadline"
      });
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(deadline !== undefined && {
          deadline: deadline ? new Date(deadline) : null
        })
      }
    });

    return res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: project
    });

  } catch (error) {
    next(error);
  }
};


// DELETE PROJECT

export const deleteProject = async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);

    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID"
      });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    const canEdit =
  req.user.role === "ADMIN" ||
  req.user.role === "PROJECT_MANAGER" ||
  existingProject.ownerId === req.user.id;

if (!canEdit) {
  return res.status(403).json({
    success: false,
    message: "You are not authorized to update this project"
  });
}

    await prisma.project.delete({
      where: { id: projectId }
    });

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully"
    });

  } catch (error) {
    next(error);
  }
};

