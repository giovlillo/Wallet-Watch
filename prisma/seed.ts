import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  // Create or Reset admin user with a static password
  const adminUsername = 'admin';
  const staticPassword = 'admin123';
  const hashedPassword = await bcrypt.hash(staticPassword, 12);

  await prisma.adminUser.upsert({
    where: { username: adminUsername },
    update: {
        password: hashedPassword,
    },
    create: {
      username: adminUsername,
      password: hashedPassword,
    },
  });

  console.log('============================================================');
  console.log(' ');
  console.log('Admin user password has been set.');
  console.log(`Username: ${adminUsername}`);
  console.log(`Password: ${staticPassword}`);
  console.log('Please change this password immediately after logging in.');
  console.log(' ');
  console.log('============================================================');

  // Creazione categorie
  const categoriesData = [
    { id: 'c1', name: 'Scam', description: 'Wallets involved in scams, phishing, or fraudulent activities.', icon: 'ShieldAlert' },
    { id: 'c2', name: 'Hacking', description: 'Wallets associated with hacking incidents and theft of funds.', icon: 'Sword' },
    { id: 'c3', name: 'Malware', description: 'Wallets linked to malware or ransomware campaigns.', icon: 'Bug' },
    { id: 'c4', name: 'Suspicious', description: 'Wallets exhibiting suspicious behavior without confirmed illicit activity.', icon: 'Eye' },
    { id: 'c5', name: 'Safe', description: 'Verified safe wallets, e.g., official exchange wallets.', icon: 'ShieldCheck' },
  ];

  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {},
      create: cat,
    });
  }
  
  // Creazione cryptocurrencies
  const cryptosData = [
    { id: 'crypto1', name: 'Bitcoin', symbol: 'BTC', icon: 'Bitcoin' },
    { id: 'crypto2', name: 'Ethereum', symbol: 'ETH', icon: 'Ethereum' },
    { id: 'crypto3', name: 'Tether', symbol: 'USDT', icon: 'DollarSign' },
    { id: 'crypto4', name: 'Solana', symbol: 'SOL', icon: 'Sun' },
    { id: 'crypto5', name: 'Binance Coin', symbol: 'BNB', icon: 'Box' },
  ];

  for (const crypto of cryptosData) {
    await prisma.cryptocurrency.upsert({
      where: { id: crypto.id },
      update: {},
      create: crypto,
    });
  }

  // System Settings
  const settings = [
    { key: 'loginMaxAttempts', value: '5' },
    { key: 'loginLockoutMinutes', value: '15' },
    { key: 'recaptchaEnabled', value: 'true' },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log('Database seeded successfully with categories, cryptocurrencies, and system settings.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
