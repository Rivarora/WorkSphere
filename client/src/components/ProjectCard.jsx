
import { CalendarDays, Users, Pencil, Trash2 } from "lucide-react";

function ProjectCard({ project, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition">

      {/* Project heading */}
      <div className="flex justify-between items-start gap-3">
        <div>
          <h3 className="font-semibold text-slate-800 text-lg">
            {project.name}
          </h3>

          <p className="text-sm text-slate-500 mt-1">
            {project.description || "No description provided"}
          </p>
        </div>

        <span className={`text-xs px-3 py-1 rounded-full font-medium ${project.statusColor}`}>
          {project.status}
        </span>
      </div>

      {/* Progress */}
      <div className="mt-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-slate-500">Progress</span>
          <span className="text-sm font-semibold text-slate-700">
            {project.progress}%
          </span>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* Project details */}
      <div className="flex items-center justify-between mt-6 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <Users size={17} />
          <span>{project.members} Members</span>
        </div>

        <div className="flex items-center gap-2">
          <CalendarDays size={17} />
          <span>{project.deadline}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-100">
        <button
          onClick={() => onEdit(project)}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
        >
          <Pencil size={16} />
          Edit
        </button>

        <button
          onClick={() => onDelete(project.id)}
          className="flex items-center gap-2 text-red-500 hover:text-red-700 text-sm font-medium"
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>

    </div>
  );
}

export default ProjectCard;
