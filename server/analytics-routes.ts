import type { Express } from "express";
import { storage } from "./storage";
import { isAuthenticated } from "./replitAuth";

export function registerAnalyticsRoutes(app: Express) {
  // Analytics Overview
  app.get("/api/analytics/overview", isAuthenticated, async (req: any, res) => {
    try {
      const timeRange = req.query.timeRange || "30d";
      const userId = req.user.claims.sub;
      
      // Get overview metrics
      const overview = await storage.getAnalyticsOverview(userId, timeRange);
      res.json(overview);
    } catch (error) {
      console.error("Error fetching analytics overview:", error);
      res.status(500).json({ message: "Failed to fetch analytics overview" });
    }
  });

  // Revenue Analytics
  app.get("/api/analytics/revenue", isAuthenticated, async (req: any, res) => {
    try {
      const timeRange = req.query.timeRange || "30d";
      const userId = req.user.claims.sub;
      
      const revenueData = await storage.getRevenueAnalytics(userId, timeRange);
      res.json(revenueData);
    } catch (error) {
      console.error("Error fetching revenue analytics:", error);
      res.status(500).json({ message: "Failed to fetch revenue analytics" });
    }
  });

  // Booking Analytics
  app.get("/api/analytics/bookings", isAuthenticated, async (req: any, res) => {
    try {
      const timeRange = req.query.timeRange || "30d";
      const userId = req.user.claims.sub;
      
      const bookingsData = await storage.getBookingAnalytics(userId, timeRange);
      res.json(bookingsData);
    } catch (error) {
      console.error("Error fetching booking analytics:", error);
      res.status(500).json({ message: "Failed to fetch booking analytics" });
    }
  });

  // Performance Metrics
  app.get("/api/analytics/performance", isAuthenticated, async (req: any, res) => {
    try {
      const timeRange = req.query.timeRange || "30d";
      const userId = req.user.claims.sub;
      
      const performanceMetrics = await storage.getPerformanceMetrics(userId, timeRange);
      res.json(performanceMetrics);
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
      res.status(500).json({ message: "Failed to fetch performance metrics" });
    }
  });

  // Customer Insights
  app.get("/api/analytics/customers", isAuthenticated, async (req: any, res) => {
    try {
      const timeRange = req.query.timeRange || "30d";
      const userId = req.user.claims.sub;
      
      const customerInsights = await storage.getCustomerInsights(userId, timeRange);
      res.json(customerInsights);
    } catch (error) {
      console.error("Error fetching customer insights:", error);
      res.status(500).json({ message: "Failed to fetch customer insights" });
    }
  });

  // Service Analytics
  app.get("/api/analytics/services", isAuthenticated, async (req: any, res) => {
    try {
      const timeRange = req.query.timeRange || "30d";
      const userId = req.user.claims.sub;
      
      const serviceAnalytics = await storage.getServiceAnalytics(userId, timeRange);
      res.json(serviceAnalytics);
    } catch (error) {
      console.error("Error fetching service analytics:", error);
      res.status(500).json({ message: "Failed to fetch service analytics" });
    }
  });

  // Competitor Analysis
  app.get("/api/analytics/competitors", isAuthenticated, async (req: any, res) => {
    try {
      const timeRange = req.query.timeRange || "30d";
      
      // This would typically come from market research APIs or third-party data
      const competitorData = {
        marketPosition: 3,
        marketShare: "22%",
        averagePricing: "$195",
        competitorComparison: [
          { name: "StyleHub", marketShare: "28%", avgPrice: "$180", rating: "4.3", growth: "-2%" },
          { name: "BeautyConnect", marketShare: "35%", avgPrice: "$165", rating: "4.1", growth: "+5%" },
          { name: "Byootify", marketShare: "22%", avgPrice: "$195", rating: "4.8", growth: "+23%" },
        ],
        strengths: ["Higher customer satisfaction", "Premium pricing", "Rapid growth"],
        opportunities: ["Market share expansion", "Service diversification", "Geographic expansion"]
      };
      
      res.json(competitorData);
    } catch (error) {
      console.error("Error fetching competitor analysis:", error);
      res.status(500).json({ message: "Failed to fetch competitor analysis" });
    }
  });

  // Export Analytics Report
  app.post("/api/analytics/export", isAuthenticated, async (req: any, res) => {
    try {
      const { timeRange, reportType, format } = req.body;
      const userId = req.user.claims.sub;
      
      // Generate comprehensive report
      const reportData = await storage.generateAnalyticsReport(userId, timeRange, reportType);
      
      // In a real implementation, you'd generate PDF/CSV/Excel file
      res.json({
        success: true,
        downloadUrl: `/api/reports/${reportData.id}`,
        reportId: reportData.id,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error generating analytics report:", error);
      res.status(500).json({ message: "Failed to generate analytics report" });
    }
  });

  // Real-time Analytics Updates
  app.get("/api/analytics/realtime", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const realtimeData = await storage.getRealtimeAnalytics(userId);
      res.json(realtimeData);
    } catch (error) {
      console.error("Error fetching realtime analytics:", error);
      res.status(500).json({ message: "Failed to fetch realtime analytics" });
    }
  });

  // Predictive Analytics
  app.get("/api/analytics/predictions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const period = req.query.period || "30d";
      
      const predictions = await storage.getPredictiveAnalytics(userId, period);
      res.json(predictions);
    } catch (error) {
      console.error("Error fetching predictive analytics:", error);
      res.status(500).json({ message: "Failed to fetch predictive analytics" });
    }
  });
}