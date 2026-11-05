
import { useState, useEffect } from "react";
import { User, Bell, Lock, Save } from "lucide-react";
import API from "../api/axios";

function Settings() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    role: ""
  });

  const [notifications, setNotifications] = useState({
    email: true,
    taskUpdates: true,
    projectUpdates: false
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Fetch profile and saved notification preferences
  async function fetchProfile() {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/profile");
      const user = response.data.data;

      setProfile({
        name: user.name,
        email: user.email,
        role: user.role
      });

      // Load saved preferences from PostgreSQL
      setNotifications({
        email: user.emailNotifications,
        taskUpdates: user.taskNotifications,
        projectUpdates: user.projectNotifications
      });

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to load settings"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  // Handle profile changes
  function handleProfileChange(e) {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
  }

  // Handle notification changes
  function handleNotificationChange(e) {
    setNotifications({
      ...notifications,
      [e.target.name]: e.target.checked
    });
  }

  // Save profile and notification preferences
  async function handleSave(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await API.put("/profile", {
        name: profile.name,
        emailNotifications: notifications.email,
        taskNotifications: notifications.taskUpdates,
        projectNotifications: notifications.projectUpdates
      });

      const user = response.data.data;

      setProfile({
        name: user.name,
        email: user.email,
        role: user.role
      });

      setNotifications({
        email: user.emailNotifications,
        taskUpdates: user.taskNotifications,
        projectUpdates: user.projectNotifications
      });

      setSuccess("Settings saved successfully!");

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to save settings"
      );
    } finally {
      setSaving(false);
    }
  }

  // Change password
  async function handleChangePassword(e) {
    e.preventDefault();

    setPasswordError("");
    setPasswordSuccess("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError("Password must contain at least 8 characters.");
      return;
    }

    try {
      setPasswordLoading(true);

      const response = await API.put(
        "/profile/change-password",
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }
      );

      setPasswordSuccess(response.data.message);

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });

    } catch (err) {
      setPasswordError(
        err.response?.data?.message ||
        "Password change failed"
      );
    } finally {
      setPasswordLoading(false);
    }
  }

  const roleNames = {
    ADMIN: "Admin",
    PROJECT_MANAGER: "Project Manager",
    DEVELOPER: "Developer",
    DESIGNER: "Designer"
  };

  if (loading) {
    return <p className="text-slate-500">Loading settings...</p>;
  }

  return (
    <div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">
          Settings
        </h1>
        <p className="text-slate-500 mt-1">
          Manage your account and application preferences.
        </p>
      </div>

      {error && (
        <p className="bg-red-50 text-red-600 p-3 rounded-lg mb-5">
          {error}
        </p>
      )}

      {success && (
        <p className="bg-green-50 text-green-700 p-3 rounded-lg mb-5">
          {success}
        </p>
      )}

      {/* Profile Information */}
      <div className="bg-white border rounded-xl p-6 mb-6">

        <div className="flex items-center gap-3 mb-6">
          <User className="text-indigo-600" />
          <h2 className="text-lg font-semibold">
            Profile Information
          </h2>
        </div>

        <div className="space-y-4">

          <div>
            <label className="block text-sm text-slate-600 mb-2">
              Full Name
            </label>
            <input
              name="name"
              value={profile.name}
              onChange={handleProfileChange}
              className="w-full border rounded-lg p-3"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-2">
              Email Address
            </label>
            <input
              value={profile.email}
              readOnly
              className="w-full border rounded-lg p-3 bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-2">
              Role
            </label>
            <input
              value={roleNames[profile.role] || profile.role}
              readOnly
              className="w-full border rounded-lg p-3 bg-slate-100"
            />
          </div>

        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white border rounded-xl p-6 mb-6">

        <div className="flex items-center gap-3 mb-6">
          <Bell className="text-indigo-600" />
          <h2 className="text-lg font-semibold">
            Notification Preferences
          </h2>
        </div>

        <div className="space-y-5">

          <label className="flex items-center justify-between">
            Email Notifications
            <input
              type="checkbox"
              name="email"
              checked={notifications.email}
              onChange={handleNotificationChange}
              className="w-5 h-5 accent-indigo-600"
            />
          </label>

          <label className="flex items-center justify-between">
            Task Updates
            <input
              type="checkbox"
              name="taskUpdates"
              checked={notifications.taskUpdates}
              onChange={handleNotificationChange}
              className="w-5 h-5 accent-indigo-600"
            />
          </label>

          <label className="flex items-center justify-between">
            Project Updates
            <input
              type="checkbox"
              name="projectUpdates"
              checked={notifications.projectUpdates}
              onChange={handleNotificationChange}
              className="w-5 h-5 accent-indigo-600"
            />
          </label>

        </div>
      </div>

      {/* Security */}
      <div className="bg-white border rounded-xl p-6 mb-6">

        <div className="flex items-center gap-3 mb-6">
          <Lock className="text-indigo-600" />
          <h2 className="text-lg font-semibold">
            Change Password
          </h2>
        </div>

        {passwordError && (
          <p className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
            {passwordError}
          </p>
        )}

        {passwordSuccess && (
          <p className="bg-green-50 text-green-700 p-3 rounded-lg mb-4">
            {passwordSuccess}
          </p>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">

          <input
            type="password"
            placeholder="Current Password"
            required
            value={passwordData.currentPassword}
            onChange={(e) =>
              setPasswordData({
                ...passwordData,
                currentPassword: e.target.value
              })
            }
            className="w-full border rounded-lg p-3"
          />

          <input
            type="password"
            placeholder="New Password (minimum 8 characters)"
            minLength={8}
            required
            value={passwordData.newPassword}
            onChange={(e) =>
              setPasswordData({
                ...passwordData,
                newPassword: e.target.value
              })
            }
            className="w-full border rounded-lg p-3"
          />

          <input
            type="password"
            placeholder="Confirm New Password"
            required
            value={passwordData.confirmPassword}
            onChange={(e) =>
              setPasswordData({
                ...passwordData,
                confirmPassword: e.target.value
              })
            }
            className="w-full border rounded-lg p-3"
          />

          <button
            type="submit"
            disabled={passwordLoading}
            className="bg-indigo-600 text-white px-5 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {passwordLoading ? "Updating..." : "Change Password"}
          </button>

        </form>
      </div>

      {/* Save Settings */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
      >
        <Save size={18} />
        {saving ? "Saving..." : "Save Settings"}
      </button>

    </div>
  );
}

export default Settings;
