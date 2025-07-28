
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Submission, Category, Cryptocurrency, SelectOption } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import * as LucideIcons from 'lucide-react';
import Link from 'next/link';

interface RecentSubmissionsTableProps {
  initialSubmissions: Submission[];
  categories: Category[];
  cryptocurrencies: Cryptocurrency[];
  showReason?: boolean; // Nuova prop per controllare la colonna Reason
  clickableAddress?: boolean; // Nuova prop per controllare i link agli indirizzi
}

const IconComponent = ({ name, fallback: FallbackIcon = LucideIcons.ShieldQuestion, ...props }: { name: string, fallback?: LucideIcons.LucideIcon } & LucideIcons.LucideProps) => {
  const Icon = (LucideIcons as any)[name] as LucideIcons.LucideIcon | undefined;
  if (!Icon || typeof Icon !== 'function') {
    return <FallbackIcon {...props} />;
  }
  return <Icon {...props} />;
};

export default function RecentSubmissionsTable({ 
  initialSubmissions, 
  categories: propCategories, 
  cryptocurrencies: propCryptos,
  showReason = false,
  clickableAddress = false
}: RecentSubmissionsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCrypto, setSelectedCrypto] = useState<string>('');
  const [displayedSubmissions, setDisplayedSubmissions] = useState<Submission[]>(initialSubmissions.slice(0, 10)); // Limite a 10

  const categoryOptions: SelectOption[] = useMemo(() => propCategories.map(c => ({ value: c.id, label: c.name })), [propCategories]);
  const cryptoOptions: SelectOption[] = useMemo(() => propCryptos.map(c => ({ value: c.id, label: `${c.name} (${c.symbol})` })), [propCryptos]);

  const getCategoryInfo = (id: string): Category | undefined => propCategories.find(c => c.id === id);
  const getCryptoInfo = (id: string): Cryptocurrency | undefined => propCryptos.find(c => c.id === id);

  useEffect(() => {
    let filtered = initialSubmissions;

    if (selectedCategory) {
      filtered = filtered.filter(s => s.categoryId === selectedCategory);
    }
    if (selectedCrypto) {
      filtered = filtered.filter(s => s.cryptocurrencyId === selectedCrypto);
    }
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.walletAddress.toLowerCase().includes(lowerSearchTerm) ||
        s.reason?.toLowerCase().includes(lowerSearchTerm)
      );
    }
    setDisplayedSubmissions(filtered.slice(0, 10)); // Limite a 10
  }, [searchTerm, selectedCategory, selectedCrypto, initialSubmissions]);

  const formatWalletAddress = (address: string) => {
    if (address.length > 14) {
      return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }
    return address;
  };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-center">Recently Reported Wallets</CardTitle>
        <CardDescription className="text-center">
          Browse the latest community-reported suspicious wallets. Approved submissions only.
          {clickableAddress ? " Click on a wallet address for details." : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <Input 
            placeholder="Search address"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:col-span-1"
          />
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

        {displayedSubmissions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No submissions match your criteria.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Wallet Address</TableHead>
                  <TableHead className="whitespace-nowrap">Category</TableHead>
                  <TableHead className="whitespace-nowrap">Crypto</TableHead>
                  {showReason && <TableHead className="whitespace-nowrap">Reason (Snippet)</TableHead>}
                  <TableHead className="text-right whitespace-nowrap">Reported</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedSubmissions.map((submission) => {
                  const category = getCategoryInfo(submission.categoryId);
                  const crypto = getCryptoInfo(submission.cryptocurrencyId);
                  return (
                    <TableRow key={submission.id}>
                      <TableCell className="font-mono text-sm whitespace-nowrap max-w-[150px] truncate" title={submission.walletAddress}>
                        {clickableAddress ? (
                          <Link href={`/submission/${submission.id}`} className="hover:underline text-primary">
                            {formatWalletAddress(submission.walletAddress)}
                          </Link>
                        ) : (
                          formatWalletAddress(submission.walletAddress)
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {category ? (
                          <Badge variant="secondary" className="whitespace-nowrap">
                             <IconComponent name={category.icon} fallback={LucideIcons.ShieldQuestion} className="w-3 h-3 mr-1.5" />
                            {category.name}
                          </Badge>
                        ) : <span className="text-xs">N/A</span>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {crypto ? (
                           <Badge variant="outline" className="whitespace-nowrap">
                             <IconComponent name={crypto.icon} fallback={LucideIcons.Coins} className="w-3 h-3 mr-1.5" />
                            {crypto.symbol}
                           </Badge>
                        ) : <span className="text-xs">N/A</span>}
                      </TableCell>
                      {showReason && (
                        <TableCell className="text-xs whitespace-nowrap max-w-[200px] truncate" title={submission.reason || '-'}>
                          {submission.reason ? `${submission.reason.substring(0, 50)}${submission.reason.length > 50 ? '...' : ''}` : '-'}
                        </TableCell>
                      )}
                      <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
