import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListChecks, ShieldAlert, CircleDollarSign, Users } from "lucide-react";
import Link from "next/link";
import { getSubmissionsCount, getCategories, getCryptocurrencies } from "@/lib/data"; // Direct fetch

export default async function AdminDashboardPage() {
  const [
    totalSubmissions,
    pendingSubmissions,
    approvedSubmissions,
    categories,
    cryptos,
  ] = await Promise.all([
    getSubmissionsCount(),
    getSubmissionsCount({ status: 'pending' }),
    getSubmissionsCount({ status: 'approved' }),
    getCategories(),
    getCryptocurrencies(),
  ]);

  const stats = [
    { title: "Total Submissions", value: totalSubmissions, icon: ListChecks, color: "text-primary" },
    { title: "Pending Approval", value: pendingSubmissions, icon: Users, color: "text-yellow-400" },
    { title: "Approved Submissions", value: approvedSubmissions, icon: ListChecks, color: "text-green-500" },
    { title: "Managed Categories", value: categories.length, icon: ShieldAlert, color: "text-accent" },
    { title: "Managed Cryptos", value: cryptos.length, icon: CircleDollarSign, color: "text-blue-400" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-headline tracking-tight">Admin Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
          <CardDescription>Quickly navigate to management sections.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Link href="/admin/submissions" className="block p-4 bg-card-foreground/5 hover:bg-card-foreground/10 rounded-lg transition-colors">
            <h3 className="font-semibold text-primary mb-1">Manage Submissions</h3>
            <p className="text-sm text-muted-foreground">View, approve, or delete wallet reports.</p>
          </Link>
          <Link href="/admin/categories" className="block p-4 bg-card-foreground/5 hover:bg-card-foreground/10 rounded-lg transition-colors">
            <h3 className="font-semibold text-primary mb-1">Manage Categories</h3>
            <p className="text-sm text-muted-foreground">Add, edit, or remove report categories.</p>
          </Link>
          <Link href="/admin/cryptocurrencies" className="block p-4 bg-card-foreground/5 hover:bg-card-foreground/10 rounded-lg transition-colors">
            <h3 className="font-semibold text-primary mb-1">Manage Cryptocurrencies</h3>
            <p className="text-sm text-muted-foreground">Maintain the list of supported cryptocurrencies.</p>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
