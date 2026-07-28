import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

/** Marketing and guest-auth pages: top navbar + footer. */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow w-full">{children}</main>
      <Footer />
    </div>
  );
}
