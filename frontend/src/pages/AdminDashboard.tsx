import { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { ReportRow, ReportSummary } from "../types";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    Promise.all([
      api.get<ReportRow[]>("/admin/reports"),
      api.get<ReportSummary>("/admin/reports/summary"),
    ])
      .then(([reportsRes, summaryRes]) => {
        setRows(reportsRes.data);
        setSummary(summaryRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredRows = rows.filter(
    (r) =>
      r.userName.toLowerCase().includes(filter.toLowerCase()) ||
      r.videoTitle.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Admin Paneli</h1>
          <p className="text-slate-400 text-sm">Hosgeldin, {user?.name}</p>
        </div>
        <button
          onClick={logout}
          className="text-sm text-slate-400 hover:text-white border border-slate-700 rounded-md px-3 py-1.5"
        >
          Cikis Yap
        </button>
      </header>

      {/* Ozet Kartlari */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <SummaryCard label="Toplam Personel" value={summary.totalUsers} />
          <SummaryCard label="Toplam Egitim" value={summary.totalVideos} />
          <SummaryCard label="Toplam Atama" value={summary.totalAssignments} />
          <SummaryCard label="Tamamlanma Orani" value={`%${summary.completionRate}`} />
        </div>
      )}

      <div className="mb-4">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Personel veya egitim adina gore filtrele..."
          className="w-full md:w-80 rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      {loading ? (
        <p className="text-slate-400">Yukleniyor...</p>
      ) : (
        <div className="overflow-x-auto bg-slate-800 rounded-lg border border-slate-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-700">
                <th className="px-4 py-3 font-medium">Personel</th>
                <th className="px-4 py-3 font-medium">Egitim</th>
                <th className="px-4 py-3 font-medium">Izlenme %</th>
                <th className="px-4 py-3 font-medium">Kalinan Sure</th>
                <th className="px-4 py-3 font-medium">Durum</th>
                <th className="px-4 py-3 font-medium">Son Guncelleme</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r) => (
                <tr key={r.assignmentId} className="border-b border-slate-700/50 hover:bg-slate-750">
                  <td className="px-4 py-3 text-white">
                    {r.userName}
                    <div className="text-xs text-slate-500">{r.userEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{r.videoTitle}</td>
                  <td className="px-4 py-3 text-slate-300">%{Math.round(r.watchedPercentage)}</td>
                  <td className="px-4 py-3 text-slate-300">{formatTime(r.lastWatchedSecond)}</td>
                  <td className="px-4 py-3">
                    {r.isCompleted ? (
                      <span className="bg-green-900/40 text-green-400 text-xs font-medium px-2.5 py-1 rounded-full">
                        ✓ Tamamlandi
                      </span>
                    ) : (
                      <span className="bg-yellow-900/40 text-yellow-400 text-xs font-medium px-2.5 py-1 rounded-full">
                        Devam ediyor
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {r.updatedAt ? new Date(r.updatedAt).toLocaleString("tr-TR") : "-"}
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    Kayit bulunamadi.
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

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <p className="text-slate-400 text-xs">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  );
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
