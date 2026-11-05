
import { useState, useEffect } from "react";
import { Plus, Search, Trash2, Pencil, X } from "lucide-react";
import API from "../api/axios";

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    projectId: "",
    assignedToId: "",
    priority: "MEDIUM",
    status: "PENDING",
    dueDate: ""
  });

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  async function fetchData() {
    try {
      setLoading(true);
      setError("");

      const [taskRes, projectRes, memberRes] = await Promise.all([
        API.get("/tasks"),
        API.get("/projects"),
        API.get("/projects/members")
      ]);

      setTasks(taskRes.data.data);
      setProjects(projectRes.data.data);
      setMembers(memberRes.data.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load task data"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  function resetForm() {
    setFormData({
      title: "",
      description: "",
      projectId: "",
      assignedToId: "",
      priority: "MEDIUM",
      status: "PENDING",
      dueDate: ""
    });

    setEditingId(null);
    setShowForm(false);
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "projectId" ? { assignedToId: "" } : {})
    }));
  }

  // Members belonging to the selected project only
  const selectedProject = projects.find(
    (project) => project.id === Number(formData.projectId)
  );

  const projectMemberIds = new Set([
    ...(selectedProject?.members || []).map((member) => member.id),
    ...(selectedProject?.ownerId ? [selectedProject.ownerId] : []),
    ...(selectedProject?.owner?.id ? [selectedProject.owner.id] : [])
  ]);

  const hasMembershipData =
    selectedProject &&
    (Array.isArray(selectedProject.members) ||
      selectedProject.ownerId != null ||
      selectedProject.owner != null);

  const availableMembers = hasMembershipData
    ? members.filter((member) => projectMemberIds.has(member.id))
    : selectedProject
      ? members
      : [];

  // Create or update task
  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        ...formData,
        title: formData.title.trim(),
        projectId: Number(formData.projectId),
        assignedToId: formData.assignedToId
          ? Number(formData.assignedToId)
          : null,
        dueDate: formData.dueDate || null
      };

      if (editingId) {
        await API.patch(`/tasks/${editingId}`, payload);
      } else {
        await API.post("/tasks", payload);
      }

      resetForm();
      await fetchData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (editingId ? "Failed to update task" : "Failed to create task")
      );
    } finally {
      setSaving(false);
    }
  }

  // Open form with existing task information
  function handleEdit(task) {
    setFormData({
      title: task.title || "",
      description: task.description || "",
      projectId: String(task.projectId),
      assignedToId: task.assignedToId
        ? String(task.assignedToId)
        : "",
      priority: task.priority || "MEDIUM",
      status: task.status || "PENDING",
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().split("T")[0]
        : ""
    });

    setEditingId(task.id);
    setShowForm(true);
    setError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Update task status
  async function handleStatusChange(taskId, newStatus) {
    try {
      setError("");

      await API.patch(`/tasks/${taskId}`, {
        status: newStatus
      });

      await fetchData();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to update task status"
      );
    }
  }

  // Delete task
  async function handleDelete(taskId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) return;

    try {
      setError("");

      await API.delete(`/tasks/${taskId}`);

      await fetchData();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to delete task"
      );
    }
  }

  function canEditTask(task) {
    const project = projects.find(
      (item) => item.id === task.projectId
    );

    return (
      currentUser?.role === "ADMIN" ||
      project?.ownerId === currentUser?.id
    );
  }

  function canDeleteTask(task) {
    return canEditTask(task);
  }

  function formatStatus(value) {
    const statuses = {
      PENDING: "Pending",
      IN_PROGRESS: "In Progress",
      COMPLETED: "Completed"
    };

    return statuses[value] || value;
  }

  function formatPriority(value) {
    return value.charAt(0) + value.slice(1).toLowerCase();
  }

  function getPriorityColor(priority) {
    if (priority === "HIGH") return "bg-red-100 text-red-700";
    if (priority === "MEDIUM") return "bg-yellow-100 text-yellow-700";
    return "bg-green-100 text-green-700";
  }

  function getStatusColor(taskStatus) {
    if (taskStatus === "COMPLETED")
      return "bg-green-100 text-green-700";

    if (taskStatus === "IN_PROGRESS")
      return "bg-blue-100 text-blue-700";

    return "bg-orange-100 text-orange-700";
  }

  // Search and filter
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesStatus =
      status === "All" || formatStatus(task.status) === status;

    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Tasks
          </h1>

          <p className="text-slate-500 mt-1">
            Manage and track your team's tasks.
          </p>
        </div>

        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setEditingId(null);
              setShowForm(true);
              setError("");
            }
          }}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? "Close Form" : "Add Task"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <p className="bg-red-50 text-red-600 p-3 rounded-lg mb-5">
          {error}
        </p>
      )}

      {/* Create / Edit Task Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-xl border shadow-sm mb-8 space-y-4"
        >
          <h2 className="font-semibold text-lg">
            {editingId ? "Edit Task" : "Create New Task"}
          </h2>

          <input
            name="title"
            placeholder="Task Name"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full border p-3 rounded-lg"
          />

          <textarea
            name="description"
            placeholder="Task Description"
            value={formData.description}
            onChange={handleChange}
            className="w-full border p-3 rounded-lg"
          />

          <select
            name="projectId"
            value={formData.projectId}
            onChange={handleChange}
            required
            className="w-full border p-3 rounded-lg"
          >
            <option value="">Select Project</option>

            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          <select
            name="assignedToId"
            value={formData.assignedToId}
            onChange={handleChange}
            className="w-full border p-3 rounded-lg"
          >
            <option value="">Unassigned</option>

            {availableMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} ({member.role})
              </option>
            ))}
          </select>

          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full border p-3 rounded-lg"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>

          {editingId && (
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg"
            >
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          )}

          <input
            type="date"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            className="w-full border p-3 rounded-lg"
          />

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving || projects.length === 0}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Task"
                  : "Save Task"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="border text-slate-600 px-5 py-2 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>

          {projects.length === 0 && (
            <p className="text-sm text-orange-600">
              Create or get access to a project before adding tasks.
            </p>
          )}
        </form>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex items-center gap-2 bg-white border rounded-lg px-3 flex-1">
          <Search size={18} className="text-slate-400" />

          <input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-3 outline-none"
          />
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-white border rounded-lg px-4 py-3"
        >
          <option value="All">All Tasks</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* Task Table */}
      {loading ? (
        <p className="text-slate-500">Loading tasks...</p>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-sm">
              <tr>
                <th className="p-4">Task</th>
                <th className="p-4">Project</th>
                <th className="p-4">Assignee</th>
                <th className="p-4">Due Date</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Status</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <tr key={task.id} className="border-t">
                    <td className="p-4 font-medium text-slate-800">
                      {task.title}
                    </td>

                    <td className="p-4 text-slate-600">
                      {task.project?.name || "—"}
                    </td>

                    <td className="p-4 text-slate-600">
                      {task.assignedTo?.name || "Unassigned"}
                    </td>

                    <td className="p-4 text-slate-600">
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString()
                        : "—"}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}
                      >
                        {formatPriority(task.priority)}
                      </span>
                    </td>

                    <td className="p-4">
                      <select
                        value={task.status}
                        onChange={(e) =>
                          handleStatusChange(task.id, e.target.value)
                        }
                        className={`px-3 py-1 rounded-full text-xs font-medium border-0 ${getStatusColor(task.status)}`}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {canEditTask(task) && (
                          <button
                            onClick={() => handleEdit(task)}
                            title="Edit task"
                            className="text-indigo-500 hover:text-indigo-700"
                          >
                            <Pencil size={18} />
                          </button>
                        )}

                        {canDeleteTask(task) && (
                          <button
                            onClick={() => handleDelete(task.id)}
                            title="Delete task"
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="p-6 text-center text-slate-500"
                  >
                    No tasks found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Tasks;
