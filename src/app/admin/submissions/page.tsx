import { fetchAllSubmissionsForAdmin } from '@/lib/actions/submissionActions';
import { getCategories, getCryptocurrencies } from '@/lib/data';
import { SubmissionsClientPage } from './SubmissionsClientPage'; // Client component for table interactions

export default async function AdminSubmissionsPage() {
  const submissions = await fetchAllSubmissionsForAdmin();
  const categories = await getCategories();
  const cryptos = await getCryptocurrencies();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-headline tracking-tight">Manage Submissions</h1>
        {/* Add New Submission button could go here if admin can also create submissions */}
      </div>
      <SubmissionsClientPage initialSubmissions={submissions} categories={categories} cryptocurrencies={cryptos} />
    </div>
  );
}
