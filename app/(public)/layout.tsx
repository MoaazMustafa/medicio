import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

export const metadata = {
  title: "Medicio — AI-Powered Healthcare Access Platform",
  description: "Connecting patients with doctors, hospitals, labs, and pharmacies.",
};

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
