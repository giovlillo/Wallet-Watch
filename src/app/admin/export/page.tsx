"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminExportPage() {
  const { toast } = useToast();

  const handleDownloadCSV = async () => {
    try {
      const response = await fetch('/api/submissions/csv');
      if (!response.ok) {
        throw new Error(`Failed to download CSV: ${response.statusText}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wallet_watch_submissions_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: "Download Started", description: "Your CSV export is downloading." });
    } catch (error) {
      console.error("CSV Download Error:", error);
      toast({ variant: "destructive", title: "Download Failed", description: (error as Error).message || "Could not export data." });
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-headline tracking-tight">Export Data</h1>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Download Submissions</CardTitle>
          <CardDescription>Export all wallet submission data in CSV format.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            This will generate a CSV file containing all reported wallet submissions, including their status, category, cryptocurrency, reason, and timestamps.
          </p>
          <Button onClick={handleDownloadCSV}>
            <Download className="mr-2 h-4 w-4" />
            Download All Submissions (CSV)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
