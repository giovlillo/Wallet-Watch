
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Category, Cryptocurrency, SelectOption } from '@/lib/types';
import { Search } from 'lucide-react';

interface SearchFormProps {
  categories: Category[];
  cryptocurrencies: Cryptocurrency[];
  initialQuery?: string;
  initialCategory?: string;
  initialCrypto?: string;
}

export default function SearchForm({ 
  categories, 
  cryptocurrencies: cryptos, 
  initialQuery = '', 
  initialCategory = '', 
  initialCrypto = ''
}: SearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedCrypto, setSelectedCrypto] = useState(initialCrypto);

  useEffect(() => {
    setQuery(searchParams.get('query') || '');
    setSelectedCategory(searchParams.get('category') || '');
    setSelectedCrypto(searchParams.get('crypto') || '');
  }, [searchParams]);

  const categoryOptions: SelectOption[] = categories.map(c => ({ value: c.id, label: c.name }));
  const cryptoOptions: SelectOption[] = cryptos.map(c => ({ value: c.id, label: `${c.name} (${c.symbol})` }));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedCrypto) params.set('crypto', selectedCrypto);
    
    if (params.toString()) { // Only navigate if there's something to search
        router.push(`/search?${params.toString()}`);
    } else {
        router.push('/search'); // Clear results if no params
    }
  };

  return (
    <form onSubmit={handleSearch} className="space-y-4">
      <Input 
        placeholder="Enter wallet address or keywords..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="text-base"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by cryptocurrency" />
          </SelectTrigger>
          <SelectContent>
            {cryptoOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
        <Search className="mr-2 h-4 w-4" /> Search Database
      </Button>
    </form>
  );
}
