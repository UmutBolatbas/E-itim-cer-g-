import { Router } from "express";
import { z } from "zod";
import prisma from "../prismaClient";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

// Tamamlama esigi - videonun %90'i izlenince "Tamamlandi" sayilir
const COMPLETION_THRESHOLD = 0.9;

const updateProgressSchema = z.object({
  videoId: z.string().uuid(),
  currentTime: z.number().min(0), // Player'in o anki saniyesi (player.getCurrentTime())
  duration: z.number().min(1), // Videonun toplam suresi (player.getDuration())
});

/**
 * PATCH /api/progress
 * Frontend tarafindan video oynatilirken periyodik olarak (orn. her 5-10 saniyede)
 * cagrilir. Sunucu, gonderilen currentTime/duration oranina gore
 * watchedPercentage ve isCompleted degerlerini KENDISI hesaplar.
 *
 * ONEMLI: isCompleted ve watchedPercentage asla frontend'den dogrudan
 * kabul edilmez; sadece currentTime/duration alip sunucu tarafinda
 * hesaplama yapilir. Bu sayede istemci tarafi manipulasyonla
 * "Tamamlandi" durumu sahte olarak isaretlenemez.
 */
router.patch("/", async (req, res) => {
  const parsed = updateProgressSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Gecersiz veri.", details: parsed.error.errors });
  }

  const userId = req.user!.userId;
  const { videoId, currentTime, duration } = parsed.data;

  // Kullaniciya bu video atanmis mi kontrolu
  const assignment = await prisma.assignment.findUnique({
    where: { userId_videoId: { userId, videoId } },
  });
  if (!assignment) {
    return res.status(403).json({ message: "Bu videoya erisim yetkiniz yok." });
  }

  // Sunucu tarafinda yuzde hesaplama (0-100 araliginda sinirlandirilir)
  const rawPercentage = (currentTime / duration) * 100;
  const watchedPercentage = Math.min(100, Math.max(0, rawPercentage));
  const isCompleted = currentTime / duration >= COMPLETION_THRESHOLD;

  // Video suresini ilk defa ogreniyorsak cache'leyelim (raporlama icin faydali)
  await prisma.video.updateMany({
    where: { id: videoId, durationSeconds: null },
    data: { durationSeconds: Math.round(duration) },
  });

  // upsert: kayit varsa guncelle, yoksa olustur
  // NOT: isCompleted bir kere true olduysa, kullanici videoyu geri sarsa bile
  // false'a dusurmuyoruz - "tamamlama" gecmiste basarilmis bir durumdur.
  const existing = await prisma.progress.findUnique({
    where: { userId_videoId: { userId, videoId } },
  });

  const finalIsCompleted = existing?.isCompleted || isCompleted;

  const progress = await prisma.progress.upsert({
    where: { userId_videoId: { userId, videoId } },
    update: {
      lastWatchedSecond: currentTime,
      watchedPercentage,
      isCompleted: finalIsCompleted,
    },
    create: {
      userId,
      videoId,
      lastWatchedSecond: currentTime,
      watchedPercentage,
      isCompleted: finalIsCompleted,
    },
  });

  res.json({
    lastWatchedSecond: progress.lastWatchedSecond,
    watchedPercentage: progress.watchedPercentage,
    isCompleted: progress.isCompleted,
  });
});

export default router;
