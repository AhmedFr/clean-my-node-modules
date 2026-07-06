import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function BlogLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Navbar />
      <main className="pb-[110px] pt-[72px]">{children}</main>
      <Footer />
    </>
  );
}
