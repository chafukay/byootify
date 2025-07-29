import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { eq, and } from "drizzle-orm";
import { 
  tokenPackages, 
  activeBoosts, 
  providerVerifications, 
  professionalReferences, 
  trustScores
} from "../shared/schema";
import { db } from "./db";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertProfessionalSchema, 
  insertServiceSchema, 
  insertBookingSchema, 
  insertReviewSchema,
  insertProviderTokenSchema,
  insertTokenTransactionSchema,
  insertFeeStructureSchema,
  insertJobRequestSchema,
  insertProviderBidSchema,
  insertProviderCertificationSchema,
  insertProviderReferenceSchema
} from "@shared/schema";
import { z } from "zod";

// Production middleware imports
import { 
  generalRateLimit, 
  authRateLimit, 
  apiRateLimit, 
  securityHeaders, 
  validateBooking,
  validateReview,
  validateProfessional,
  handleValidationErrors,
  sanitizeInput,
  requestLogger,
  errorHandler
} from "./middleware/security";
import { 
  compressionMiddleware, 
  apiCache, 
  performanceMonitor, 
  assetOptimization,
  memoryMonitor
} from "./middleware/performance";
import { 
  metricsMiddleware, 
  analyticsTracker, 
  errorTracker,
  healthCheck,
  performanceAlerter,
  logger
} from "./middleware/monitoring";
import { backupManager, DisasterRecovery } from "./middleware/backup";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing required OpenAI API key: OPENAI_API_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Production middleware setup
  app.use(securityHeaders);
  app.use(compressionMiddleware);
  app.use(requestLogger);
  app.use(sanitizeInput);
  app.use(performanceMonitor);
  app.use(metricsMiddleware);
  app.use(analyticsTracker);
  app.use(assetOptimization);

  // Rate limiting
  // Disable rate limiting in development to prevent UI blocking
  if (process.env.NODE_ENV === 'production') {
    app.use(generalRateLimit);
  }
  // Disable all rate limiting in development
  if (process.env.NODE_ENV === 'production') {
    app.use('/api/auth', authRateLimit);
    app.use('/api', apiRateLimit);
  }

  // Caching for specific routes
  app.use('/api/professionals/featured', apiCache.middleware());
  app.use('/api/services', apiCache.middleware());

  // Auth middleware
  await setupAuth(app);

  // Production health and monitoring endpoints
  app.get('/health', async (req, res) => {
    try {
      const health = await healthCheck();
      res.status(health.status === 'healthy' ? 200 : 503).json(health);
    } catch (error) {
      res.status(503).json({ status: 'unhealthy', error: 'Health check failed' });
    }
  });

  app.get('/api/system/backup-status', isAuthenticated, async (req, res) => {
    try {
      const status = backupManager.getBackupStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get backup status' });
    }
  });

  app.post('/api/system/create-backup', isAuthenticated, async (req, res) => {
    try {
      const result = await backupManager.createFullBackup();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create backup' });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Provider dashboard endpoints
  app.get("/api/providers/me", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const professional = await storage.getProfessionalByUserId(userId);
      if (!professional) {
        return res.status(404).json({ message: "Professional profile not found" });
      }
      res.json(professional);
    } catch (error) {
      console.error("Error fetching professional:", error);
      res.status(500).json({ message: "Failed to fetch professional" });
    }
  });

  // Compatibility alias for frontend
  app.get("/api/professionals/me", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const professional = await storage.getProfessionalByUserId(userId);
      if (!professional) {
        return res.status(404).json({ message: "Professional profile not found" });
      }
      res.json(professional);
    } catch (error) {
      console.error("Error fetching professional:", error);
      res.status(500).json({ message: "Failed to fetch professional" });
    }
  });

  // Smart Notification System Endpoints
  const { notificationService } = await import('./notification-service');

  // Get user notifications
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { category, unreadOnly, limit, offset } = req.query;
      
      const notifications = await notificationService.getUserNotifications(userId, {
        category: category as string,
        unreadOnly: unreadOnly === 'true',
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });
      
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      const notification = await notificationService.markAsRead(id, userId);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Dismiss notification
  app.delete("/api/notifications/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      const notification = await notificationService.dismissNotification(id, userId);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error dismissing notification:", error);
      res.status(500).json({ message: "Failed to dismiss notification" });
    }
  });

  // Get notification preferences
  app.get("/api/notifications/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Return default preferences for now - can be enhanced with actual user preferences
      const defaultPreferences = [
        { category: 'booking', inAppEnabled: true, emailEnabled: true, smsEnabled: false, pushEnabled: true, frequency: 'immediate' },
        { category: 'payment', inAppEnabled: true, emailEnabled: true, smsEnabled: true, pushEnabled: true, frequency: 'immediate' },
        { category: 'business', inAppEnabled: true, emailEnabled: true, smsEnabled: false, pushEnabled: true, frequency: 'immediate' },
        { category: 'marketing', inAppEnabled: true, emailEnabled: false, smsEnabled: false, pushEnabled: false, frequency: 'weekly' },
        { category: 'system', inAppEnabled: true, emailEnabled: true, smsEnabled: false, pushEnabled: true, frequency: 'immediate' },
      ];
      
      res.json(defaultPreferences);
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      res.status(500).json({ message: "Failed to fetch preferences" });
    }
  });

  // Update notification preferences
  app.put("/api/notifications/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const preferences = req.body;
      
      // For now, just return success - can be enhanced with actual preference storage
      res.json({ success: true, message: "Preferences updated successfully" });
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  // Create sample notifications for demo
  app.post("/api/notifications/demo", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Create sample notifications
      const sampleNotifications = [
        {
          userId,
          type: 'booking_reminder',
          category: 'booking',
          title: 'Upcoming Appointment Reminder',
          message: 'You have an appointment scheduled for tomorrow at 2:00 PM. Don\'t forget to prepare!',
          priority: 'normal' as const,
          actionRequired: true,
          actionUrl: '/dashboard',
          actionText: 'View Booking',
        },
        {
          userId,
          type: 'payment_due',
          category: 'payment',
          title: 'Payment Required',
          message: 'Your payment of $85.00 is due. Please complete your payment to confirm your booking.',
          priority: 'high' as const,
          actionRequired: true,
          actionUrl: '/checkout',
          actionText: 'Pay Now',
        },
        {
          userId,
          type: 'job_match',
          category: 'business',
          title: 'New Job Match Available',
          message: 'Sarah Johnson has posted a hair styling job that matches your skills. Apply now!',
          priority: 'normal' as const,
          actionRequired: true,
          actionUrl: '/dashboard?tab=jobs',
          actionText: 'View Job',
        },
      ];

      const createdNotifications = [];
      for (const notificationData of sampleNotifications) {
        const notification = await notificationService.createNotification(notificationData);
        createdNotifications.push(notification);
      }
      
      res.json({ success: true, notifications: createdNotifications });
    } catch (error) {
      console.error("Error creating demo notifications:", error);
      res.status(500).json({ message: "Failed to create demo notifications" });
    }
  });

  app.get("/api/providers/bookings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const professional = await storage.getProfessionalByUserId(userId);
      if (!professional) {
        return res.status(404).json({ message: "Professional profile not found" });
      }
      const bookings = await storage.getBookingsByProfessional(professional.id);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Skill badges endpoints
  app.get("/api/providers/:id/skill-badges", async (req, res) => {
    try {
      const professionalId = parseInt(req.params.id);
      const badges = await storage.getSkillBadges(professionalId);
      res.json(badges);
    } catch (error) {
      console.error("Error fetching skill badges:", error);
      res.status(500).json({ message: "Failed to fetch skill badges" });
    }
  });

  app.post("/api/skill-badges", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const professional = await storage.getProfessionalByUserId(userId);
      if (!professional) {
        return res.status(404).json({ message: "Professional profile not found" });
      }
      
      const badgeData = {
        ...req.body,
        professionalId: professional.id,
      };
      
      const badge = await storage.createSkillBadge(badgeData);
      res.json(badge);
    } catch (error) {
      console.error("Error creating skill badge:", error);
      res.status(500).json({ message: "Failed to create skill badge" });
    }
  });

  // Video consultations endpoints
  app.get("/api/providers/:id/video-consultations", async (req, res) => {
    try {
      const professionalId = parseInt(req.params.id);
      const consultations = await storage.getVideoConsultations(professionalId);
      res.json(consultations);
    } catch (error) {
      console.error("Error fetching video consultations:", error);
      res.status(500).json({ message: "Failed to fetch video consultations" });
    }
  });

  // AI insights endpoint
  app.get("/api/providers/:id/ai-insights", async (req, res) => {
    try {
      const professionalId = parseInt(req.params.id);
      const score = await storage.getAIMatchingScore(professionalId);
      
      // Mock AI insights data for demonstration
      const insights = {
        compatibilityScore: score?.compatibilityScore || "0.94",
        recommendedClients: [
          { type: "Creative Professionals", match: 92 },
          { type: "Luxury Seekers", match: 88 },
          { type: "Trend Followers", match: 85 }
        ],
        performanceMetrics: {
          bookingIncrease: "+23%",
          satisfaction: "4.8/5",
          repeatClients: "87%"
        }
      };
      
      res.json(insights);
    } catch (error) {
      console.error("Error fetching AI insights:", error);
      res.status(500).json({ message: "Failed to fetch AI insights" });
    }
  });

  // Super Admin routes
  const requireSuperAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // For development, allow any authenticated user to access super admin features
    // In production, you would check: req.user?.claims?.sub === "super_admin_user_id"
    // For now, we'll check if user has super_admin role from database
    const userId = req.user.claims.sub;
    storage.getUser(userId).then(user => {
      if (user?.role === "super_admin") {
        next();
      } else {
        res.status(403).json({ message: "Super admin access required" });
      }
    }).catch(() => {
      res.status(403).json({ message: "Super admin access required" });
    });
  };

  app.get("/api/admin/platform-stats", isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getPlatformStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching platform stats:", error);
      res.status(500).json({ message: "Failed to fetch platform stats" });
    }
  });

  app.get("/api/admin/users", isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const { search, role } = req.query;
      const users = await storage.getAllUsers(search as string, role as string);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/providers", isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const providers = await storage.getFeaturedProfessionals();
      res.json(providers);
    } catch (error) {
      console.error("Error fetching providers:", error);
      res.status(500).json({ message: "Failed to fetch providers" });
    }
  });

  app.post("/api/admin/users/suspend", isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const { userId, reason } = req.body;
      const adminId = req.user.claims.sub;
      await storage.suspendUser(userId, reason, adminId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error suspending user:", error);
      res.status(500).json({ message: "Failed to suspend user" });
    }
  });

  app.post("/api/admin/providers/verify", isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const { providerId } = req.body;
      const adminId = req.user.claims.sub;
      await storage.verifyProvider(providerId, adminId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error verifying provider:", error);
      res.status(500).json({ message: "Failed to verify provider" });
    }
  });

  app.get("/api/admin/moderation-queue", isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const { status } = req.query;
      const queue = await storage.getModerationQueue(status as string);
      res.json(queue);
    } catch (error) {
      console.error("Error fetching moderation queue:", error);
      res.status(500).json({ message: "Failed to fetch moderation queue" });
    }
  });

  app.post("/api/admin/moderate-content", isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const { itemId, action, notes } = req.body;
      const adminId = req.user.claims.sub;
      await storage.moderateContent(itemId, action, notes || "", adminId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error moderating content:", error);
      res.status(500).json({ message: "Failed to moderate content" });
    }
  });

  app.get("/api/admin/action-logs", isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const logs = await storage.getAdminActionLogs();
      res.json(logs);
    } catch (error) {
      console.error("Error fetching action logs:", error);
      res.status(500).json({ message: "Failed to fetch action logs" });
    }
  });

  // Provider routes
  app.post('/api/providers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const professionalData = insertProfessionalSchema.parse({
        ...req.body,
        userId,
      });
      
      const professional = await storage.createProfessional(professionalData);
      res.json(professional);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Place specific routes before parameterized routes
  app.get('/api/providers/search', async (req, res) => {
    try {
      const { 
        location, 
        category, 
        priceMin, 
        priceMax, 
        rating,
        distance,
        specialties,
        availability,
        sortBy,
        verified,
        portfolio,
        instant,
        lat, 
        lng 
      } = req.query;
      
      const professionals = await storage.searchProfessionals({
        location: location as string,
        category: category as string,
        priceMin: priceMin ? parseFloat(priceMin as string) : undefined,
        priceMax: priceMax ? parseFloat(priceMax as string) : undefined,
        rating: rating ? parseFloat(rating as string) : undefined,
        distance: distance ? parseInt(distance as string) : undefined,
        specialties: specialties ? (specialties as string).split(',') : undefined,
        availability: availability as string,
        sortBy: sortBy as string,
        verified: verified === 'true',
        hasPortfolio: portfolio === 'true',
        instantBooking: instant === 'true',
        lat: lat ? parseFloat(lat as string) : undefined,
        lng: lng ? parseFloat(lng as string) : undefined,
      });
      
      res.json(professionals);
    } catch (error) {
      console.error("Error searching professionals:", error);
      res.status(500).json({ message: "Failed to search professionals" });
    }
  });

  app.get('/api/providers/featured', async (req, res) => {
    try {
      const professionals = await storage.getFeaturedProfessionals();
      res.json(professionals);
    } catch (error) {
      console.error("Error fetching featured professionals:", error);
      res.status(500).json({ message: "Failed to fetch featured professionals" });
    }
  });

  // Get popular specialties for a category
  app.get('/api/specialties/popular/:category?', async (req, res) => {
    try {
      const { category } = req.params;
      
      // Mock popular specialties based on category
      let specialties: string[] = [];
      
      switch (category) {
        case 'hair':
          specialties = ['Natural Hair', 'Color Specialist', 'Curl Specialist', 'Bridal Styles'];
          break;
        case 'nails':
          specialties = ['Acrylic Nails', 'Gel Nails', 'Nail Art', 'French Manicure'];
          break;
        case 'makeup':
          specialties = ['Bridal Makeup', 'Special Occasions', 'Editorial', 'Natural Looks'];
          break;
        case 'braiding':
          specialties = ['Box Braids', 'Cornrows', 'Dutch Braids', 'Goddess Braids'];
          break;
        case 'barbering':
          specialties = ['Beard Grooming', 'Fade Cuts', 'Classic Cuts', 'Hot Towel Shaves'];
          break;
        case 'skincare':
          specialties = ['Anti-Aging', 'Acne Treatment', 'Deep Cleansing', 'Hydration'];
          break;
        default:
          specialties = ['Natural Hair', 'Bridal Makeup', 'Acrylic Nails', 'Beard Grooming'];
      }
      
      res.json(specialties);
    } catch (error) {
      console.error("Error fetching popular specialties:", error);
      res.status(500).json({ message: "Failed to fetch specialties" });
    }
  });

  // Provider Growth & Marketing API endpoints
  app.get('/api/providers/:id/growth-metrics/:period', isAuthenticated, async (req: any, res) => {
    try {
      const { id, period } = req.params;
      const userId = req.user?.claims?.sub;
      
      // Verify provider ownership
      const professional = await storage.getProfessionalByUserId(userId);
      if (!professional || professional.id !== parseInt(id)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Mock growth metrics data
      const metrics = {
        profileViews: { current: 1234, previous: 1100, change: 12.2 },
        bookingRequests: { current: 87, previous: 75, change: 16.0 },
        conversionRate: { current: 24.5, previous: 22.1, change: 10.9 },
        averageRating: { current: 4.8, previous: 4.7, change: 2.1 },
        repeatClientRate: { current: 68.3, previous: 64.2, change: 6.4 },
        revenue: { current: 3240.50, previous: 2890.25, change: 12.1 }
      };
      
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching growth metrics:", error);
      res.status(500).json({ message: "Failed to fetch growth metrics" });
    }
  });

  app.get('/api/providers/:id/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      
      // Verify provider ownership
      const professional = await storage.getProfessionalByUserId(userId);
      if (!professional || professional.id !== parseInt(id)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Mock campaign data
      const campaigns = [
        {
          id: "1",
          title: "New Client Special",
          type: "discount",
          status: "active",
          description: "20% off first appointment for new clients",
          discount: 20,
          validUntil: "2025-08-31",
          usageCount: 12,
          maxUsage: 50,
          createdAt: "2025-07-15"
        },
        {
          id: "2",
          title: "Referral Rewards",
          type: "referral",
          status: "active",
          description: "Earn $10 for every successful referral",
          usageCount: 8,
          createdAt: "2025-07-01"
        }
      ];
      
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.post('/api/providers/:id/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      
      // Verify provider ownership
      const professional = await storage.getProfessionalByUserId(userId);
      if (!professional || professional.id !== parseInt(id)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const campaignData = req.body;
      
      // Mock campaign creation
      const newCampaign = {
        id: Date.now().toString(),
        ...campaignData,
        status: "active",
        usageCount: 0,
        createdAt: new Date().toISOString()
      };
      
      res.json(newCampaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  app.get('/api/providers/:id/profile-optimization', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      
      // Verify provider ownership
      const professional = await storage.getProfessionalByUserId(userId);
      if (!professional || professional.id !== parseInt(id)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Mock profile optimization data
      const optimization = {
        completionScore: 85,
        missingElements: ["Portfolio Photos", "Service Descriptions"],
        recommendations: [
          {
            title: "Add Portfolio Photos",
            description: "Upload before/after photos to showcase your work",
            impact: "high",
            action: "upload_portfolio"
          },
          {
            title: "Complete Service Descriptions",
            description: "Add detailed descriptions to all your services",
            impact: "medium",
            action: "update_services"
          }
        ]
      };
      
      res.json(optimization);
    } catch (error) {
      console.error("Error fetching profile optimization:", error);
      res.status(500).json({ message: "Failed to fetch profile optimization" });
    }
  });

  // Referral Program endpoints
  app.get('/api/providers/:id/referral-stats', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      
      // Verify provider ownership
      const professional = await storage.getProfessionalByUserId(userId);
      if (!professional || professional.id !== parseInt(id)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Mock referral stats
      const stats = {
        totalReferrals: 23,
        completedReferrals: 18,
        pendingReferrals: 5,
        totalEarnings: 180.00,
        referralRate: 78.3,
        topReferrer: {
          name: "Sarah Johnson",
          referrals: 4,
          earnings: 40.00
        }
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching referral stats:", error);
      res.status(500).json({ message: "Failed to fetch referral stats" });
    }
  });

  app.get('/api/providers/:id/referral-links', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      
      // Verify provider ownership
      const professional = await storage.getProfessionalByUserId(userId);
      if (!professional || professional.id !== parseInt(id)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Mock referral links
      const links = [
        {
          id: "1",
          url: `https://byootify.replit.app/provider/${id}?ref=${userId}`,
          clicks: 45,
          conversions: 8,
          createdAt: "2025-07-20"
        }
      ];
      
      res.json(links);
    } catch (error) {
      console.error("Error fetching referral links:", error);
      res.status(500).json({ message: "Failed to fetch referral links" });
    }
  });

  app.post('/api/providers/:id/referral-link', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      
      // Verify provider ownership
      const professional = await storage.getProfessionalByUserId(userId);
      if (!professional || professional.id !== parseInt(id)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Generate new referral link
      const newLink = {
        id: Date.now().toString(),
        url: `https://byootify.replit.app/provider/${id}?ref=${userId}-${Date.now()}`,
        clicks: 0,
        conversions: 0,
        createdAt: new Date().toISOString()
      };
      
      res.json(newLink);
    } catch (error) {
      console.error("Error generating referral link:", error);
      res.status(500).json({ message: "Failed to generate referral link" });
    }
  });

  app.get('/api/providers/:id/referrals', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      
      // Verify provider ownership
      const professional = await storage.getProfessionalByUserId(userId);
      if (!professional || professional.id !== parseInt(id)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Mock referral history
      const referrals = [
        {
          id: "1",
          referrerName: "Maria Garcia",
          referredName: "Jessica Smith",
          status: "completed",
          bookingDate: "2025-07-25",
          commission: 10.00,
          createdAt: "2025-07-20"
        },
        {
          id: "2",
          referrerName: "Lisa Wong",
          referredName: "Amanda Johnson",
          status: "pending",
          commission: 10.00,
          createdAt: "2025-07-26"
        }
      ];
      
      res.json(referrals);
    } catch (error) {
      console.error("Error fetching referrals:", error);
      res.status(500).json({ message: "Failed to fetch referrals" });
    }
  });

  // Social Media Integration endpoints
  app.get('/api/providers/:id/social-accounts', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      
      // Verify provider ownership
      const professional = await storage.getProfessionalByUserId(userId);
      if (!professional || professional.id !== parseInt(id)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Mock social accounts
      const accounts = [
        {
          platform: "instagram",
          username: "beautybymaria",
          connected: true,
          followers: 2450,
          lastSync: "2025-07-27T00:00:00Z",
          profilePicture: "https://via.placeholder.com/40"
        }
      ];
      
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching social accounts:", error);
      res.status(500).json({ message: "Failed to fetch social accounts" });
    }
  });

  app.get('/api/providers/:id/social-analytics', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      
      // Verify provider ownership
      const professional = await storage.getProfessionalByUserId(userId);
      if (!professional || professional.id !== parseInt(id)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Mock social analytics
      const analytics = {
        totalFollowers: 5200,
        totalEngagement: 1250,
        averageReach: 980,
        bestPostingTimes: ["10:00 AM", "3:00 PM", "7:00 PM"],
        topHashtags: [
          { tag: "beautypro", performance: 85 },
          { tag: "hairgoals", performance: 78 },
          { tag: "beforeandafter", performance: 72 }
        ],
        platformPerformance: [
          { platform: "instagram", posts: 45, engagement: 850, growth: 12.5 },
          { platform: "facebook", posts: 23, engagement: 400, growth: 8.2 }
        ]
      };
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching social analytics:", error);
      res.status(500).json({ message: "Failed to fetch social analytics" });
    }
  });

  app.get('/api/content-templates', async (req, res) => {
    try {
      // Mock content templates
      const templates = [
        {
          id: "1",
          title: "Before & After Showcase",
          category: "before_after",
          content: "✨ Another amazing transformation! Swipe to see the incredible before and after. What do you think? #beforeandafter #hairtransformation #beautypro",
          hashtags: ["beforeandafter", "hairtransformation", "beautypro", "hairgoals"],
          popularity: 92
        },
        {
          id: "2",
          title: "Client Testimonial",
          category: "testimonial", 
          content: "💕 'I feel so confident with my new look! Thank you for making me feel beautiful.' - Happy client testimonial. Book your appointment today! #testimonial #happyclient #beauty",
          hashtags: ["testimonial", "happyclient", "beauty", "confident"],
          popularity: 88
        },
        {
          id: "3",
          title: "Beauty Tips",
          category: "tips",
          content: "💡 Pro tip: Always use heat protectant before styling! Your hair will thank you later. What's your favorite hair care tip? #beautytips #haircare #protip",
          hashtags: ["beautytips", "haircare", "protip", "healthyhair"],
          popularity: 76
        }
      ];
      
      res.json(templates);
    } catch (error) {
      console.error("Error fetching content templates:", error);
      res.status(500).json({ message: "Failed to fetch content templates" });
    }
  });

  // Portfolio management routes
  app.get("/api/providers/:id/portfolio", async (req, res) => {
    try {
      const { id } = req.params;
      const portfolio = await storage.getProviderPortfolio(parseInt(id));
      res.json(portfolio);
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      res.status(500).json({ message: "Failed to fetch portfolio" });
    }
  });

  app.post("/api/providers/:id/portfolio", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      
      // Verify provider ownership
      const professional = await storage.getProfessionalByUserId(userId);
      if (!professional || professional.id !== parseInt(id)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const portfolioData = {
        professionalId: parseInt(id),
        ...req.body,
      };

      const portfolioImage = await storage.addPortfolioImage(portfolioData);
      res.json(portfolioImage);
    } catch (error) {
      console.error("Error adding portfolio image:", error);
      res.status(500).json({ message: "Failed to add portfolio image" });
    }
  });

  // Earnings tracking routes
  app.get("/api/providers/:id/earnings/:period", isAuthenticated, async (req: any, res) => {
    try {
      const { id, period } = req.params;
      const userId = req.user?.claims?.sub;
      
      // Verify provider ownership
      const professional = await storage.getProfessionalByUserId(userId);
      if (!professional || professional.id !== parseInt(id)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const earnings = await storage.getProviderEarnings(parseInt(id), period);
      res.json(earnings);
    } catch (error) {
      console.error("Error fetching earnings:", error);
      res.status(500).json({ message: "Failed to fetch earnings" });
    }
  });

  app.get("/api/providers/:id/earnings/stats/:period", isAuthenticated, async (req: any, res) => {
    try {
      const { id, period } = req.params;
      const userId = req.user?.claims?.sub;
      
      // Verify provider ownership
      const professional = await storage.getProfessionalByUserId(userId);
      if (!professional || professional.id !== parseInt(id)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const stats = await storage.getEarningsStats(parseInt(id), period);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching earnings stats:", error);
      res.status(500).json({ message: "Failed to fetch earnings stats" });
    }
  });

  // Notification routes
  app.get("/api/notifications/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?.claims?.sub;
      
      if (userId !== currentUserId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.markNotificationAsRead(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch("/api/notifications/mark-all-read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  app.delete("/api/notifications/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteNotification(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Get single provider
  app.get("/api/providers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const provider = await storage.getProfessional(id);
      
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      
      res.json(provider);
    } catch (error) {
      console.error("Error fetching provider:", error);
      res.status(500).json({ message: "Failed to fetch provider" });
    }
  });

  app.get('/api/professionals/:id', async (req, res) => {
    try {
      const professional = await storage.getProfessional(parseInt(req.params.id));
      if (!professional) {
        return res.status(404).json({ message: "Professional not found" });
      }
      res.json(professional);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch professional" });
    }
  });

  app.put('/api/professionals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const professionalId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Verify ownership
      const existing = await storage.getProfessional(professionalId);
      if (!existing || existing.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const updates = insertProfessionalSchema.partial().parse(req.body);
      const professional = await storage.updateProfessional(professionalId, updates);
      res.json(professional);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Service routes
  app.post('/api/services', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const professional = await storage.getProfessionalByUserId(userId);
      
      if (!professional) {
        return res.status(403).json({ message: "Must be a professional to create services" });
      }

      const serviceData = insertServiceSchema.parse({
        ...req.body,
        professionalId: professional.id,
      });
      
      const service = await storage.createService(serviceData);
      res.json(service);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get provider services
  app.get("/api/providers/:id/services", async (req, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const services = await storage.getProviderServices(providerId);
      res.json(services);
    } catch (error) {
      console.error("Error fetching provider services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  // Get provider reviews
  app.get("/api/providers/:id/reviews", async (req, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const reviews = await storage.getProviderReviews(providerId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching provider reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Get provider portfolio
  app.get("/api/providers/:id/portfolio", async (req, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const portfolio = await storage.getProviderPortfolio(providerId);
      res.json(portfolio);
    } catch (error) {
      console.error("Error fetching provider portfolio:", error);
      res.status(500).json({ message: "Failed to fetch portfolio" });
    }
  });

  // Get provider availability
  app.get("/api/providers/:id/availability", async (req, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const availability = await storage.getProviderAvailability(providerId);
      res.json(availability);
    } catch (error) {
      console.error("Error fetching provider availability:", error);
      res.status(500).json({ message: "Failed to fetch availability" });
    }
  });

  app.get('/api/professionals/:id/services', async (req, res) => {
    try {
      const professionalId = parseInt(req.params.id);
      const services = await storage.getServicesByProfessional(professionalId);
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  // Booking routes
  app.post('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const clientId = req.user.claims.sub;
      const bookingData = insertBookingSchema.parse({
        ...req.body,
        clientId,
      });
      
      const booking = await storage.createBooking(bookingData);
      res.json(booking);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/bookings/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookings = await storage.getBookingsByClient(userId);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get('/api/professionals/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const professional = await storage.getProfessionalByUserId(userId);
      
      if (!professional) {
        return res.status(403).json({ message: "Not a professional" });
      }

      const bookings = await storage.getBookingsByProfessional(professional.id);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Review routes
  app.post('/api/reviews', isAuthenticated, async (req: any, res) => {
    try {
      const clientId = req.user.claims.sub;
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        clientId,
      });
      
      const review = await storage.createReview(reviewData);
      res.json(review);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/professionals/:id/reviews', async (req, res) => {
    try {
      const professionalId = parseInt(req.params.id);
      const reviews = await storage.getReviewsByProfessional(professionalId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Portfolio routes
  app.get('/api/professionals/:id/portfolio', async (req, res) => {
    try {
      const professionalId = parseInt(req.params.id);
      const images = await storage.getPortfolioImages(professionalId);
      res.json(images);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch portfolio" });
    }
  });

  // Availability routes
  app.get('/api/professionals/:id/availability', async (req, res) => {
    try {
      const professionalId = parseInt(req.params.id);
      const availability = await storage.getAvailability(professionalId);
      res.json(availability);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch availability" });
    }
  });

  // Stripe payment routes
  app.post("/api/create-payment-intent", isAuthenticated, async (req, res) => {
    try {
      const { amount } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Booking payment intent
  app.post("/api/bookings/:id/payment-intent", isAuthenticated, async (req: any, res) => {
    try {
      const bookingId = req.params.id;
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Verify booking belongs to user
      if (booking.clientId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(parseFloat(booking.totalPrice) * 100), // Convert to cents
        currency: "usd",
        metadata: {
          bookingId: booking.id,
          clientId: booking.clientId,
        },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Get booking details for checkout
  app.get("/api/bookings/:id", isAuthenticated, async (req: any, res) => {
    try {
      const bookingId = req.params.id;
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Verify booking belongs to user
      if (booking.clientId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Not authorized" });
      }

      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  // Shop API Routes - handle both URL patterns
  app.get("/api/shop/products", async (req, res) => {
    try {
      const { search, category, sortBy, limit } = req.query;
      const products = await storage.getProducts({
        search: search as string,
        category: category as string,
        sortBy: sortBy as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Handle parameterized product searches
  app.get("/api/shop/products/:search?/:category?/:priceRange?/:sortBy?", async (req, res) => {
    try {
      const { search, category, priceRange, sortBy } = req.params;
      const products = await storage.getProducts({
        search: search && search !== 'all' ? search : undefined,
        category: category && category !== 'all' ? category : undefined,
        sortBy: sortBy && sortBy !== 'popular' ? sortBy : 'popular',
      });
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/shop/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(parseInt(req.params.id));
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Cart routes
  app.get("/api/shop/cart", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cartItems = await storage.getCartItems(userId);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post("/api/shop/cart", isAuthenticated, async (req: any, res) => {
    try {
      const { productId, quantity = 1 } = req.body;
      const userId = req.user.claims.sub;
      
      if (!productId) {
        return res.status(400).json({ message: "Product ID is required" });
      }

      const cartItem = await storage.addToCart(userId, parseInt(productId), quantity);
      res.json(cartItem);
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(500).json({ message: "Failed to add to cart" });
    }
  });

  app.put("/api/shop/cart/:productId", isAuthenticated, async (req: any, res) => {
    try {
      const { quantity } = req.body;
      const userId = req.user.claims.sub;
      const productId = parseInt(req.params.productId);

      if (!quantity || quantity < 1) {
        return res.status(400).json({ message: "Valid quantity is required" });
      }

      await storage.updateCartItem(userId, productId, quantity);
      res.json({ message: "Cart updated successfully" });
    } catch (error) {
      console.error("Error updating cart:", error);
      res.status(500).json({ message: "Failed to update cart" });
    }
  });

  app.delete("/api/shop/cart/:productId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const productId = parseInt(req.params.productId);
      
      await storage.removeFromCart(userId, productId);
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ message: "Failed to remove from cart" });
    }
  });

  // Wishlist routes
  app.get("/api/shop/wishlist", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const wishlistItems = await storage.getWishlistItems(userId);
      res.json(wishlistItems);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      res.status(500).json({ message: "Failed to fetch wishlist" });
    }
  });

  app.post("/api/shop/wishlist", isAuthenticated, async (req: any, res) => {
    try {
      const { productId } = req.body;
      const userId = req.user.claims.sub;

      if (!productId) {
        return res.status(400).json({ message: "Product ID is required" });
      }

      const wishlistItem = await storage.addToWishlist(userId, parseInt(productId));
      res.json(wishlistItem);
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      res.status(500).json({ message: "Failed to add to wishlist" });
    }
  });

  app.delete("/api/shop/wishlist/:productId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const productId = parseInt(req.params.productId);
      
      await storage.removeFromWishlist(userId, productId);
      res.json({ message: "Item removed from wishlist" });
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      res.status(500).json({ message: "Failed to remove from wishlist" });
    }
  });

  // Reviews routes
  app.get("/api/shop/products/:id/reviews", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const reviews = await storage.getProductReviews(productId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post("/api/shop/reviews", isAuthenticated, async (req: any, res) => {
    try {
      const { productId, rating, comment } = req.body;
      const userId = req.user.claims.sub;

      if (!productId || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Valid product ID and rating (1-5) are required" });
      }

      const review = await storage.addProductReview(userId, parseInt(productId), rating, comment || "");
      res.json(review);
    } catch (error) {
      console.error("Error adding review:", error);
      res.status(500).json({ message: "Failed to add review" });
    }
  });

  // Orders routes
  app.get("/api/shop/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orders = await storage.getOrders(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Create payment intent for shop checkout
  app.post("/api/shop/create-payment-intent", isAuthenticated, async (req: any, res) => {
    try {
      const { items, shippingAddress } = req.body;
      const userId = req.user.claims.sub;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Order items are required" });
      }

      if (!shippingAddress) {
        return res.status(400).json({ message: "Shipping address is required" });
      }

      // Calculate total amount
      const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
      const shipping = subtotal > 50 ? 0 : 9.99;
      const tax = subtotal * 0.08; // 8% tax
      const totalAmount = Math.round((subtotal + shipping + tax) * 100); // Convert to cents

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalAmount,
        currency: "usd",
        metadata: {
          userId,
          orderType: "shop_order",
          itemCount: items.length.toString(),
          shippingAddress: JSON.stringify(shippingAddress),
        },
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        amount: totalAmount,
        subtotal: Math.round(subtotal * 100),
        shipping: Math.round(shipping * 100),
        tax: Math.round(tax * 100),
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  app.post("/api/shop/orders", isAuthenticated, async (req: any, res) => {
    try {
      const { items, shippingAddress, paymentIntentId } = req.body;
      const userId = req.user.claims.sub;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Order items are required" });
      }

      if (!shippingAddress) {
        return res.status(400).json({ message: "Shipping address is required" });
      }

      if (!paymentIntentId) {
        return res.status(400).json({ message: "Payment confirmation required" });
      }

      // Verify payment intent with Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({ message: "Payment not completed" });
      }

      // Create the order
      const order = await storage.createOrder(userId, items, shippingAddress);
      
      // Update order with payment information
      await storage.updateOrderPayment(order.id, paymentIntentId, paymentIntent.amount / 100);
      
      // Clear the cart after successful order
      await storage.clearCart(userId);
      
      res.json({
        ...order,
        paymentStatus: "completed",
        paymentIntentId,
      });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Advanced Booking Features - Recurring Appointments
  app.post('/api/providers/:id/recurring-bookings', isAuthenticated, async (req, res) => {
    try {
      const professionalId = parseInt(req.params.id);
      const { serviceId, startDate, frequency, occurrences, skipDates, timeSlot, notes } = req.body;
      
      // Generate recurring booking dates
      const bookingDates = [];
      let currentDate = new Date(startDate);
      
      for (let i = 0; i < (occurrences || 12); i++) {
        if (!skipDates?.some((skipDate: string) => 
          new Date(skipDate).toDateString() === currentDate.toDateString()
        )) {
          bookingDates.push(new Date(currentDate));
        }
        
        // Increment based on frequency
        switch (frequency) {
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'biweekly':
            currentDate.setDate(currentDate.getDate() + 14);
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
        }
      }

      // Create individual bookings for each date
      const bookings = [];
      for (const date of bookingDates) {
        const appointmentDateTime = new Date(date);
        const [time, period] = timeSlot.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        appointmentDateTime.setHours(
          period === 'PM' && hours !== 12 ? hours + 12 : hours,
          minutes || 0
        );

        const booking = await storage.createBooking({
          clientId: (req as any).user.claims.sub,
          professionalId,
          serviceIds: [parseInt(serviceId)],
          appointmentDate: appointmentDateTime,
          status: 'pending',
          totalPrice: '0', // Will be calculated
          notes: `${notes || ''} (Recurring booking - ${frequency})`,
          isRecurring: true,
        });
        bookings.push(booking);
      }

      res.json({ bookings, message: `${bookings.length} recurring appointments scheduled` });
    } catch (error) {
      console.error('Error creating recurring booking:', error);
      res.status(500).json({ message: 'Failed to create recurring booking' });
    }
  });

  // Waitlist Management
  app.post('/api/waitlist', isAuthenticated, async (req, res) => {
    try {
      const waitlistItem = await storage.addToWaitlist({
        userId: (req as any).user.claims.sub,
        ...req.body,
      });
      res.json(waitlistItem);
    } catch (error) {
      console.error('Error adding to waitlist:', error);
      res.status(500).json({ message: 'Failed to add to waitlist' });
    }
  });

  app.get('/api/waitlist/status/:professionalId', isAuthenticated, async (req, res) => {
    try {
      const professionalId = parseInt(req.params.professionalId);
      const userId = (req as any).user.claims.sub;
      
      const waitlistItems = await storage.getWaitlist(professionalId);
      const userItem = waitlistItems.find((item: any) => item.userId === userId);
      
      if (userItem) {
        const position = waitlistItems.indexOf(userItem) + 1;
        res.json({
          onWaitlist: true,
          position,
          createdAt: userItem.createdAt,
          id: userItem.id,
        });
      } else {
        res.json({ onWaitlist: false });
      }
    } catch (error) {
      console.error('Error getting waitlist status:', error);
      res.status(500).json({ message: 'Failed to get waitlist status' });
    }
  });

  app.get('/api/providers/:id/waitlist', isAuthenticated, async (req, res) => {
    try {
      const professionalId = parseInt(req.params.id);
      const waitlistItems = await storage.getWaitlist(professionalId);
      res.json(waitlistItems);
    } catch (error) {
      console.error('Error getting waitlist:', error);
      res.status(500).json({ message: 'Failed to get waitlist' });
    }
  });

  app.post('/api/waitlist/:id/notify', isAuthenticated, async (req, res) => {
    try {
      const waitlistId = req.params.id;
      const { message } = req.body;
      
      // Create notification for the waitlisted user
      await storage.createNotification({
        userId: (req as any).user.claims.sub, // This should be the waitlisted user's ID
        title: 'Appointment Available!',
        message,
        type: 'booking_available',
        category: 'bookings',
        isRead: false,
      });

      res.json({ message: 'Notification sent successfully' });
    } catch (error) {
      console.error('Error sending waitlist notification:', error);
      res.status(500).json({ message: 'Failed to send notification' });
    }
  });

  app.delete('/api/waitlist/:id', isAuthenticated, async (req, res) => {
    try {
      const waitlistId = req.params.id;
      await storage.removeFromWaitlist(waitlistId);
      res.json({ message: 'Removed from waitlist successfully' });
    } catch (error) {
      console.error('Error removing from waitlist:', error);
      res.status(500).json({ message: 'Failed to remove from waitlist' });
    }
  });

  // Group Booking Management
  app.post('/api/providers/:id/group-bookings', isAuthenticated, async (req, res) => {
    try {
      const professionalId = parseInt(req.params.id);
      const bookingData = req.body;
      
      // Create a group booking record
      const groupBooking = await storage.createGroupBooking({
        clientId: (req as any).user.claims.sub,
        professionalId,
        ...bookingData,
        status: 'pending',
        createdAt: new Date(),
      });

      // Create notification for the provider
      await storage.createNotification({
        userId: (req as any).user.claims.sub, // This should be the provider's user ID
        title: 'New Group Booking Request',
        message: `Group event for ${bookingData.groupSize} people on ${bookingData.eventDate}`,
        type: 'group_booking_request',
        category: 'bookings',
        isRead: false,
      });

      res.json(groupBooking);
    } catch (error) {
      console.error('Error creating group booking:', error);
      res.status(500).json({ message: 'Failed to create group booking' });
    }
  });

  app.get('/api/providers/:id/group-bookings', isAuthenticated, async (req, res) => {
    try {
      const professionalId = parseInt(req.params.id);
      const groupBookings = await storage.getGroupBookings(professionalId);
      res.json(groupBookings);
    } catch (error) {
      console.error('Error getting group bookings:', error);
      res.status(500).json({ message: 'Failed to get group bookings' });
    }
  });

  // Register communication system routes
  const { registerCommunicationRoutes } = await import("./communication-routes");
  registerCommunicationRoutes(app);

  // Analytics routes
  app.get("/api/analytics/overview", isAuthenticated, async (req: any, res) => {
    try {
      const timeRange = req.query.timeRange || "30d";
      const userId = req.user.claims.sub;
      const overview = await storage.getAnalyticsOverview(userId, timeRange);
      res.json(overview);
    } catch (error) {
      console.error("Error fetching analytics overview:", error);
      res.status(500).json({ message: "Failed to fetch analytics overview" });
    }
  });

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

  app.get("/api/analytics/performance", isAuthenticated, async (req: any, res) => {
    try {
      const timeRange = req.query.timeRange || "30d";
      const userId = req.user.claims.sub;
      const performanceData = await storage.getPerformanceMetrics(userId, timeRange);
      res.json(performanceData);
    } catch (error) {
      console.error("Error fetching performance analytics:", error);
      res.status(500).json({ message: "Failed to fetch performance analytics" });
    }
  });

  app.get("/api/analytics/customers", isAuthenticated, async (req: any, res) => {
    try {
      const timeRange = req.query.timeRange || "30d";
      const userId = req.user.claims.sub;
      const customerData = await storage.getCustomerInsights(userId, timeRange);
      res.json(customerData);
    } catch (error) {
      console.error("Error fetching customer analytics:", error);
      res.status(500).json({ message: "Failed to fetch customer analytics" });
    }
  });

  app.get("/api/analytics/services", isAuthenticated, async (req: any, res) => {
    try {
      const timeRange = req.query.timeRange || "30d";
      const userId = (req as any).user.claims.sub;
      const servicesData = await storage.getServiceAnalytics(userId, timeRange);
      res.json(servicesData);
    } catch (error) {
      console.error("Error fetching service analytics:", error);
      res.status(500).json({ message: "Failed to fetch service analytics" });
    }
  });

  app.get("/api/analytics/realtime", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req as any).user.claims.sub;
      const realtimeData = await storage.getRealtimeAnalytics(userId);
      res.json(realtimeData);
    } catch (error) {
      console.error("Error fetching realtime analytics:", error);
      res.status(500).json({ message: "Failed to fetch realtime analytics" });
    }
  });

  app.get("/api/analytics/predictive", isAuthenticated, async (req: any, res) => {
    try {
      const period = req.query.period || "monthly";
      const userId = (req as any).user.claims.sub;
      const predictiveData = await storage.getPredictiveAnalytics(userId, period);
      res.json(predictiveData);
    } catch (error) {
      console.error("Error fetching predictive analytics:", error);
      res.status(500).json({ message: "Failed to fetch predictive analytics" });
    }
  });

  // ====================
  // PHASE 1 MVP - TOKEN SYSTEM & COMMISSION FEATURES
  // ====================

  // Provider Token Management
  app.get('/api/providers/:id/tokens', isAuthenticated, async (req: any, res) => {
    try {
      const professionalId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Verify provider ownership
      const professional = await storage.getProfessionalByUserId(userId);
      if (!professional || professional.id !== professionalId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const tokens = await storage.getProviderTokens(professionalId);
      res.json(tokens);
    } catch (error) {
      console.error("Error fetching provider tokens:", error);
      res.status(500).json({ message: "Failed to fetch token information" });
    }
  });

  app.post('/api/providers/:id/tokens/purchase', isAuthenticated, async (req: any, res) => {
    try {
      const professionalId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const { tokenPackage, paymentMethodId } = req.body;
      
      // Verify provider ownership
      const professional = await storage.getProfessionalByUserId(userId);
      if (!professional || professional.id !== professionalId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Token packages: basic (100 tokens - $10), standard (500 tokens - $40), premium (1000 tokens - $75)
      const packages = {
        basic: { tokens: 100, cost: 1000 }, // $10.00 in cents
        standard: { tokens: 500, cost: 4000 }, // $40.00 in cents
        premium: { tokens: 1000, cost: 7500 } // $75.00 in cents
      };

      if (!packages[tokenPackage as keyof typeof packages]) {
        return res.status(400).json({ message: "Invalid token package" });
      }

      const packageInfo = packages[tokenPackage as keyof typeof packages];

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: packageInfo.cost,
        currency: "usd",
        metadata: {
          type: "token_purchase",
          professionalId: professionalId.toString(),
          tokenPackage,
          tokenAmount: packageInfo.tokens.toString(),
        },
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        package: tokenPackage,
        tokens: packageInfo.tokens,
        cost: packageInfo.cost / 100
      });
    } catch (error) {
      console.error("Error creating token purchase:", error);
      res.status(500).json({ message: "Failed to create token purchase" });
    }
  });

  app.post('/api/providers/:id/tokens/boost', isAuthenticated, async (req: any, res) => {
    try {
      const professionalId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const { boostType, duration, geoLocation } = req.body;
      
      // Verify provider ownership
      const professional = await storage.getProfessionalByUserId(userId);
      if (!professional || professional.id !== professionalId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Boost costs: local (5 tokens/hour), city (10 tokens/hour), state (20 tokens/hour)
      const boostCosts = {
        local: 5,
        city: 10,
        state: 20
      };

      const tokensRequired = boostCosts[boostType as keyof typeof boostCosts] * duration;
      
      const result = await storage.useTokensForBoost(professionalId, {
        boostType,
        duration,
        geoLocation,
        tokensUsed: tokensRequired
      });

      res.json(result);
    } catch (error) {
      console.error("Error applying token boost:", error);
      res.status(500).json({ message: "Failed to apply token boost" });
    }
  });

  // Commission & Fee Structure
  app.get('/api/bookings/:id/fees', isAuthenticated, async (req: any, res) => {
    try {
      const bookingId = req.params.id;
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Verify user has access to this booking
      const userId = req.user.claims.sub;
      if (booking.clientId !== userId) {
        const professional = await storage.getProfessionalByUserId(userId);
        if (!professional || professional.id !== booking.professionalId) {
          return res.status(403).json({ message: "Unauthorized" });
        }
      }

      const feeStructure = await storage.calculateFeeStructure(bookingId);
      res.json(feeStructure);
    } catch (error) {
      console.error("Error fetching fee structure:", error);
      res.status(500).json({ message: "Failed to fetch fee structure" });
    }
  });

  // Job Request System (Clients post jobs, providers bid)
  app.post('/api/job-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobRequestData = insertJobRequestSchema.parse({
        ...req.body,
        clientId: userId,
      });
      
      const jobRequest = await storage.createJobRequest(jobRequestData);
      res.json(jobRequest);
    } catch (error: any) {
      console.error("Error creating job request:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/job-requests', async (req, res) => {
    try {
      const { 
        location, 
        category, 
        budget, 
        urgency,
        homeVisitRequired,
        limit = 20,
        offset = 0 
      } = req.query;
      
      const jobRequests = await storage.searchJobRequests({
        location: location as string,
        category: category as string,
        budget: budget ? parseFloat(budget as string) : undefined,
        urgency: urgency as string,
        homeVisitRequired: homeVisitRequired === 'true',
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });
      
      res.json(jobRequests);
    } catch (error) {
      console.error("Error searching job requests:", error);
      res.status(500).json({ message: "Failed to search job requests" });
    }
  });

  app.get('/api/job-requests/:id', async (req, res) => {
    try {
      const jobRequestId = req.params.id;
      const jobRequest = await storage.getJobRequest(jobRequestId);
      
      if (!jobRequest) {
        return res.status(404).json({ message: "Job request not found" });
      }
      
      res.json(jobRequest);
    } catch (error) {
      console.error("Error fetching job request:", error);
      res.status(500).json({ message: "Failed to fetch job request" });
    }
  });

  app.post('/api/job-requests/:id/bids', isAuthenticated, async (req: any, res) => {
    try {
      const jobRequestId = req.params.id;
      const userId = req.user.claims.sub;
      
      // Get provider info
      const professional = await storage.getProfessionalByUserId(userId);
      if (!professional) {
        return res.status(403).json({ message: "Only providers can bid on jobs" });
      }

      const bidData = insertProviderBidSchema.parse({
        ...req.body,
        jobRequestId,
        professionalId: professional.id,
      });
      
      const bid = await storage.createProviderBid(bidData);
      
      // Update job request bid count
      await storage.updateJobRequestBidCount(jobRequestId);
      
      res.json(bid);
    } catch (error: any) {
      console.error("Error creating provider bid:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/job-requests/:id/bids', async (req, res) => {
    try {
      const jobRequestId = req.params.id;
      const bids = await storage.getJobRequestBids(jobRequestId);
      res.json(bids);
    } catch (error) {
      console.error("Error fetching job request bids:", error);
      res.status(500).json({ message: "Failed to fetch bids" });
    }
  });

  // Provider Verification System
  app.post('/api/providers/:id/certifications', isAuthenticated, async (req: any, res) => {
    try {
      const professionalId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Verify provider ownership
      const professional = await storage.getProfessionalByUserId(userId);
      if (!professional || professional.id !== professionalId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const certificationData = insertProviderCertificationSchema.parse({
        ...req.body,
        professionalId,
      });
      
      const certification = await storage.createProviderCertification(certificationData);
      res.json(certification);
    } catch (error: any) {
      console.error("Error creating certification:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/providers/:id/certifications', async (req, res) => {
    try {
      const professionalId = parseInt(req.params.id);
      const certifications = await storage.getProviderCertifications(professionalId);
      res.json(certifications);
    } catch (error) {
      console.error("Error fetching certifications:", error);
      res.status(500).json({ message: "Failed to fetch certifications" });
    }
  });

  app.post('/api/providers/:id/references', isAuthenticated, async (req: any, res) => {
    try {
      const professionalId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Verify provider ownership
      const professional = await storage.getProfessionalByUserId(userId);
      if (!professional || professional.id !== professionalId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const referenceData = insertProviderReferenceSchema.parse({
        ...req.body,
        professionalId,
      });
      
      const reference = await storage.createProviderReference(referenceData);
      res.json(reference);
    } catch (error: any) {
      console.error("Error creating reference:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/providers/:id/references', isAuthenticated, async (req: any, res) => {
    try {
      const professionalId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Verify provider ownership
      const professional = await storage.getProfessionalByUserId(userId);
      if (!professional || professional.id !== professionalId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const references = await storage.getProviderReferences(professionalId);
      res.json(references);
    } catch (error) {
      console.error("Error fetching references:", error);
      res.status(500).json({ message: "Failed to fetch references" });
    }
  });

  // Enhanced Booking with Home Visits
  app.post('/api/bookings/with-fees', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookingData = insertBookingSchema.parse({
        ...req.body,
        clientId: userId,
      });
      
      // Create booking with automatic fee calculation
      const booking = await storage.createBookingWithFees(bookingData);
      res.json(booking);
    } catch (error: any) {
      console.error("Error creating booking with fees:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Error handling middleware (must be last)
  app.use(errorTracker);
  app.use(errorHandler);

  // Start monitoring and backup services
  if (process.env.NODE_ENV === 'production') {
    performanceAlerter.start();
    backupManager.startScheduledBackups();
    logger.info('Production services started: monitoring, alerting, and backups');
  }

  memoryMonitor.start();
  logger.info('Application middleware and routes registered successfully');

  // Enhanced Token System API - Aligned with wireframes vision
  app.get("/api/providers/:id/tokens/dashboard", isAuthenticated, async (req, res) => {
    try {
      const professionalId = parseInt(req.params.id);
      const tokens = await storage.getProviderTokens(professionalId);
      const activeBoosts = await storage.getActiveBoosts(professionalId);
      const trustScore = await storage.getTrustScore(professionalId);
      
      res.json({
        tokens: tokens || { 
          tokenBalance: 0, 
          totalTokensPurchased: 0, 
          tokensUsed: 0, 
          pointsEarned: 0, 
          achievementLevel: 'bronze' 
        },
        activeBoosts: activeBoosts,
        trustScore: trustScore || { overallScore: 5.0 },
        nextAchievement: getNextAchievement(tokens?.pointsEarned || 0)
      });
    } catch (error) {
      console.error("Error fetching provider token dashboard:", error);
      res.status(500).json({ message: "Failed to fetch token dashboard" });
    }
  });

  // Get available token packages per wireframes
  app.get("/api/token-packages", async (req, res) => {
    try {
      let packages = await storage.getTokenPackages();
      if (packages.length === 0) {
        // Seed default packages per wireframes ($10, $40, $75)
        await seedTokenPackages();
        packages = await storage.getTokenPackages();
      }
      res.json(packages);
    } catch (error) {
      console.error("Error fetching token packages:", error);
      res.status(500).json({ message: "Failed to fetch token packages" });
    }
  });

  // Provider Verification System - Per wireframes requirements
  app.get("/api/providers/:id/verifications", isAuthenticated, async (req, res) => {
    try {
      const professionalId = parseInt(req.params.id);
      const verifications = await storage.getProviderVerifications(professionalId);
      const references = await storage.getProviderReferences(professionalId);
      const trustScore = await storage.getTrustScore(professionalId);
      
      res.json({
        verifications,
        references,
        trustScore: trustScore || {
          overallScore: 5.0,
          backgroundCheckPassed: false,
          stateIdVerified: false,
          certificationsVerified: false,
          referencesVerified: false,
          workspacePhotosUploaded: false
        },
        completionPercentage: calculateVerificationCompletion(verifications, references, trustScore)
      });
    } catch (error) {
      console.error("Error fetching provider verifications:", error);
      res.status(500).json({ message: "Failed to fetch verifications" });
    }
  });

  // Add provider verification document
  app.post("/api/providers/:id/verifications", isAuthenticated, async (req, res) => {
    try {
      const professionalId = parseInt(req.params.id);
      const verificationData = { ...req.body, professionalId };
      
      const verification = await storage.addProviderVerification(verificationData);
      
      // Update trust score based on new verification
      await updateTrustScoreAfterVerification(professionalId);
      
      res.json(verification);
    } catch (error) {
      console.error("Error adding provider verification:", error);
      res.status(500).json({ message: "Failed to add verification" });
    }
  });

  // Add provider reference
  app.post("/api/providers/:id/references", isAuthenticated, async (req, res) => {
    try {
      const professionalId = parseInt(req.params.id);
      const referenceData = { ...req.body, professionalId };
      
      const reference = await storage.addProviderReference(referenceData);
      res.json(reference);
    } catch (error) {
      console.error("Error adding provider reference:", error);
      res.status(500).json({ message: "Failed to add reference" });
    }
  });

  // ============================================================================
  // STRIPE INTEGRATION FOR TOKEN PURCHASES & REVENUE MODEL
  // ============================================================================

  // Token Purchase System with Stripe Integration
  app.post('/api/tokens/purchase', isAuthenticated, async (req, res) => {
    try {
      const { packageId } = req.body;
      const userId = (req as any).user.claims.sub;
      
      // Get the professional profile
      const professional = await storage.getProfessionalByUserId(userId);
      if (!professional) {
        return res.status(404).json({ message: 'Professional profile not found' });
      }

      // Get token package details
      const packages = await storage.getTokenPackages();
      const selectedPackage = packages.find(p => p.id === packageId);
      
      if (!selectedPackage) {
        return res.status(404).json({ message: 'Token package not found' });
      }

      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(selectedPackage.price), // Already in cents
        currency: 'usd',
        metadata: {
          userId,
          professionalId: professional.id.toString(),
          packageId: packageId.toString(),
          packageName: selectedPackage.name,
          tokenAmount: selectedPackage.tokenAmount.toString()
        }
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        packageDetails: selectedPackage
      });
    } catch (error: any) {
      console.error('Error creating token purchase intent:', error);
      res.status(500).json({ message: 'Failed to create payment intent: ' + error.message });
    }
  });

  // Token Purchase Success Handler
  app.post('/api/tokens/purchase/success', isAuthenticated, async (req, res) => {
    try {
      const { paymentIntentId } = req.body;
      const userId = (req as any).user.claims.sub;
      
      // Verify payment with Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ message: 'Payment not completed' });
      }

      const professionalId = parseInt(paymentIntent.metadata.professionalId);
      const tokenAmount = parseInt(paymentIntent.metadata.tokenAmount);

      // Add tokens to provider balance
      await storage.updateTokenBalance(professionalId, tokenAmount, 'add');

      // Create notification for successful purchase
      await storage.createNotification({
        userId,
        title: 'Token Purchase Successful!',
        message: `You've successfully purchased ${tokenAmount} tokens. Your visibility boost is now available.`,
        type: 'token_purchase',
        category: 'tokens',
        isRead: false,
      });

      res.json({ 
        message: 'Tokens added successfully',
        tokensAdded: tokenAmount
      });
    } catch (error: any) {
      console.error('Error processing token purchase:', error);
      res.status(500).json({ message: 'Failed to process purchase: ' + error.message });
    }
  });

  // Activate Visibility Boost
  app.post('/api/tokens/boost/activate', isAuthenticated, async (req, res) => {
    try {
      const { boostType, duration } = req.body;
      const userId = (req as any).user.claims.sub;
      
      const professional = await storage.getProfessionalByUserId(userId);
      if (!professional) {
        return res.status(404).json({ message: 'Professional profile not found' });
      }

      // Calculate token cost based on boost type and duration
      const tokenCost = {
        local: { 1: 5, 3: 12, 7: 25 },
        city: { 1: 10, 3: 25, 7: 50 },
        state: { 1: 20, 3: 50, 7: 100 }
      };

      const cost = tokenCost[boostType as keyof typeof tokenCost]?.[duration as keyof typeof tokenCost['local']];
      if (!cost) {
        return res.status(400).json({ message: 'Invalid boost type or duration' });
      }

      // Check token balance
      const tokens = await storage.getProviderTokens(professional.id);
      if (!tokens || (tokens.tokenBalance || 0) < cost) {
        return res.status(400).json({ message: 'Insufficient token balance' });
      }

      // Deduct tokens and create boost
      await storage.updateTokenBalance(professional.id, cost, 'subtract');
      
      const boost = await storage.createBoost({
        professionalId: professional.id,
        boostType,
        duration,
        startTime: new Date(),
        endTime: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
        isActive: true,
        tokensCost: cost
      });

      // Create notification
      await storage.createNotification({
        userId,
        title: 'Visibility Boost Activated!',
        message: `Your ${boostType} boost is now active for ${duration} days. You'll appear higher in search results.`,
        type: 'boost_activated',
        category: 'tokens',
        isRead: false,
      });

      res.json(boost);
    } catch (error: any) {
      console.error('Error activating boost:', error);
      res.status(500).json({ message: 'Failed to activate boost: ' + error.message });
    }
  });

  // Token Management API Endpoints
  app.get('/api/tokens/packages', async (req, res) => {
    try {
      const packages = await storage.getTokenPackages();
      res.json(packages);
    } catch (error: any) {
      console.error('Error fetching token packages:', error);
      res.status(500).json({ message: 'Failed to fetch token packages' });
    }
  });

  app.get('/api/providers/:id/tokens', isAuthenticated, async (req, res) => {
    try {
      const professionalId = parseInt(req.params.id);
      const tokens = await storage.getProviderTokens(professionalId);
      res.json(tokens || {
        tokenBalance: 0,
        totalTokensPurchased: 0,
        tokensUsed: 0,
        pointsEarned: 0,
        achievementLevel: 'bronze'
      });
    } catch (error: any) {
      console.error('Error fetching provider tokens:', error);
      res.status(500).json({ message: 'Failed to fetch tokens' });
    }
  });

  app.get('/api/providers/:id/boosts', isAuthenticated, async (req, res) => {
    try {
      const professionalId = parseInt(req.params.id);
      const boosts = await storage.getActiveBoosts(professionalId);
      res.json(boosts);
    } catch (error: any) {
      console.error('Error fetching active boosts:', error);
      res.status(500).json({ message: 'Failed to fetch boosts' });
    }
  });

  // Commission & Fee Processing (Automated during booking completion)
  app.post('/api/bookings/:id/complete', isAuthenticated, async (req, res) => {
    try {
      const bookingId = req.params.id;
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      const totalAmount = parseFloat(booking.totalPrice);
      const commission = totalAmount * 0.15; // 15% commission
      const serviceFee = totalAmount * 0.10; // 10% service fee
      const providerPayout = totalAmount - commission - serviceFee;

      // Update booking status
      await storage.updateBooking(bookingId, { 
        status: 'completed'
      });

      // Record commission and fee
      await storage.recordCommission({
        bookingId,
        totalAmount,
        commissionAmount: commission,
        serviceFeeAmount: serviceFee,
        providerPayoutAmount: providerPayout,
        payoutDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Next day payout
      });

      // Create payout notification
      await storage.createNotification({
        userId: booking.professionalId.toString(),
        title: 'Booking Completed - Payout Scheduled',
        message: `Your payout of $${providerPayout.toFixed(2)} will be deposited tomorrow.`,
        type: 'payout_scheduled',
        category: 'earnings',
        isRead: false,
      });

      res.json({ 
        message: 'Booking completed successfully',
        providerPayout: providerPayout.toFixed(2),
        payoutDate: 'Tomorrow'
      });
    } catch (error: any) {
      console.error('Error completing booking:', error);
      res.status(500).json({ message: 'Failed to complete booking: ' + error.message });
    }
  });

  // ============================================================================
  // ANONYMOUS COMMUNICATION SYSTEM - PHASE 2 TRUST & SAFETY
  // ============================================================================

  // Create anonymous communication channel
  app.post('/api/communication/channels', isAuthenticated, async (req, res) => {
    try {
      const { clientId, providerId, bookingId } = req.body;
      const channelCode = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const channel = await storage.createAnonymousChannel({
        channelCode,
        clientId,
        providerId,
        bookingId,
        isActive: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });

      res.json(channel);
    } catch (error: any) {
      console.error('Error creating communication channel:', error);
      res.status(500).json({ message: 'Failed to create communication channel' });
    }
  });

  // Get channel info
  app.get('/api/communication/channels/:channelCode', async (req, res) => {
    try {
      const { channelCode } = req.params;
      const channel = await storage.getAnonymousChannel(channelCode);
      
      if (!channel) {
        return res.status(404).json({ message: 'Channel not found' });
      }

      res.json(channel);
    } catch (error: any) {
      console.error('Error fetching channel:', error);
      res.status(500).json({ message: 'Failed to fetch channel' });
    }
  });

  // Get channel messages
  app.get('/api/communication/messages/:channelCode', async (req, res) => {
    try {
      const { channelCode } = req.params;
      const messages = await storage.getAnonymousMessages(channelCode);
      res.json(messages);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });

  // Send anonymous message
  app.post('/api/communication/messages', isAuthenticated, async (req, res) => {
    try {
      const { channelCode, senderType, message, messageType, attachmentUrl } = req.body;
      
      const newMessage = await storage.createAnonymousMessage({
        channelCode,
        senderType,
        message,
        messageType: messageType || 'text',
        attachmentUrl,
        isRead: false,
      });

      // Update communication history
      await storage.updateCommunicationHistory(channelCode);

      res.json(newMessage);
    } catch (error: any) {
      console.error('Error sending message:', error);
      res.status(500).json({ message: 'Failed to send message' });
    }
  });

  // Rate communication session
  app.post('/api/communication/channels/:channelCode/rate', isAuthenticated, async (req, res) => {
    try {
      const { channelCode } = req.params;
      const { rating } = req.body;
      
      await storage.rateCommunicationSession(channelCode, rating);
      res.json({ message: 'Rating submitted successfully' });
    } catch (error: any) {
      console.error('Error rating session:', error);
      res.status(500).json({ message: 'Failed to submit rating' });
    }
  });

  // Request contact information reveal
  app.post('/api/communication/channels/:channelCode/request-contact', isAuthenticated, async (req, res) => {
    try {
      const { channelCode } = req.params;
      const userId = (req as any).user.claims.sub;
      
      // Create notification for contact request
      const channel = await storage.getAnonymousChannel(channelCode);
      if (!channel) {
        return res.status(404).json({ message: 'Channel not found' });
      }

      // Determine recipient
      const recipientId = channel.clientId === userId ? channel.providerId.toString() : channel.clientId;
      
      await storage.createNotification({
        userId: recipientId,
        title: 'Contact Information Request',
        message: 'Someone has requested to share contact information with you.',
        type: 'contact_request',
        category: 'communication',
        isRead: false,
      });

      res.json({ message: 'Contact request sent' });
    } catch (error: any) {
      console.error('Error requesting contact:', error);
      res.status(500).json({ message: 'Failed to request contact' });
    }
  });

  // ============================================================================
  // TWO-FACTOR AUTHENTICATION SYSTEM
  // ============================================================================

  // Setup 2FA
  app.post('/api/auth/2fa/setup', isAuthenticated, async (req, res) => {
    try {
      const { userId, phoneNumber, email } = req.body;
      
      // Create or update 2FA record
      const twoFactor = await storage.setup2FA({
        userId,
        phoneNumber,
        email,
        isPhoneVerified: false,
        isEmailVerified: false,
      });

      // Generate verification code
      const codeType = phoneNumber ? 'sms' : 'email';
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      await storage.createVerificationCode({
        userId,
        code,
        codeType,
        isUsed: false,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      });

      // In production, send SMS/email here
      console.log(`2FA Code for ${userId}: ${code} (${codeType})`);

      res.json({
        message: 'Verification code sent',
        verificationCode: {
          codeType,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        }
      });
    } catch (error: any) {
      console.error('Error setting up 2FA:', error);
      res.status(500).json({ message: 'Failed to setup 2FA' });
    }
  });

  // Verify 2FA code
  app.post('/api/auth/2fa/verify', isAuthenticated, async (req, res) => {
    try {
      const { userId, code, codeType } = req.body;
      
      const verificationCode = await storage.verifyCode(userId, code, codeType);
      if (!verificationCode) {
        return res.status(400).json({ message: 'Invalid or expired verification code' });
      }

      // Mark appropriate verification as complete
      await storage.markVerificationComplete(userId, codeType);

      // Generate backup codes
      const backupCodes = Array.from({ length: 8 }, () => 
        Math.random().toString(36).substr(2, 8).toUpperCase()
      );
      
      await storage.updateBackupCodes(userId, backupCodes);

      res.json({
        message: 'Verification successful',
        isComplete: true,
        backupCodes
      });
    } catch (error: any) {
      console.error('Error verifying 2FA:', error);
      res.status(500).json({ message: 'Failed to verify code' });
    }
  });

  // Get 2FA status
  app.get('/api/auth/2fa/:userId', isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const twoFactor = await storage.get2FAStatus(userId);
      res.json(twoFactor);
    } catch (error: any) {
      console.error('Error fetching 2FA status:', error);
      res.status(500).json({ message: 'Failed to fetch 2FA status' });
    }
  });

  // Disable 2FA
  app.delete('/api/auth/2fa/:userId', isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      await storage.disable2FA(userId);
      res.json({ message: '2FA disabled successfully' });
    } catch (error: any) {
      console.error('Error disabling 2FA:', error);
      res.status(500).json({ message: 'Failed to disable 2FA' });
    }
  });

  // Generate new backup codes
  app.post('/api/auth/2fa/:userId/backup-codes', isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      
      const backupCodes = Array.from({ length: 8 }, () => 
        Math.random().toString(36).substr(2, 8).toUpperCase()
      );
      
      await storage.updateBackupCodes(userId, backupCodes);
      res.json({ backupCodes });
    } catch (error: any) {
      console.error('Error generating backup codes:', error);
      res.status(500).json({ message: 'Failed to generate backup codes' });
    }
  });

  // Phase 3: Provider Payout System Routes
  app.get("/api/providers/:providerId/payouts", isAuthenticated, async (req, res) => {
    try {
      const { providerId } = req.params;
      const payouts = await storage.getProviderPayouts(parseInt(providerId));
      res.json(payouts);
    } catch (error: any) {
      console.error("Error fetching provider payouts:", error);
      res.status(500).json({ message: "Failed to fetch payouts" });
    }
  });

  app.post("/api/providers/:providerId/payout-schedule", isAuthenticated, async (req, res) => {
    try {
      const { providerId } = req.params;
      const { frequency, minimumAmount, stripeAccountId, bankAccountLast4 } = req.body;
      
      const nextPayoutDate = new Date();
      nextPayoutDate.setDate(nextPayoutDate.getDate() + (frequency === 'daily' ? 1 : frequency === 'weekly' ? 7 : 30));

      const scheduleData = {
        providerId: parseInt(providerId),
        frequency,
        minimumAmount: minimumAmount.toString(),
        nextPayoutDate,
        stripeAccountId,
        bankAccountLast4,
      };

      const existingSchedule = await storage.getPayoutSchedule(parseInt(providerId));
      if (existingSchedule) {
        await storage.updatePayoutSchedule(parseInt(providerId), scheduleData);
      } else {
        await storage.createPayoutSchedule(scheduleData);
      }

      res.json({ message: "Payout schedule updated successfully" });
    } catch (error: any) {
      console.error("Error updating payout schedule:", error);
      res.status(500).json({ message: "Failed to update payout schedule" });
    }
  });

  app.get("/api/providers/:providerId/payout-schedule", isAuthenticated, async (req, res) => {
    try {
      const { providerId } = req.params;
      const schedule = await storage.getPayoutSchedule(parseInt(providerId));
      res.json(schedule || {});
    } catch (error: any) {
      console.error("Error fetching payout schedule:", error);
      res.status(500).json({ message: "Failed to fetch payout schedule" });
    }
  });

  // Tip Processing Routes
  app.post("/api/bookings/:bookingId/tip", isAuthenticated, async (req, res) => {
    try {
      const { bookingId } = req.params;
      const { amount } = req.body;
      const userId = (req as any).user?.claims?.sub;

      // Create Stripe payment intent for tip
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          type: "tip",
          bookingId,
          clientId: userId,
        },
      });

      // Create tip record
      const tipData = {
        bookingId,
        clientId: userId,
        providerId: 1, // Demo provider
        amount: amount.toString(),
        status: "pending",
      };

      const tip = await storage.createTip(tipData);

      res.json({ 
        tipId: tip.id,
        clientSecret: paymentIntent.client_secret 
      });
    } catch (error: any) {
      console.error("Error creating tip:", error);
      res.status(500).json({ message: "Failed to create tip" });
    }
  });

  app.get("/api/providers/:providerId/tips", isAuthenticated, async (req, res) => {
    try {
      const { providerId } = req.params;
      const { startDate, endDate } = req.query;
      
      let start, end;
      if (startDate) start = new Date(startDate as string);
      if (endDate) end = new Date(endDate as string);

      const tips = await storage.getProviderTips(parseInt(providerId), start, end);
      res.json(tips);
    } catch (error: any) {
      console.error("Error fetching provider tips:", error);
      res.status(500).json({ message: "Failed to fetch tips" });
    }
  });

  // Dispute Management Routes
  app.post("/api/bookings/:bookingId/dispute", isAuthenticated, async (req, res) => {
    try {
      const { bookingId } = req.params;
      const { reason, description, amount, disputantType } = req.body;
      const userId = (req as any).user?.claims?.sub;

      const disputeData = {
        bookingId,
        disputantId: userId,
        disputantType,
        reason,
        description,
        amount: amount.toString(),
        status: "open",
      };

      const dispute = await storage.createDispute(disputeData);
      res.json(dispute);
    } catch (error: any) {
      console.error("Error creating dispute:", error);
      res.status(500).json({ message: "Failed to create dispute" });
    }
  });

  app.get("/api/users/:userId/disputes", isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const disputes = await storage.getDisputesByUser(userId);
      res.json(disputes);
    } catch (error: any) {
      console.error("Error fetching user disputes:", error);
      res.status(500).json({ message: "Failed to fetch disputes" });
    }
  });

  app.get("/api/disputes/:disputeId", isAuthenticated, async (req, res) => {
    try {
      const { disputeId } = req.params;
      const dispute = await storage.getDispute(disputeId);
      
      if (!dispute) {
        return res.status(404).json({ message: "Dispute not found" });
      }

      const messages = await storage.getDisputeMessages(disputeId);
      res.json({ ...dispute, messages });
    } catch (error: any) {
      console.error("Error fetching dispute:", error);
      res.status(500).json({ message: "Failed to fetch dispute" });
    }
  });

  app.post("/api/disputes/:disputeId/messages", isAuthenticated, async (req, res) => {
    try {
      const { disputeId } = req.params;
      const { message, attachments } = req.body;
      const userId = (req as any).user?.claims?.sub;

      const messageData = {
        disputeId,
        senderId: userId,
        senderType: "client", // Would need logic to determine if admin/provider
        message,
        attachments,
      };

      const disputeMessage = await storage.createDisputeMessage(messageData);
      res.json(disputeMessage);
    } catch (error: any) {
      console.error("Error creating dispute message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Phase 4: Automation & Communication API endpoints
  
  // Automated Notifications
  app.get('/api/users/:userId/scheduled-notifications', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const userIdFromAuth = req.user?.claims?.sub;
      
      if (userId !== userIdFromAuth) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const notifications = await storage.getScheduledNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching scheduled notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get('/api/notification-templates', async (req, res) => {
    try {
      const templates = await storage.getNotificationTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching notification templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.post('/api/notifications/test', isAuthenticated, async (req: any, res) => {
    try {
      const { recipientId, type, channel } = req.body;
      const userId = req.user?.claims?.sub;
      
      if (recipientId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Create test notification
      const testNotification = await storage.createAutomatedNotification({
        type: `test_${type}`,
        templateId: 'test-template',
        recipientId,
        recipientType: 'client',
        scheduledFor: new Date(),
        channels: [channel],
        metadata: { isTest: true },
      });

      res.json({ message: "Test notification created", id: testNotification.id });
    } catch (error) {
      console.error("Error sending test notification:", error);
      res.status(500).json({ message: "Failed to send test notification" });
    }
  });

  // Communication Preferences
  app.get('/api/users/:userId/communication-preferences', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const userIdFromAuth = req.user?.claims?.sub;
      
      if (userId !== userIdFromAuth) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const preferences = await storage.getCommunicationPreferences(userId);
      res.json(preferences || {
        appointmentReminders: true,
        bookingConfirmations: true,
        paymentNotifications: true,
        marketingMessages: false,
        smsEnabled: true,
        emailEnabled: true,
        pushEnabled: true,
        reminderTimings: { "24h": true, "2h": true, "30m": false },
        quietHours: { enabled: false, start: "22:00", end: "08:00" }
      });
    } catch (error) {
      console.error("Error fetching communication preferences:", error);
      res.status(500).json({ message: "Failed to fetch preferences" });
    }
  });

  app.post('/api/users/:userId/communication-preferences', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const userIdFromAuth = req.user?.claims?.sub;
      
      if (userId !== userIdFromAuth) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const preferences = await storage.updateCommunicationPreferences(userId, req.body);
      res.json(preferences);
    } catch (error) {
      console.error("Error updating communication preferences:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  // Communication History
  app.get('/api/users/:userId/communication-log', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const userIdFromAuth = req.user?.claims?.sub;
      
      if (userId !== userIdFromAuth) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const history = await storage.getCommunicationHistory(userId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching communication history:", error);
      res.status(500).json({ message: "Failed to fetch communication history" });
    }
  });

  // Calendar Integration
  app.get('/api/users/:userId/calendar-integrations', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const userIdFromAuth = req.user?.claims?.sub;
      
      if (userId !== userIdFromAuth) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const integrations = await storage.getCalendarIntegrations(userId);
      res.json(integrations);
    } catch (error) {
      console.error("Error fetching calendar integrations:", error);
      res.status(500).json({ message: "Failed to fetch calendar integrations" });
    }
  });

  app.post('/api/users/:userId/calendar-connect', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { calendarType, redirectUrl } = req.body;
      const userIdFromAuth = req.user?.claims?.sub;
      
      if (userId !== userIdFromAuth) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Mock OAuth URL for demo purposes
      const authUrl = `https://accounts.${calendarType}.com/oauth/authorize?client_id=demo&redirect_uri=${encodeURIComponent(redirectUrl)}&scope=calendar.readonly&response_type=code`;
      
      res.json({ authUrl });
    } catch (error) {
      console.error("Error connecting calendar:", error);
      res.status(500).json({ message: "Failed to connect calendar" });
    }
  });

  app.delete('/api/calendar-integrations/:integrationId', isAuthenticated, async (req: any, res) => {
    try {
      const { integrationId } = req.params;
      const userId = req.user?.claims?.sub;
      
      // Verify ownership through integration
      const integrations = await storage.getCalendarIntegrations(userId);
      const integration = integrations.find(i => i.id === integrationId);
      
      if (!integration) {
        return res.status(404).json({ message: "Integration not found" });
      }

      await storage.deleteCalendarIntegration(integrationId);
      res.json({ message: "Calendar disconnected successfully" });
    } catch (error) {
      console.error("Error disconnecting calendar:", error);
      res.status(500).json({ message: "Failed to disconnect calendar" });
    }
  });

  app.post('/api/calendar-integrations/:integrationId/sync', isAuthenticated, async (req: any, res) => {
    try {
      const { integrationId } = req.params;
      const userId = req.user?.claims?.sub;
      
      // Verify ownership
      const integrations = await storage.getCalendarIntegrations(userId);
      const integration = integrations.find(i => i.id === integrationId);
      
      if (!integration) {
        return res.status(404).json({ message: "Integration not found" });
      }

      // Update last sync time
      await storage.updateCalendarIntegration(integrationId, {
        lastSyncAt: new Date(),
        syncStatus: 'active'
      });

      res.json({ message: "Calendar sync initiated" });
    } catch (error) {
      console.error("Error syncing calendar:", error);
      res.status(500).json({ message: "Failed to sync calendar" });
    }
  });

  app.patch('/api/calendar-integrations/:integrationId', isAuthenticated, async (req: any, res) => {
    try {
      const { integrationId } = req.params;
      const userId = req.user?.claims?.sub;
      
      // Verify ownership
      const integrations = await storage.getCalendarIntegrations(userId);
      const integration = integrations.find(i => i.id === integrationId);
      
      if (!integration) {
        return res.status(404).json({ message: "Integration not found" });
      }

      await storage.updateCalendarIntegration(integrationId, req.body);
      res.json({ message: "Integration updated successfully" });
    } catch (error) {
      console.error("Error updating calendar integration:", error);
      res.status(500).json({ message: "Failed to update integration" });
    }
  });

  // Calendar Events
  app.get('/api/users/:userId/calendar-events', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const userIdFromAuth = req.user?.claims?.sub;
      
      if (userId !== userIdFromAuth) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const events = await storage.getCalendarEvents(userId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      res.status(500).json({ message: "Failed to fetch calendar events" });
    }
  });

  app.get('/api/users/:userId/calendar-sync-status', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const userIdFromAuth = req.user?.claims?.sub;
      
      if (userId !== userIdFromAuth) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const integrations = await storage.getCalendarIntegrations(userId);
      const syncStatus = {
        totalIntegrations: integrations.length,
        activeIntegrations: integrations.filter(i => i.syncStatus === 'active').length,
        lastSyncAt: integrations.reduce((latest, integration) => {
          if (!integration.lastSyncAt) return latest;
          const syncTime = new Date(integration.lastSyncAt);
          return !latest || syncTime > latest ? syncTime : latest;
        }, null),
        hasErrors: integrations.some(i => i.syncStatus === 'error')
      };

      res.json(syncStatus);
    } catch (error) {
      console.error("Error fetching sync status:", error);
      res.status(500).json({ message: "Failed to fetch sync status" });
    }
  });

  // Notification Templates (Public endpoint)
  app.get('/api/notification-templates', async (req, res) => {
    try {
      const templates = await storage.getNotificationTemplates();
      res.json(templates);
    } catch (error: any) {
      console.error("Error fetching notification templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  // AI Translation endpoints
  app.post('/api/translate', async (req, res) => {
    try {
      const { text, targetLanguage } = req.body;
      
      if (!text || !targetLanguage) {
        return res.status(400).json({ message: "Text and target language are required" });
      }

      // If target language is English, return original text
      if (targetLanguage === 'en') {
        return res.json({ translatedText: text });
      }

      // Language mapping for OpenAI
      const languageMap: Record<string, string> = {
        'zh': 'Chinese (Simplified)',
        'es': 'Spanish',
        'fr': 'French',
        'ar': 'Arabic'
      };

      const targetLanguageName = languageMap[targetLanguage] || targetLanguage;

      // Call OpenAI API for translation
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a professional translator. Translate the given text to ${targetLanguageName}. Maintain the original tone and context. Return only the translated text without any additional commentary.`
            },
            {
              role: 'user',
              content: text
            }
          ],
          max_tokens: 1000,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        // Handle rate limits gracefully
        if (response.status === 429) {
          console.warn('OpenAI rate limit reached, returning original text');
          return res.json({ translatedText: text });
        }
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const translatedText = data.choices?.[0]?.message?.content || text;

      res.json({ translatedText });
    } catch (error) {
      console.error('Translation error:', error);
      res.status(500).json({ message: "Translation failed", translatedText: req.body.text });
    }
  });

  app.post('/api/translate/batch', async (req, res) => {
    try {
      const { texts, targetLanguage } = req.body;
      
      if (!texts || !Array.isArray(texts) || !targetLanguage) {
        return res.status(400).json({ message: "Texts array and target language are required" });
      }

      // If target language is English, return original texts
      if (targetLanguage === 'en') {
        return res.json({ translatedTexts: texts });
      }

      // Language mapping for OpenAI
      const languageMap: Record<string, string> = {
        'zh': 'Chinese (Simplified)',
        'es': 'Spanish',
        'fr': 'French',
        'ar': 'Arabic'
      };

      const targetLanguageName = languageMap[targetLanguage] || targetLanguage;

      // Batch translate texts
      const translatedTexts = await Promise.all(
        texts.map(async (text: string) => {
          if (!text.trim()) return text;
          
          try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                  {
                    role: 'system',
                    content: `You are a professional translator. Translate the given text to ${targetLanguageName}. Maintain the original tone and context. Return only the translated text without any additional commentary.`
                  },
                  {
                    role: 'user',
                    content: text
                  }
                ],
                max_tokens: 500,
                temperature: 0.3
              })
            });

            if (!response.ok) {
              // Handle rate limits and errors gracefully
              if (response.status === 429) {
                console.warn('OpenAI rate limit reached for batch translation');
              }
              return text; // Return original if translation fails
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || text;
          } catch {
            return text; // Return original if translation fails
          }
        })
      );

      res.json({ translatedTexts });
    } catch (error) {
      console.error('Batch translation error:', error);
      res.status(500).json({ message: "Batch translation failed", translatedTexts: req.body.texts });
    }
  });

  // Add AI-powered routes
  const { aiRouter } = await import("./routes/ai");
  app.use("/api/ai", aiRouter);

  const httpServer = createServer(app);
  return httpServer;
}

// Helper functions for enhanced token system per wireframes
function getNextAchievement(pointsEarned: number) {
  const achievements = [
    { level: 'bronze', points: 0, name: 'Getting Started' },
    { level: 'silver', points: 100, name: 'Rising Star', reward: '25 Bonus Tokens' },
    { level: 'gold', points: 500, name: 'Professional', reward: '100 Bonus Tokens' },
    { level: 'platinum', points: 1000, name: 'Expert Provider', reward: '250 Bonus Tokens' }
  ];
  
  const next = achievements.find(a => a.points > pointsEarned);
  return next || achievements[achievements.length - 1];
}

function getBoostCost(boostType: string, duration: number): number {
  const costs = {
    'local': 10,     // 10 tokens per hour
    'city': 25,      // 25 tokens per hour  
    'state': 50,     // 50 tokens per hour
    'featured': 100  // 100 tokens per hour
  };
  return (costs[boostType as keyof typeof costs] || 10) * duration;
}

function getBoostPriority(boostType: string): number {
  const priorities = {
    'local': 1,
    'city': 2,
    'state': 3,
    'featured': 4
  };
  return priorities[boostType as keyof typeof priorities] || 1;
}

function calculateVerificationCompletion(verifications: any[], references: any[], trustScore: any): number {
  let completion = 0;
  const totalSteps = 7; // Based on wireframes requirements
  
  // Required verifications per wireframes
  if (verifications.some(v => v.verificationType === 'state_id' && v.verificationStatus === 'approved')) completion++;
  if (verifications.some(v => v.verificationType === 'background_check' && v.verificationStatus === 'approved')) completion++;
  if (verifications.some(v => v.verificationType === 'certification' && v.verificationStatus === 'approved')) completion++;
  if (references.length >= 2) completion++; // 2 references required
  if (trustScore?.workspacePhotosUploaded) completion++;
  if (trustScore?.overallScore >= 8.0) completion++;
  if (verifications.length >= 3) completion++; // Multiple verifications
  
  return Math.round((completion / totalSteps) * 100);
}

async function updateTrustScoreAfterVerification(professionalId: number) {
  try {
    const verifications = await storage.getProviderVerifications(professionalId);
    const references = await storage.getProviderReferences(professionalId);
    
    let verificationScore = 0;
    let backgroundCheckPassed = false;
    let stateIdVerified = false;
    let certificationsVerified = false;
    let referencesVerified = references.length >= 2;
    
    verifications.forEach(v => {
      if (v.verificationStatus === 'approved') {
        verificationScore += 2.0;
        if (v.verificationType === 'background_check') backgroundCheckPassed = true;
        if (v.verificationType === 'state_id') stateIdVerified = true;
        if (v.verificationType === 'certification') certificationsVerified = true;
      }
    });
    
    const overallScore = Math.min(10.0, 5.0 + verificationScore);
    
    await storage.updateTrustScore(professionalId, {
      overallScore,
      verificationScore,
      backgroundCheckPassed,
      stateIdVerified,
      certificationsVerified,
      referencesVerified
    });
  } catch (error) {
    console.error('Error updating trust score:', error);
  }
}

async function seedTokenPackages() {
  try {
    const packages = [
      {
        name: 'Basic Boost',
        tokenAmount: 100,
        price: 1000, // $10.00
        boostType: 'local',
        boostDuration: 24,
        description: 'Perfect for new providers getting started',
        isPopular: false
      },
      {
        name: 'Standard Boost',
        tokenAmount: 500,
        price: 4000, // $40.00
        boostType: 'city',
        boostDuration: 48,
        description: 'Best value for growing your business',
        isPopular: true
      },
      {
        name: 'Premium Boost',
        tokenAmount: 1000,
        price: 7500, // $75.00
        boostType: 'state',
        boostDuration: 72,
        description: 'Maximum visibility across your state',
        isPopular: false
      }
    ];
    
    for (const pkg of packages) {
      await db.insert(tokenPackages).values(pkg);
    }
  } catch (error) {
    console.error('Error seeding token packages:', error);
  }
}
