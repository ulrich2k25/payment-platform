import type { ReactNode } from "react";

import { MerchantDashboardShell } from "@/components/merchant/merchant-dashboard-shell";
import { requireMerchant } from "@/lib/merchant-auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const session = await requireMerchant();

  return (
    <MerchantDashboardShell
      companyName={session.merchant.name}
      email={session.user.email}
    >
      {children}
    </MerchantDashboardShell>
  );
}
