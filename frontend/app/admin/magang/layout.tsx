import { PklMobileTabs } from "@/components/magang/PklMobileTabs";

export default function AdminMagangLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PklMobileTabs role="admin" />
      {children}
    </>
  );
}
