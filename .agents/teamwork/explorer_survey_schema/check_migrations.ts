import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const migrations: any[] = await prisma.$queryRaw`SELECT * FROM "_prisma_migrations" ORDER BY "finished_at" ASC`;
    console.log("=== PRISMA MIGRATIONS ===");
    console.log(migrations);
  } catch (err: any) {
    console.log("No _prisma_migrations table or error:", err.message);
  }

  const tables: any[] = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;
  console.log("\n=== PUBLIC TABLES IN DB ===");
  console.log(tables.map((t) => t.table_name));
}

main().finally(() => prisma.$disconnect());
