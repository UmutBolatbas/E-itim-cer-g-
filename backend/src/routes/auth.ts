import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../prismaClient";
import { signToken } from "../middleware/auth";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2, "Isim en az 2 karakter olmalidir."),
  email: z.string().email("Gecerli bir e-posta adresi giriniz."),
  password: z.string().min(6, "Sifre en az 6 karakter olmalidir."),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * POST /api/auth/register
 * Yeni kullanici kaydi olusturur. Varsayilan rol USER'dir.
 * Admin hesaplari guvenlik nedeniyle bu endpoint'ten degil,
 * seed script veya mevcut bir admin tarafindan veritabaninda olusturulur.
 */
router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.errors[0].message });
  }
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ message: "Bu e-posta adresi zaten kayitli." });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: "USER" },
  });

  const token = signToken({ userId: user.id, role: user.role });

  return res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

/**
 * POST /api/auth/login
 * E-posta + sifre ile giris yapar, JWT doner.
 */
router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "E-posta ve sifre gereklidir." });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: "E-posta veya sifre hatali." });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ message: "E-posta veya sifre hatali." });
  }

  const token = signToken({ userId: user.id, role: user.role });

  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

export default router;
