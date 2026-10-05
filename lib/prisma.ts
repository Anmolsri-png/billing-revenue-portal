import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { assertSafeDatabaseTarget } from "./database-guard"

assertSafeDatabaseTarget(process.env.DATABASE_URL)

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const adapter = new PrismaPg(pool)

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["error"],
  })

if (process.env.NODE_ENV !== "production")
  globalForPrisma.prisma = prisma