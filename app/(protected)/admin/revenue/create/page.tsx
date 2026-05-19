import POForm from "@/components/purchase-order/purchase-order-form";
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
import { CreatePageShell } from "@/components/ui/create-page-shell";

const POCreatePage = async () => {
  const billingPlan = await getBillingPlans()
  const contractType = await getContractTypes()
  const serviceType = await getServiceTypes()
  const customers = await getCustomers()
  const vendors = await getVendors()
  const contractDurations = await getContractDurations()
  const companies = await getCompanys()

  const route = "/admin/revenue";
  const canCreate = await canAccess(route, "create")
  if (!canCreate) {
    redirect("/404");
  }

  return (
    <CreatePageShell
      title="Add Revenue"
      backHref="/admin/revenue"
    >
      <POForm
        update={false}
        companies={companies as Company[]}
        billingPlan={billingPlan as BillingPlan[]}
        contractType={contractType}
        serviceType={serviceType}
        customers={customers as Customer[]}
        vendors={vendors as Vendor[]}
        contractDurations={contractDurations}
      />
    </CreatePageShell>
  );
};

export default POCreatePage;
