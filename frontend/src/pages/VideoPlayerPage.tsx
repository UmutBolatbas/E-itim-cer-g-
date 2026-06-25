import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import YouTube, { YouTubeProps, YouTubePlayer } from "react-youtube";
import api from "../api/client";
import { VideoWithProgress } from "../types";

// Her kac saniyede bir backend'e progress gonderilecek
const SAVE_INTERVAL_MS = 7000;

export default function VideoPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [video, setVideo] = useState<VideoWithProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState<string>("");

  const playerRef = useRef<YouTubePlayer | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  // En son gonderilen saniyeyi tutuyoruz; ayni saniyeyi tekrar tekrar
  // gondermemek icin (video durduysa gereksiz istek atmayalim)
  const lastSentSecondRef = useRef<number>(-1);

  // Video + mevcut progress bilgisini cek (resume icin lastWatchedSecond gerekli)
  useEffect(() => {
    if (!id) return;
    api
      .get<VideoWithProgress>(`/videos/${id}`)
      .then((res) => setVideo(res.data))
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  /**
   * Backend'e o anki izleme durumunu gonderir.
   * Sunucu currentTime/duration oranina gore watchedPercentage ve
   * isCompleted (%90 esigi) degerini KENDISI hesaplar - bu mantik
   * guvenlik nedeniyle frontend'de degil backend'de (progress.ts) yer alir.
   */
  const sendProgress = useCallback(
    async (currentTime: number, duration: number) => {
      if (!id || duration <= 0) return;
      // Cok kucuk degisiklikleri (1 saniyeden az) gondermeyelim
      if (Math.abs(currentTime - lastSentSecondRef.current) < 1) return;

      lastSentSecondRef.current = currentTime;

      try {
        const res = await api.patch("/progress", {
          videoId: id,
          currentTime,
          duration,
        });
        // Lokal state'i de guncelleyelim (ilerleme cubugu, "Tamamlandi" rozeti icin)
        setVideo((prev) =>
          prev
            ? {
                ...prev,
                lastWatchedSecond: res.data.lastWatchedSecond,
                watchedPercentage: res.data.watchedPercentage,
                isCompleted: res.data.isCompleted,
              }
            : prev
        );
        if (res.data.isCompleted) {
          setStatusText("✓ Bu egitim tamamlandi olarak isaretlendi.");
        }
      } catch (err) {
        console.error("Progress kaydedilemedi:", err);
      }
    },
    [id]
  );

  // Player hazir oldugunda: resume (kaldigi saniyeden baslat) + periyodik kayit baslat
  const handlePlayerReady: YouTubeProps["onReady"] = (event) => {
    playerRef.current = event.target;

    if (video && video.lastWatchedSecond > 5) {
      // Videonun sonuna cok yakinsa bastan baslat, degilse kaldigi yerden devam et
      event.target.seekTo(video.lastWatchedSecond, true);
      setStatusText(`Kaldiginiz yerden devam ediliyor (${formatTime(video.lastWatchedSecond)})`);
    }
  };

  // Oynatma durumu degistiginde (PLAYING / PAUSED / ENDED) periyodik kaydi yonet
  const handleStateChange: YouTubeProps["onStateChange"] = (event) => {
    const playerState = event.data;
    // YT.PlayerState: PLAYING = 1, PAUSED = 2, ENDED = 0

    if (playerState === 1) {
      // PLAYING basladi -> periyodik kayit interval'ini baslat
      if (saveTimerRef.current) window.clearInterval(saveTimerRef.current);
      saveTimerRef.current = window.setInterval(() => {
        const player = playerRef.current;
        if (!player) return;
        const currentTime = player.getCurrentTime();
        const duration = player.getDuration();
        sendProgress(currentTime, duration);
      }, SAVE_INTERVAL_MS);
    } else {
      // PAUSED veya ENDED -> interval'i durdur, son saniyeyi hemen kaydet
      if (saveTimerRef.current) {
        window.clearInterval(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      const player = playerRef.current;
      if (player) {
        sendProgress(player.getCurrentTime(), player.getDuration());
      }
    }
  };

  // Sayfa kapatilirken / sekme degistirilirken son saniyeyi kaybetmemek icin kayit
  useEffect(() => {
    function handleBeforeUnload() {
      const player = playerRef.current;
      if (player) {
        // NOT: sayfa kapanirken async istek garanti tamamlanmaz,
        // ama tarayici genelde kisa sureli fetch'leri tamamlamaya calisir.
        sendProgress(player.getCurrentTime(), player.getDuration());
      }
    }
    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        handleBeforeUnload();
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (saveTimerRef.current) window.clearInterval(saveTimerRef.current);
    };
  }, [sendProgress]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Yukleniyor...</div>;
  }

  if (!video) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Video bulunamadi.</div>;
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      <button onClick={() => navigate("/")} className="text-slate-400 hover:text-white text-sm mb-4">
        ← Egitimlerime don
      </button>

      <h1 className="text-xl font-bold text-white mb-1">{video.title}</h1>
      {video.description && <p className="text-slate-400 text-sm mb-4">{video.description}</p>}

      <div className="aspect-video rounded-lg overflow-hidden bg-black mb-4">
        <YouTube
          videoId={video.youtubeVideoId}
          opts={{
            width: "100%",
            height: "100%",
            playerVars: {
              // rel:0, modestbranding gibi parametreler izleme deneyimini sadelestirir
              rel: 0,
              modestbranding: 1,
            },
          }}
          onReady={handlePlayerReady}
          onStateChange={handleStateChange}
          className="w-full h-full"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex-1 mr-4">
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                video.isCompleted ? "bg-green-500" : "bg-blue-500"
              }`}
              style={{ width: `${Math.min(100, video.watchedPercentage)}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">%{Math.round(video.watchedPercentage)} izlendi</p>
        </div>

        {video.isCompleted && (
          <span className="bg-green-900/40 text-green-400 text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap">
            ✓ Tamamlandi
          </span>
        )}
      </div>

      {statusText && <p className="text-sm text-blue-400 mt-3">{statusText}</p>}
    </div>
  );
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
