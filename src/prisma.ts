import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
// instances가 이미 있으면  globalForPrisma.prisma(전역 인스턴스)를 사용하고 없으면 새로운 인스턴스를 생성
  globalForPrisma.prisma || new PrismaClient()
// production 환경이 아닐때만 (development | test) globalForPrisma.prisma를 사용 (전역 인스턴스) 하도록 설정
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma


