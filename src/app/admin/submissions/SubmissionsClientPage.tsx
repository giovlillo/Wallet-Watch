"use client";

import * as React from "react";
import { ColumnDef, FilterFn, Row } from "@tanstack/react-table";
import { MoreHorizontal, ArrowUpDown, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { DataTableClient } from "@/components/admin/DataTableClient";
import type { Submission, Category, Cryptocurrency, SubmissionStatus } from "@/lib/types";
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { updateSubmission, deleteSubmission } from "@/lib/actions/submissionActions";
import { useRouter } from "next/navigation";
import * as LucideIcons from 'lucide-react';

const IconComponent = ({ name, ...props }: { name: string } & LucideIcons.LucideProps) => {
  const Icon = (LucideIcons as any)[name];
  if (!Icon) return <LucideIcons.ShieldQuestion {...props} />;
  return <Icon {...props} />;
};

interface SubmissionsClientPageProps {
  initialSubmissions: Submission[];
  categories: Category[];
  cryptocurrencies: Cryptocurrency[];
}

const dateRangeFilter: FilterFn<Submission> = (row: Row<Submission>, columnId: string, filterValue: {from?: Date, to?: Date}) => {
  const date = new Date(row.getValue(columnId));
  const from = filterValue.from ? new Date(filterValue.from) : null;
  if (from) from.setHours(0, 0, 0, 0);
  const to = filterValue.to ? new Date(filterValue.to) : null;
  if (to) to.setHours(23, 59, 59, 999);
  
  if (from && to) return date >= from && date <= to;
  if (from) return date >= from;
  if (to) return date <= to;
  return true;
};

export function SubmissionsClientPage({ initialSubmissions, categories, cryptocurrencies }: SubmissionsClientPageProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [submissions, setSubmissions] = React.useState(initialSubmissions);
  const [selectedStatus, setSelectedStatus] = React.useState<SubmissionStatus>("pending");
  const [selectedCount, setSelectedCount] = React.useState(0);
  const [selectedRows, setSelectedRows] = React.useState<Submission[]>([]);

  const handleRowSelection = (submission: Submission, isSelected: boolean) => {
    setSelectedRows(prev => 
      isSelected 
        ? [...prev, submission]
        : prev.filter(s => s.id !== submission.id)
    );
    setSelectedCount(isSelected ? selectedCount + 1 : selectedCount - 1);
  };

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'N/A';
  const getCryptoInfo = (id: string) => cryptocurrencies.find(c => c.id === id);
  const getCategoryIcon = (id: string) => categories.find(c => c.id === id)?.icon || 'HelpCircle';
  const getCryptoIcon = (id: string) => cryptocurrencies.find(c => c.id === id)?.icon || 'Coins';

  const handleStatusChange = async (submissionId: string | string[], newStatus: SubmissionStatus) => {
    const ids = Array.isArray(submissionId) ? submissionId : [submissionId];
    const originalSubmissions = [...submissions];
    
    setSubmissions(prev => 
      prev.map(s => ids.includes(s.id) ? { ...s, status: newStatus, updatedAt: new Date() } : s)
    );

    try {
      const results = await Promise.all(ids.map(id => updateSubmission(id, { status: newStatus })));
      const allSuccess = results.every(r => r.success);
      
      if (allSuccess) {
        toast({ 
          title: "Status Updated", 
          description: `Updated ${ids.length} submission${ids.length > 1 ? 's' : ''} to ${newStatus}.`
        });
      } else {
        setSubmissions(originalSubmissions);
        toast({ variant: "destructive", title: "Partial Update", description: `Some submissions failed to update.` });
      }
    } catch (error) {
      setSubmissions(originalSubmissions);
      toast({ variant: "destructive", title: "Update Failed", description: "Failed to update submissions." });
    }
  };

  const handleDelete = async (submissionId: string) => {
    const originalSubmissions = [...submissions];
    setSubmissions(prev => prev.filter(s => s.id !== submissionId));

    const result = await deleteSubmission(submissionId);
    if (result.success) {
      toast({ title: "Submission Deleted", description: "The submission has been removed." });
    } else {
      setSubmissions(originalSubmissions);
      toast({ variant: "destructive", title: "Delete Failed", description: result.error });
    }
  };

  const handleBulkStatusChange = () => {
    if (selectedRows.length === 0) {
      toast({ variant: "destructive", title: "No Selection", description: "Please select at least one submission." });
      return;
    }
    const selectedIds = selectedRows.map(row => row.id);
    handleStatusChange(selectedIds, selectedStatus);
    setSelectedRows([]);
    setSelectedCount(0);
  };

  const columns: ColumnDef<Submission>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedRows.some(s => s.id === row.original.id)}
          onCheckedChange={(value) => handleRowSelection(row.original, !!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "walletAddress",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Wallet Address <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-mono text-xs break-all">{row.getValue("walletAddress")}</div>,
    },
    {
      accessorKey: "categoryId",
      header: "Category",
      cell: ({ row }) => {
        const categoryName = getCategoryName(row.getValue("categoryId"));
        const categoryIcon = getCategoryIcon(row.getValue("categoryId"));
        return (
          <Badge variant="secondary" className="whitespace-nowrap">
            <IconComponent name={categoryIcon} className="w-3 h-3 mr-1.5" />
            {categoryName}
          </Badge>
        );
      },
    },
    {
      accessorKey: "cryptocurrencyId",
      header: "Crypto",
      cell: ({ row }) => {
        const crypto = getCryptoInfo(row.getValue("cryptocurrencyId"));
        return crypto ? (
          <Badge variant="outline" className="whitespace-nowrap">
            <IconComponent name={crypto.icon} className="w-3 h-3 mr-1.5" />
            {crypto.symbol}
          </Badge>
        ) : 'N/A';
      },
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => <div className="text-xs max-w-xs truncate" title={row.getValue("reason")}>{row.getValue("reason") || "-"}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as SubmissionStatus;
        let icon = <Clock className="mr-2 h-4 w-4" />;
        let color = "bg-yellow-500/20 text-yellow-500";
        if (status === "approved") { icon = <CheckCircle className="mr-2 h-4 w-4" />; color = "bg-green-500/20 text-green-500"; }
        if (status === "rejected") { icon = <XCircle className="mr-2 h-4 w-4" />; color = "bg-red-500/20 text-red-500"; }
        return <Badge variant="outline" className={`capitalize ${color} border-none`}>{icon}{status}</Badge>;
      },
    },
    {
      accessorKey: "submitterIp",
      header: "Submitter IP",
      cell: ({ row }) => <div className="font-mono text-xs">{row.getValue("submitterIp") || "N/A"}</div>,
    },
    {
      accessorKey: "createdAt",
      header: "Reported At",
      cell: ({ row }) => format(new Date(row.getValue("createdAt")), "PPpp"),
      filterFn: dateRangeFilter as FilterFn<Submission>,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const submission = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.push(`/admin/submissions/${submission.id}`)}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(submission.walletAddress)}>
                Copy Address
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Change Status</DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup 
                      value={submission.status} 
                      onValueChange={(newStatus) => handleStatusChange(submission.id, newStatus as SubmissionStatus)}
                    >
                      <DropdownMenuRadioItem value="pending">Pending</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="approved">Approved</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="rejected">Rejected</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
                onClick={() => {
                  if(confirm("Are you sure you want to delete this submission?")) {
                    handleDelete(submission.id);
                  }
                }}
              >
                Delete Submission
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as SubmissionStatus)}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <Button 
          onClick={handleBulkStatusChange}
          disabled={selectedCount === 0}
        >
          Update Selected ({selectedCount})
        </Button>
      </div>
      
      <DataTableClient
        columns={columns} 
        data={submissions} 
        filterInputPlaceholder="Filter by wallet address..."
        filterColumnId="walletAddress"
        dateFilterColumnId="createdAt"
        additionalFilters={[
          { 
            columnId: "submitterIp", 
            placeholder: "Filter by IP address..." 
          }
        ]}
      />
    </div>
  );
}
