import MobileSearch from "@/components/mobile-search";
import MobileResponsiveWrapper from "@/components/mobile-responsive-wrapper";

export default function MobileSearchPage() {
  return (
    <MobileResponsiveWrapper>
      <div className="py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Find Providers</h1>
        <MobileSearch />
      </div>
    </MobileResponsiveWrapper>
  );
}