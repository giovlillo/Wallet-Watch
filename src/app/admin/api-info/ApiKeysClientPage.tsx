'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { ApiKey } from '@prisma/client';

export default function ApiKeysClientPage() {
  const [owner, setOwner] = useState('');
  const [tier, setTier] = useState('LIMITED');
  const [generatedKey, setGeneratedKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/admin/api-keys');
      if (!response.ok) throw new Error('Failed to fetch API keys');
      const keys = await response.json();
      setApiKeys(keys);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not fetch API keys.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const handleGenerateKey = async () => {
    setIsLoading(true);
    setGeneratedKey('');

    try {
      const response = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, tier }),
      });

      if (!response.ok) throw new Error('Failed to generate API key');

      const { plainTextKey } = await response.json();
      setGeneratedKey(plainTextKey);
      setIsKeyModalOpen(true);
      toast({
        title: 'API Key Generated',
        description: 'The new API key has been generated successfully.',
      });
      fetchApiKeys(); // Refresh the list
      setOwner(''); // Reset form
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate API key.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    try {
      const response = await fetch('/api/admin/api-keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) throw new Error('Failed to revoke API key');

      toast({
        title: 'API Key Revoked',
        description: 'The API key has been successfully revoked.',
      });
      fetchApiKeys(); // Refresh the list
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to revoke API key.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="md:col-span-1">
          <Label htmlFor="owner">Owner</Label>
          <Input
            id="owner"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="e.g. John Doe"
          />
        </div>
        <div className="md:col-span-1">
          <Label htmlFor="tier">Tier</Label>
          <Select value={tier} onValueChange={setTier}>
            <SelectTrigger id="tier">
              <SelectValue placeholder="Select a tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LIMITED">Limited</SelectItem>
              <SelectItem value="UNLIMITED">Unlimited</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-1 flex items-end">
          <Button onClick={handleGenerateKey} disabled={isLoading || !owner} className="w-full">
            {isLoading ? 'Generating...' : 'Generate API Key'}
          </Button>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Existing API Keys</h2>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Owner</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apiKeys.length > 0 ? (
              apiKeys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell>{key.owner}</TableCell>
                  <TableCell>
                    <Badge variant={key.tier === 'UNLIMITED' ? 'default' : 'secondary'}>
                      {key.tier}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(key.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRevokeKey(key.id)}
                    >
                      Revoke
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No API keys found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isKeyModalOpen} onOpenChange={setIsKeyModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New API Key Generated</DialogTitle>
            <DialogDescription>
              Please copy this key. You will not be able to see it again.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 p-3 bg-muted rounded-md break-all">
            <code>{generatedKey}</code>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsKeyModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
