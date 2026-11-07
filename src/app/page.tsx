import PortfolioNav from "@/components/portfolio/PortfolioNav";
import PortfolioHero from "@/components/portfolio/PortfolioHero";
import PortfolioStory from "@/components/portfolio/PortfolioStory";
import PortfolioMenu from "@/components/portfolio/PortfolioMenu";
import PortfolioEvents from "@/components/portfolio/PortfolioEvents";
import PortfolioCollaboration from "@/components/portfolio/PortfolioCollaboration";
import PortfolioFooter from "@/components/portfolio/PortfolioFooter";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#15100c] text-[#fbf7f0] selection:bg-amber-500 selection:text-black">
      <PortfolioNav />
      <PortfolioHero />
      <PortfolioStory />
      <PortfolioMenu />
      <PortfolioEvents />
      <PortfolioCollaboration />
      <PortfolioFooter />
    </main>
  );
}
