import POForm from "@/components/purchase-order/purchase-order-form";
import { getPurchaseOrderById } from "@/lib/actions/purschase-order";
import { getBillingPlans } from "@/lib/actions/billing-plan";
import { getContractTypes } from "@/lib/actions/contract-type";
import { getServiceTypes } from "@/lib/actions/service-type";
import { getCustomers } from "@/lib/actions/customer";
import { BillingPlan, Company, Customer, Vendor } from "@/types";
import { getContractDurations } from "@/lib/actions/contract-duration";
import { getCompanys } from "@/lib/actions/company";
import { getVendors } from "@/lib/actions/vendor";
import { canAccess } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { EditPageShell } from "@/components/ui/edit-page-shell";
import { IndianRupee } from "lucide-react";

interface EditPOPageProps {
  params: Promise<{ id: string }>; // params is now a Promise
}

const EditPOPage = async ({ params }: EditPOPageProps) => {
  const billingPlan = await getBillingPlans()
  const contractType = await getContractTypes()
  const serviceType = await getServiceTypes()
  const customers = await getCustomers()
  const vendors = await getVendors()
  const contractDurations = await getContractDurations()
  const companies = await getCompanys()

  const { id } = await params;

  const po = await getPurchaseOrderById(id);

  const route = "/admin/revenue";
  const canEdit = await canAccess(route, "edit")
  if (!canEdit) {
    redirect("/404");
  }

  return (
    <EditPageShell
      title="Edit Revenue"
      backHref="/admin/revenue"
      eyebrow="Revenue Record"
      icon={IndianRupee}
    >
      <POForm
        data={JSON.parse(JSON.stringify(po.data))}
        update={true}
        companies={companies as Company[]}
        billingPlan={billingPlan as BillingPlan[]}
        contractType={contractType}
        serviceType={serviceType}
        customers={customers as Customer[]}
        vendors={vendors as Vendor[]}
        contractDurations={contractDurations}
      />
    </EditPageShell>
  );
};

export default EditPOPage;
