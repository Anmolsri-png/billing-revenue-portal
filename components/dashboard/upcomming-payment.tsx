"use client";

import { useEffect, useState } from "react";
import { getUpcomingPayments } from "@/lib/actions/revenue";

interface Payment { 
  invoiceNumber: string;
  paymentDueDate: Date | null;
  invoiceAmount: number | null;
}

export default function UpcomingPayments() {
  const [data, setData] = useState<Payment[]>([]);

  useEffect(() => {
    getUpcomingPayments().then(setData);
  }, []);

  return (
    <div className="space-y-2">
      {data.length === 0 ? (
        <div className="text-center text-gray-500 py-6">
          No records found
        </div>
      ) : (
        data.map((p, i) => (
          <div
            key={i}
            className="flex justify-between p-2 border rounded"
          >
            <div>
              <p className="text-sm font-medium">
                {p.invoiceNumber}
              </p>
              <p className="text-xs text-gray-500">
                Due: {p.paymentDueDate
                  ? new Date(p.paymentDueDate).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
            <div className="font-semibold">
              ₹{Number(p.invoiceAmount || 0).toFixed(2)}
            </div>
          </div>
        ))
      )}
    </div>
  );
}