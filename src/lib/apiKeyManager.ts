import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export enum ApiKeyTier {
  UNLIMITED = 'UNLIMITED',
  LIMITED = 'LIMITED',
}

export const generateApiKey = async (owner: string, tier: ApiKeyTier) => {
  const plainTextKey = crypto.randomBytes(32).toString('hex');
  const hashedKey = crypto.createHash('sha256').update(plainTextKey).digest('hex');

  const record = await prisma.apiKey.create({
    data: {
      key: hashedKey,
      owner: owner,
      tier: tier,
    },
  });

  return { plainTextKey, record };
};

export const getAllApiKeys = async () => {
  return await prisma.apiKey.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
};

export const revokeApiKey = async (id: string) => {
  return await prisma.apiKey.delete({
    where: { id },
  });
};
