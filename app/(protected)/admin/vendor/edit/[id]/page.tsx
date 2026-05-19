import { Handshake } from "lucide-react";
import { redirect } from "next/navigation";

import VendorForm from "@/components/vendor/vendor-form";
import { EditPageShell } from "@/components/ui/edit-page-shell";
import { getVendorById } from "@/lib/actions/vendor";
import { canAccess } from "@/lib/rbac";

interface EditVendorPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditVendorPage({ params }: EditVendorPageProps) {
  const route = "/admin/vendor";
  const canEdit = await canAccess(route, "edit");
  if (!canEdit) {
    redirect("/404");
  }

  const { id } = await params;
  const vendor = await getVendorById(id);

  if (!vendor.success || !vendor.data) {
    redirect("/admin/vendor");
  }

  return (
    <EditPageShell
      title="Edit Vendor"
      backHref="/admin/vendor"
      eyebrow="Vendor Record"
      icon={Handshake}
    >
      <VendorForm
        data={JSON.parse(JSON.stringify(vendor.data))}
        update={true}
      />
    </EditPageShell>
  );
}
