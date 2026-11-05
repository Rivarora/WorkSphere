
import { CalendarDays } from "lucide-react";

function TaskTable({ tasks }) {

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

      <div className="overflow-x-auto">

        <table className="w-full text-left">

          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 text-sm text-slate-500">Task</th>
              <th className="p-4 text-sm text-slate-500">Assigned To</th>
              <th className="p-4 text-sm text-slate-500">Due Date</th>
              <th className="p-4 text-sm text-slate-500">Priority</th>
              <th className="p-4 text-sm text-slate-500">Status</th>
            </tr>
          </thead>

          <tbody>

            {tasks.map((task) => (

              <tr
                key={task.id}
                className="border-b border-slate-100 hover:bg-slate-50"
              >

                <td className="p-4 font-medium text-slate-800">
                  {task.name}
                </td>

                <td className="p-4 text-sm text-slate-600">
                  {task.assignee}
                </td>

                <td className="p-4 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={16} />
                    {task.dueDate}
                  </div>
                </td>

                <td className="p-4">
                  <span className={`text-xs px-3 py-1 rounded-full ${task.priorityColor}`}>
                    {task.priority}
                  </span>
                </td>

                <td className="p-4">
                  <span className={`text-xs px-3 py-1 rounded-full ${task.statusColor}`}>
                    {task.status}
                  </span>
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default TaskTable;
