
import { getSubmissionById, getCategoryById, getCryptocurrencyById } from '@/lib/data';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, AlertTriangle, ShieldQuestion, Coins, CheckCircle, Globe, User } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import * as LucideIcons from 'lucide-react';
import type { Metadata, ResolvingMetadata } from 'next';
import { Button } from '@/components/ui/button';

const IconComponent = ({ name, fallback: FallbackIcon = ShieldQuestion, ...props }: { name: string, fallback?: LucideIcons.LucideIcon } & LucideIcons.LucideProps) => {
  const Icon = (LucideIcons as any)[name] as LucideIcons.LucideIcon | undefined;
  if (!Icon || typeof Icon !== 'function') { // Check if it's a function (component)
    return <FallbackIcon {...props} />; 
  }
  return <Icon {...props} />;
};

type Props = {
  params: { id: string };
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const submission = await getSubmissionById(params.id);

  if (!submission || submission.status !== 'approved') {
    return {
      title: 'Submission Not Found - Wallet Watch',
    };
  }
  
  const category = await getCategoryById(submission.categoryId);
  const crypto = await getCryptocurrencyById(submission.cryptocurrencyId);

  return {
    title: `Report: ${submission.walletAddress.substring(0,12)}... (${crypto?.symbol || 'Crypto'}) - Wallet Watch`,
    description: `Details for reported wallet address ${submission.walletAddress}. Category: ${category?.name || 'N/A'}. Reason: ${submission.reason?.substring(0,100) || 'N/A'}...`,
  };
}


export default async function SubmissionDetailPage({ params }: Props) {
  const submission = await getSubmissionById(params.id);

  if (!submission) {
    notFound(); 
  }

  if (submission.status !== 'approved') {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 md:py-12 flex items-center justify-center">
          <Card className="w-full max-w-lg text-center shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
                Submission Not Available
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This submission is either pending review, has been rejected, or does not exist in the public database.
              </p>
              <Button variant="outline" asChild className="mt-6">
                <Link href="/search">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Search
                </Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const category = await getCategoryById(submission.categoryId);
  const cryptocurrency = await getCryptocurrencyById(submission.cryptocurrencyId);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <div className="mb-6">
          <Button variant="outline" asChild>
            <Link href="/search">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Reports
            </Link>
          </Button>
        </div>

        <Card className="w-full shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl font-headline break-all">
              Report Details: {submission.walletAddress}
            </CardTitle>
            <CardDescription>
              Full information for the publicly reported wallet address.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Wallet Address</h3>
              <p className="font-mono text-lg break-all bg-muted/30 p-3 rounded-md">{submission.walletAddress}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Category</h3>
                {category ? (
                  <Badge variant="secondary" className="text-base px-3 py-1.5">
                    <IconComponent name={category.icon} fallback={ShieldQuestion} className="w-4 h-4 mr-2" />
                    {category.name}
                  </Badge>
                ) : (
                  <p className="text-base">N/A</p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Cryptocurrency</h3>
                {cryptocurrency ? (
                  <Badge variant="outline" className="text-base px-3 py-1.5">
                    <IconComponent name={cryptocurrency.icon} fallback={Coins} className="w-4 h-4 mr-2" />
                    {cryptocurrency.name} ({cryptocurrency.symbol})
                  </Badge>
                ) : (
                  <p className="text-base">N/A</p>
                )}
              </div>
            </div>
            
            {submission.websiteUrl && submission.websiteUrl.trim() !== '' && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                  <Globe className="w-4 h-4 mr-2" /> Associated Website URL
                </h3>
                <p className="text-base break-all bg-muted/30 p-3 rounded-md">{submission.websiteUrl}</p>
              </div>
            )}

            {submission.reportedOwner && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                  <User className="w-4 h-4 mr-2" /> Reported Owner
                </h3>
                <p className="text-base bg-muted/30 p-3 rounded-md">{submission.reportedOwner}</p>
              </div>
            )}

            {submission.reason && submission.reason.trim() !== '' && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Reason for Reporting</h3>
                <p className="text-base whitespace-pre-wrap bg-muted/50 p-4 rounded-md border border-border">
                  {submission.reason}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
               <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                 <Badge variant="default" className="bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 capitalize text-base px-3 py-1.5 border border-green-500/30">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {submission.status}
                  </Badge>
              </div>
               <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Reported At</h3>
                <p className="text-base">{format(new Date(submission.createdAt), "PPPp")}</p>
              </div>
            </div>
            
             {submission.adminNotes && ( 
              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Admin Notes (Internal)</h3>
                <p className="text-base bg-muted/30 p-3 rounded-md text-muted-foreground italic">{submission.adminNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
