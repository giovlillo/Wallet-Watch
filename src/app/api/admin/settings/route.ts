import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.systemSetting.findMany();
    
    // Converti l'array di impostazioni in un oggetto
    const settingsObject = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);
    
    return NextResponse.json(settingsObject);
  } catch (error) {
    console.error('Error loading settings:', error);
    return NextResponse.json({ 
      error: 'Failed to load settings'
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { settings } = body;
    
    // Debug: log dei settings ricevuti
    console.log('Received settings:', settings);
    
    try {
      // Verifica la connessione al database
      await prisma.$queryRaw`SELECT 1`;
      console.log('Database connection successful');
      
      // Salva le impostazioni nel database
      for (const [key, value] of Object.entries(settings)) {
        console.log(`Saving setting: ${key} = ${value}`);
        const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        const result = await prisma.systemSetting.upsert({
          where: { key },
          update: { value: stringValue },
          create: { key, value: stringValue }
        });
        console.log(`Setting saved:`, result);
      }
    } catch (dbError) {
      let errorMessage = 'Database operation failed: ';
      if (dbError instanceof Error) {
        errorMessage += dbError.message;
      } else {
        errorMessage += 'Unknown error';
      }
      console.error('Database error:', errorMessage);
      console.error('Full error object:', dbError);
      throw new Error(errorMessage);
    }

    return NextResponse.json({ success: true, message: 'Settings saved successfully' });
  } catch (error) {
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error('Error saving settings:', errorMessage);
    return NextResponse.json({ 
      error: 'Failed to save settings', 
      details: errorMessage
    }, { status: 500 });
  }
}
