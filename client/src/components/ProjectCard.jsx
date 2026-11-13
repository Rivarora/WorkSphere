
import {
  CalendarDays,
  Users,
  Pencil,
  Trash2
} from "lucide-react";

function ProjectCard({ project, onEdit, onDelete }) {
  const progress = Math.min(
    100,
    Math.max(0, Number(project.progress) || 0)
  );

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition">

      {/* Project Heading */}
      <div className="flex justify-between items-start gap-3">

        <div className="min-w-0">
          <h3 className="font-semibold text-slate-800 text-lg break-word">
            {project.name}
          </h3>

          <p className="text-sm text-slate-500 mt-1 break-word">
            {project.description || "No description provided"}
          </p>
        </div>

        <span
          className={`shrink-0 text-xs px-3 py-1 rounded-full font-medium ${
            project.statusColor ||
            "bg-slate-100 text-slate-700"
          }`}
        >
          {project.status}
        </span>

      </div>

      {/* Progress */}
      <div className="mt-6">

        <div className="flex justify-between mb-2">
          <span className="text-sm text-slate-500">
            Progress
          </span>

          <span className="text-sm font-semibold text-slate-700">
            {progress}%
          </span>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

      </div>

      {/* Project Details */}
      <div className="flex items-center justify-between mt-6 text-sm text-slate-500 gap-3">

        <div className="flex items-center gap-2">
          <Users size={17} />
          <span>{project.members} Members</span>
        </div>

        <div className="flex items-center gap-2">
          <CalendarDays size={17} />
          <span>{project.deadline || "Not set"}</span>
        </div>

      </div>

      {/* Actions */}
      {(onEdit || onDelete) && (
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-100">

          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(project)}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium transition"
              aria-label={`Edit ${project.name}`}
            >
              <Pencil size={16} />
              Edit
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(project.id)}
              className="flex items-center gap-2 text-red-500 hover:text-red-700 text-sm font-medium transition"
              aria-label={`Delete ${project.name}`}
            >
              <Trash2 size={16} />
              Delete
            </button>
          )}

        </div>
      )}

    </div>
  );
}

export default ProjectCard;
