import { NextResponse, type NextRequest } from 'next/server';
import { getPublicSubmissions, getCategoryById, getCryptocurrencyById } from '@/lib/data';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || '';
  const categoryId = searchParams.get('categoryId') || undefined;
  const cryptocurrencyId = searchParams.get('cryptocurrencyId') || undefined;

  try {
    const submissionsData = await getPublicSubmissions({
      searchTerm: query,
      categoryId,
      cryptocurrencyId,
      limit: 100 // Limit search results
    });

    const enhancedSubmissions = await Promise.all(submissionsData.map(async (s) => {
      const category = await getCategoryById(s.categoryId);
      const crypto = await getCryptocurrencyById(s.cryptocurrencyId);
      return {
        ...s,
        categoryName: category?.name || 'Unknown',
        categoryIcon: category?.icon || 'HelpCircle',
        cryptocurrencyName: crypto?.name || 'Unknown',
        cryptocurrencySymbol: crypto?.symbol || 'UNK',
        cryptocurrencyIcon: crypto?.icon || 'Coins'
      };
    }));

    return NextResponse.json(enhancedSubmissions, { status: 200 });
  } catch (error) {
    console.error("Error fetching search results for API:", error);
    return NextResponse.json({ message: "Failed to fetch search results." }, { status: 500 });
  }
}
