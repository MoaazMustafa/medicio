import { Button, Card, Chip } from "@heroui/react";
import { CheckCircle2, Database, Globe, Sparkles } from "lucide-react";

export const metadata = {
  title: "Scraper Engine",
  description: "Configure and run public clinical directory scrapers.",
};

export default function AdminScrapersPage() {
  return (
    <section className="w-full flex flex-col min-h-[calc(100vh-4rem)] p-4 md:p-8 max-w-[1600px] mx-auto gap-6">
      <Card className="p-6 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-6 shadow-lg">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-custom pb-4">
          <div>
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <Globe className="w-6 h-6 text-primary" />
              <span>Data Aggregation & Scraper Engine (M11)</span>
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              Super Admin automated web crawlers for Facebook, Google Maps & public medical listing sites with deduplication.
            </p>
          </div>

          <Button variant="primary" className="text-xs font-semibold px-4 flex items-center gap-1.5 w-fit">
            <Database className="w-4 h-4" />
            Trigger Scraper Job
          </Button>
        </div>

        {/* Per-Entity Crawlers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: "Doctor Scraper", target: "Public Registries & Clinic Sites", status: "Idle", badge: "Doctor", count: "1,420 Records" },
            { name: "Hospital Scraper", target: "Hospital Directories & Specialities", status: "Scheduled", badge: "Hospital", count: "650 Records" },
            { name: "Pharmacy Scraper", target: "Local Pharmacy Listings", status: "Idle", badge: "Pharmacy", count: "2,100 Records" },
            { name: "Lab Center Scraper", target: "Diagnostic Test Centers", status: "Idle", badge: "Lab", count: "650 Records" },
          ].map((item) => (
            <Card key={item.name} className="p-5 border border-border-custom bg-background-custom/40 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-primary">{item.badge}</span>
                <Chip variant="soft" className="text-[10px] font-mono">{item.status}</Chip>
              </div>
              <h4 className="text-sm font-bold text-text-primary">{item.name}</h4>
              <p className="text-xs text-text-secondary">Source: {item.target}</p>
              <span className="text-xs font-mono font-semibold text-text-primary pt-1">{item.count}</span>
            </Card>
          ))}
        </div>

        {/* Roadmap & Coming Soon Bullet Points */}
        <div className="mt-4 p-6 border border-border-custom bg-background-custom/30 rounded-xl flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-border-custom/60 pb-3">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-text-primary">Upcoming Scraper Engine Features (Roadmap)</h3>
            <Chip variant="soft" color="accent" className="text-[10px] font-mono ml-auto">
              Coming Soon
            </Chip>
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-text-secondary">
            <li className="flex items-start gap-2 p-3 rounded-lg bg-surface/50 border border-border-custom/50">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-text-primary block mb-0.5">Google Maps & Facebook Crawler Adapters</strong>
                Structured scraper parser adapters translating public place listings into standard `ScrapedRecord` entities.
              </div>
            </li>
            <li className="flex items-start gap-2 p-3 rounded-lg bg-surface/50 border border-border-custom/50">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-text-primary block mb-0.5">Automated Address & License Deduplication</strong>
                Deterministic deduplication engine prioritizing registered/verified profiles over unverified web listings.
              </div>
            </li>
            <li className="flex items-start gap-2 p-3 rounded-lg bg-surface/50 border border-border-custom/50">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-text-primary block mb-0.5">Geo-Radius Radius Crawler Configurator</strong>
                Configurable scraping radius control panel with interactive map target selection.
              </div>
            </li>
            <li className="flex items-start gap-2 p-3 rounded-lg bg-surface/50 border border-border-custom/50">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-text-primary block mb-0.5">Scraped-to-Verified Claim Conversion</strong>
                Self-service claim flow allowing unclaimed doctor/hospital listings to be verified by real managers.
              </div>
            </li>
          </ul>
        </div>
      </Card>
    </section>
  );
}
