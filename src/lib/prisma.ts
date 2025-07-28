import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;

// Export for CommonJS compatibility
module.exports = prisma;
