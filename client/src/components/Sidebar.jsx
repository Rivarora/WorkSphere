
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Settings,
  LogOut,
  Briefcase,
  Activity
} from "lucide-react";

import { NavLink } from "react-router-dom";
import socket from "../socket";
function Sidebar() {

  const menuItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Projects", path: "/projects", icon: FolderKanban },
    { name: "Tasks", path: "/tasks", icon: CheckSquare },
    { name: "Team", path: "/team", icon: Users },
    { name: "Activity", path: "/activity", icon: Activity },
    { name: "Settings", path: "/settings", icon: Settings }
  ];

  return (
    <div className="w-64 min-h-screen bg-slate-900 text-white p-5">

      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <Briefcase size={24} />
        </div>

        <h1 className="text-xl font-bold">
          WorkSphere
        </h1>
      </div>

      {/* Navigation */}
      <nav className="space-y-2">

        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-lg transition
                ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-slate-300 hover:bg-slate-800"
                }`
              }
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}

      </nav>

      {/* Logout */}
      <div className="mt-16">
        <button
          onClick={() => {
             socket.disconnect();
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/login";
          }}
          className="w-full flex items-center gap-3 p-3 text-slate-300 hover:bg-slate-800 rounded-lg cursor-pointer transition"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>

    </div>
  );
}

export default Sidebar;
