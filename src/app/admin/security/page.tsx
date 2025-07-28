import SecuritySettings from "@/components/admin/security/SecuritySettings";

export default function SecurityPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Security Settings</h1>
      </div>
      
      <SecuritySettings />
    </div>
  );
}
