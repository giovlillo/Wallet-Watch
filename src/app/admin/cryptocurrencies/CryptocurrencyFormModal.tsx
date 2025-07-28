
"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { Cryptocurrency } from '@/lib/types';
import { createCryptocurrency, updateCryptocurrency } from '@/lib/actions/cryptocurrencyActions';
import * as LucideIcons from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const cryptoFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name too long"),
  symbol: z.string().min(1, "Symbol is required").max(10, "Symbol too long"),
  icon: z.string().min(1, "Icon is required"),
});

type CryptoFormValues = z.infer<typeof cryptoFormSchema>;

interface CryptoFormModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  cryptocurrency: Cryptocurrency | null;
  onSuccess: (cryptocurrency: Cryptocurrency, isNew: boolean) => void;
}

const lucideIconNames = Object.keys(LucideIcons).filter(key => key.match(/^[A-Z]/) && typeof (LucideIcons as any)[key] === 'function');

export function CryptocurrencyFormModal({ isOpen, setIsOpen, cryptocurrency, onSuccess }: CryptoFormModalProps) {
  const { toast } = useToast();
  const form = useForm<CryptoFormValues>({
    resolver: zodResolver(cryptoFormSchema),
    defaultValues: {
      name: '',
      symbol: '',
      icon: 'Coins', 
    },
  });

  useEffect(() => {
    if (isOpen) { // Only reset form when modal is opening or crypto changes while open
      if (cryptocurrency) {
        form.reset({
          name: cryptocurrency.name,
          symbol: cryptocurrency.symbol,
          icon: cryptocurrency.icon,
        });
      } else {
        form.reset({
          name: '',
          symbol: '',
          icon: 'Coins',
        });
      }
    }
  }, [cryptocurrency, form, isOpen]);

  const onSubmit = async (values: CryptoFormValues) => {
    const result = cryptocurrency
      ? await updateCryptocurrency(cryptocurrency.id, values)
      : await createCryptocurrency(values);

    if (result.success && result.cryptocurrency) {
      toast({
        title: cryptocurrency ? "Cryptocurrency Updated" : "Cryptocurrency Created",
        description: `Cryptocurrency "${result.cryptocurrency.name}" has been ${cryptocurrency ? 'updated' : 'created'}.`,
      });
      onSuccess(result.cryptocurrency, !cryptocurrency);
      setIsOpen(false);
    } else {
      toast({
        variant: "destructive",
        title: cryptocurrency ? "Update Failed" : "Creation Failed",
        description: result.error || "An unknown error occurred.",
      });
    }
  };

  // Determine a unique key for the form to ensure it re-initializes properly
  const formKey = cryptocurrency ? `edit-${cryptocurrency.id}` : 'add-new-cryptocurrency';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{cryptocurrency ? 'Edit Cryptocurrency' : 'Add New Cryptocurrency'}</DialogTitle>
          <DialogDescription>
            {cryptocurrency ? 'Update the details of this cryptocurrency.' : 'Add a new cryptocurrency to the list.'}
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
                    <Input placeholder="e.g., Bitcoin" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Symbol</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., BTC" {...field} />
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
                {form.formState.isSubmitting ? 'Saving...' : 'Save Cryptocurrency'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
