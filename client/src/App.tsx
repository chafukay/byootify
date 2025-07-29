import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { SimpleToaster } from "@/components/simple-toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { RTLWrapper } from "@/components/language-switcher";
import { TestComponent } from "@/components/test-component";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import SearchNew from "@/pages/search-new";
import Shop from "@/pages/shop";
import Cart from "@/pages/cart";
import ShopCheckout from "@/pages/shop-checkout";
import ProfessionalProfile from "@/pages/professional-profile";
import Booking from "@/pages/booking";
import AdvancedBooking from "@/pages/advanced-booking";
import ProfessionalOnboarding from "@/pages/professional-onboarding";
import ProfessionalDashboard from "@/pages/professional-dashboard-clean";
import SuperAdminDashboard from "@/pages/super-admin-dashboard";
import Checkout from "@/pages/checkout";
import BookingConfirmation from "@/pages/booking-confirmation";
import Orders from "@/pages/orders";
import Messages from "@/pages/messages";
import VideoCall from "@/pages/video-call";
import NotificationsPage from "@/pages/notifications";
import MobileHome from "@/pages/mobile-home";
import AnalyticsDashboard from "@/pages/analytics-dashboard";
import SystemDashboard from "@/pages/system-dashboard";
import ProviderGrowthPage from "@/pages/provider-growth";
import Phase1MVP from "@/pages/phase-1-mvp";
import Phase2TrustSafety from "@/pages/phase-2-trust-safety";
import Phase3PaymentPayout from "@/pages/phase-3-payment-payout";
import Phase4AutomationCommunication from "@/pages/phase-4-automation-communication";
import AITranslationDemo from "@/pages/ai-translation-demo";
import ByootifyUniversity from "@/pages/byootify-university";
import DeploymentDashboard from "@/pages/deployment-dashboard";
import MobileAppDevelopment from "@/pages/mobile-app-development";
import Jobs from "@/pages/jobs";
import MyBookings from "@/pages/bookings";
import Analytics from "@/pages/analytics";
import { useMobile } from "@/hooks/use-mobile";
import "./i18n";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isMobile } = useMobile();
  
  console.log("Router rendering:", { isAuthenticated, isLoading, isMobile });

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={isMobile ? MobileHome : Landing} />
          <Route path="/search" component={SearchNew} />
          <Route path="/shop" component={Shop} />
          <Route path="/cart" component={Cart} />
          <Route path="/shop-checkout" component={ShopCheckout} />
          <Route path="/provider/:id" component={ProfessionalProfile} />
          <Route path="/phase-1-mvp" component={Phase1MVP} />
          <Route path="/phase-2-trust-safety" component={Phase2TrustSafety} />
          <Route path="/phase-3-payment-payout" component={Phase3PaymentPayout} />
          <Route path="/phase-4-automation-communication" component={Phase4AutomationCommunication} />
          <Route path="/ai-translation-demo" component={AITranslationDemo} />
          <Route path="/byootify-university" component={ByootifyUniversity} />
          <Route path="/deployment-dashboard" component={DeploymentDashboard} />
          <Route path="/mobile-app-development" component={MobileAppDevelopment} />
        </>
      ) : (
        <>
          <Route path="/" component={isMobile ? MobileHome : Home} />
          <Route path="/search" component={SearchNew} />
          <Route path="/jobs" component={Jobs} />
          <Route path="/shop" component={Shop} />
          <Route path="/cart" component={Cart} />
          <Route path="/shop-checkout" component={ShopCheckout} />
          <Route path="/provider/:id" component={ProfessionalProfile} />
          <Route path="/booking/:providerId" component={Booking} />
          <Route path="/advanced-booking/:providerId" component={AdvancedBooking} />
          <Route path="/checkout/:bookingId" component={Checkout} />
          <Route path="/booking-confirmation" component={BookingConfirmation} />
          <Route path="/onboarding/provider" component={ProfessionalOnboarding} />
          <Route path="/dashboard" component={ProfessionalDashboard} />
          <Route path="/bookings" component={MyBookings} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/provider-growth" component={ProviderGrowthPage} />
          <Route path="/super-admin" component={SuperAdminDashboard} />
          <Route path="/orders" component={Orders} />
          <Route path="/business-analytics" component={AnalyticsDashboard} />
          <Route path="/system-dashboard" component={SystemDashboard} />
          <Route path="/messages" component={Messages} />
          <Route path="/messages/:conversationId" component={Messages} />
          <Route path="/video-call/:callId" component={VideoCall} />
          <Route path="/notifications" component={NotificationsPage} />
          <Route path="/phase-1-mvp" component={Phase1MVP} />
          <Route path="/phase-2-trust-safety" component={Phase2TrustSafety} />
          <Route path="/phase-3-payment-payout" component={Phase3PaymentPayout} />
          <Route path="/phase-4-automation-communication" component={Phase4AutomationCommunication} />
          <Route path="/ai-translation-demo" component={AITranslationDemo} />
          <Route path="/byootify-university" component={ByootifyUniversity} />
          <Route path="/deployment-dashboard" component={DeploymentDashboard} />
          <Route path="/mobile-app-development" component={MobileAppDevelopment} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  console.log("App component rendering...");
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RTLWrapper>
          <div style={{ 
            minHeight: "100vh", 
            background: "#f8f9fa", 
            padding: "20px",
            fontFamily: "Arial, sans-serif",
            display: "block",
            position: "relative",
            zIndex: 1
          }}>
            {/* App is now working properly - removed debug components */}
            <SimpleToaster />
            <Router />
          </div>
        </RTLWrapper>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
