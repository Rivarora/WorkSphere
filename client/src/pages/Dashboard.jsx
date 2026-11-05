
import { useState, useEffect } from "react";

import {
  FolderKanban,
  ListTodo,
  CheckCircle,
  Clock,
  CalendarDays,
  Activity as ActivityIcon,
  RefreshCw
} from "lucide-react";

import StatCard from "../components/StatCard";
import ProjectCard from "../components/ProjectCard";
import TaskTable from "../components/TaskTable";
import API from "../api/axios";

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchDashboardData() {
    try {
      setLoading(true);
      setError("");

      const [projectRes, taskRes, activityRes] = await Promise.all([
        API.get("/projects"),
        API.get("/tasks"),
        API.get("/activities")
      ]);

      setProjects(projectRes.data.data || []);
      setTasks(taskRes.data.data || []);
      setActivities(activityRes.data.data || []);

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Task statistics
  const totalProjects = projects.length;
  const totalTasks = tasks.length;

  const activeTasks = tasks.filter(
    (task) => task.status === "IN_PROGRESS"
  ).length;

  const completedTasks = tasks.filter(
    (task) => task.status === "COMPLETED"
  ).length;

  const pendingTasks = tasks.filter(
    (task) => task.status === "PENDING"
  ).length;

  const completionRate = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  const stats = [
    {
      title: "Total Projects",
      value: totalProjects,
      icon: FolderKanban,
      color: "bg-indigo-100 text-indigo-600"
    },
    {
      title: "Active Tasks",
      value: activeTasks,
      icon: ListTodo,
      color: "bg-blue-100 text-blue-600"
    },
    {
      title: "Completed Tasks",
      value: completedTasks,
      icon: CheckCircle,
      color: "bg-green-100 text-green-600"
    },
    {
      title: "Pending Tasks",
      value: pendingTasks,
      icon: Clock,
      color: "bg-orange-100 text-orange-600"
    }
  ];

  // Recent projects
  const recentProjects = [...projects]
    .sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    )
    .slice(0, 3)
    .map((project) => {
      const statusMap = {
        PLANNING: "Pending",
        IN_PROGRESS: "In Progress",
        COMPLETED: "Completed",
        ON_HOLD: "On Hold"
      };

      const statusColors = {
        PLANNING: "bg-orange-100 text-orange-700",
        IN_PROGRESS: "bg-blue-100 text-blue-700",
        COMPLETED: "bg-green-100 text-green-700",
        ON_HOLD: "bg-slate-100 text-slate-700"
      };

      const projectTasks = project.tasks || [];

      const progress = projectTasks.length
        ? Math.round(
            (projectTasks.filter(
              (task) => task.status === "COMPLETED"
            ).length / projectTasks.length) * 100
          )
        : 0;

      return {
        ...project,
        status: statusMap[project.status] || project.status,
        statusColor: statusColors[project.status],
        progress,
        members: project.members?.length || 0,
        deadline: project.deadline
          ? new Date(project.deadline).toLocaleDateString()
          : "Not set"
      };
    });

  // Recent tasks
  const recentTasks = [...tasks]
    .sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    )
    .slice(0, 5)
    .map((task) => {
      const statusMap = {
        PENDING: "Pending",
        IN_PROGRESS: "In Progress",
        COMPLETED: "Completed"
      };

      const priorityMap = {
        LOW: "Low",
        MEDIUM: "Medium",
        HIGH: "High"
      };

      const statusColors = {
        PENDING: "bg-orange-100 text-orange-700",
        IN_PROGRESS: "bg-blue-100 text-blue-700",
        COMPLETED: "bg-green-100 text-green-700"
      };

      const priorityColors = {
        LOW: "bg-green-100 text-green-700",
        MEDIUM: "bg-yellow-100 text-yellow-700",
        HIGH: "bg-red-100 text-red-700"
      };

      return {
        id: task.id,
        name: task.title,
        assignee: task.assignedTo?.name || "Unassigned",
        dueDate: task.dueDate
          ? new Date(task.dueDate).toLocaleDateString()
          : "Not set",
        priority: priorityMap[task.priority] || task.priority,
        priorityColor: priorityColors[task.priority],
        status: statusMap[task.status] || task.status,
        statusColor: statusColors[task.status]
      };
    });

  // Upcoming deadlines
  const upcomingTasks = tasks
    .filter((task) => {
      if (!task.dueDate || task.status === "COMPLETED") {
        return false;
      }

      const dueDate = new Date(task.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return dueDate >= today;
    })
    .sort(
      (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
    )
    .slice(0, 5);

  // Recent activities
  const recentActivities = activities.slice(0, 5);

  function formatDate(date) {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    return Number.isNaN(parsedDate.getTime())
      ? "Date unavailable"
      : parsedDate.toLocaleString();
  }

  if (loading) {
    return (
      <p className="text-slate-500">
        Loading dashboard...
      </p>
    );
  }

  return (
    <div>

      {/* Heading */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Dashboard
          </h1>

          <p className="text-slate-500 mt-1">
            Here's what's happening with your workspace.
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <p className="bg-red-50 text-red-600 p-3 rounded-lg mb-5">
          {error}
        </p>
      )}

      {/* Statistics */}
      <h2 className="text-xl font-semibold text-slate-800 mb-6">
        Overview
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      {/* Overall Progress */}
      <div className="bg-white border rounded-xl p-6 mt-8">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h2 className="font-semibold text-slate-800">
              Overall Task Completion
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Progress across all accessible tasks
            </p>
          </div>

          <span className="text-xl font-bold text-indigo-600">
            {completionRate}%
          </span>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-3">
          <div
            className="bg-indigo-600 h-3 rounded-full transition-all"
            style={{ width: `${completionRate}%` }}
          />
        </div>

        <p className="text-xs text-slate-500 mt-3">
          {completedTasks} of {totalTasks} tasks completed
        </p>
      </div>

      {/* Recent Projects */}
      <div className="mt-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              Recent Projects
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Track your team's ongoing projects.
            </p>
          </div>

          <button
            onClick={() => window.location.href = "/projects"}
            className="text-indigo-600 font-medium text-sm hover:underline"
          >
            View All
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {recentProjects.length > 0 ? (
            recentProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
              />
            ))
          ) : (
            <p className="text-slate-500">
              No projects available.
            </p>
          )}
        </div>
      </div>

      {/* Task Overview */}
      <div className="mt-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              Task Overview
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Monitor your team's tasks and deadlines.
            </p>
          </div>

          <button
            onClick={() => window.location.href = "/tasks"}
            className="text-indigo-600 text-sm font-medium hover:underline"
          >
            View All
          </button>
        </div>

        {recentTasks.length > 0 ? (
          <TaskTable tasks={recentTasks} />
        ) : (
          <p className="text-slate-500">
            No tasks available.
          </p>
        )}
      </div>

      {/* Upcoming Deadlines */}
      <div className="mt-10">
        <div className="flex items-center gap-2 mb-5">
          <CalendarDays className="text-indigo-600" />

          <h2 className="text-xl font-semibold text-slate-800">
            Upcoming Deadlines
          </h2>
        </div>

        <div className="bg-white border rounded-xl divide-y">
          {upcomingTasks.length > 0 ? (
            upcomingTasks.map((task) => (
              <div
                key={task.id}
                className="p-5 flex flex-wrap justify-between items-center gap-3"
              >
                <div>
                  <h3 className="font-medium text-slate-800">
                    {task.title}
                  </h3>

                  <p className="text-sm text-slate-500 mt-1">
                    {task.project?.name || "Project"} ·{" "}
                    {task.assignedTo?.name || "Unassigned"}
                  </p>
                </div>

                <span className="text-sm bg-orange-100 text-orange-700 px-3 py-2 rounded-lg">
                  {new Date(task.dueDate).toLocaleDateString()}
                </span>
              </div>
            ))
          ) : (
            <p className="text-slate-500 p-5">
              No upcoming deadlines.
            </p>
          )}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="mt-10">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <ActivityIcon className="text-indigo-600" />

            <h2 className="text-xl font-semibold text-slate-800">
              Recent Activities
            </h2>
          </div>

          <button
            onClick={() => window.location.href = "/activity"}
            className="text-indigo-600 text-sm font-medium hover:underline"
          >
            View All
          </button>
        </div>

        <div className="bg-white border rounded-xl divide-y">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity) => (
              <div key={activity.id} className="p-5">
                <h3 className="font-medium text-slate-800">
                  {activity.action.replaceAll("_", " ")}
                </h3>

                <p className="text-sm text-slate-600 mt-1">
                  {activity.description}
                </p>

                <p className="text-xs text-slate-400 mt-2">
                  By {activity.user?.name || "Unknown user"}
                  {" · "}
                  {formatDate(activity.createdAt)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-slate-500 p-5">
              No recent activities.
            </p>
          )}
        </div>
      </div>

    </div>
  );
}

export default Dashboard;
