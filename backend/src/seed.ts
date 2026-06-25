import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import prisma from "./prismaClient";

dotenv.config();

/**
 * Bu script ilk admin hesabini ve birkac placeholder egitim videosu olusturur.
 * Calistirmak icin: npm run seed
 */
async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";
  const adminName = process.env.ADMIN_NAME || "Sistem Yoneticisi";

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: { name: adminName, email: adminEmail, passwordHash, role: "ADMIN" },
    });
    console.log(`Admin hesabi olusturuldu: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log("Admin hesabi zaten mevcut, atlaniyor.");
  }

  // Placeholder egitim videolari (gercek YouTube ID'leri ile sonra degistirilecek)
  const placeholderVideos = [
    {
      title: "Temel Yasam Destegi (CPR) - Giris",
      youtubeVideoId: "dQw4w9WgXcQ", // TODO: gercek egitim videosu ID'si ile degistirilecek
      description: "Temel yasam destegi adimlarinin genel tanitimi (placeholder icerik).",
    },
    {
      title: "Travma Hastasina Yaklasim",
      youtubeVideoId: "dQw4w9WgXcQ", // TODO: gercek egitim videosu ID'si ile degistirilecek
      description: "Trafik kazasi ve travma vakalarinda ilk degerlendirme (placeholder icerik).",
    },
    {
      title: "Ambulans Ekipmanlarinin Kullanimi",
      youtubeVideoId: "dQw4w9WgXcQ", // TODO: gercek egitim videosu ID'si ile degistirilecek
      description: "Ambulans ici temel ekipmanlarin tanitimi (placeholder icerik).",
    },
  ];

  for (const v of placeholderVideos) {
    const exists = await prisma.video.findFirst({ where: { title: v.title } });
    if (!exists) {
      await prisma.video.create({ data: v });
      console.log(`Video eklendi: ${v.title}`);
    }
  }

  console.log("Seed islemi tamamlandi.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
