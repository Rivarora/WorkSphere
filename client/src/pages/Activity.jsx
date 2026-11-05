
import { useState, useEffect, useMemo } from "react";
import socket from "../socket";

import {
  Activity as ActivityIcon,
  FolderKanban,
  ListTodo,
  UserPlus,
  Trash2,
  RefreshCw,
  Pencil
} from "lucide-react";

import API from "../api/axios";

function Activity() {
  const [activities, setActivities] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("All");
  const [selectedAction, setSelectedAction] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchActivities() {
    try {
      setLoading(true);
      setError("");

      const [activityRes, projectRes] = await Promise.all([
        API.get("/activities"),
        API.get("/projects")
      ]);

      setActivities(activityRes.data.data || []);
      setProjects(projectRes.data.data || []);

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to load activities"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchActivities();

    const handleNewActivity = (newActivity) => {
      setActivities((previous) => {
        if (previous.some((item) => item.id === newActivity.id)) {
          return previous;
        }

        return [newActivity, ...previous].slice(0, 50);
      });
    };

    socket.on("newActivity", handleNewActivity);

    return () => {
      socket.off("newActivity", handleNewActivity);
    };
  }, []);

  function getActivityIcon(action) {
    if (action.includes("PROJECT")) return FolderKanban;
    if (action.includes("MEMBER")) return UserPlus;
    if (action.includes("DELETED") || action.includes("REMOVED")) {
      return Trash2;
    }
    if (action.includes("UPDATED")) return Pencil;

    return ListTodo;
  }

  function getActivityColor(action) {
    if (action.includes("CREATED") || action.includes("ADDED")) {
      return "bg-green-100 text-green-600";
    }

    if (action.includes("DELETED") || action.includes("REMOVED")) {
      return "bg-red-100 text-red-600";
    }

    if (action.includes("MEMBER")) {
      return "bg-purple-100 text-purple-600";
    }

    if (action.includes("UPDATED")) {
      return "bg-orange-100 text-orange-600";
    }

    return "bg-blue-100 text-blue-600";
  }

  function formatDate(date) {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleString();
  }

  const filteredActivities = useMemo(() => {
    return activities.filter((item) => {
      const matchesProject =
        selectedProject === "All" ||
        String(item.projectId) === selectedProject;

      let matchesAction = true;

      if (selectedAction === "Projects") {
        matchesAction = item.action.includes("PROJECT");
      } else if (selectedAction === "Tasks") {
        matchesAction = item.action.includes("TASK");
      } else if (selectedAction === "Members") {
        matchesAction = item.action.includes("MEMBER");
      } else if (selectedAction === "Deletions") {
        matchesAction =
          item.action.includes("DELETED") ||
          item.action.includes("REMOVED");
      }

      return matchesProject && matchesAction;
    });
  }, [activities, selectedProject, selectedAction]);

  return (
    <div>
      {/* Heading */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Activity Feed
          </h1>

          <p className="text-slate-500 mt-1">
            Keep track of recent activities in WorkSphere.
          </p>
        </div>

        <button
          onClick={fetchActivities}
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Total Activities */}
      <div className="bg-white border rounded-xl p-5 mb-6 flex items-center gap-4">
        <div className="bg-indigo-100 text-indigo-600 p-3 rounded-lg">
          <ActivityIcon size={26} />
        </div>

        <div>
          <p className="text-sm text-slate-500">
            Total Recent Activities
          </p>

          <h2 className="text-2xl font-bold text-slate-800">
            {activities.length}
          </h2>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="bg-white border rounded-lg px-4 py-3 flex-1"
        >
          <option value="All">All Projects</option>

          {projects.map((project) => (
            <option key={project.id} value={String(project.id)}>
              {project.name}
            </option>
          ))}
        </select>

        <select
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value)}
          className="bg-white border rounded-lg px-4 py-3 flex-1"
        >
          <option value="All">All Activities</option>
          <option value="Projects">Project Activities</option>
          <option value="Tasks">Task Activities</option>
          <option value="Members">Member Activities</option>
          <option value="Deletions">Deletions and Removals</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <p className="bg-red-50 text-red-600 p-3 rounded-lg mb-5">
          {error}
        </p>
      )}

      {/* Activity List */}
      {loading ? (
        <p className="text-slate-500">Loading activities...</p>
      ) : filteredActivities.length > 0 ? (
        <div className="bg-white border rounded-xl divide-y">
          {filteredActivities.map((item) => {
            const Icon = getActivityIcon(item.action);

            return (
              <div
                key={item.id}
                className="p-5 flex items-start gap-4"
              >
                <div
                  className={`p-3 rounded-lg ${getActivityColor(item.action)}`}
                >
                  <Icon size={21} />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800">
                    {item.action.replaceAll("_", " ")}
                  </h3>

                  <p className="text-sm text-slate-600 mt-1">
                    {item.description}
                  </p>

                  <p className="text-xs text-slate-400 mt-2">
                    By {item.user?.name || "Unknown user"}
                    {" · "}
                    {formatDate(item.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border rounded-xl p-10 text-center">
          <ActivityIcon
            size={40}
            className="mx-auto text-slate-300 mb-3"
          />

          <h3 className="font-semibold text-slate-700">
            No activities found
          </h3>

          <p className="text-sm text-slate-500 mt-2">
            Try changing your filters or create a new activity.
          </p>
        </div>
      )}
    </div>
  );
}

export default Activity;
