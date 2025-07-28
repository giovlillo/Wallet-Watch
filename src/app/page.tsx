
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WalletSubmissionForm from '@/components/WalletSubmissionForm';
import RecentSubmissionsTable from '@/components/RecentSubmissionsTable';
import { getCategories, getCryptocurrencies, getPublicSubmissions } from '@/lib/data';
import HomePageWrapper from '@/components/HomePageWrapper';

export default async function Home() {
  const categories = await getCategories();
  const cryptocurrencies = await getCryptocurrencies();
  const recentSubmissions = await getPublicSubmissions({ limit: 10 });

  return (
    <HomePageWrapper>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
          <section id="submit-report" className="mb-12 md:mb-16">
            <WalletSubmissionForm categories={categories} cryptocurrencies={cryptocurrencies} />
          </section>
          
          <section id="recent-submissions" className="mb-12">
            <RecentSubmissionsTable 
              initialSubmissions={recentSubmissions} 
              categories={categories} 
              cryptocurrencies={cryptocurrencies}
              showReason={false}
              clickableAddress={false}
            />
          </section>
        </main>
        <Footer />
      </div>
    </HomePageWrapper>
  );
}
