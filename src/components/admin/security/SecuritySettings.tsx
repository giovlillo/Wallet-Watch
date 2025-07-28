"use client";
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTableClient } from "@/components/admin/DataTableClient";
import { ColumnDef } from "@tanstack/react-table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type BlocklistItem = {
  id: string;
  type: 'keyword' | 'phrase' | 'domain';
  value: string;
};

const blocklistColumns: ColumnDef<BlocklistItem>[] = [
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return <span className="capitalize">{type}</span>;
    },
  },
  {
    accessorKey: "value",
    header: "Value",
  },
];

export default function SecuritySettings() {
  const [recaptchaEnabled, setRecaptchaEnabled] = useState(true);
  const [rateLimitWindow, setRateLimitWindow] = useState(15);
  const [rateLimitMax, setRateLimitMax] = useState(5);
  const [isLoading, setIsLoading] = useState(true);

  // Carica le impostazioni all'avvio
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings');
        if (!response.ok) {
          throw new Error('Failed to load settings');
        }
        const settings = await response.json();
        
        // Carica reCAPTCHA setting
        if (settings.recaptchaEnabled) {
          if (settings.recaptchaEnabled === 'true' || settings.recaptchaEnabled === 'false') {
            setRecaptchaEnabled(settings.recaptchaEnabled === 'true');
          } else {
            try {
              const recaptchaValue = JSON.parse(settings.recaptchaEnabled);
              setRecaptchaEnabled(recaptchaValue);
            } catch (e) {
              console.error('Error parsing recaptchaEnabled:', e);
              setRecaptchaEnabled(false);
            }
          }
        }
        
        // Carica rateLimit setting
        if (settings.rateLimit) {
          if (typeof settings.rateLimit === 'string' && settings.rateLimit.startsWith('{')) {
            try {
              const rateLimit = JSON.parse(settings.rateLimit);
              setRateLimitWindow(rateLimit.window);
              setRateLimitMax(rateLimit.max);
            } catch (e) {
              console.error('Error parsing rateLimit:', e);
              setRateLimitWindow(15);
              setRateLimitMax(5);
            }
          } else {
            // Imposta valori di default se non è un oggetto valido
            setRateLimitWindow(15);
            setRateLimitMax(5);
          }
        }

        // Carica blocklist setting
        if (settings.blocklist) {
          try {
            const parsedBlocklist = JSON.parse(settings.blocklist);
            setBlocklistItems(Array.isArray(parsedBlocklist) ? parsedBlocklist : []);
          } catch (e) {
            console.error('Error parsing blocklist:', e);
            setBlocklistItems([]);
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, []);
  
  const [blocklistType, setBlocklistType] = useState<'keyword' | 'phrase' | 'domain'>('keyword');
  const [blocklistValue, setBlocklistValue] = useState('');
  const [blocklistItems, setBlocklistItems] = useState<BlocklistItem[]>([]);

  const saveSettings = async (settings: Record<string, any>) => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }

      console.log('Settings saved successfully');
      return await response.json();
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  };

  const addBlocklistItem = () => {
    if (blocklistValue.trim()) {
      const newItem: BlocklistItem = {
        id: Math.random().toString(36).substring(7),
        type: blocklistType,
        value: blocklistValue,
      };
      const newItems = [...blocklistItems, newItem];
      setBlocklistItems(newItems);
      setBlocklistValue('');
      // Salva immediatamente la nuova blocklist
      saveSettings({ blocklist: JSON.stringify(newItems) });
    }
  };

  const deleteBlocklistItem = (id: string) => {
    const newItems = blocklistItems.filter(item => item.id !== id);
    setBlocklistItems(newItems);
    // Salva immediatamente la blocklist aggiornata
    saveSettings({ blocklist: JSON.stringify(newItems) });
  };

  return (
    <div className="space-y-8">
      {/* reCAPTCHA Settings */}
      <Card>
        <CardHeader>
          <CardTitle>reCAPTCHA Settings</CardTitle>
          <CardDescription>Enable or disable Google reCAPTCHA verification</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch 
                id="recaptcha-toggle" 
                checked={recaptchaEnabled} 
                onCheckedChange={setRecaptchaEnabled} 
              />
              <Label htmlFor="recaptcha-toggle">
                {recaptchaEnabled ? 'Enabled' : 'Disabled'}
              </Label>
            </div>
            <Button onClick={() => saveSettings({ recaptchaEnabled })}>
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rate Limiting Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Limiting</CardTitle>
          <CardDescription>Configure submission rate limits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="rate-limit-window">Time Window (minutes)</Label>
              <Input
                id="rate-limit-window"
                type="number"
                min="1"
                value={rateLimitWindow}
                onChange={(e) => setRateLimitWindow(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="rate-limit-max">Max Submissions</Label>
              <Input
                id="rate-limit-max"
                type="number"
                min="1"
                value={rateLimitMax}
                onChange={(e) => setRateLimitMax(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => saveSettings({ 
              rateLimit: { window: rateLimitWindow, max: rateLimitMax } 
            })}>
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Blocklist Management */}
      <Card>
        <CardHeader>
          <CardTitle>Blocklist Management</CardTitle>
          <CardDescription>Block keywords, phrases, and domains associated with spam</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <Label>Blocklist Type</Label>
              <Select 
                value={blocklistType} 
                onValueChange={(value) => setBlocklistType(value as any)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="keyword">Keyword</SelectItem>
                  <SelectItem value="phrase">Phrase</SelectItem>
                  <SelectItem value="domain">Domain</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Value</Label>
              <Input
                placeholder={
                  blocklistType === 'domain' ? 
                  "example.com" : 
                  blocklistType === 'keyword' ? 
                  "spam" : 
                  "bad phrase"
                }
                value={blocklistValue}
                onChange={(e) => setBlocklistValue(e.target.value)}
              />
            </div>
            <div className="md:col-span-1 flex items-end">
              <Button onClick={addBlocklistItem} className="w-full">
                Add
              </Button>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">Current Blocklist</h3>
            {blocklistItems.length > 0 ? (
              <DataTableClient 
                columns={[
                  ...blocklistColumns,
                  {
                    id: "blocklist_actions",
                    header: "Actions",
                    cell: ({ row }) => (
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => deleteBlocklistItem(row.original.id)}
                      >
                        Delete
                      </Button>
                    ),
                  }
                ]} 
                data={blocklistItems} 
                filterInputPlaceholder="Filter blocklist..." 
              />
            ) : (
              <p className="text-muted-foreground">No items in blocklist</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
