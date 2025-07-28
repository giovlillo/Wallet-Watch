export default function Footer() {
  return (
    <footer className="py-6 px-6 border-t border-border mt-auto">
      <div className="container mx-auto text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} Wallet Watch. All rights reserved.</p>
        <p className="mt-1">
          Disclaimer: Information provided is community-sourced and for informational purposes only.
          Always do your own research before interacting with any wallet address.
        </p>
      </div>
    </footer>
  );
}
