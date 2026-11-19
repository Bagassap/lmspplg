import { PklMobileTabs } from "@/components/magang/PklMobileTabs";

export default function SiswaMagangLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PklMobileTabs role="siswa" />
      {children}
    </>
  );
}
