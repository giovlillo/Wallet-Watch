import { PrismaClient } from '@prisma/client';
import type { Category, Cryptocurrency, Submission, SubmissionStatus } from './types';

const prisma = new PrismaClient();

// --- Category Functions ---
export const getCategories = async (): Promise<Category[]> => {
  return prisma.category.findMany();
};

export const getCategoryById = async (id: string): Promise<Category | null> => {
  return prisma.category.findUnique({ where: { id } });
};

export const createCategory = async (data: Omit<Category, 'id'>): Promise<Category> => {
  return prisma.category.create({ data });
};

export const updateCategory = async (id: string, data: Partial<Omit<Category, 'id'>>): Promise<Category | null> => {
  return prisma.category.update({ where: { id }, data });
};

export const deleteCategory = async (id: string): Promise<boolean> => {
  try {
    await prisma.category.delete({ where: { id } });
    return true;
  } catch (error) {
    return false;
  }
};

// --- Cryptocurrency Functions ---
export const getCryptocurrencies = async (): Promise<Cryptocurrency[]> => {
  return prisma.cryptocurrency.findMany();
};

export const getCryptocurrencyById = async (id: string): Promise<Cryptocurrency | null> => {
  return prisma.cryptocurrency.findUnique({ where: { id } });
};

export const createCryptocurrency = async (data: Omit<Cryptocurrency, 'id'>): Promise<Cryptocurrency> => {
  return prisma.cryptocurrency.create({ data });
};

export const updateCryptocurrency = async (id: string, data: Partial<Omit<Cryptocurrency, 'id'>>): Promise<Cryptocurrency | null> => {
  return prisma.cryptocurrency.update({ where: { id }, data });
};

export const deleteCryptocurrency = async (id: string): Promise<boolean> => {
  try {
    await prisma.cryptocurrency.delete({ where: { id } });
    return true;
  } catch (error) {
    return false;
  }
};

// --- Submission Functions ---
export const getSubmissions = async (params?: {
  limit?: number;
  offset?: number;
  status?: SubmissionStatus;
  categoryId?: string;
  cryptocurrencyId?: string;
  searchTerm?: string;
}): Promise<Submission[]> => {
  const { limit = 10, offset = 0, ...filters } = params || {};

  const where: any = {};
  
  if (filters.status) where.status = filters.status;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.cryptocurrencyId) where.cryptocurrencyId = filters.cryptocurrencyId;
  
  if (filters.searchTerm) {
    where.OR = [
      { walletAddress: { contains: filters.searchTerm } },
      { reason: { contains: filters.searchTerm } },
      { websiteUrl: { contains: filters.searchTerm } },
      { reportedOwner: { contains: filters.searchTerm } }
    ];
  }

  return prisma.submission.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: offset,
    take: limit,
    include: {
      category: true,
      cryptocurrency: true
    }
  });
};

export const getSubmissionsCount = async (params?: {
  status?: SubmissionStatus;
}): Promise<number> => {
  const where: any = {};
  if (params?.status) {
    where.status = params.status;
  }
  return prisma.submission.count({ where });
};

export const getPublicSubmissions = async (params?: {
  limit?: number;
  categoryId?: string;
  cryptocurrencyId?: string;
  searchTerm?: string;
}): Promise<Submission[]> => {
  return getSubmissions({ ...params, status: 'approved' });
};

export const getAllSubmissions = async (params?: {
  limit?: number;
  offset?: number;
  categoryId?: string;
  cryptocurrencyId?: string;
  searchTerm?: string;
}): Promise<Submission[]> => {
  return getSubmissions(params);
};

export const getSubmissionById = async (id: string): Promise<Submission | null> => {
  return prisma.submission.findUnique({ 
    where: { id },
    include: {
      category: true,
      cryptocurrency: true
    }
  });
};

export const createSubmission = async (data: Omit<Submission, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Submission> => {
  return prisma.submission.create({
    data: {
      ...data,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      websiteUrl: data.websiteUrl || undefined,
      reportedOwner: data.reportedOwner || undefined,
    }
  });
};

export const updateSubmission = async (id: string, data: Partial<Omit<Submission, 'id' | 'createdAt'>>): Promise<Submission | null> => {
  return prisma.submission.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
      websiteUrl: data.websiteUrl || undefined,
      reportedOwner: data.reportedOwner || undefined,
    }
  });
};

export const deleteSubmission = async (id: string): Promise<boolean> => {
  try {
    await prisma.submission.delete({ where: { id } });
    return true;
  } catch (error) {
    return false;
  }
};

export const getCategoryNameById = async (id: string): Promise<string> => {
  const category = await getCategoryById(id);
  return category ? category.name : 'Unknown Category';
};

export const getCryptocurrencySymbolById = async (id: string): Promise<string> => {
  const crypto = await getCryptocurrencyById(id);
  return crypto ? crypto.symbol : 'UNK';
};
