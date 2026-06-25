import { Router } from "express";
import prisma from "../prismaClient";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

/**
 * GET /api/videos/my
 * Giris yapan kullaniciya atanmis tum videolari, varsa mevcut
 * progress bilgisiyle (lastWatchedSecond, isCompleted) birlikte doner.
 * Frontend bu listeyi kullanip her video icin "Devam Et" / "Tamamlandi" gosterir.
 */
router.get("/my", async (req, res) => {
  const userId = req.user!.userId;

  const assignments = await prisma.assignment.findMany({
    where: { userId },
    include: {
      video: {
        include: {
          progress: {
            where: { userId }, // sadece bu kullanicinin progress kaydi
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const result = assignments.map((a: typeof assignments[number]) => {
    const progress = a.video.progress[0]; // unique(userId, videoId) oldugu icin tek kayit
    return {
      id: a.video.id,
      title: a.video.title,
      description: a.video.description,
      youtubeVideoId: a.video.youtubeVideoId,
      durationSeconds: a.video.durationSeconds,
      lastWatchedSecond: progress?.lastWatchedSecond ?? 0,
      watchedPercentage: progress?.watchedPercentage ?? 0,
      isCompleted: progress?.isCompleted ?? false,
    };
  });

  res.json(result);
});

/**
 * GET /api/videos/:id
 * Tek bir videonun detayini + kullanicinin progress'ini doner.
 * Video oynatma sayfasi acilirken kullanilir (resume icin lastWatchedSecond).
 */
router.get("/:id", async (req, res) => {
  const userId = req.user!.userId;
  const videoId = req.params.id;

  // Kullaniciya bu video atanmis mi kontrolu (yetkisiz erisimi engelle)
  const assignment = await prisma.assignment.findUnique({
    where: { userId_videoId: { userId, videoId } },
  });
  if (!assignment) {
    return res.status(403).json({ message: "Bu videoya erisim yetkiniz yok." });
  }

  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) {
    return res.status(404).json({ message: "Video bulunamadi." });
  }

  const progress = await prisma.progress.findUnique({
    where: { userId_videoId: { userId, videoId } },
  });

  res.json({
    id: video.id,
    title: video.title,
    description: video.description,
    youtubeVideoId: video.youtubeVideoId,
    durationSeconds: video.durationSeconds,
    lastWatchedSecond: progress?.lastWatchedSecond ?? 0,
    watchedPercentage: progress?.watchedPercentage ?? 0,
    isCompleted: progress?.isCompleted ?? false,
  });
});

export default router;
