import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthPayload {
  userId: string;
  role: "USER" | "ADMIN";
}

// Express Request tipini genisletiyoruz, böylece req.user kullanabiliriz
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "degistirilmesi-gereken-anahtar";

/**
 * Gelen istekte Authorization: Bearer <token> header'ini dogrular.
 * Gecerliyse req.user'a payload'i ekler ve devam eder.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Yetkilendirme tokeni bulunamadi." });
  }

  const token = header.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token gecersiz veya suresi dolmus." });
  }
}

/**
 * authMiddleware'den SONRA kullanilmali.
 * Sadece ADMIN rolundeki kullanicilarin erismesine izin verir.
 */
export function adminOnly(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ message: "Bu islem icin admin yetkisi gereklidir." });
  }
  next();
}

export function signToken(payload: AuthPayload): string {
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}
