
"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { Category } from '@/lib/types';
import { createCategory, updateCategory } from '@/lib/actions/categoryActions';
import * as LucideIcons from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const categoryFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name too long"),
  description: z.string().max(200, "Description too long").optional(),
  icon: z.string().min(1, "Icon is required"),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface CategoryFormModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  category: Category | null;
  onSuccess: (category: Category, isNew: boolean) => void;
}

const lucideIconNames = Object.keys(LucideIcons).filter(key => key.match(/^[A-Z]/) && typeof (LucideIcons as any)[key] === 'function');


export function CategoryFormModal({ isOpen, setIsOpen, category, onSuccess }: CategoryFormModalProps) {
  const { toast } = useToast();
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      description: '',
      icon: 'ShieldQuestion',
    },
  });

  useEffect(() => {
    if (isOpen) { // Only reset form when modal is opening or category changes while open
      if (category) {
        form.reset({
          name: category.name,
          description: category.description || '',
          icon: category.icon,
        });
      } else {
        form.reset({
          name: '',
          description: '',
          icon: 'ShieldQuestion',
        });
      }
    }
  }, [category, form, isOpen]);

  const onSubmit = async (values: CategoryFormValues) => {
    const result = category
      ? await updateCategory(category.id, values)
      : await createCategory(values);

    if (result.success && result.category) {
      toast({
        title: category ? "Category Updated" : "Category Created",
        description: `Category "${result.category.name}" has been ${category ? 'updated' : 'created'}.`,
      });
      onSuccess(result.category, !category);
      setIsOpen(false);
    } else {
      toast({
        variant: "destructive",
        title: category ? "Update Failed" : "Creation Failed",
        description: result.error || "An unknown error occurred.",
      });
    }
  };

  // Determine a unique key for the form to ensure it re-initializes properly
  const formKey = category ? `edit-${category.id}` : 'add-new-category';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{category ? 'Edit Category' : 'Add New Category'}</DialogTitle>
          <DialogDescription>
            {category ? 'Update the details of this category.' : 'Create a new category for wallet reports.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form} key={formKey}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Scam/Phishing" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Briefly describe the category" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an icon" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-60">
                      {lucideIconNames.map(iconName => (
                        <SelectItem key={iconName} value={iconName}>
                          <div className="flex items-center">
                            {(LucideIcons as any)[iconName] && React.createElement((LucideIcons as any)[iconName], {className: "mr-2 h-4 w-4"})}
                            {iconName}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save Category'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
