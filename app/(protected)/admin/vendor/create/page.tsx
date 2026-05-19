import { redirect } from "next/navigation";

import VendorForm from "@/components/vendor/vendor-form";
import { CreatePageShell } from "@/components/ui/create-page-shell";
import { canAccess } from "@/lib/rbac";

export default async function CreateVendorPage() {
  const route = "/admin/vendor";
  const canCreate = await canAccess(route, "create");
  if (!canCreate) {
    redirect("/404");
  }

  return (
    <CreatePageShell
      title="Add Vendor"
      backHref="/admin/vendor"
    >
      <VendorForm update={false} />
    </CreatePageShell>
  );
}
