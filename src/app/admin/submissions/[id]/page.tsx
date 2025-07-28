import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { fetchSubmissionById } from "@/lib/actions/submissionActions";
import { getCategoryById } from "@/lib/actions/categoryActions";
import { getCryptocurrencyById } from "@/lib/actions/cryptocurrencyActions";
import { format } from 'date-fns';
import Link from "next/link";
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, CheckCircle, XCircle } from "lucide-react";
import * as LucideIcons from 'lucide-react';

const IconComponent = ({ name, ...props }: { name: string } & LucideIcons.LucideProps) => {
  const Icon = (LucideIcons as any)[name];
  if (!Icon) return <LucideIcons.ShieldQuestion {...props} />;
  return <Icon {...props} />;
};

export default async function AdminSubmissionDetailPage({ params }: { params: { id: string } }) {
  const submission = await fetchSubmissionById(params.id);
  
  if (!submission) {
    notFound();
  }

  const [category, cryptocurrency] = await Promise.all([
    getCategoryById(submission.categoryId),
    getCryptocurrencyById(submission.cryptocurrencyId),
  ]);

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <Link href="/admin/submissions">
          <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Submissions
            </Button>
          </Link>
          <div className="flex items-center space-x-2">
            {submission.status === 'pending' && (
              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-500 border-none">
                <Clock className="mr-2 h-4 w-4" /> Pending
              </Badge>
            )}
            {submission.status === 'approved' && (
              <Badge variant="outline" className="bg-green-500/20 text-green-500 border-none">
                <CheckCircle className="mr-2 h-4 w-4" /> Approved
              </Badge>
            )}
            {submission.status === 'rejected' && (
              <Badge variant="outline" className="bg-red-500/20 text-red-500 border-none">
                <XCircle className="mr-2 h-4 w-4" /> Rejected
              </Badge>
            )}
          </div>
        </div>
        <Separator />

        <Card className="mt-4 w-full">
          <CardHeader>
            <CardTitle>Submission Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Wallet Address</h3>
                <p className="font-mono text-sm break-all p-2 bg-muted rounded">{submission.walletAddress}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Category</h3>
                  <Badge variant="secondary">
                    <IconComponent name={category?.icon || 'HelpCircle'} className="w-3 h-3 mr-1.5" />
                    {category?.name || 'N/A'}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Cryptocurrency</h3>
                  <Badge variant="outline">
                    <IconComponent name={cryptocurrency?.icon || 'Coins'} className="w-3 h-3 mr-1.5" />
                    {cryptocurrency?.symbol || 'N/A'}
                  </Badge>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Reason</h3>
                <p className="text-sm">{submission.reason || "-"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">IP Address</h3>
                <p className="font-mono text-sm break-all p-2 bg-muted rounded">{submission.submitterIp || 'N/A'}</p>
              </div>


              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Submitted At</h3>
                <p className="text-sm">{format(new Date(submission.createdAt), "PPpp")}</p>
              </div>

              {submission.websiteUrl && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Website URL</h3>
                  <p className="text-sm break-all">{submission.websiteUrl}</p>
                </div>
              )}

              {submission.adminNotes && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Admin Notes</h3>
                  <p className="text-sm">{submission.adminNotes}</p>
                </div>
              )}
            </div>
          </CardContent>
          </Card>
    </div>
  );
}
