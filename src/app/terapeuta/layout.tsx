import TerapeutaNav from "./TerapeutaNav";

export default function TerapeutaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <TerapeutaNav />
    </>
  );
}
