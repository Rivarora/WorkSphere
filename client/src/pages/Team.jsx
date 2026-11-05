
import { useState, useEffect } from "react";
import {
  Search,
  Users,
  UserPlus,
  X,
  Trash2,
  FolderKanban
} from "lucide-react";

import API from "../api/axios";

function Team() {
  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const [formData, setFormData] = useState({
    projectId: "",
    userId: ""
  });

  // Get logged-in user
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  // Only Project Manager can manage team members
  const isProjectManager =
    currentUser?.role === "PROJECT_MANAGER";

  async function fetchTeamData() {
    try {
      setLoading(true);
      setError("");

      const [memberRes, projectRes] = await Promise.all([
        API.get("/projects/members"),
        API.get("/projects")
      ]);

      setMembers(memberRes.data.data || []);
      setProjects(projectRes.data.data || []);

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to load team data"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTeamData();
  }, []);

  async function handleAddMember(e) {
    e.preventDefault();

    if (!isProjectManager) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await API.post(
        `/projects/${formData.projectId}/members`,
        { userId: Number(formData.userId) }
      );

      setSuccess("Member added to project successfully!");

      setFormData({
        projectId: "",
        userId: ""
      });

      setShowForm(false);
      await fetchTeamData();

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to add member"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveMember(project, member) {
    if (!isProjectManager) return;

    const confirmed = window.confirm(
      `Remove ${member.name} from ${project.name}? Their account will not be deleted.`
    );

    if (!confirmed) return;

    try {
      setRemovingId(`${project.id}-${member.id}`);
      setError("");
      setSuccess("");

      await API.delete(
        `/projects/${project.id}/members/${member.id}`
      );

      setSuccess(
        `${member.name} removed from ${project.name} successfully.`
      );

      await fetchTeamData();

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to remove member"
      );
    } finally {
      setRemovingId(null);
    }
  }

  function formatRole(role) {
    const roles = {
      ADMIN: "Admin",
      PROJECT_MANAGER: "Project Manager",
      DEVELOPER: "Developer",
      DESIGNER: "Designer"
    };

    return roles[role] || role;
  }

  const selectedProject = projects.find(
    (project) => String(project.id) === formData.projectId
  );

  const availableMembers = members.filter((member) => {
    if (!selectedProject) return true;

    const isOwner = selectedProject.ownerId === member.id;

    const alreadyMember = selectedProject.members?.some(
      (item) => item.id === member.id
    );

    return !isOwner && !alreadyMember;
  });

  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(search.toLowerCase()) ||
    member.email.toLowerCase().includes(search.toLowerCase()) ||
    member.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>

      {/* Heading */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">

        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Team Members
          </h1>

          <p className="text-slate-500 mt-1">
            Manage your team and their responsibilities.
          </p>
        </div>

        {/* Add Member - Project Manager Only */}
        {isProjectManager && (
          <button
            onClick={() => {
              setShowForm(!showForm);
              setError("");
              setSuccess("");
            }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700"
          >
            {showForm ? <X size={18} /> : <UserPlus size={18} />}
            {showForm ? "Close" : "Add Member"}
          </button>
        )}

      </div>

      {/* Messages */}
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

      {/* Add Member Form - Project Manager Only */}
      {isProjectManager && showForm && (
        <form
          onSubmit={handleAddMember}
          className="bg-white border rounded-xl p-6 mb-6 shadow-sm"
        >

          <h2 className="text-lg font-semibold text-slate-800 mb-5">
            Add Member to Project
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Project
              </label>

              <select
                value={formData.projectId}
                onChange={(e) =>
                  setFormData({
                    projectId: e.target.value,
                    userId: ""
                  })
                }
                required
                className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Choose a project</option>

                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Team Member
              </label>

              <select
                value={formData.userId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    userId: e.target.value
                  })
                }
                required
                disabled={!formData.projectId || availableMembers.length === 0}
                className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
              >
                <option value="">Choose a member</option>

                {availableMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.email})
                  </option>
                ))}
              </select>

              {formData.projectId && availableMembers.length === 0 && (
                <p className="text-sm text-slate-500 mt-2">
                  All available members are already assigned.
                </p>
              )}
            </div>

          </div>

          <button
            type="submit"
            disabled={
              saving ||
              !formData.projectId ||
              !formData.userId
            }
            className="mt-5 bg-indigo-600 text-white px-5 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Adding Member..." : "Add to Project"}
          </button>

        </form>
      )}

      {/* Total Members */}
      <div className="bg-white border rounded-xl p-5 mb-6 flex items-center gap-4">

        <div className="bg-indigo-100 text-indigo-600 p-3 rounded-lg">
          <Users size={26} />
        </div>

        <div>
          <p className="text-sm text-slate-500">
            Total Team Members
          </p>

          <h2 className="text-2xl font-bold text-slate-800">
            {members.length}
          </h2>
        </div>

      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border rounded-lg px-3 mb-6">

        <Search size={18} className="text-slate-400" />

        <input
          placeholder="Search by name, email or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full py-3 outline-none"
        />

      </div>

      {/* Members */}
      {loading ? (
        <p className="text-slate-500">
          Loading team members...
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

          {filteredMembers.length > 0 ? (
            filteredMembers.map((member) => {

              const assignedProjects = projects.filter((project) =>
                project.members?.some(
                  (item) => item.id === member.id
                )
              );

              return (
                <div
                  key={member.id}
                  className="bg-white border rounded-xl p-6 shadow-sm"
                >

                  {/* Member Details */}
                  <div className="flex items-center gap-4 mb-5">

                    <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg">
                      {member.name.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-800">
                        {member.name}
                      </h3>

                      <p className="text-sm text-slate-500">
                        {formatRole(member.role)}
                      </p>
                    </div>

                  </div>

                  <p className="text-sm text-slate-500 break-all">
                    {member.email}
                  </p>

                  <div className="border-t mt-5 pt-4">
                    <p className="text-sm text-slate-500">
                      Account ID
                    </p>

                    <p className="text-xl font-bold text-slate-800 mt-1">
                      #{member.id}
                    </p>
                  </div>

                  {/* Project Assignments */}
                  <div className="border-t mt-5 pt-4">

                    <div className="flex items-center gap-2 mb-3">
                      <FolderKanban size={17} className="text-indigo-600" />

                      <h4 className="font-semibold text-slate-700">
                        Assigned Projects ({assignedProjects.length})
                      </h4>
                    </div>

                    {assignedProjects.length > 0 ? (
                      <div className="space-y-3">

                        {assignedProjects.map((project) => (
                          <div
                            key={project.id}
                            className="flex items-center justify-between gap-2 bg-slate-50 p-3 rounded-lg"
                          >

                            <span className="text-sm text-slate-700 font-medium">
                              {project.name}
                            </span>

                            {/* Remove Member - Project Manager Only */}
                            {isProjectManager && (
                              <button
                                onClick={() =>
                                  handleRemoveMember(project, member)
                                }
                                disabled={
                                  removingId === `${project.id}-${member.id}`
                                }
                                title="Remove from project"
                                aria-label={`Remove ${member.name} from ${project.name}`}
                                className="text-red-500 hover:bg-red-100 p-2 rounded-lg disabled:opacity-50"
                              >
                                {removingId === `${project.id}-${member.id}` ? (
                                  <span className="text-xs">...</span>
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </button>
                            )}

                          </div>
                        ))}

                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">
                        Not assigned to any projects.
                      </p>
                    )}

                  </div>

                </div>
              );
            })
          ) : (
            <p className="text-slate-500 col-span-full">
              No team members found.
            </p>
          )}

        </div>
      )}

    </div>
  );
}

export default Team;
