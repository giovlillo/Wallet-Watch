import { NextResponse, type NextRequest } from 'next/server';
import { getPublicSubmissions, getCategoryNameById, getCryptocurrencySymbolById, getCategoryById, getCryptocurrencyById } from '@/lib/data'; // Direct data access for simplicity

export async function GET(request: NextRequest) {
  // Public API: typically returns only 'approved' submissions.
  // Query parameters for filtering can be added here (e.g., limit, offset, category, crypto)
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string, 10) : 100;
  const categoryId = searchParams.get('categoryId') || undefined;
  const cryptocurrencyId = searchParams.get('cryptocurrencyId') || undefined;
  const searchTerm = searchParams.get('searchTerm') || undefined;
  
  try {
    const submissionsData = await getPublicSubmissions({
      limit: Math.min(limit, 500), // Max limit to prevent abuse
      categoryId,
      cryptocurrencyId,
      searchTerm
    });

    // Enhance submissions with category/crypto names for easier API consumption
    const enhancedSubmissions = submissionsData.map(s => {
      const category = getCategoryById(s.categoryId);
      const crypto = getCryptocurrencyById(s.cryptocurrencyId);
      return {
        ...s,
        categoryName: category?.name || 'Unknown',
        categoryIcon: category?.icon || 'HelpCircle',
        cryptocurrencyName: crypto?.name || 'Unknown',
        cryptocurrencySymbol: crypto?.symbol || 'UNK',
        cryptocurrencyIcon: crypto?.icon || 'Coins'
      };
    });

    return NextResponse.json(enhancedSubmissions, { status: 200 });
  } catch (error) {
    console.error("Error fetching public submissions for API:", error);
    return NextResponse.json({ message: "Failed to fetch submissions." }, { status: 500 });
  }
}
