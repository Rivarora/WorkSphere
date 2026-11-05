
import prisma from "../config/prisma.js";
import logActivity from "../utils/activityLogger.js";

// ==========================================
// GET ALL TASKS
// ==========================================
export const getTasks = async (req, res, next) => {
  try {
    const whereCondition =
      req.user.role === "ADMIN"
        ? {}
        : {
            project: {
              OR: [
                { ownerId: req.user.id },
                {
                  members: {
                    some: { id: req.user.id }
                  }
                }
              ]
            }
          };

    const tasks = await prisma.task.findMany({
      where: whereCondition,
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });

  } catch (error) {
    next(error);
  }
};


// ==========================================
// CREATE TASK
// ==========================================
export const createTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      projectId,
      assignedToId,
      priority,
      dueDate
    } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({
        success: false,
        message: "Task title and project ID are required"
      });
    }

    const validPriorities = ["LOW", "MEDIUM", "HIGH"];

    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task priority"
      });
    }

    const project = await prisma.project.findUnique({
  where: { id: Number(projectId) },
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

    const isAdmin = req.user.role === "ADMIN";
    const isOwner = project.ownerId === req.user.id;

    const isMember = await prisma.project.findFirst({
      where: {
        id: project.id,
        members: {
          some: { id: req.user.id }
        }
      }
    });

    if (!isAdmin && !isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        message: "You cannot create tasks in this project"
      });
    }

    
if (assignedToId) {
  const assignee = await prisma.user.findUnique({
    where: { id: Number(assignedToId) },
    select: { id: true }
  });

  if (!assignee) {
    return res.status(404).json({
      success: false,
      message: "Assigned user not found"
    });
  }

  const isProjectMember = await prisma.project.findFirst({
    where: {
      id: project.id,
      members: {
        some: {
          id: Number(assignedToId)
        }
      }
    }
  });

  const isProjectOwner =
    project.ownerId === Number(assignedToId);

  if (!isProjectMember && !isProjectOwner) {
    return res.status(400).json({
      success: false,
      message: "Assignee must belong to this project"
    });
  }
}


    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        projectId: project.id,
        assignedToId: assignedToId
          ? Number(assignedToId)
          : null,
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Record task creation
   await logActivity({
  userId: req.user.id,
  action: "TASK_CREATED",
  description: `Created task: ${task.title}`,
  entityType: "Task",
  entityId: task.id,
  projectId: project.id,
  io: req.app.get("io"),
  recipientUserIds: [
    project.ownerId,
    ...project.members.map((member) => member.id),
    ...(task.assignedToId ? [task.assignedToId] : [])
  ]
});

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: task
    });

  } catch (error) {
    next(error);
  }
};


// ==========================================
// UPDATE TASK
// ==========================================


