
import { useEffect, useState } from "react";

import {
  Search,
  Bell,
  UserCircle,
  CheckCheck,
  X,
  Trash2
} from "lucide-react";

import API from "../api/axios";
import socket from "../socket";

function Header() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchNotifications = async () => {
    try {
      const response = await API.get("/notifications");

      setNotifications(response.data.data || []);
      setUnreadCount(response.data.unreadCount || 0);

    } catch (error) {
      console.error("Notification fetch error:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const handleNewNotification = (notification) => {
      setNotifications((previous) => {
        if (previous.some((item) => item.id === notification.id)) {
          return previous;
        }

        return [notification, ...previous].slice(0, 50);
      });

      setUnreadCount((previous) => previous + 1);
    };

    socket.on("newNotification", handleNewNotification);

    return () => {
      socket.off("newNotification", handleNewNotification);
    };
  }, []);

  // Mark one notification as read
  const markAsRead = async (id) => {
    const notification = notifications.find(
      (item) => item.id === id
    );

    if (!notification || notification.isRead) return;

    try {
      await API.patch(`/notifications/${id}/read`);

      setNotifications((previous) =>
        previous.map((item) =>
          item.id === id
            ? { ...item, isRead: true }
            : item
        )
      );

      setUnreadCount((previous) => Math.max(0, previous - 1));

    } catch (error) {
      console.error("Mark as read error:", error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await API.patch("/notifications/read-all");

      setNotifications((previous) =>
        previous.map((item) => ({
          ...item,
          isRead: true
        }))
      );

      setUnreadCount(0);

    } catch (error) {
      console.error("Mark all as read error:", error);
    }
  };

  // Delete one notification
  const deleteNotification = async (id) => {
    const notification = notifications.find(
      (item) => item.id === id
    );

    if (!notification) return;

    try {
      setDeletingId(id);

      await API.delete(`/notifications/${id}`);

      setNotifications((previous) =>
        previous.filter((item) => item.id !== id)
      );

      if (!notification.isRead) {
        setUnreadCount((previous) => Math.max(0, previous - 1));
      }

    } catch (error) {
      console.error("Delete notification error:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">

      {/* Page title */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">
          Dashboard
        </h2>

        <p className="text-sm text-slate-500">
          Welcome back! Here's your workspace overview.
        </p>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-5">

        <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-lg">
          <Search size={18} className="text-slate-500" />

          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent outline-none w-32"
          />
        </div>

        {/* Notification Bell */}
        <div className="relative">

          <button
            onClick={() =>
              setShowNotifications((previous) => !previous)
            }
            className="relative p-2 rounded-lg hover:bg-slate-100 transition"
          >
            <Bell size={23} className="text-slate-600" />

            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-5 h-5 px-1 rounded-full flex items-center justify-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50">

              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-bold text-slate-800">
                  Notifications
                </h3>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <CheckCheck size={14} />
                      Mark all read
                    </button>
                  )}

                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">

                {notifications.length === 0 ? (
                  <p className="text-center text-sm text-slate-500 py-10">
                    No notifications yet.
                  </p>
                ) : (
                  notifications.map((notification) => {
                    const activity = notification.activity;

                    return (
                      <div
                        key={notification.id}
                        className={`p-4 border-b hover:bg-slate-50 transition ${
                          !notification.isRead
                            ? "bg-indigo-50"
                            : "bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-3">

                          <div
                            className="w-2 h-2 mt-2 rounded-full bg-indigo-500 shrink-0"
                            style={{
                              opacity: notification.isRead ? 0 : 1
                            }}
                          />

                          <div
                            className="flex-1 cursor-pointer"
                            onClick={() =>
                              markAsRead(notification.id)
                            }
                          >
                            <p className="text-sm font-semibold text-slate-800">
                              {activity?.action?.replaceAll("_", " ")}
                            </p>

                            <p className="text-sm text-slate-600 mt-1">
                              {activity?.description}
                            </p>

                            <p className="text-xs text-slate-400 mt-2">
                              By {activity?.user?.name || "User"} ·{" "}
                              {new Date(
                                notification.createdAt
                              ).toLocaleString()}
                            </p>
                          </div>

                          <button
                            onClick={() =>
                              deleteNotification(notification.id)
                            }
                            disabled={deletingId === notification.id}
                            title="Delete notification"
                            aria-label="Delete notification"
                            className="text-red-500 hover:bg-red-100 p-2 rounded-lg disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                          </button>

                        </div>
                      </div>
                    );
                  })
                )}

              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2">
          <UserCircle size={32} className="text-indigo-600" />

          <div>
            <p className="text-sm font-semibold text-slate-800">
              {user.name || "User"}
            </p>

            <p className="text-xs text-slate-500">
              {user.role || "Member"}
            </p>
          </div>
        </div>

      </div>
    </header>
  );
}

export default Header;
