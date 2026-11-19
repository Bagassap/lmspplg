import { PklMobileTabs } from "@/components/magang/PklMobileTabs";

export default function GuruMagangLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PklMobileTabs role="guru" />
      {children}
    </>
  );
}
