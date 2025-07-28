import { getCryptocurrencies } from '@/lib/actions/cryptocurrencyActions';
import { CryptocurrenciesClientPage } from './CryptocurrenciesClientPage';

export default async function AdminCryptocurrenciesPage() {
  const cryptocurrencies = await getCryptocurrencies();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-headline tracking-tight">Manage Cryptocurrencies</h1>
      <CryptocurrenciesClientPage initialCryptocurrencies={cryptocurrencies} />
    </div>
  );
}
