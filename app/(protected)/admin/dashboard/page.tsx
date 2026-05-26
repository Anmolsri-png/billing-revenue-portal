import { getProjects } from "@/lib/actions/project";
import { getCompanys } from "@/lib/actions/company";
import { getCustomers } from "@/lib/actions/customer";
import { PLDashboardComponent } from "@/components/pl/pl-dashboard-component";
import PurchaseOrderDashboard from "@/components/purchase-order/purchase-order-dashboard";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }> | { tab?: string };
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const projects = await getProjects();
  const companies = await getCompanys();
  const customers = await getCustomers();
  const customerOptions = customers.map((customer) => {
    const fullName = [customer.firstName, customer.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    return {
      id: customer.id,
      name:
        customer.companyName?.trim() ||
        fullName ||
        customer.customerCode ||
        "-",
    };
  });

  const currentTab =
    resolvedSearchParams?.tab === "revenue" ? "revenue" : "pl";

  if (currentTab === "revenue") {
    return (
      <PurchaseOrderDashboard
        companies={JSON.parse(JSON.stringify(companies))}
        customers={JSON.parse(JSON.stringify(customerOptions))}
      />
    );
  }

  return (
    <PLDashboardComponent
      companies={JSON.parse(JSON.stringify(companies))}
      projects={JSON.parse(JSON.stringify(projects))}
    />
  );
}
