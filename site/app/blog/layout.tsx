import "./blog.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function BlogLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Navbar />
      <main className="blog-main">{children}</main>
      <Footer />
    </>
  );
}
