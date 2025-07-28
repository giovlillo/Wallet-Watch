import { NextResponse, type NextRequest } from 'next/server';
import { generateApiKey, ApiKeyTier, getAllApiKeys, revokeApiKey } from '@/lib/apiKeyManager';

export async function GET() {
  try {
    const keys = await getAllApiKeys();
    return NextResponse.json(keys);
  } catch (error) {
    console.error('Failed to fetch API keys:', error);
    return new NextResponse(JSON.stringify({ message: 'Failed to fetch API keys' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(request: Request) {
  try {
    const { owner, tier } = await request.json();

    if (!owner || !tier) {
      return new NextResponse(JSON.stringify({ message: 'Missing owner or tier' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { plainTextKey, record } = await generateApiKey(owner, tier as ApiKeyTier);

    return NextResponse.json({ plainTextKey, record });
  } catch (error) {
    console.error('Failed to generate API key:', error);
    return new NextResponse(JSON.stringify({ message: 'Failed to generate API key' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return new NextResponse(JSON.stringify({ message: 'Missing API key ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await revokeApiKey(id);

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error('Failed to revoke API key:', error);
    return new NextResponse(JSON.stringify({ message: 'Failed to revoke API key' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
