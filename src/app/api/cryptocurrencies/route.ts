import { getCryptocurrencies } from '@/lib/data';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cryptocurrencies = await getCryptocurrencies();
    return NextResponse.json(cryptocurrencies);
  } catch (error) {
    console.error('Error fetching cryptocurrencies:', error);
    return NextResponse.json({ error: 'Failed to fetch cryptocurrencies' }, { status: 500 });
  }
}
