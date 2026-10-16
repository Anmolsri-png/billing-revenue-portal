"use client";

import { useEffect, useState } from "react";
import { getRevenueByCompany } from "@/lib/actions/revenue";

interface CompanyRevenue {
  companyName: string;
  billed: number;
  collected: number;
  overdue: number;
}

export default function RevenueByCompany() {
  const [data, setData] = useState<CompanyRevenue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getRevenueByCompany();
        setData(result);
      } catch (error) {
        console.error("Failed to fetch company revenue:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

  if (loading) {
    return <div className="p-4 text-gray-500">Loading revenue data...</div>;
  }

  if (data.length === 0) {
    return <div className="p-4 text-gray-500">No revenue data available.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="py-2 px-3">Company</th>
            <th className="py-2 px-3">Billed</th>
            <th className="py-2 px-3">Collected</th>
            <th className="py-2 px-3">Outstanding</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className="border-b hover:bg-gray-50">
              <td className="py-2 px-3 font-medium">{row.companyName}</td>
              <td className="py-2 px-3">{formatCurrency(row.billed)}</td>
              <td className="py-2 px-3 text-green-600">{formatCurrency(row.collected)}</td>
              <td className="py-2 px-3 text-yellow-600">{formatCurrency(row.overdue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}