import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n"; // Initialize i18n

// Add comprehensive error handling specifically for Stripe.js issues
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Check if this is a Stripe-related error
  const reason = event.reason;
  if (reason && (
    (typeof reason === 'string' && reason.includes('Stripe')) ||
    (reason.message && reason.message.includes('Stripe')) ||
    (reason.message && reason.message.includes('stripe'))
  )) {
    console.warn('Stripe.js loading issue detected - payment functionality may be limited');
    // Prevent this from crashing the app
    event.preventDefault();
    return;
  }
  
  // For other promise rejections, log but don't prevent default
  console.error('Promise rejection details:', event);
});

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }
  
  // React app is now working properly, removed debug content
  
  console.log("Mounting React app...");
  const root = createRoot(rootElement);
  root.render(<App />);
  console.log("React app mounted successfully");
  
  // Check if content is actually rendered after a short delay
  setTimeout(() => {
    const hasContent = rootElement.children.length > 0;
    console.log("Content rendered:", hasContent);
    console.log("Root element HTML:", rootElement.innerHTML.substring(0, 200));
    if (!hasContent) {
      console.warn("React app mounted but no content rendered");
    }
  }, 1000);
  
} catch (error) {
  console.error("Failed to mount React app:", error);
  document.getElementById("root")!.innerHTML = `<div style="padding: 20px; background: #fee; color: #c00; font-family: monospace;">
    <h2>Application Error</h2>
    <p>Failed to load the application: ${error instanceof Error ? error.message : 'Unknown error'}</p>
    <p>Please refresh the page or contact support.</p>
  </div>`;
}
