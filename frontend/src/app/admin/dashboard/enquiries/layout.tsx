import type { ReactNode } from "react";

export const metadata = {
  title: "Admission Enquiries | Admin Dashboard",
  description: "Manage school admission enquiries.",
};

export default function AdmissionEnquiriesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
