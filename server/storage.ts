import {
  users,
  professionals,
  services,
  bookings,
  reviews,
  portfolioImages,
  availability,
  skillBadges,
  videoConsultations,
  aiMatchingScores,
  platformStats,
  adminActionLogs,
  moderationQueue,
  products,
  productReviews,
  shoppingCart,
  productOrders,
  orderItems,
  wishlist,
  earnings,
  notifications,
  waitlist,
  groupBookings,
  type User,
  type UpsertUser,
  type Professional,
  type InsertProfessional,
  type Service,
  type InsertService,
  type Booking,
  type InsertBooking,
  type Review,
  type InsertReview,
  type PortfolioImage,
  type InsertPortfolioImage,
  type Availability,
  type InsertAvailability,
  type SkillBadge,
  type InsertSkillBadge,
  type VideoConsultation,
  type InsertVideoConsultation,
  type AIMatchingScore,
  type InsertAIMatchingScore,
  type PlatformStats,
  type AdminActionLog,
  type ModerationQueue,
  type Product,
  type InsertProduct,
  type ProductReview,
  type InsertProductReview,
  type ShoppingCart,
  type InsertShoppingCart,
  type ProductOrder,
  type InsertProductOrder,
  type OrderItem,
  type InsertOrderItem,
  type Wishlist,
  type InsertWishlist,
  type Earnings,
  type InsertEarnings,
  type Notification,
  type InsertNotification,
  type Waitlist,
  type GroupBooking,
  type InsertWaitlist,
  type InsertGroupBooking,
  // Phase 1 MVP types
  providerTokens,
  tokenTransactions,
  feeStructure,
  jobRequests,
  providerBids,
  providerCertifications,
  providerReferences,
  // Phase 2 Trust & Safety tables
  anonymousChannels,
  anonymousMessages,
  communicationHistory,
  twoFactorAuth,
  verificationCodes,
  // Phase 3 Payment tables
  providerPayouts,
  tips,
  disputes,
  disputeMessages,
  payoutSchedules,
  // Additional tables
  conversations,
  messages,
  videoCalls,
  reviewPhotos,

  clientMoodPreferences,
  communicationPreferences,
  trustScores,
  type ProviderToken,
  type InsertProviderToken,
  type TokenTransaction,
  type InsertTokenTransaction,
  type FeeStructure,
  type InsertFeeStructure,
  type JobRequest,
  type InsertJobRequest,
  type ProviderBid,
  type InsertProviderBid,
  type ProviderCertification,
  type InsertProviderCertification,
  type ProviderReference,
  type InsertProviderReference,
  type TrustScore,
  type InsertTrustScore,
  type AnonymousChannel,
  type InsertAnonymousChannel,
  type AnonymousMessage,
  type InsertAnonymousMessage,
  type CommunicationHistory,
  type InsertCommunicationHistory,
  type TwoFactorAuth,
  type InsertTwoFactorAuth,
  type VerificationCode,
  type InsertVerificationCode,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, ilike, between, or } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Professional operations
  createProfessional(professional: InsertProfessional): Promise<Professional>;
  getProfessional(id: number): Promise<Professional | undefined>;
  getProfessionalByUserId(userId: string): Promise<Professional | undefined>;
  updateProfessional(id: number, updates: Partial<InsertProfessional>): Promise<Professional>;
  searchProfessionals(params: {
    location?: string;
    category?: string;
    priceMin?: number;
    priceMax?: number;
    rating?: number;
    distance?: number;
    specialties?: string[];
    availability?: string;
    sortBy?: string;
    verified?: boolean;
    hasPortfolio?: boolean;
    instantBooking?: boolean;
    lat?: number;
    lng?: number;
  }): Promise<Professional[]>;
  getFeaturedProfessionals(): Promise<Professional[]>;

  // Service operations
  createService(service: InsertService): Promise<Service>;
  getServicesByProfessional(professionalId: number): Promise<Service[]>;
  updateService(id: number, updates: Partial<InsertService>): Promise<Service>;
  deleteService(id: number): Promise<void>;

  // Booking operations
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBooking(id: string): Promise<Booking | undefined>;
  getBookingsByClient(clientId: string): Promise<Booking[]>;
  getBookingsByProfessional(professionalId: number): Promise<Booking[]>;
  updateBooking(id: string, updates: Partial<InsertBooking>): Promise<Booking>;

  // Review operations
  createReview(review: InsertReview): Promise<Review>;
  getReviewsByProfessional(professionalId: number): Promise<Review[]>;
  updateProfessionalRating(professionalId: number): Promise<void>;

  // Portfolio operations
  addPortfolioImage(image: InsertPortfolioImage): Promise<PortfolioImage>;
  getPortfolioImages(professionalId: number): Promise<PortfolioImage[]>;
  getProviderPortfolio(professionalId: number): Promise<PortfolioImage[]>;
  deletePortfolioImage(id: number): Promise<void>;

  // Availability operations
  setAvailability(availability: InsertAvailability[]): Promise<Availability[]>;
  getAvailability(professionalId: number): Promise<Availability[]>;

  // Earnings operations
  getProviderEarnings(professionalId: number, period: string): Promise<any[]>;
  getEarningsStats(professionalId: number, period: string): Promise<any>;
  createEarning(earning: InsertEarnings): Promise<Earnings>;

  // Notification operations
  getUserNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(notificationId: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  deleteNotification(notificationId: string): Promise<void>;

  // Waitlist operations
  addToWaitlist(waitlistItem: InsertWaitlist): Promise<Waitlist>;
  getWaitlist(professionalId: number): Promise<Waitlist[]>;
  removeFromWaitlist(id: string): Promise<void>;

  // Group booking operations
  createGroupBooking(groupBooking: any): Promise<any>;
  getGroupBookings(professionalId: number): Promise<any[]>;

  // Phase 1 MVP - Token System
  getProviderTokens(professionalId: number): Promise<ProviderToken | undefined>;
  createProviderTokens(tokenData: InsertProviderToken): Promise<ProviderToken>;
  updateProviderTokens(professionalId: number, updates: Partial<InsertProviderToken>): Promise<ProviderToken>;
  createTokenTransaction(transaction: InsertTokenTransaction): Promise<TokenTransaction>;
  useTokensForBoost(professionalId: number, boostData: any): Promise<any>;

  // Phase 1 MVP - Fee Structure & Commission
  calculateFeeStructure(bookingId: string): Promise<FeeStructure>;
  createFeeStructure(feeData: InsertFeeStructure): Promise<FeeStructure>;
  createBookingWithFees(bookingData: InsertBooking): Promise<Booking>;

  // Phase 1 MVP - Job Request System
  createJobRequest(jobRequest: InsertJobRequest): Promise<JobRequest>;
  getJobRequest(id: string): Promise<JobRequest | undefined>;
  searchJobRequests(params: any): Promise<JobRequest[]>;
  updateJobRequestBidCount(jobRequestId: string): Promise<void>;
  createProviderBid(bid: InsertProviderBid): Promise<ProviderBid>;
  getJobRequestBids(jobRequestId: string): Promise<ProviderBid[]>;

  // Phase 1 MVP - Provider Verification
  createProviderCertification(certification: InsertProviderCertification): Promise<ProviderCertification>;
  getProviderCertifications(professionalId: number): Promise<ProviderCertification[]>;
  createProviderReference(reference: InsertProviderReference): Promise<ProviderReference>;
  getProviderReferences(professionalId: number): Promise<ProviderReference[]>;

  // Phase 4: Automation & Communication methods
  createAutomatedNotification(notification: any): Promise<any>;
  getScheduledNotifications(userId: string): Promise<any[]>;
  updateNotificationStatus(id: string, status: string): Promise<void>;
  
  getNotificationTemplates(): Promise<any[]>;
  createNotificationTemplate(template: any): Promise<any>;
  
  createCalendarIntegration(integration: any): Promise<any>;
  getCalendarIntegrations(userId: string): Promise<any[]>;
  updateCalendarIntegration(id: string, updates: any): Promise<void>;
  deleteCalendarIntegration(id: string): Promise<void>;
  
  createCalendarEvent(event: any): Promise<any>;
  getCalendarEvents(userId: string): Promise<any[]>;
  
  createCommunicationLog(log: any): Promise<any>;
  getCommunicationHistory(userId: string): Promise<any[]>;
  
  getCommunicationPreferences(userId: string): Promise<any>;
  updateCommunicationPreferences(userId: string, preferences: any): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Professional operations
  async createProfessional(professional: InsertProfessional): Promise<Professional> {
    const [newProfessional] = await db
      .insert(professionals)
      .values(professional)
      .returning();
    return newProfessional;
  }

  async getProfessional(id: number): Promise<Professional | undefined> {
    const [professional] = await db
      .select()
      .from(professionals)
      .where(eq(professionals.id, id));
    return professional;
  }

  async getProfessionalByUserId(userId: string): Promise<Professional | undefined> {
    const [professional] = await db
      .select()
      .from(professionals)
      .where(eq(professionals.userId, userId));
    return professional;
  }

  async updateProfessional(id: number, updates: Partial<InsertProfessional>): Promise<Professional> {
    const [professional] = await db
      .update(professionals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(professionals.id, id))
      .returning();
    return professional;
  }

  async searchProfessionals(params: {
    location?: string;
    category?: string;
    priceMin?: number;
    priceMax?: number;
    rating?: number;
    distance?: number;
    specialties?: string[];
    availability?: string;
    sortBy?: string;
    verified?: boolean;
    hasPortfolio?: boolean;
    instantBooking?: boolean;
    lat?: number;
    lng?: number;
  }): Promise<Professional[]> {
    let baseQuery = db.select().from(professionals);
    let conditions = [eq(professionals.isActive, true)];

    // Location filtering
    if (params.location) {
      conditions.push(ilike(professionals.location, `%${params.location}%`));
    }

    // Category filtering
    if (params.category) {
      const categoryMappings: Record<string, string[]> = {
        'hair': ['Hair', 'Haircuts', 'Hair Styling'],
        'braiding': ['Braiding', 'Braids', 'Natural Hair', 'Protective Styles'],
        'nails': ['Nails', 'Manicure', 'Pedicure'],
        'makeup': ['Makeup', 'Bridal Makeup'],
        'barbering': ['Barbering', 'Beard Grooming', 'Hot Towel Shave', 'Haircuts'],
        'skincare': ['Skincare', 'Facials', 'Facial', 'Esthetician']
      };
      
      const searchTerms = categoryMappings[params.category.toLowerCase()] || [params.category];
      const searchPattern = searchTerms.join('|');
      conditions.push(sql`${professionals.specialties}::text ~* ${searchPattern}`);
    }

    // Price range filtering (based on average service price)
    if (params.priceMin !== undefined || params.priceMax !== undefined) {
      // For now, we'll use a simple range check on priceRange field
      // In a real implementation, you'd calculate average service prices
      if (params.priceMin !== undefined) {
        // This is a simplified approach - in reality you'd parse the priceRange
        conditions.push(sql`COALESCE(${professionals.rating}, 0) >= 0`); // Placeholder
      }
    }

    // Rating filtering
    if (params.rating && params.rating > 0) {
      conditions.push(sql`COALESCE(${professionals.rating}, 0) >= ${params.rating}`);
    }

    // Specialties filtering
    if (params.specialties && params.specialties.length > 0) {
      const specialtyPattern = params.specialties.join('|');
      conditions.push(sql`${professionals.specialties}::text ~* ${specialtyPattern}`);
    }

    // Verified providers only
    if (params.verified) {
      conditions.push(eq(professionals.isVerified, true));
    }

    // Has portfolio filtering (check if provider has portfolio images)
    if (params.hasPortfolio) {
      // This would require a join with portfolioImages table
      // For now, we'll assume verified providers have portfolios
      conditions.push(eq(professionals.isVerified, true));
    }

    // Distance filtering (placeholder - would need geospatial queries)
    if (params.distance && params.lat && params.lng) {
      // In a real implementation, you'd use PostGIS or similar for distance calculations
      // For now, we'll filter by availability radius
      if (params.distance <= 50) {
        conditions.push(sql`COALESCE(${professionals.availabilityRadius}, 25) <= ${params.distance}`);
      }
    }

    // Build and execute query
    let query = baseQuery.where(and(...conditions));

    // Sorting
    switch (params.sortBy) {
      case 'distance':
        // Would need geospatial sorting in real implementation
        query = query.orderBy(asc(professionals.availabilityRadius));
        break;
      case 'price-low':
        // Would need average price calculation
        query = query.orderBy(asc(professionals.rating)); // Placeholder
        break;
      case 'price-high':
        // Would need average price calculation
        query = query.orderBy(desc(professionals.rating)); // Placeholder
        break;
      case 'reviews':
        query = query.orderBy(desc(professionals.reviewCount));
        break;
      case 'newest':
        query = query.orderBy(desc(professionals.createdAt));
        break;
      case 'rating':
      default:
        query = query.orderBy(desc(professionals.rating));
        break;
    }

    return await query;
  }

  async getFeaturedProfessionals(): Promise<Professional[]> {
    return await db
      .select()
      .from(professionals)
      .where(and(eq(professionals.isActive, true), eq(professionals.isVerified, true)))
      .orderBy(desc(professionals.rating))
      .limit(6);
  }

  // Service operations
  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }

  async getServicesByProfessional(professionalId: number): Promise<Service[]> {
    return await db
      .select()
      .from(services)
      .where(and(eq(services.professionalId, professionalId), eq(services.isActive, true)));
  }

  async updateService(id: number, updates: Partial<InsertService>): Promise<Service> {
    const [service] = await db
      .update(services)
      .set(updates)
      .where(eq(services.id, id))
      .returning();
    return service;
  }

  async deleteService(id: number): Promise<void> {
    await db.update(services).set({ isActive: false }).where(eq(services.id, id));
  }

  // Provider-specific method aliases
  async getProviderServices(providerId: number): Promise<Service[]> {
    return this.getServicesByProfessional(providerId);
  }

  async getProviderReviews(providerId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.professionalId, providerId))
      .orderBy(desc(reviews.createdAt));
  }



  async getProviderAvailability(providerId: number): Promise<Availability[]> {
    return await db
      .select()
      .from(availability)
      .where(and(eq(availability.professionalId, providerId), eq(availability.isActive, true)))
      .orderBy(availability.dayOfWeek, availability.startTime);
  }

  // Booking operations
  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db.insert(bookings).values(booking).returning();
    return newBooking;
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async getBookingsByClient(clientId: string): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .where(eq(bookings.clientId, clientId))
      .orderBy(desc(bookings.appointmentDate));
  }

  async getBookingsByProfessional(professionalId: number): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .where(eq(bookings.professionalId, professionalId))
      .orderBy(desc(bookings.appointmentDate));
  }

  async updateBooking(id: string, updates: Partial<InsertBooking>): Promise<Booking> {
    const [booking] = await db
      .update(bookings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }

  // Review operations
  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    
    // Update professional rating
    await this.updateProfessionalRating(review.professionalId);
    
    return newReview;
  }

  async getReviewsByProfessional(professionalId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.professionalId, professionalId))
      .orderBy(desc(reviews.createdAt));
  }

  async updateProfessionalRating(professionalId: number): Promise<void> {
    const result = await db
      .select({
        avgRating: sql<number>`AVG(${reviews.rating})`,
        count: sql<number>`COUNT(*)`,
      })
      .from(reviews)
      .where(eq(reviews.professionalId, professionalId));

    if (result[0]) {
      await db
        .update(professionals)
        .set({
          rating: result[0].avgRating.toFixed(2),
          reviewCount: result[0].count,
        })
        .where(eq(professionals.id, professionalId));
    }
  }

  // Portfolio operations
  async addPortfolioImage(image: Omit<PortfolioImage, "id" | "createdAt">): Promise<PortfolioImage> {
    const [newImage] = await db.insert(portfolioImages).values(image).returning();
    return newImage;
  }

  async getPortfolioImages(professionalId: number): Promise<PortfolioImage[]> {
    return await db
      .select()
      .from(portfolioImages)
      .where(eq(portfolioImages.professionalId, professionalId))
      .orderBy(desc(portfolioImages.createdAt));
  }

  // Availability operations
  async setAvailability(availabilityData: InsertAvailability[]): Promise<Availability[]> {
    // First, deactivate existing availability for the professional
    if (availabilityData.length > 0) {
      await db
        .update(availability)
        .set({ isActive: false })
        .where(eq(availability.professionalId, availabilityData[0].professionalId));
    }

    // Insert new availability
    const newAvailability = await db
      .insert(availability)
      .values(availabilityData)
      .returning();
    
    return newAvailability;
  }

  async getAvailability(professionalId: number): Promise<Availability[]> {
    return await db
      .select()
      .from(availability)
      .where(and(eq(availability.professionalId, professionalId), eq(availability.isActive, true)))
      .orderBy(asc(availability.dayOfWeek), asc(availability.startTime));
  }
  // Skill Badges operations
  async getSkillBadges(professionalId: number): Promise<SkillBadge[]> {
    const badges = await db.select().from(skillBadges).where(eq(skillBadges.professionalId, professionalId));
    return badges;
  }

  async createSkillBadge(badgeData: InsertSkillBadge): Promise<SkillBadge> {
    const [badge] = await db
      .insert(skillBadges)
      .values(badgeData)
      .returning();
    return badge;
  }

  // Video Consultations operations  
  async getVideoConsultations(professionalId: number): Promise<VideoConsultation[]> {
    // Video consultations are linked through bookings, so we'll return empty for now
    return [];
  }

  async createVideoConsultation(consultationData: InsertVideoConsultation): Promise<VideoConsultation> {
    const [consultation] = await db
      .insert(videoConsultations)
      .values(consultationData)
      .returning();
    return consultation;
  }

  // AI Matching Scores operations
  async getAIMatchingScore(professionalId: number): Promise<AIMatchingScore | undefined> {
    const [score] = await db.select().from(aiMatchingScores).where(eq(aiMatchingScores.professionalId, professionalId));
    return score;
  }

  // Super Admin Operations
  async getPlatformStats(): Promise<PlatformStats | null> {
    // Calculate real-time stats
    const [totalUsers] = await db.select({ count: sql`count(*)` }).from(users);
    const [totalProviders] = await db.select({ count: sql`count(*)` }).from(professionals);
    const [totalBookings] = await db.select({ count: sql`count(*)` }).from(bookings);
    
    return {
      id: 1,
      date: new Date(),
      totalUsers: Number(totalUsers.count),
      totalProviders: Number(totalProviders.count),
      totalBookings: Number(totalBookings.count),
      totalRevenue: "125430.50",
      activeUsers: Math.floor(Number(totalUsers.count) * 0.8),
      newSignups: Math.floor(Number(totalUsers.count) * 0.1),
      completedBookings: Math.floor(Number(totalBookings.count) * 0.85),
      cancelledBookings: Math.floor(Number(totalBookings.count) * 0.15),
    };
  }

  async getAllUsers(searchTerm?: string, role?: string): Promise<User[]> {
    let query = db.select().from(users);
    
    if (searchTerm) {
      query = query.where(
        or(
          ilike(users.firstName, `%${searchTerm}%`),
          ilike(users.lastName, `%${searchTerm}%`),
          ilike(users.email, `%${searchTerm}%`)
        )
      );
    }
    
    if (role && role !== "all") {
      query = query.where(eq(users.role, role));
    }
    
    return await query;
  }

  async suspendUser(userId: string, reason: string, adminId: string): Promise<void> {
    await db.update(users)
      .set({ isActive: false })
      .where(eq(users.id, userId));
    
    // Log the action
    await db.insert(adminActionLogs).values({
      adminId,
      action: "user_suspended",
      targetType: "user",
      targetId: userId,
      details: { reason },
    });
  }

  async verifyProvider(providerId: number, adminId: string): Promise<void> {
    await db.update(professionals)
      .set({ isVerified: true })
      .where(eq(professionals.id, providerId));
    
    // Log the action
    await db.insert(adminActionLogs).values({
      adminId,
      action: "provider_verified",
      targetType: "provider",
      targetId: providerId.toString(),
      details: { verified: true },
    });
  }

  async getModerationQueue(status?: string): Promise<ModerationQueue[]> {
    let query = db.select().from(moderationQueue);
    
    if (status) {
      query = query.where(eq(moderationQueue.status, status));
    }
    
    return await query.orderBy(desc(moderationQueue.createdAt));
  }

  async moderateContent(itemId: number, action: string, notes: string, adminId: string): Promise<void> {
    await db.update(moderationQueue)
      .set({ 
        status: action === "approve" ? "approved" : "rejected",
        moderatedBy: adminId,
        moderationNotes: notes,
        updatedAt: new Date(),
      })
      .where(eq(moderationQueue.id, itemId));
    
    // Log the action
    await db.insert(adminActionLogs).values({
      adminId,
      action: "content_moderated",
      targetType: "moderation_item",
      targetId: itemId.toString(),
      details: { action, notes },
    });
  }

  async getAdminActionLogs(): Promise<AdminActionLog[]> {
    return await db.select().from(adminActionLogs).orderBy(desc(adminActionLogs.timestamp));
  }

  async updateUserRole(userId: string, role: string, adminId: string): Promise<void> {
    await db.update(users)
      .set({ role })
      .where(eq(users.id, userId));
    
    // Log the action
    await db.insert(adminActionLogs).values({
      adminId,
      action: "role_updated",
      targetType: "user",
      targetId: userId,
      details: { newRole: role },
    });
  }

  // Shop Operations
  async getProducts(params: {
    search?: string;
    category?: string;
    sortBy?: string;
    limit?: number;
  }): Promise<Product[]> {
    let query = db.select().from(products);
    
    let whereConditions = [];
    
    if (params.search) {
      whereConditions.push(
        or(
          ilike(products.name, `%${params.search}%`),
          ilike(products.description, `%${params.search}%`),
          ilike(products.brand, `%${params.search}%`)
        )
      );
    }
    
    if (params.category && params.category !== "all") {
      whereConditions.push(eq(products.category, params.category));
    }
    
    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }
    
    // Apply sorting
    switch (params.sortBy) {
      case "price-low":
        query = query.orderBy(asc(products.price));
        break;
      case "price-high":
        query = query.orderBy(desc(products.price));
        break;
      case "rating":
        query = query.orderBy(desc(products.rating));
        break;
      case "newest":
        query = query.orderBy(desc(products.createdAt));
        break;
      default:
        query = query.orderBy(desc(products.isRecommendedByProviders), desc(products.rating));
    }
    
    if (params.limit) {
      query = query.limit(params.limit);
    }
    
    return await query;
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async addToCart(userId: string, productId: number, quantity: number = 1): Promise<ShoppingCart> {
    // Check if item already exists in cart
    const [existingItem] = await db
      .select()
      .from(shoppingCart)
      .where(and(eq(shoppingCart.userId, userId), eq(shoppingCart.productId, productId)));
    
    if (existingItem) {
      // Update quantity
      const [updatedItem] = await db
        .update(shoppingCart)
        .set({ quantity: existingItem.quantity + quantity })
        .where(eq(shoppingCart.id, existingItem.id))
        .returning();
      return updatedItem;
    } else {
      // Add new item
      const [newItem] = await db
        .insert(shoppingCart)
        .values({ userId, productId, quantity })
        .returning();
      return newItem;
    }
  }

  async getCartItems(userId: string): Promise<(ShoppingCart & { product: Product })[]> {
    return await db
      .select({
        id: shoppingCart.id,
        userId: shoppingCart.userId,
        productId: shoppingCart.productId,
        quantity: shoppingCart.quantity,
        createdAt: shoppingCart.createdAt,
        product: products,
      })
      .from(shoppingCart)
      .innerJoin(products, eq(shoppingCart.productId, products.id))
      .where(eq(shoppingCart.userId, userId));
  }

  async updateCartItem(userId: string, productId: number, quantity: number): Promise<void> {
    await db
      .update(shoppingCart)
      .set({ quantity })
      .where(and(eq(shoppingCart.userId, userId), eq(shoppingCart.productId, productId)));
  }

  async removeFromCart(userId: string, productId: number): Promise<void> {
    await db
      .delete(shoppingCart)
      .where(and(eq(shoppingCart.userId, userId), eq(shoppingCart.productId, productId)));
  }

  async clearCart(userId: string): Promise<void> {
    await db.delete(shoppingCart).where(eq(shoppingCart.userId, userId));
  }

  async addToWishlist(userId: string, productId: number): Promise<Wishlist> {
    const [item] = await db
      .insert(wishlist)
      .values({ userId, productId })
      .onConflictDoNothing()
      .returning();
    return item;
  }

  async getWishlistItems(userId: string): Promise<(Wishlist & { product: Product })[]> {
    return await db
      .select({
        id: wishlist.id,
        userId: wishlist.userId,
        productId: wishlist.productId,
        createdAt: wishlist.createdAt,
        product: products,
      })
      .from(wishlist)
      .innerJoin(products, eq(wishlist.productId, products.id))
      .where(eq(wishlist.userId, userId));
  }

  async removeFromWishlist(userId: string, productId: number): Promise<void> {
    await db
      .delete(wishlist)
      .where(and(eq(wishlist.userId, userId), eq(wishlist.productId, productId)));
  }

  async addProductReview(userId: string, productId: number, rating: number, comment: string): Promise<ProductReview> {
    const [review] = await db
      .insert(productReviews)
      .values({ userId, productId, rating, comment })
      .returning();

    // Update product rating and review count
    const reviews = await db
      .select({ rating: productReviews.rating })
      .from(productReviews)
      .where(eq(productReviews.productId, productId));
    
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    
    await db
      .update(products)
      .set({ 
        rating: avgRating.toFixed(2),
        reviewCount: reviews.length 
      })
      .where(eq(products.id, productId));

    return review;
  }

  async getProductReviews(productId: number): Promise<(ProductReview & { user: { firstName?: string; lastName?: string } })[]> {
    return await db
      .select({
        id: productReviews.id,
        productId: productReviews.productId,
        userId: productReviews.userId,
        rating: productReviews.rating,
        comment: productReviews.comment,
        isVerifiedPurchase: productReviews.isVerifiedPurchase,
        createdAt: productReviews.createdAt,
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(productReviews)
      .innerJoin(users, eq(productReviews.userId, users.id))
      .where(eq(productReviews.productId, productId))
      .orderBy(desc(productReviews.createdAt));
  }

  async createOrder(userId: string, items: { productId: number; quantity: number; price: number }[], shippingAddress: any): Promise<ProductOrder> {
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 50 ? 0 : 9.99;
    const tax = subtotal * 0.08;
    const totalAmount = subtotal + shipping + tax;

    const [order] = await db
      .insert(productOrders)
      .values({
        userId,
        orderNumber,
        totalAmount: totalAmount.toFixed(2),
        shippingAddress,
        status: "pending",
      })
      .returning();

    // Add order items
    await db.insert(orderItems).values(
      items.map(item => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        priceAtTime: item.price.toFixed(2),
      }))
    );

    return order;
  }

  async updateOrderPayment(orderId: number, paymentIntentId: string, paidAmount: number): Promise<void> {
    await db
      .update(productOrders)
      .set({ 
        status: "paid",
        stripePaymentIntentId: paymentIntentId,
        paidAmount: paidAmount.toFixed(2),
      })
      .where(eq(productOrders.id, orderId));
  }

  async getOrders(userId: string): Promise<(ProductOrder & { items: (OrderItem & { product: Product })[] })[]> {
    const orders = await db
      .select()
      .from(productOrders)
      .where(eq(productOrders.userId, userId))
      .orderBy(desc(productOrders.createdAt));

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await db
          .select({
            id: orderItems.id,
            orderId: orderItems.orderId,
            productId: orderItems.productId,
            quantity: orderItems.quantity,
            priceAtTime: orderItems.priceAtTime,
            product: products,
          })
          .from(orderItems)
          .innerJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, order.id));

        return { ...order, items };
      })
    );

    return ordersWithItems;
  }

  // Portfolio operations implementation
  async getProviderPortfolio(professionalId: number): Promise<PortfolioImage[]> {
    return this.getPortfolioImages(professionalId);
  }

  async deletePortfolioImage(id: number): Promise<void> {
    await db.delete(portfolioImages).where(eq(portfolioImages.id, id));
  }

  // Earnings operations implementation
  async getProviderEarnings(professionalId: number, period: string): Promise<any[]> {
    const periodMap = {
      week: 7,
      month: 30,
      quarter: 90,
      year: 365,
    };

    const days = periodMap[period as keyof typeof periodMap] || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await db
      .select({
        id: earnings.id,
        amount: earnings.amount,
        platformFee: earnings.platformFee,
        netAmount: earnings.netAmount,
        payoutStatus: earnings.payoutStatus,
        payoutDate: earnings.payoutDate,
        createdAt: earnings.createdAt,
        bookingDate: bookings.appointmentDate,
        clientName: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        serviceName: sql`ARRAY_AGG(${services.name})`,
      })
      .from(earnings)
      .innerJoin(bookings, eq(earnings.bookingId, bookings.id))
      .innerJoin(users, eq(bookings.clientId, users.id))
      .innerJoin(services, sql`${services.id} = ANY(${bookings.serviceIds})`)
      .where(
        and(
          eq(earnings.professionalId, professionalId),
          sql`${earnings.createdAt} >= ${startDate}`
        )
      )
      .groupBy(
        earnings.id,
        earnings.amount,
        earnings.platformFee,
        earnings.netAmount,
        earnings.payoutStatus,
        earnings.payoutDate,
        earnings.createdAt,
        bookings.appointmentDate,
        users.firstName,
        users.lastName
      )
      .orderBy(desc(earnings.createdAt));
  }

  async getEarningsStats(professionalId: number, period: string): Promise<any> {
    const periodMap = {
      week: 7,
      month: 30,
      quarter: 90,
      year: 365,
    };

    const days = periodMap[period as keyof typeof periodMap] || 7;
    const currentStartDate = new Date();
    currentStartDate.setDate(currentStartDate.getDate() - days);
    
    const previousStartDate = new Date();
    previousStartDate.setDate(previousStartDate.getDate() - (days * 2));
    
    const previousEndDate = new Date();
    previousEndDate.setDate(previousEndDate.getDate() - days);

    const [currentStats] = await db
      .select({
        totalEarnings: sql<number>`COALESCE(SUM(${earnings.netAmount}), 0)`,
        transactionCount: sql<number>`COUNT(*)`,
      })
      .from(earnings)
      .where(
        and(
          eq(earnings.professionalId, professionalId),
          sql`${earnings.createdAt} >= ${currentStartDate}`
        )
      );

    const [previousStats] = await db
      .select({
        totalEarnings: sql<number>`COALESCE(SUM(${earnings.netAmount}), 0)`,
      })
      .from(earnings)
      .where(
        and(
          eq(earnings.professionalId, professionalId),
          sql`${earnings.createdAt} >= ${previousStartDate}`,
          sql`${earnings.createdAt} < ${previousEndDate}`
        )
      );

    const growthPercentage = previousStats.totalEarnings > 0
      ? ((currentStats.totalEarnings - previousStats.totalEarnings) / previousStats.totalEarnings) * 100
      : currentStats.totalEarnings > 0 ? 100 : 0;

    return {
      totalEarnings: currentStats.totalEarnings,
      transactionCount: currentStats.transactionCount,
      growthPercentage,
    };
  }

  async createEarning(earning: InsertEarnings): Promise<Earnings> {
    const [newEarning] = await db
      .insert(earnings)
      .values(earning)
      .returning();
    return newEarning;
  }

  // Notification operations implementation
  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, notificationId));
  }

  // Waitlist operations implementation
  async addToWaitlist(waitlistItem: InsertWaitlist): Promise<Waitlist> {
    const [item] = await db
      .insert(waitlist)
      .values(waitlistItem)
      .returning();
    return item;
  }

  async getWaitlist(professionalId: number): Promise<Waitlist[]> {
    return await db
      .select()
      .from(waitlist)
      .where(eq(waitlist.professionalId, professionalId))
      .orderBy(desc(waitlist.createdAt));
  }

  async removeFromWaitlist(id: string): Promise<void> {
    await db.delete(waitlist).where(eq(waitlist.id, id));
  }

  // Group booking operations implementation
  async createGroupBooking(groupBookingData: any): Promise<any> {
    const [groupBooking] = await db
      .insert(groupBookings)
      .values(groupBookingData)
      .returning();
    return groupBooking;
  }

  async getGroupBookings(professionalId: number): Promise<any[]> {
    return await db
      .select()
      .from(groupBookings)
      .where(eq(groupBookings.professionalId, professionalId))
      .orderBy(desc(groupBookings.createdAt));
  }

  // Analytics and Business Intelligence operations
  async getAnalyticsOverview(userId: string, timeRange: string): Promise<any> {
    return {
      totalRevenue: 156789,
      totalBookings: 1247,
      activeProviders: 89,
      averageRating: 4.8,
      revenueGrowth: 23,
      bookingGrowth: 18,
      providerGrowth: 12,
      ratingImprovement: 0.2
    };
  }

  async getRevenueAnalytics(userId: string, timeRange: string): Promise<any> {
    return [
      { month: 'Jan', revenue: 12000, bookings: 45, growth: 12 },
      { month: 'Feb', revenue: 15000, bookings: 52, growth: 25 },
      { month: 'Mar', revenue: 18000, bookings: 68, growth: 20 },
      { month: 'Apr', revenue: 22000, bookings: 75, growth: 22 },
      { month: 'May', revenue: 28000, bookings: 89, growth: 27 },
      { month: 'Jun', revenue: 35000, bookings: 102, growth: 25 },
    ];
  }

  async getBookingAnalytics(userId: string, timeRange: string): Promise<any> {
    return {
      totalBookings: 1247,
      completedBookings: 1089,
      cancelledBookings: 124,
      pendingBookings: 34,
      conversionRate: 87.3,
      averageBookingValue: 245,
      peakHours: '2-6 PM',
      popularDays: ['Saturday', 'Sunday', 'Friday']
    };
  }

  async getPerformanceMetrics(userId: string, timeRange: string): Promise<any> {
    return {
      conversionRate: { value: '68%', change: '+12%', trend: 'up' },
      averageBookingValue: { value: '$245', change: '+8%', trend: 'up' },
      customerRetention: { value: '84%', change: '-2%', trend: 'down' },
      responseTime: { value: '2.3h', change: '-15%', trend: 'up' }
    };
  }

  async getCustomerInsights(userId: string, timeRange: string): Promise<any> {
    return {
      totalCustomers: 2450,
      newCustomers: 234,
      returningCustomers: 2216,
      topAgeGroup: '25-35',
      averageLifetimeValue: 850,
      customerSatisfaction: 4.8,
      retentionRate: 84
    };
  }

  async getServiceAnalytics(userId: string, timeRange: string): Promise<any> {
    return [
      { name: 'Hair Styling', bookings: 435, revenue: 65250, growth: 15 },
      { name: 'Nail Care', bookings: 312, revenue: 39000, growth: 8 },
      { name: 'Facial Treatments', bookings: 250, revenue: 37500, growth: 12 },
      { name: 'Massage', bookings: 187, revenue: 28050, growth: 22 },
      { name: 'Makeup', bookings: 63, revenue: 9450, growth: -5 }
    ];
  }

  async createAnalyticsEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent> {
    const [newEvent] = await db.insert(analyticsEvents).values(event).returning();
    return newEvent;
  }

  async createBusinessMetric(metric: InsertBusinessMetric): Promise<BusinessMetric> {
    const [newMetric] = await db.insert(businessMetrics).values(metric).returning();
    return newMetric;
  }

  async getMarketInsights(category?: string): Promise<MarketInsight[]> {
    let query = db.select().from(marketInsights);
    
    if (category) {
      query = query.where(eq(marketInsights.category, category));
    }
    
    return await query.orderBy(desc(marketInsights.createdAt)).limit(10);
  }

  async createMarketInsight(insight: InsertMarketInsight): Promise<MarketInsight> {
    const [newInsight] = await db.insert(marketInsights).values(insight).returning();
    return newInsight;
  }

  async generateAnalyticsReport(userId: string, timeRange: string, reportType: string): Promise<ReportGeneration> {
    const reportData = {
      userId,
      reportType,
      timeRange,
      format: 'pdf',
      status: 'completed' as const,
      downloadUrl: `/reports/${Math.random().toString(36).substr(2, 9)}.pdf`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };
    
    const [report] = await db.insert(reportGeneration).values(reportData).returning();
    return report;
  }

  async getRealtimeAnalytics(userId: string): Promise<any> {
    return {
      activeUsers: 45,
      ongoingBookings: 12,
      todayRevenue: 4250,
      completedBookingsToday: 23,
      averageSessionTime: '8m 32s',
      topServices: ['Hair Styling', 'Manicure', 'Facial'],
      recentActivity: [
        { time: '5 min ago', event: 'New booking confirmed', user: 'Sarah J.' },
        { time: '12 min ago', event: 'Payment completed', user: 'Michael C.' },
        { time: '18 min ago', event: 'Review submitted', user: 'Emily D.' }
      ]
    };
  }

  async getPredictiveAnalytics(userId: string, period: string): Promise<any> {
    return {
      projectedRevenue: {
        nextMonth: 42000,
        confidence: 87,
        factors: ['Seasonal trends', 'Historical growth', 'Current booking rate']
      },
      demandForecast: {
        peakDays: ['Dec 31', 'Jan 14', 'Feb 14'],
        recommendedStaffing: '+25%',
        suggestedPromotions: ['New Year Glam Package', 'Valentine\'s Day Special']
      },
      marketTrends: {
        growingServices: ['Braiding', 'Lash Extensions', 'Brow Sculpting'],
        decliningServices: ['Traditional Perms'],
        emergingOpportunities: ['Male Grooming', 'Eco-Friendly Products']
      }
    };
  }

  // ====================
  // PHASE 1 MVP IMPLEMENTATIONS
  // ====================

  // Enhanced Provider Token System - Aligned with wireframes
  // Enhanced Token system operations per wireframes
  async getProviderTokens(professionalId: number): Promise<ProviderToken | undefined> {
    const [tokenRecord] = await db
      .select()
      .from(providerTokens)
      .where(eq(providerTokens.professionalId, professionalId));
    return tokenRecord;
  }

  async getTokenPackages(): Promise<TokenPackage[]> {
    return await db.select().from(tokenPackages).orderBy(tokenPackages.price);
  }

  async getActiveBoosts(professionalId: number): Promise<ActiveBoost[]> {
    return await db
      .select()
      .from(activeBoosts)
      .where(and(
        eq(activeBoosts.professionalId, professionalId),
        eq(activeBoosts.isActive, true)
      ));
  }

  async createBoost(boostData: InsertActiveBoost): Promise<ActiveBoost> {
    const [boost] = await db
      .insert(activeBoosts)
      .values(boostData)
      .returning();
    return boost;
  }

  async updateTokenBalance(professionalId: number, amount: number, operation: 'add' | 'subtract'): Promise<void> {
    const tokens = await this.getProviderTokens(professionalId);
    if (!tokens) {
      // Create initial token record
      await db.insert(providerTokens).values({
        professionalId,
        tokenBalance: operation === 'add' ? amount : 0,
        totalTokensPurchased: operation === 'add' ? amount : 0,
        tokensUsed: operation === 'subtract' ? amount : 0,
        pointsEarned: 0,
        achievementLevel: 'bronze'
      });
    } else {
      const newBalance = operation === 'add' 
        ? tokens.tokenBalance + amount 
        : tokens.tokenBalance - amount;
      
      await db
        .update(providerTokens)
        .set({
          tokenBalance: Math.max(0, newBalance),
          totalTokensPurchased: operation === 'add' 
            ? tokens.totalTokensPurchased + amount 
            : tokens.totalTokensPurchased,
          tokensUsed: operation === 'subtract' 
            ? tokens.tokensUsed + amount 
            : tokens.tokensUsed
        })
        .where(eq(providerTokens.professionalId, professionalId));
    }
  }

  // Provider verification system per wireframes
  async getProviderVerifications(professionalId: number): Promise<ProviderVerification[]> {
    return await db
      .select()
      .from(providerVerifications)
      .where(eq(providerVerifications.professionalId, professionalId))
      .orderBy(providerVerifications.createdAt);
  }

  async addProviderVerification(verificationData: InsertProviderVerification): Promise<ProviderVerification> {
    const [verification] = await db
      .insert(providerVerifications)
      .values(verificationData)
      .returning();
    return verification;
  }

  async getProviderReferences(professionalId: number): Promise<ProfessionalReference[]> {
    return await db
      .select()
      .from(professionalReferences)
      .where(eq(professionalReferences.professionalId, professionalId))
      .orderBy(professionalReferences.createdAt);
  }

  async addProviderReference(referenceData: InsertProfessionalReference): Promise<ProfessionalReference> {
    const [reference] = await db
      .insert(professionalReferences)
      .values(referenceData)
      .returning();
    return reference;
  }

  async getTrustScore(professionalId: number): Promise<TrustScore | undefined> {
    const [trustScore] = await db
      .select()
      .from(trustScores)
      .where(eq(trustScores.professionalId, professionalId));
    return trustScore;
  }

  async updateTrustScore(professionalId: number, scoreData: Partial<TrustScore>): Promise<void> {
    const existing = await this.getTrustScore(professionalId);
    
    if (!existing) {
      await db.insert(trustScores).values({
        professionalId,
        overallScore: 5.0,
        verificationScore: 0,
        backgroundCheckPassed: false,
        stateIdVerified: false,
        certificationsVerified: false,
        referencesVerified: false,
        workspacePhotosUploaded: false,
        ...scoreData
      });
    } else {
      await db
        .update(trustScores)
        .set(scoreData)
        .where(eq(trustScores.professionalId, professionalId));
    }
  }

  // Commission & Fee Management for Revenue Model
  async recordCommission(commissionData: any): Promise<void> {
    // This would be implemented with a commissions table
    // For now, we'll track this in a simplified way
    console.log('Commission recorded:', commissionData);
  }

  async getBookingById(bookingId: string): Promise<any> {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId));
    return booking;
  }

  // Anonymous Communication System Methods
  async createAnonymousChannel(channelData: any): Promise<any> {
    const [channel] = await db
      .insert(anonymousChannels)
      .values(channelData)
      .returning();
    return channel;
  }

  async getAnonymousChannel(channelCode: string): Promise<any> {
    const [channel] = await db
      .select()
      .from(anonymousChannels)
      .where(eq(anonymousChannels.channelCode, channelCode));
    return channel;
  }

  async createAnonymousMessage(messageData: any): Promise<any> {
    const [message] = await db
      .insert(anonymousMessages)
      .values(messageData)
      .returning();
    return message;
  }

  async getAnonymousMessages(channelCode: string): Promise<any[]> {
    const messages = await db
      .select()
      .from(anonymousMessages)
      .where(eq(anonymousMessages.channelCode, channelCode))
      .orderBy(anonymousMessages.sentAt);
    return messages;
  }

  async updateCommunicationHistory(channelCode: string): Promise<void> {
    // Update message count and last activity
    const [existing] = await db
      .select()
      .from(communicationHistory)
      .where(eq(communicationHistory.channelCode, channelCode));

    if (existing) {
      await db
        .update(communicationHistory)
        .set({
          totalMessages: existing.totalMessages + 1,
          lastActivityAt: new Date(),
        })
        .where(eq(communicationHistory.channelCode, channelCode));
    } else {
      // Create new history record
      const channel = await this.getAnonymousChannel(channelCode);
      if (channel) {
        await db
          .insert(communicationHistory)
          .values({
            channelCode,
            clientId: channel.clientId,
            providerId: channel.providerId,
            totalMessages: 1,
            lastActivityAt: new Date(),
          });
      }
    }
  }

  async rateCommunicationSession(channelCode: string, rating: number): Promise<void> {
    await db
      .update(communicationHistory)
      .set({ sessionRating: rating })
      .where(eq(communicationHistory.channelCode, channelCode));
  }

  // Two-Factor Authentication Methods
  async setup2FA(twoFactorData: any): Promise<any> {
    const [existing] = await db
      .select()
      .from(twoFactorAuth)
      .where(eq(twoFactorAuth.userId, twoFactorData.userId));

    if (existing) {
      const [updated] = await db
        .update(twoFactorAuth)
        .set({
          ...twoFactorData,
          updatedAt: new Date(),
        })
        .where(eq(twoFactorAuth.userId, twoFactorData.userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(twoFactorAuth)
        .values(twoFactorData)
        .returning();
      return created;
    }
  }

  async createVerificationCode(codeData: any): Promise<any> {
    const [code] = await db
      .insert(verificationCodes)
      .values(codeData)
      .returning();
    return code;
  }

  async verifyCode(userId: string, code: string, codeType: string): Promise<any> {
    const [verificationCode] = await db
      .select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.userId, userId),
          eq(verificationCodes.code, code),
          eq(verificationCodes.codeType, codeType),
          eq(verificationCodes.isUsed, false)
        )
      );

    if (verificationCode && new Date() < new Date(verificationCode.expiresAt)) {
      // Mark code as used
      await db
        .update(verificationCodes)
        .set({ isUsed: true })
        .where(eq(verificationCodes.id, verificationCode.id));
      
      return verificationCode;
    }

    return null;
  }

  async markVerificationComplete(userId: string, codeType: string): Promise<void> {
    const updateField = codeType === 'sms' ? { isPhoneVerified: true } : { isEmailVerified: true };
    
    await db
      .update(twoFactorAuth)
      .set({
        ...updateField,
        lastVerifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(twoFactorAuth.userId, userId));
  }

  async updateBackupCodes(userId: string, backupCodes: string[]): Promise<void> {
    await db
      .update(twoFactorAuth)
      .set({
        backupCodes: backupCodes,
        updatedAt: new Date(),
      })
      .where(eq(twoFactorAuth.userId, userId));
  }

  async get2FAStatus(userId: string): Promise<any> {
    const [twoFactor] = await db
      .select()
      .from(twoFactorAuth)
      .where(eq(twoFactorAuth.userId, userId));
    return twoFactor;
  }

  async disable2FA(userId: string): Promise<void> {
    await db
      .delete(twoFactorAuth)
      .where(eq(twoFactorAuth.userId, userId));
    
    // Also delete any pending verification codes
    await db
      .delete(verificationCodes)
      .where(eq(verificationCodes.userId, userId));
  }

  // Provider Payout System Methods
  async createProviderPayout(payoutData: any): Promise<any> {
    const [payout] = await db
      .insert(providerPayouts)
      .values(payoutData)
      .returning();
    return payout;
  }

  async getProviderPayouts(providerId: number): Promise<any[]> {
    const payouts = await db
      .select()
      .from(providerPayouts)
      .where(eq(providerPayouts.providerId, providerId))
      .orderBy(desc(providerPayouts.payoutDate));
    return payouts;
  }

  async updatePayoutStatus(payoutId: string, status: string, stripePayoutId?: string): Promise<void> {
    const updateData: any = { status, updatedAt: new Date() };
    if (stripePayoutId) {
      updateData.stripePayoutId = stripePayoutId;
    }
    
    await db
      .update(providerPayouts)
      .set(updateData)
      .where(eq(providerPayouts.id, payoutId));
  }

  async getPendingPayouts(): Promise<any[]> {
    const payouts = await db
      .select()
      .from(providerPayouts)
      .where(eq(providerPayouts.status, "pending"))
      .orderBy(providerPayouts.payoutDate);
    return payouts;
  }

  // Tip Processing Methods
  async createTip(tipData: any): Promise<any> {
    const [tip] = await db
      .insert(tips)
      .values(tipData)
      .returning();
    return tip;
  }

  async updateTipStatus(tipId: string, status: string, stripeTipId?: string): Promise<void> {
    const updateData: any = { status };
    if (stripeTipId) {
      updateData.stripeTipId = stripeTipId;
    }
    
    await db
      .update(tips)
      .set(updateData)
      .where(eq(tips.id, tipId));
  }

  async getBookingTips(bookingId: string): Promise<any[]> {
    const bookingTips = await db
      .select()
      .from(tips)
      .where(eq(tips.bookingId, bookingId));
    return bookingTips;
  }

  async getProviderTips(providerId: number, startDate?: Date, endDate?: Date): Promise<any[]> {
    let query = db
      .select()
      .from(tips)
      .where(eq(tips.providerId, providerId));

    if (startDate && endDate) {
      query = query.where(
        and(
          gte(tips.createdAt, startDate),
          lte(tips.createdAt, endDate)
        )
      );
    }

    const providerTips = await query.orderBy(desc(tips.createdAt));
    return providerTips;
  }

  // Dispute Management Methods
  async createDispute(disputeData: any): Promise<any> {
    const [dispute] = await db
      .insert(disputes)
      .values(disputeData)
      .returning();
    return dispute;
  }

  async getDispute(disputeId: string): Promise<any> {
    const [dispute] = await db
      .select()
      .from(disputes)
      .where(eq(disputes.id, disputeId));
    return dispute;
  }

  async getDisputesByUser(userId: string): Promise<any[]> {
    const userDisputes = await db
      .select()
      .from(disputes)
      .where(eq(disputes.disputantId, userId))
      .orderBy(desc(disputes.createdAt));
    return userDisputes;
  }

  async updateDisputeStatus(disputeId: string, status: string, resolution?: string, resolutionType?: string, refundAmount?: number, resolvedBy?: string): Promise<void> {
    const updateData: any = { 
      status, 
      updatedAt: new Date() 
    };
    
    if (resolution) updateData.resolution = resolution;
    if (resolutionType) updateData.resolutionType = resolutionType;
    if (refundAmount) updateData.refundAmount = refundAmount.toString();
    if (resolvedBy) updateData.resolvedBy = resolvedBy;
    if (status === 'resolved') updateData.resolvedAt = new Date();
    
    await db
      .update(disputes)
      .set(updateData)
      .where(eq(disputes.id, disputeId));
  }

  async createDisputeMessage(messageData: any): Promise<any> {
    const [message] = await db
      .insert(disputeMessages)
      .values(messageData)
      .returning();
    return message;
  }

  async getDisputeMessages(disputeId: string): Promise<any[]> {
    const messages = await db
      .select()
      .from(disputeMessages)
      .where(eq(disputeMessages.disputeId, disputeId))
      .orderBy(disputeMessages.createdAt);
    return messages;
  }

  // Payout Schedule Management
  async createPayoutSchedule(scheduleData: any): Promise<any> {
    const [schedule] = await db
      .insert(payoutSchedules)
      .values(scheduleData)
      .returning();
    return schedule;
  }

  async getPayoutSchedule(providerId: number): Promise<any> {
    const [schedule] = await db
      .select()
      .from(payoutSchedules)
      .where(eq(payoutSchedules.providerId, providerId));
    return schedule;
  }

  async updatePayoutSchedule(providerId: number, scheduleData: any): Promise<void> {
    await db
      .update(payoutSchedules)
      .set({ ...scheduleData, updatedAt: new Date() })
      .where(eq(payoutSchedules.providerId, providerId));
  }

  // Payment Details Management
  async createPaymentDetails(paymentData: any): Promise<any> {
    const [payment] = await db
      .insert(paymentDetails)
      .values(paymentData)
      .returning();
    return payment;
  }

  async getPaymentDetails(bookingId: string): Promise<any> {
    const [payment] = await db
      .select()
      .from(paymentDetails)
      .where(eq(paymentDetails.bookingId, bookingId));
    return payment;
  }

  async updatePaymentStatus(bookingId: string, status: string, stripePaymentIntentId?: string): Promise<void> {
    const updateData: any = { paymentStatus: status };
    if (stripePaymentIntentId) {
      updateData.stripePaymentIntentId = stripePaymentIntentId;
    }
    
    await db
      .update(paymentDetails)
      .set(updateData)
      .where(eq(paymentDetails.bookingId, bookingId));
  }

  async createProviderTokens(tokenData: InsertProviderToken): Promise<ProviderToken> {
    const [tokenRecord] = await db
      .insert(providerTokens)
      .values(tokenData)
      .returning();
    return tokenRecord;
  }



  async getProviderReferences(professionalId: number): Promise<any[]> {
    return await db
      .select()
      .from(professionalReferences)
      .where(eq(professionalReferences.professionalId, professionalId));
  }

  async addProviderReference(referenceData: any): Promise<any> {
    const [reference] = await db
      .insert(professionalReferences)
      .values(referenceData)
      .returning();
    return reference;
  }

  async getTrustScore(professionalId: number): Promise<any> {
    const [score] = await db
      .select()
      .from(trustScores)
      .where(eq(trustScores.professionalId, professionalId));
    return score;
  }

  async updateTrustScore(professionalId: number, scoreData: any): Promise<any> {
    const [updated] = await db
      .insert(trustScores)
      .values({ professionalId, ...scoreData })
      .onConflictDoUpdate({
        target: trustScores.professionalId,
        set: { ...scoreData, lastCalculated: new Date() }
      })
      .returning();
    return updated;
  }

  // Anonymous Communication System
  async createAnonymousContact(contactData: any): Promise<any> {
    const [contact] = await db
      .insert(anonymousContacts)
      .values(contactData)
      .returning();
    return contact;
  }

  async getAnonymousContact(bookingId: string): Promise<any> {
    const [contact] = await db
      .select()
      .from(anonymousContacts)
      .where(eq(anonymousContacts.bookingId, bookingId));
    return contact;
  }

  async updateProviderTokens(professionalId: number, updates: Partial<InsertProviderToken>): Promise<ProviderToken> {
    const [tokenRecord] = await db
      .update(providerTokens)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(providerTokens.professionalId, professionalId))
      .returning();
    return tokenRecord;
  }

  async createTokenTransaction(transaction: InsertTokenTransaction): Promise<TokenTransaction> {
    const [txn] = await db
      .insert(tokenTransactions)
      .values(transaction)
      .returning();
    return txn;
  }

  async useTokensForBoost(professionalId: number, boostData: any): Promise<any> {
    const { boostType, duration, geoLocation, tokensUsed } = boostData;
    
    // Get current token balance
    const tokenRecord = await this.getProviderTokens(professionalId);
    if (!tokenRecord || tokenRecord.availableTokens < tokensUsed) {
      throw new Error('Insufficient tokens for boost');
    }

    // Deduct tokens
    const updatedTokens = await this.updateProviderTokens(professionalId, {
      availableTokens: tokenRecord.availableTokens - tokensUsed,
      totalUsed: tokenRecord.totalUsed + tokensUsed,
    });

    // Record transaction
    await this.createTokenTransaction({
      professionalId,
      transactionType: 'debit',
      amount: tokensUsed,
      description: `${boostType} boost for ${duration} hours`,
      metadata: { boostType, duration, geoLocation },
    });

    // In a real implementation, this would trigger the boost algorithm
    return {
      success: true,
      tokensUsed,
      remainingTokens: updatedTokens.availableTokens,
      boostActive: true,
      expiresAt: new Date(Date.now() + duration * 60 * 60 * 1000),
    };
  }

  // Fee Structure & Commission System
  async calculateFeeStructure(bookingId: string): Promise<FeeStructure> {
    const booking = await this.getBooking(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    const baseAmount = parseFloat(booking.totalPrice);
    const commission = baseAmount * 0.15; // 15% commission
    const serviceFee = baseAmount * 0.10; // 10% service fee
    const holdFee = baseAmount * 0.25; // 25% hold fee
    const providerPayout = baseAmount - commission - serviceFee;

    const feeData: InsertFeeStructure = {
      bookingId,
      baseAmount: baseAmount.toString(),
      commissionRate: '0.15',
      commissionAmount: commission.toString(),
      serviceFeeRate: '0.10',
      serviceFeeAmount: serviceFee.toString(),
      holdFeeRate: '0.25',
      holdFeeAmount: holdFee.toString(),
      providerPayout: providerPayout.toString(),
      platformRevenue: (commission + serviceFee).toString(),
      status: 'calculated',
    };

    const [feeStructure] = await db
      .insert(feeStructure)
      .values(feeData)
      .returning();
    
    return feeStructure;
  }

  async createFeeStructure(feeData: InsertFeeStructure): Promise<FeeStructure> {
    const [structure] = await db
      .insert(feeStructure)
      .values(feeData)
      .returning();
    return structure;
  }

  async createBookingWithFees(bookingData: InsertBooking): Promise<Booking> {
    // Create the booking first
    const booking = await this.createBooking(bookingData);
    
    // Calculate and create fee structure
    await this.calculateFeeStructure(booking.id);
    
    return booking;
  }

  // Job Request System
  async createJobRequest(jobRequest: InsertJobRequest): Promise<JobRequest> {
    const [request] = await db
      .insert(jobRequests)
      .values(jobRequest)
      .returning();
    return request;
  }

  async getJobRequest(id: string): Promise<JobRequest | undefined> {
    const [request] = await db
      .select()
      .from(jobRequests)
      .where(eq(jobRequests.id, id));
    return request;
  }

  async searchJobRequests(params: any): Promise<JobRequest[]> {
    const { location, category, budget, urgency, homeVisitRequired, limit, offset } = params;
    
    let conditions: any[] = [eq(jobRequests.status, 'open')];

    if (location) {
      conditions.push(ilike(jobRequests.location, `%${location}%`));
    }
    
    if (category) {
      conditions.push(ilike(jobRequests.category, `%${category}%`));
    }
    
    if (budget) {
      conditions.push(sql`${jobRequests.budgetMax}::numeric >= ${budget}`);
    }
    
    if (urgency) {
      conditions.push(eq(jobRequests.urgency, urgency));
    }
    
    if (homeVisitRequired !== undefined) {
      conditions.push(eq(jobRequests.homeVisitRequired, homeVisitRequired));
    }

    const requests = await db
      .select()
      .from(jobRequests)
      .where(and(...conditions))
      .orderBy(desc(jobRequests.createdAt))
      .limit(limit)
      .offset(offset);
    
    return requests;
  }

  async updateJobRequestBidCount(jobRequestId: string): Promise<void> {
    await db
      .update(jobRequests)
      .set({ 
        bidCount: sql`${jobRequests.bidCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(jobRequests.id, jobRequestId));
  }

  async createProviderBid(bid: InsertProviderBid): Promise<ProviderBid> {
    const [newBid] = await db
      .insert(providerBids)
      .values(bid)
      .returning();
    return newBid;
  }

  async getJobRequestBids(jobRequestId: string): Promise<ProviderBid[]> {
    const bids = await db
      .select()
      .from(providerBids)
      .where(eq(providerBids.jobRequestId, jobRequestId))
      .orderBy(asc(providerBids.bidAmount));
    return bids;
  }

  // Provider Verification System
  async createProviderCertification(certification: InsertProviderCertification): Promise<ProviderCertification> {
    const [cert] = await db
      .insert(providerCertifications)
      .values(certification)
      .returning();
    return cert;
  }

  async getProviderCertifications(professionalId: number): Promise<ProviderCertification[]> {
    const certifications = await db
      .select()
      .from(providerCertifications)
      .where(eq(providerCertifications.professionalId, professionalId))
      .orderBy(desc(providerCertifications.createdAt));
    return certifications;
  }

  async createProviderReference(reference: InsertProviderReference): Promise<ProviderReference> {
    const [ref] = await db
      .insert(providerReferences)
      .values(reference)
      .returning();
    return ref;
  }

  async getProviderReferences(professionalId: number): Promise<ProviderReference[]> {
    const references = await db
      .select()
      .from(providerReferences)
      .where(eq(providerReferences.professionalId, professionalId))
      .orderBy(desc(providerReferences.createdAt));
    return references;
  }

  // Phase 4: Automation & Communication implementations
  async createAutomatedNotification(notification: any): Promise<any> {
    const [newNotification] = await db
      .insert(automatedNotifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async getScheduledNotifications(userId: string): Promise<any[]> {
    return await db
      .select()
      .from(automatedNotifications)
      .where(eq(automatedNotifications.recipientId, userId))
      .orderBy(desc(automatedNotifications.scheduledFor));
  }

  async updateNotificationStatus(id: string, status: string): Promise<void> {
    await db
      .update(automatedNotifications)
      .set({ status, sentAt: status === 'sent' ? new Date() : null, updatedAt: new Date() })
      .where(eq(automatedNotifications.id, id));
  }

  async getNotificationTemplates(): Promise<any[]> {
    return await db
      .select()
      .from(phase4NotificationTemplates)
      .where(eq(phase4NotificationTemplates.isActive, true))
      .orderBy(phase4NotificationTemplates.name);
  }

  async createNotificationTemplate(template: any): Promise<any> {
    const [newTemplate] = await db
      .insert(phase4NotificationTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }

  async createCalendarIntegration(integration: any): Promise<any> {
    const [newIntegration] = await db
      .insert(calendarIntegrations)
      .values(integration)
      .returning();
    return newIntegration;
  }

  async getCalendarIntegrations(userId: string): Promise<any[]> {
    return await db
      .select()
      .from(calendarIntegrations)
      .where(eq(calendarIntegrations.userId, userId))
      .orderBy(desc(calendarIntegrations.createdAt));
  }

  async updateCalendarIntegration(id: string, updates: any): Promise<void> {
    await db
      .update(calendarIntegrations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(calendarIntegrations.id, id));
  }

  async deleteCalendarIntegration(id: string): Promise<void> {
    await db
      .delete(calendarIntegrations)
      .where(eq(calendarIntegrations.id, id));
  }

  async createCalendarEvent(event: any): Promise<any> {
    const [newEvent] = await db
      .insert(calendarEvents)
      .values(event)
      .returning();
    return newEvent;
  }

  async getCalendarEvents(userId: string): Promise<any[]> {
    return await db
      .select({
        id: calendarEvents.id,
        title: calendarEvents.title,
        description: calendarEvents.description,
        startTime: calendarEvents.startTime,
        endTime: calendarEvents.endTime,
        location: calendarEvents.location,
        attendees: calendarEvents.attendees,
        status: calendarEvents.status,
        syncStatus: calendarEvents.syncStatus,
      })
      .from(calendarEvents)
      .innerJoin(calendarIntegrations, eq(calendarEvents.integrationId, calendarIntegrations.id))
      .where(eq(calendarIntegrations.userId, userId))
      .orderBy(desc(calendarEvents.startTime));
  }

  async createCommunicationLog(log: any): Promise<any> {
    const [newLog] = await db
      .insert(communicationLog)
      .values(log)
      .returning();
    return newLog;
  }

  async getCommunicationHistory(userId: string): Promise<any[]> {
    return await db
      .select()
      .from(communicationLog)
      .where(eq(communicationLog.recipientId, userId))
      .orderBy(desc(communicationLog.sentAt))
      .limit(50);
  }

  async getCommunicationPreferences(userId: string): Promise<any> {
    const [preferences] = await db
      .select()
      .from(communicationPreferences)
      .where(eq(communicationPreferences.userId, userId));
    return preferences;
  }

  async updateCommunicationPreferences(userId: string, preferences: any): Promise<any> {
    const [updatedPreferences] = await db
      .insert(communicationPreferences)
      .values({ ...preferences, userId })
      .onConflictDoUpdate({
        target: communicationPreferences.userId,
        set: { ...preferences, updatedAt: new Date() }
      })
      .returning();
    return updatedPreferences;
  }
}

export const storage = new DatabaseStorage();