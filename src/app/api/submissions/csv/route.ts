
import { NextResponse } from 'next/server';
import { getAllSubmissions, getCategoryNameById, getCryptocurrencySymbolById } from '@/lib/data'; // Direct data access for simplicity
import type { Submission } from '@/lib/types';

function escapeCsvCell(cellData: any): string {
  const stringData = String(cellData === null || cellData === undefined ? '' : cellData);
  if (stringData.includes(',') || stringData.includes('"') || stringData.includes('\n')) {
    return `"${stringData.replace(/"/g, '""')}"`;
  }
  return stringData;
}

export async function GET() {
  // IMPORTANT: In a real application, add authentication here to protect this endpoint.
  // For example, check for an admin session or API key.
  // const session = await getServerSession(authOptions); // Example with NextAuth
  // if (!session || !session.user.isAdmin) {
  //   return new NextResponse("Unauthorized", { status: 401 });
  // }

  try {
    const submissions = await getAllSubmissions(); // Fetch all submissions

    if (!submissions || submissions.length === 0) {
      return new NextResponse("No data available to export.", { status: 404 });
    }

    const headers = [
      "ID", "Wallet Address", "Category", "Cryptocurrency", 
      "Reason", "Website URL", "Reported Owner", "Status", "Admin Notes", "Created At", "Updated At", "Submitter IP"
    ];
    
    const csvRows = submissions.map(s => [
      escapeCsvCell(s.id),
      escapeCsvCell(s.walletAddress),
      escapeCsvCell(getCategoryNameById(s.categoryId)),
      escapeCsvCell(getCryptocurrencySymbolById(s.cryptocurrencyId)),
      escapeCsvCell(s.reason),
      escapeCsvCell(s.websiteUrl),
      escapeCsvCell(s.reportedOwner),
      escapeCsvCell(s.status),
      escapeCsvCell(s.adminNotes),
      escapeCsvCell(s.createdAt.toISOString()),
      escapeCsvCell(s.updatedAt.toISOString()),
      escapeCsvCell(s.submitterIp)
    ].join(','));

    const csvString = [headers.join(','), ...csvRows].join('\n');

    return new NextResponse(csvString, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="wallet_watch_submissions_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error) {
    console.error("Error generating CSV:", error);
    return new NextResponse("Failed to generate CSV file.", { status: 500 });
  }
}
