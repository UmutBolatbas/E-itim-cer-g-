import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { VideoWithProgress } from "../types";

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const [videos, setVideos] = useState<VideoWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<VideoWithProgress[]>("/videos/my")
      .then((res) => setVideos(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Egitimlerim</h1>
          <p className="text-slate-400 text-sm">Hosgeldin, {user?.name}</p>
        </div>
        <button
          onClick={logout}
          className="text-sm text-slate-400 hover:text-white border border-slate-700 rounded-md px-3 py-1.5"
        >
          Cikis Yap
        </button>
      </header>

      {loading && <p className="text-slate-400">Yukleniyor...</p>}

      {!loading && videos.length === 0 && (
        <div className="bg-slate-800 rounded-lg p-6 text-center text-slate-400">
          Size henuz atanmis bir egitim videosu bulunmuyor.
        </div>
      )}

      <div className="space-y-3">
        {videos.map((v) => (
          <Link
            key={v.id}
            to={`/video/${v.id}`}
            className="block bg-slate-800 hover:bg-slate-750 rounded-lg p-4 transition border border-slate-700"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <h2 className="font-semibold text-white">{v.title}</h2>
                {v.description && (
                  <p className="text-sm text-slate-400 mt-0.5 line-clamp-1">{v.description}</p>
                )}

                {/* Ilerleme cubugu */}
                <div className="mt-2 w-full bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      v.isCompleted ? "bg-green-500" : "bg-blue-500"
                    }`}
                    style={{ width: `${Math.min(100, v.watchedPercentage)}%` }}
                  />
                </div>
              </div>

              <div className="shrink-0 text-right">
                {v.isCompleted ? (
                  <span className="inline-block bg-green-900/40 text-green-400 text-xs font-medium px-2.5 py-1 rounded-full">
                    ✓ Tamamlandi
                  </span>
                ) : v.watchedPercentage > 0 ? (
                  <span className="inline-block bg-blue-900/40 text-blue-400 text-xs font-medium px-2.5 py-1 rounded-full">
                    %{Math.round(v.watchedPercentage)} izlendi
                  </span>
                ) : (
                  <span className="inline-block bg-slate-700 text-slate-300 text-xs font-medium px-2.5 py-1 rounded-full">
                    Baslanmadi
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
