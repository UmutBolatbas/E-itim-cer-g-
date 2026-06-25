import { Router } from "express";
import { z } from "zod";
import prisma from "../prismaClient";
import { authMiddleware, adminOnly } from "../middleware/auth";

const router = Router();

// Bu router'daki TUM route'lar once login, sonra admin kontrolunden gecer
router.use(authMiddleware);
router.use(adminOnly);

/* ---------------------------------------------------------- */
/*  VIDEO YONETIMI                                             */
/* ---------------------------------------------------------- */

const videoSchema = z.object({
  title: z.string().min(2),
  youtubeVideoId: z.string().min(5), // orn: "dQw4w9WgXcQ"
  description: z.string().optional(),
});

// GET /api/admin/videos - tum videolari listele
router.get("/videos", async (_req, res) => {
  const videos = await prisma.video.findMany({ orderBy: { createdAt: "desc" } });
  res.json(videos);
});

// POST /api/admin/videos - yeni egitim videosu ekle (placeholder icerik girilebilir)
router.post("/videos", async (req, res) => {
  const parsed = videoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.errors[0].message });
  }
  const video = await prisma.video.create({ data: parsed.data });
  res.status(201).json(video);
});

// DELETE /api/admin/videos/:id
router.delete("/videos/:id", async (req, res) => {
  await prisma.video.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

/* ---------------------------------------------------------- */
/*  KULLANICI LISTESI                                          */
/* ---------------------------------------------------------- */

// GET /api/admin/users - tum standart kullanicilari listele
router.get("/users", async (_req, res) => {
  const users = await prisma.user.findMany({
    where: { role: "USER" },
    select: { id: true, name: true, email: true, createdAt: true },
    orderBy: { name: "asc" },
  });
  res.json(users);
});

/* ---------------------------------------------------------- */
/*  EGITIM ATAMA                                                */
/* ---------------------------------------------------------- */

const assignSchema = z.object({
  userId: z.string().uuid(),
  videoId: z.string().uuid(),
});

// POST /api/admin/assignments - bir videoyu bir kullaniciya ata
router.post("/assignments", async (req, res) => {
  const parsed = assignSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "userId ve videoId gereklidir." });
  }
  try {
    const assignment = await prisma.assignment.create({ data: parsed.data });
    res.status(201).json(assignment);
  } catch (err) {
    res.status(409).json({ message: "Bu egitim zaten bu kullaniciya atanmis." });
  }
});

// DELETE /api/admin/assignments/:id - atamayi kaldir
router.delete("/assignments/:id", async (req, res) => {
  await prisma.assignment.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

/* ---------------------------------------------------------- */
/*  RAPORLAMA / DASHBOARD                                       */
/* ---------------------------------------------------------- */

/**
 * GET /api/admin/reports
 * Her kullanicinin atanmis oldugu her video icin izleme durumunu doner.
 * Admin dashboard'unda buyuk bir tabloda gosterilecek:
 * Kullanici | Video | % Izlenme | Tamamlandi mi | Son Guncelleme
 */
router.get("/reports", async (_req, res) => {
  const assignments = await prisma.assignment.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      video: { select: { id: true, title: true, durationSeconds: true } },
    },
    orderBy: [{ user: { name: "asc" } }],
  });

  // Her atama icin ilgili progress kaydini ayrica cekiyoruz
  const rows = await Promise.all(
    assignments.map(async (a: typeof assignments[number]) => {
      const progress = await prisma.progress.findUnique({
        where: { userId_videoId: { userId: a.userId, videoId: a.videoId } },
      });
      return {
        assignmentId: a.id,
        userId: a.user.id,
        userName: a.user.name,
        userEmail: a.user.email,
        videoId: a.video.id,
        videoTitle: a.video.title,
        durationSeconds: a.video.durationSeconds,
        lastWatchedSecond: progress?.lastWatchedSecond ?? 0,
        watchedPercentage: progress?.watchedPercentage ?? 0,
        isCompleted: progress?.isCompleted ?? false,
        updatedAt: progress?.updatedAt ?? null,
      };
    })
  );

  res.json(rows);
});

/**
 * GET /api/admin/reports/summary
 * Dashboard'un ust kismindaki ozet kartlari icin
 * (toplam kullanici, toplam video, ortalama tamamlanma vb.)
 */
router.get("/reports/summary", async (_req, res) => {
  const totalUsers = await prisma.user.count({ where: { role: "USER" } });
  const totalVideos = await prisma.video.count();
  const totalAssignments = await prisma.assignment.count();
  const completedCount = await prisma.progress.count({ where: { isCompleted: true } });

  res.json({
    totalUsers,
    totalVideos,
    totalAssignments,
    completedCount,
    completionRate:
      totalAssignments > 0 ? Math.round((completedCount / totalAssignments) * 100) : 0,
  });
});

export default router;
