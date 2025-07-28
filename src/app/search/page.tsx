"use client";

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RecentSubmissionsTable from '@/components/RecentSubmissionsTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import SearchForm from './SearchForm';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import type { Category, Cryptocurrency, Submission } from '@/lib/types';

export default function SearchPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <Suspense fallback={<div>Loading...</div>}>
          <SearchPageContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('query') || '';
  const categoryId = searchParams.get('category') || '';
  const cryptoId = searchParams.get('crypto') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const isSearching = !!(query || categoryId || cryptoId);

  const [categories, setCategories] = useState<Category[]>([]);
  const [cryptocurrencies, setCryptocurrencies] = useState<Cryptocurrency[]>([]);
  const [submissionsToShow, setSubmissionsToShow] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(page);
  const ITEMS_PER_PAGE = 15;

  useEffect(() => {
    setCurrentPage(page);
  }, [page]);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch categories and cryptocurrencies with timeout
        const [cats, cryptos] = await Promise.all([
          fetchWithTimeout('/api/categories', { signal }, 5000),
          fetchWithTimeout('/api/cryptocurrencies', { signal }, 5000)
        ]);
        
        setCategories(cats);
        setCryptocurrencies(cryptos);
        
        // Fetch submissions with timeout
        const submissionsUrl = isSearching 
          ? `/api/submissions/search?query=${encodeURIComponent(query)}&categoryId=${encodeURIComponent(categoryId)}&cryptocurrencyId=${encodeURIComponent(cryptoId)}`
          : `/api/public/submissions?limit=100`;
        
        const subs = await fetchWithTimeout(submissionsUrl, { signal }, 10000);
        setSubmissionsToShow(subs);
      } catch (error: unknown) {
        if (error instanceof Error) {
          if (error.name !== 'AbortError') {
            console.error('Error fetching data:', error);
            // Gestione errori per l'utente
          }
        } else {
          console.error('Unknown error:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    return () => controller.abort();
  }, [query, categoryId, cryptoId, isSearching]);

  // Helper function per timeout delle richieste
  const fetchWithTimeout = async (url: string, options = {}, timeout: number) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Unknown error occurred');
      }
    }
  };

  const pageTitle = isSearching ? "Search Wallet Database" : "Explore Reported Wallets";
  const pageDescription = isSearching 
    ? "Find reported wallets by address, reason, category, or cryptocurrency."
    : "Browse the latest 100 approved community-reported suspicious wallets or use the filters to search.";

  const resultsTitle = isSearching 
    ? `Search Results ${query ? `for "${query}"` : (categoryId || cryptoId ? 'matching filters' : '')}` 
    : "Latest Reported Wallets (Top 100)";
  
  const totalPages = Math.ceil(submissionsToShow.length / ITEMS_PER_PAGE);
  const paginatedSubmissions = submissionsToShow.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const buildPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `/search?${params.toString()}`;
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <section id="search-area" className="mb-12">
        <Card className="w-full max-w-3xl mx-auto shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-center">{pageTitle}</CardTitle>
            <CardDescription className="text-center">
              {pageDescription}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SearchForm 
              categories={categories} 
              cryptocurrencies={cryptocurrencies} 
              initialQuery={query} 
              initialCategory={categoryId} 
              initialCrypto={cryptoId} />
          </CardContent>
        </Card>
      </section>

      <section id="search-results-or-latest">
        <h2 className="text-xl font-semibold mb-4">{resultsTitle}</h2>
        {submissionsToShow.length > 0 ? (
          <>
            <RecentSubmissionsTable 
              initialSubmissions={paginatedSubmissions} 
              categories={categories} 
              cryptocurrencies={cryptocurrencies}
              showReason={true}
              clickableAddress={true}
            />
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <Button asChild variant="outline" disabled={currentPage <= 1}>
                  <Link href={buildPageUrl(currentPage - 1)}>Previous</Link>
                </Button>
                <span className="text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <Button asChild variant="outline" disabled={currentPage >= totalPages}>
                  <Link href={buildPageUrl(currentPage + 1)}>Next</Link>
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card className="text-center py-8">
            <CardContent>
              <p className="text-muted-foreground text-lg">
                {isSearching 
                  ? "No submissions found matching your criteria." 
                  : "No approved submissions found. Check back later or try submitting a report."}
              </p>
              <Button variant="link" asChild className="mt-4">
                <Link href={isSearching ? "/search" : "/"}>{isSearching ? "Clear Search" : "Back to Home"}</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>
    </>
  );
}
