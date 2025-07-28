
import Link from 'next/link';
import LogoIcon from '@/components/icons/LogoIcon';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react'; // Added Search icon

export default function Header() {
  return (
    <header className="py-4 px-6 border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-primary hover:text-primary/90 transition-colors">
          <LogoIcon className="h-7 w-7" />
          <span className="font-headline">Wallet Watch</span>
        </Link>
        <nav className="flex items-center gap-1 md:gap-2"> {/* Reduced gap slightly for smaller screens if needed */}
          <Button variant="ghost" asChild>
            <Link href="/#submit-report">Submit Report</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/search">
              <Search className="h-4 w-4 mr-0 md:mr-2" /> {/* Icon only on small screens */}
              <span className="hidden md:inline">Explore Reports</span>
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
