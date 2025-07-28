import { AccountClientPage } from './AccountClientPage';
import { getAdminAccountDetails, getLoginSettings } from '@/lib/actions/adminActions';
import { requireAdminAuth } from '@/lib/actions/authActions';

export default async function AdminAccountPage() {
  await requireAdminAuth(); // Protect the route
  const userDetails = await getAdminAccountDetails();
  const loginSettings = await getLoginSettings();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-headline tracking-tight">Account Management</h1>
      <p className="text-muted-foreground">
        Manage your administrator account settings and security features.
      </p>
      <AccountClientPage userDetails={userDetails} loginSettings={loginSettings} />
    </div>
  );
}