export const updateTask = async (req, res, next) => {
  try {
    const taskId = Number(req.params.id);

    const {
      title,
      description,
      projectId,
      assignedToId,
      priority,
      status,
      dueDate
    } = req.body;

    const validStatuses = [
      "PENDING",
      "IN_PROGRESS",
      "COMPLETED"
    ];

    const validPriorities = [
      "LOW",
      "MEDIUM",
      "HIGH"
    ];

    if (!Number.isInteger(taskId) || taskId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID"
      });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            members: {
              select: { id: true }
            }
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    const isAdmin = req.user.role === "ADMIN";
    const isOwner = task.project.ownerId === req.user.id;
    const isAssignedUser = task.assignedToId === req.user.id;

    const allowedAssignedFields = ["status", "priority"];
    const requestFields = Object.keys(req.body);

    const isStatusPriorityOnly =
      requestFields.length > 0 &&
      requestFields.every((field) =>
        allowedAssignedFields.includes(field)
      );

    // Assigned users can update only status and priority.
    const isAssignedUserUpdate =
      isAssignedUser && isStatusPriorityOnly;

    // Full task editing is restricted to Admin and project owner.
    if (!isAdmin && !isOwner && !isAssignedUserUpdate) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this task"
      });
    }

    if (requestFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No update data provided"
      });
    }

    // Validate title
    if (title !== undefined &&
        (typeof title !== "string" || !title.trim())) {
      return res.status(400).json({
        success: false,
        message: "Task title cannot be empty"
      });
    }

    // Validate status
    if (
      status !== undefined &&
      !validStatuses.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid task status"
      });
    }

    // Validate priority
    if (
      priority !== undefined &&
      !validPriorities.includes(priority)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid task priority"
      });
    }

    let updateData;

    if (isAssignedUserUpdate) {
      // Only status and priority can be changed.
      updateData = {
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority })
      };
    } else {
      // Full editing by Admin or project owner.

      const targetProjectId =
        projectId !== undefined
          ? Number(projectId)
          : task.projectId;

      if (
        !Number.isInteger(targetProjectId) ||
        targetProjectId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid project ID"
        });
      }

      const targetProject = await prisma.project.findUnique({
        where: { id: targetProjectId },
        include: {
          members: {
            select: { id: true }
          }
        }
      });

      if (!targetProject) {
        return res.status(404).json({
          success: false,
          message: "Project not found"
        });
      }

      if (
        !isAdmin &&
        targetProject.ownerId !== req.user.id
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only move tasks to projects you own"
        });
      }

      // Validate assignee
      const targetAssigneeId =
        assignedToId !== undefined
          ? (
              assignedToId === null || assignedToId === ""
                ? null
                : Number(assignedToId)
            )
          : task.assignedToId;

      if (
        targetAssigneeId !== null &&
        (!Number.isInteger(targetAssigneeId) ||
          targetAssigneeId <= 0)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid assignee ID"
        });
      }

      if (targetAssigneeId !== null) {
        const isMember = targetProject.members.some(
          (member) => member.id === targetAssigneeId
        );

        const isProjectOwner =
          targetProject.ownerId === targetAssigneeId;

        if (!isMember && !isProjectOwner) {
          return res.status(400).json({
            success: false,
            message: "Assignee must belong to the selected project"
          });
        }
      }

      // Validate due date
      let parsedDueDate = task.dueDate;

      if (dueDate !== undefined) {
        if (dueDate === null || dueDate === "") {
          parsedDueDate = null;
        } else {
          parsedDueDate = new Date(dueDate);

          if (Number.isNaN(parsedDueDate.getTime())) {
            return res.status(400).json({
              success: false,
              message: "Invalid due date"
            });
          }
        }
      }

      updateData = {
        ...(title !== undefined && {
          title: title.trim()
        }),
        ...(description !== undefined && {
          description: description || null
        }),
        projectId: targetProjectId,
        assignedToId: targetAssigneeId,
        priority: priority ?? task.priority,
        status: status ?? task.status,
        dueDate: parsedDueDate
      };
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    await logActivity({
      userId: req.user.id,
      action: "TASK_UPDATED",
      description: `Updated task: ${updatedTask.title}`,
      entityType: "Task",
      entityId: updatedTask.id,
      projectId: updatedTask.projectId,
      io: req.app.get("io"),
      recipientUserIds: [
        task.project.ownerId,
        ...task.project.members.map((member) => member.id),
        ...(updatedTask.assignedToId
          ? [updatedTask.assignedToId]
          : [])
      ]
    });

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: updatedTask
    });

  } catch (error) {
    next(error);
  }
};



// ==========================================
// DELETE TASK
// ==========================================
export const deleteTask = async (req, res, next) => {
  try {
    const taskId = Number(req.params.id);

    if (!Number.isInteger(taskId) || taskId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID"
      });
    }

    const task = await prisma.task.findUnique({
  where: { id: taskId },
  include: {
    project: {
      include: {
        members: {
          select: { id: true }
        }
      }
    }
  }
});

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    const isAdmin = req.user.role === "ADMIN";
    const isOwner = task.project.ownerId === req.user.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Only the project owner or admin can delete tasks"
      });
    }

    await prisma.task.delete({
      where: { id: taskId }
    });

    // Record task deletion
    await logActivity({
  userId: req.user.id,
  action: "TASK_DELETED",
  description: `Deleted task: ${task.title}`,
  entityType: "Task",
  entityId: task.id,
  projectId: task.projectId,
  io: req.app.get("io"),
  recipientUserIds: [
    task.project.ownerId,
    ...task.project.members.map((member) => member.id),
    ...(task.assignedToId ? [task.assignedToId] : [])
  ]
});

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully"
    });

  } catch (error) {
    next(error);
  }
};
