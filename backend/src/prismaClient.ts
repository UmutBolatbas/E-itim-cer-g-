import { PrismaClient } from "@prisma/client";

// Gelistirme ortaminda hot-reload sirasinda birden fazla
// PrismaClient instance'i acilmasini onlemek icin singleton pattern kullaniyoruz.
const prisma = new PrismaClient();

export default prisma;
