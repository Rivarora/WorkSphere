
import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";

// ==========================================
// GET USER PROFILE
// ==========================================
export const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        emailNotifications: true,
        taskNotifications: true,
        projectNotifications: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error("Get Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile"
    });
  }
};


// ==========================================
// UPDATE PROFILE AND NOTIFICATIONS
// ==========================================
export const updateProfile = async (req, res) => {
  try {
    const {
      name,
      emailNotifications,
      taskNotifications,
      projectNotifications
    } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required"
      });
    }

    const user = await prisma.user.update({
      where: {
        id: req.user.id
      },

      data: {
        name: name.trim(),

        ...(typeof emailNotifications === "boolean" && {
          emailNotifications
        }),

        ...(typeof taskNotifications === "boolean" && {
          taskNotifications
        }),

        ...(typeof projectNotifications === "boolean" && {
          projectNotifications
        })
      },

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailNotifications: true,
        taskNotifications: true,
        projectNotifications: true
      }
    });

    return res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: user
    });

  } catch (error) {
    console.error("Update Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update settings"
    });
  }
};


// ==========================================
// CHANGE PASSWORD
// ==========================================
export const changePassword = async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword
    } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Both passwords are required"
      });
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must contain at least 8 characters"
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(
      newPassword,
      12
    );

    // Update password in PostgreSQL
    await prisma.user.update({
      where: {
        id: req.user.id
      },
      data: {
        password: hashedPassword
      }
    });

    return res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });

  } catch (error) {
    console.error("Change Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to change password"
    });
  }
};
