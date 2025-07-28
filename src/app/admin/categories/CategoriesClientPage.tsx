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
import type { Category } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { deleteCategory } from "@/lib/actions/categoryActions";
import { CategoryFormModal } from "./CategoryFormModal"; // New component
import * as LucideIcons from 'lucide-react';

const IconComponent = ({ name, ...props }: { name: string } & LucideIcons.LucideProps) => {
  const Icon = (LucideIcons as any)[name];
  if (!Icon) return <LucideIcons.HelpCircle {...props} />; // Default icon
  return <Icon {...props} />;
};

interface CategoriesClientPageProps {
  initialCategories: Category[];
}

export function CategoriesClientPage({ initialCategories }: CategoriesClientPageProps) {
  const { toast } = useToast();
  const [categories, setCategories] = React.useState(initialCategories);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);

  const refreshCategories = async () => {
    // In a real app, you might fetch from server:
    // const updatedCategories = await getCategories(); // Assuming getCategories is an action
    // setCategories(updatedCategories);
    // For now, we manage state locally after actions, or expect full page refresh on major changes.
    // This is a simple placeholder; actual refresh depends on how actions update data.
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category? This may affect existing submissions.")) {
      return;
    }
    const originalCategories = [...categories];
    setCategories(prev => prev.filter(c => c.id !== categoryId)); // Optimistic update

    const result = await deleteCategory(categoryId);
    if (result.success) {
      toast({ title: "Category Deleted", description: "The category has been removed." });
      // refreshCategories(); // or rely on optimistic update / router.refresh() from parent
    } else {
      setCategories(originalCategories); // Revert on failure
      toast({ variant: "destructive", title: "Delete Failed", description: result.error });
    }
  };
  
  const columns: ColumnDef<Category>[] = [
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
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <div className="text-sm max-w-md truncate" title={row.getValue("description")}>{row.getValue("description") || "-"}</div>,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const category = row.original;
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
              <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                Edit Category
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
                onClick={() => handleDeleteCategory(category.id)}
              >
                Delete Category
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
        <Button onClick={handleAddCategory}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Category
        </Button>
      </div>
      <DataTableClient 
        columns={columns} 
        data={categories}
        filterInputPlaceholder="Filter by name..."
        filterColumnId="name" 
      />
      <CategoryFormModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        category={editingCategory}
        onSuccess={(updatedOrNewCategory, isNew) => {
          if (isNew) {
            setCategories(prev => [updatedOrNewCategory, ...prev]);
          } else {
            setCategories(prev => prev.map(c => c.id === updatedOrNewCategory.id ? updatedOrNewCategory : c));
          }
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}
