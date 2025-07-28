"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, ArrowUpDown, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableClient } from "@/components/admin/DataTableClient";
import type { Cryptocurrency } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { deleteCryptocurrency } from "@/lib/actions/cryptocurrencyActions";
import { CryptocurrencyFormModal } from "./CryptocurrencyFormModal"; // New component
import * as LucideIcons from 'lucide-react';

const IconComponent = ({ name, ...props }: { name: string } & LucideIcons.LucideProps) => {
  const Icon = (LucideIcons as any)[name];
  if (!Icon) return <LucideIcons.Coins {...props} />; // Default icon
  return <Icon {...props} />;
};


interface CryptocurrenciesClientPageProps {
  initialCryptocurrencies: Cryptocurrency[];
}

export function CryptocurrenciesClientPage({ initialCryptocurrencies }: CryptocurrenciesClientPageProps) {
  const { toast } = useToast();
  const [cryptocurrencies, setCryptocurrencies] = React.useState(initialCryptocurrencies);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingCrypto, setEditingCrypto] = React.useState<Cryptocurrency | null>(null);

  const handleAddCrypto = () => {
    setEditingCrypto(null);
    setIsModalOpen(true);
  };

  const handleEditCrypto = (crypto: Cryptocurrency) => {
    setEditingCrypto(crypto);
    setIsModalOpen(true);
  };

  const handleDeleteCrypto = async (cryptoId: string) => {
    if (!confirm("Are you sure you want to delete this cryptocurrency? This may affect existing submissions.")) {
      return;
    }
    const originalCryptos = [...cryptocurrencies];
    setCryptocurrencies(prev => prev.filter(c => c.id !== cryptoId)); // Optimistic update

    const result = await deleteCryptocurrency(cryptoId);
    if (result.success) {
      toast({ title: "Cryptocurrency Deleted", description: "The cryptocurrency has been removed." });
    } else {
      setCryptocurrencies(originalCryptos); // Revert on failure
      toast({ variant: "destructive", title: "Delete Failed", description: result.error });
    }
  };
  
  const columns: ColumnDef<Cryptocurrency>[] = [
    {
      accessorKey: "icon",
      header: "Icon",
      cell: ({ row }) => {
        const iconName = row.getValue("icon") as string;
        return <IconComponent name={iconName} className="h-5 w-5" />;
      }
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Name <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "symbol",
      header: "Symbol",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const crypto = row.original;
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
              <DropdownMenuItem onClick={() => handleEditCrypto(crypto)}>
                Edit Cryptocurrency
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
                onClick={() => handleDeleteCrypto(crypto.id)}
              >
                Delete Cryptocurrency
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={handleAddCrypto}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Cryptocurrency
        </Button>
      </div>
      <DataTableClient 
        columns={columns} 
        data={cryptocurrencies} 
        filterInputPlaceholder="Filter by name or symbol..."
        filterColumnId="name" // Or make a combined filter
      />
      <CryptocurrencyFormModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        cryptocurrency={editingCrypto}
        onSuccess={(updatedOrNewCrypto, isNew) => {
          if (isNew) {
            setCryptocurrencies(prev => [updatedOrNewCrypto, ...prev]);
          } else {
            setCryptocurrencies(prev => prev.map(c => c.id === updatedOrNewCrypto.id ? updatedOrNewCrypto : c));
          }
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}
