import { getCategories } from '@/lib/actions/categoryActions';
import { CategoriesClientPage } from './CategoriesClientPage';

export default async function AdminCategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-headline tracking-tight">Manage Categories</h1>
      <CategoriesClientPage initialCategories={categories} />
    </div>
  );
}
