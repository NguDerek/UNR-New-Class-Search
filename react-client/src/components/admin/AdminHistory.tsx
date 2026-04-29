import { useEffect, useState } from "react";
import { Clock, User } from "lucide-react";

type AdminLog = {
  id: number;
  user_email: string;
  action: string;
  summary: string;
  created_at: string;
};

export function AdminHistory() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const res = await fetch("/api/admin/history", {
          credentials: "include",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load admin history");
        }

        setLogs(data.logs || []);
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to load admin history."
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
      <div className="bg-[#003366] p-4 text-white">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          <h2 className="text-white">Admin History</h2>
        </div>
        <p className="text-slate-200 text-sm mt-1">
          Recent admin activity and course changes
        </p>
      </div>

      <div className="p-6 space-y-4">
        {isLoading && (
          <p className="text-slate-600">Loading history...</p>
        )}

        {errorMessage && (
          <p className="text-red-600 font-medium">{errorMessage}</p>
        )}

        {!isLoading && !errorMessage && logs.length === 0 && (
          <p className="text-slate-600">No admin history yet.</p>
        )}

        {!isLoading &&
          !errorMessage &&
          logs.map((log) => (
            <div
              key={log.id}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-900">{log.summary}</p>

                  <p className="text-sm text-slate-600 flex items-center gap-2 mt-1">
                    <User className="w-4 h-4 text-[#003366]" />
                    {log.user_email || "Unknown admin"}
                  </p>
                </div>

                <span className="text-sm text-slate-600">
                  {log.action}
                </span>
              </div>

              <p className="text-sm text-slate-500">{log.created_at}</p>
            </div>
          ))}
      </div>
    </div>
  );
}