import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth";
import videoRoutes from "./routes/videos";
import progressRoutes from "./routes/progress";
import adminRoutes from "./routes/admin";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Saglik kontrolu
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Ambulans Egitim API calisiyor." });
});

app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/admin", adminRoutes);

// Genel hata yakalayici
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "Sunucu hatasi olustu." });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Ambulans Egitim API ${PORT} portunda calisiyor.`);
});
