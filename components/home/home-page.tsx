import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BarChart3,
  DollarSign,
  FileText,
  IndianRupee,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type HomePageProps = {
  configuration?: {
    name?: string | null;
    logo?: string | null;
  };
};

export default function HomePage({ configuration }: HomePageProps) {
  const companyName = configuration?.name || "";
  const logo = configuration?.logo || "";

  return (
    <div className="min-h-screen overflow-hidden bg-[#F5F7FB] text-slate-800">
      <div className="absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-blue-100 opacity-70 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-[350px] w-[350px] rounded-full bg-indigo-100 opacity-60 blur-3xl" />

      <div className="relative z-10 px-6 py-8 md:px-12 lg:px-20">
        <header className="mb-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {logo ? (
              <Image
                src={logo}
                alt={companyName}
                width={48}
                height={48}
                className="rounded-xl shadow-md"
              />
            ) : null}
            <h1 className="text-2xl font-bold uppercase tracking-wide">
              {companyName}
            </h1>
          </div>
        </header>

        <section className="mb-24 grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="mb-4 font-medium text-blue-600">
              Financial Operations Simplified
            </p>

            <h2 className="text-5xl font-bold leading-tight md:text-6xl">
              One Portal for
              <span className="block text-blue-600">Revenue & Billing</span>
            </h2>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-500">
              Manage revenue streams, billing workflows, and profit analysis in
              one clean and reliable workspace.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Button
                asChild
                size="lg"
                className="rounded-2xl bg-blue-600 px-7 text-white hover:bg-blue-700"
              >
                <Link href="/admin/dashboard?tab=revenue">
                  Open Revenue Dashboard
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-2xl px-7"
              >
                <Link href="/admin/dashboard?tab=pl">Open P&amp;L</Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <Card className="rounded-3xl border-none bg-white shadow-xl">
              <CardContent className="p-8">
                <div className="grid gap-5">
                  <div className="flex items-center justify-between rounded-2xl bg-blue-50 p-5">
                    <div>
                      <h4 className="font-semibold">Revenue Tracking</h4>
                      <p className="text-sm text-slate-500">
                        Monitor payments &amp; collections
                      </p>
                    </div>
                    <DollarSign className="text-blue-600" />
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-indigo-50 p-5">
                    <div>
                      <h4 className="font-semibold">Profit &amp; Loss</h4>
                      <p className="text-sm text-slate-500">
                        Analyze performance
                      </p>
                    </div>
                    <BarChart3 className="text-indigo-600" />
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-sky-50 p-5">
                    <div>
                      <h4 className="font-semibold">Billing Management</h4>
                      <p className="text-sm text-slate-500">
                        Organize billing cycles
                      </p>
                    </div>
                    <FileText className="text-sky-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="absolute -top-6 -left-9 flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-lg">
              <TrendingUp className="text-green-500" />
              <div>
                <p className="text-sm font-semibold">Smarter Decisions</p>
                <p className="text-xs text-slate-500">Data-driven insights</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-24 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: IndianRupee,
              title: "Revenue Tracking",
              desc: "Track all financial activities in real time.",
            },
            {
              icon: BarChart3,
              title: "P&L Insights",
              desc: "Understand profitability clearly.",
            },
            {
              icon: FileText,
              title: "Billing Control",
              desc: "Manage billing efficiently.",
            },
          ].map((item, index) => (
            <Card
              key={item.title}
              className={`rounded-3xl border-none shadow-md transition-all hover:shadow-xl ${
                index === 1 ? "md:-mt-6" : ""
              }`}
            >
              <CardContent className="p-8">
                <item.icon className="mb-4 h-8 w-8 text-blue-600" />
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 text-slate-500">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="flex flex-col items-center justify-between rounded-[32px] bg-white p-10 shadow-lg md:flex-row">
          <div>
            <h3 className="text-3xl font-bold">Ready to manage finances?</h3>
            <p className="mt-2 text-slate-500">
              Access your dashboards and insights instantly.
            </p>
          </div>

          <Button
            asChild
            size="lg"
            className="mt-5 rounded-2xl bg-blue-600 hover:bg-blue-700 md:mt-0"
          >
            <Link href="/admin/dashboard?tab=pl">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </section>

        <footer className="mt-12 text-center text-sm text-slate-500">
          Copyright {new Date().getFullYear()} {companyName}. All rights
          reserved.
        </footer>
      </div>
    </div>
  );
}
