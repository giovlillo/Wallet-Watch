import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  const submissions = await prisma.submission.findMany({
    include: {
      category: true,
      cryptocurrency: true,
    },
  });

  const reports = submissions.map((submission) => ({
    id: submission.id,
    walletAddress: submission.walletAddress,
    websiteUrl: submission.websiteUrl,
    reportedOwner: submission.reportedOwner,
    createdAt: submission.createdAt,
    category: {
      name: submission.category.name,
    },
    cryptocurrency: {
      name: submission.cryptocurrency.name,
      symbol: submission.cryptocurrency.symbol,
    },
  }));

  return NextResponse.json(reports);
}
