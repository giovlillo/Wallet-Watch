import ApiKeysClientPage from './ApiKeysClientPage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ApiInfoPage() {
  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}` 
    : 'http://localhost:9002';

  const curlExample = `curl -H "x-api-key: YOUR_API_KEY" "${baseUrl}/api/public/submissions"`;
  
  const javascriptExample = `const apiKey = 'YOUR_API_KEY';
const url = '${baseUrl}/api/public/submissions';

fetch(url, {
  headers: {
    'x-api-key': apiKey
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`;

  const pythonExample = `import requests

api_key = 'YOUR_API_KEY'
url = '${baseUrl}/api/public/submissions'

headers = {
    'x-api-key': api_key
}

response = requests.get(url, headers=headers)

if response.status_code == 200:
    print(response.json())
else:
    print(f"Error: {response.status_code}, {response.text}")`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">API Key Management</h1>
        <p className="text-muted-foreground">
          Generate, view, and revoke API keys for your users.
        </p>
      </div>
      
      <ApiKeysClientPage />

      <Card>
        <CardHeader>
          <CardTitle>API Usage Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            To authenticate with the API, include your generated API key in the <code>x-api-key</code> header of your requests.
          </p>
          <p className="mb-6">
            Here are some examples of how to fetch public submissions:
          </p>
          <Tabs defaultValue="curl">
            <TabsList>
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
            </TabsList>
            <TabsContent value="curl">
              <pre className="bg-muted p-4 rounded-md mt-2">
                <code className="text-sm">{curlExample}</code>
              </pre>
            </TabsContent>
            <TabsContent value="javascript">
              <pre className="bg-muted p-4 rounded-md mt-2">
                <code className="text-sm">{javascriptExample}</code>
              </pre>
            </TabsContent>
            <TabsContent value="python">
              <pre className="bg-muted p-4 rounded-md mt-2">
                <code className="text-sm">{pythonExample}</code>
              </pre>
            </TabsContent>
          </Tabs>
          <div className="mt-6">
            <h3 className="font-semibold">API Tiers</h3>
            <p className="text-sm text-muted-foreground mt-1">
              There are two types of API keys available:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li><strong>LIMITED:</strong> Allows up to 20 API requests per month.</li>
              <li><strong>UNLIMITED:</strong> Provides unrestricted access to the API.</li>
            </ul>
          </div>
          <div className="mt-6">
            <h3 className="font-semibold">Available Public Endpoints:</h3>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li><code>GET /api/public/submissions</code>: Fetches approved submissions. Supports <code>limit</code>, <code>categoryId</code>, <code>cryptocurrencyId</code>, and <code>searchTerm</code> query parameters.</li>
              <li><code>GET /api/categories</code>: Fetches all available categories.</li>
              <li><code>GET /api/cryptocurrencies</code>: Fetches all available cryptocurrencies.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
