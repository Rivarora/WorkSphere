
import { useState, useEffect } from "react";
import { Search, Plus, X } from "lucide-react";
import ProjectCard from "../components/ProjectCard";
import API from "../api/axios";

function Projects() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Check logged-in user's role
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const isProjectManager =
    currentUser.role === "PROJECT_MANAGER";

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    deadline: "",
    status: "PLANNING"
  });

  async function fetchProjects() {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/projects");
      setProjects(response.data.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load projects"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProjects();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  function resetForm() {
    setFormData({
      name: "",
      description: "",
      deadline: "",
      status: "PLANNING"
    });

    setEditingId(null);
    setShowForm(false);
  }

  function handleEdit(project) {
    if (!isProjectManager) return;

    setEditingId(project.id);

    setFormData({
      name: project.name || "",
      description: project.description || "",
      deadline: project.deadline
        ? new Date(project.deadline).toISOString().split("T")[0]
        : "",
      status: project.status || "PLANNING"
    });

    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!isProjectManager) return;

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        deadline: formData.deadline,
        status: formData.status
      };

      if (editingId) {
        await API.put(`/projects/${editingId}`, payload);
      } else {
        await API.post("/projects", payload);
      }

      await fetchProjects();
      resetForm();

    } catch (err) {
      setError(
        err.response?.data?.message ||
        (editingId
          ? "Failed to update project"
          : "Failed to create project")
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(projectId) {
    if (!isProjectManager) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this project? Its tasks may also be deleted."
    );

    if (!confirmed) return;

    try {
      setError("");

      await API.delete(`/projects/${projectId}`);

      await fetchProjects();

    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to delete project"
      );
    }
  }

  function getStatusLabel(value) {
    const statusMap = {
      PLANNING: "Pending",
      IN_PROGRESS: "In Progress",
      COMPLETED: "Completed",
      ON_HOLD: "On Hold"
    };

    return statusMap[value] || value;
  }

  const statusColors = {
    PLANNING: "bg-orange-100 text-orange-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-green-100 text-green-700",
    ON_HOLD: "bg-slate-100 text-slate-700"
  };

  const formattedProjects = projects.map((project) => ({
    ...project,
    status: getStatusLabel(project.status),
    statusColor: statusColors[project.status],
    progress: project.tasks?.length
      ? Math.round(
          (project.tasks.filter(
            (task) => task.status === "COMPLETED"
          ).length / project.tasks.length) * 100
        )
      : 0,
    members: project.members?.length || 0,
    deadline: project.deadline
      ? new Date(project.deadline).toLocaleDateString()
      : "Not set"
  }));

  const filteredProjects = formattedProjects.filter((project) => {
    const matchesSearch = project.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesStatus =
      status === "All" || project.status === status;

    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      {/* Heading */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Projects
          </h1>

          <p className="text-slate-500 mt-1">
            Manage and track all your projects.
          </p>
        </div>

        {/* Only Project Manager sees Add Project */}
        {isProjectManager && (
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            <Plus size={18} />
            Add Project
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-600 bg-red-50 p-3 rounded-lg mb-5">
          {error}
        </p>
      )}

      {/* Create / Edit Form - Manager only */}
      {isProjectManager && showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">

          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-semibold">
              {editingId ? "Edit Project" : "Create New Project"}
            </h2>

            <button onClick={resetForm} aria-label="Close form">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            <input
              type="text"
              name="name"
              placeholder="Project Name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full border p-3 rounded-lg"
            />

            <textarea
              name="description"
              placeholder="Project Description"
              value={formData.description}
              onChange={handleChange}
              required
              className="w-full border p-3 rounded-lg"
            />

            <input
              type="date"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              required
              className="w-full border p-3 rounded-lg"
            />

            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg"
            >
              <option value="PLANNING">Planning</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="ON_HOLD">On Hold</option>
            </select>

            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Project"
                  : "Save Project"}
            </button>

          </form>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">

        <div className="flex items-center gap-2 bg-white border rounded-lg px-3 flex-1">
          <Search size={18} className="text-slate-400" />

          <input
            type="text"
            placeholder="Search projects..."
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
          <option value="All">All Projects</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Pending">Pending</option>
          <option value="On Hold">On Hold</option>
        </select>

      </div>

      {/* Project Cards */}
      {loading ? (
        <p className="text-slate-500">Loading projects...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

          {filteredProjects.length > 0 ? (
            filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={isProjectManager ? handleEdit : undefined}
                onDelete={isProjectManager ? handleDelete : undefined}
              />
            ))
          ) : (
            <p className="text-slate-500 col-span-full">
              No projects found.
            </p>
          )}

        </div>
      )}
    </div>
  );
}

export default Projects;
