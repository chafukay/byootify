import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, sql } from "drizzle-orm";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("client"), // client, provider, admin, super_admin
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Beauty professionals table
export const professionals = pgTable("professionals", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  businessName: varchar("business_name"),
  bio: text("bio"),
  specialties: text("specialties").array(),
  location: varchar("location").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  address: text("address"),
  phone: varchar("phone"),
  website: varchar("website"),
  instagram: varchar("instagram"),
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  priceRange: varchar("price_range"), // e.g., "$45-85"
  availabilityRadius: integer("availability_radius").default(25), // miles
  offersHomeVisits: boolean("offers_home_visits").default(false),
  homeVisitFee: decimal("home_visit_fee", { precision: 10, scale: 2 }).default("0"),
  maxTravelDistance: integer("max_travel_distance").default(25), // miles for home visits
  stripeAccountId: varchar("stripe_account_id"),
  profilePicture: varchar("profile_picture"), // Add this field for compatibility
  verificationLevel: varchar("verification_level").default("unverified"), // unverified, basic, verified, premium
  backgroundCheckStatus: varchar("background_check_status").default("not_required"), // not_required, pending, approved, rejected
  tokensBalance: integer("tokens_balance").default(0), // current token balance
  isTokenBoosted: boolean("is_token_boosted").default(false), // currently using tokens for visibility
  boostExpiresAt: timestamp("boost_expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdUnique: index("professionals_user_id_unique").on(table.userId),
}));

// Services offered by professionals
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  professionalId: integer("professional_id").notNull().references(() => professionals.id),
  name: varchar("name").notNull(),
  description: text("description"),
  category: varchar("category").notNull(), // hair, nails, makeup, braiding, barbering, skincare
  price: decimal("price", { precision: 8, scale: 2 }).notNull(),
  duration: integer("duration").notNull(), // in minutes
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Portfolio images for professionals
export const portfolioImages = pgTable("portfolio_images", {
  id: serial("id").primaryKey(),
  professionalId: integer("professional_id").notNull().references(() => professionals.id),
  imageUrl: varchar("image_url").notNull(),
  caption: text("caption"),
  category: varchar("category"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bookings
export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: varchar("client_id").notNull().references(() => users.id),
  professionalId: integer("professional_id").notNull().references(() => professionals.id),
  serviceIds: integer("service_ids").array().notNull(),
  appointmentDate: timestamp("appointment_date").notNull(),
  status: varchar("status").notNull().default("pending"), // pending, confirmed, completed, cancelled
  serviceLocation: varchar("service_location").default("salon"), // salon, home, mobile
  homeVisitFee: decimal("home_visit_fee", { precision: 10, scale: 2 }).default("0"),
  isRecurring: boolean("is_recurring").default(false),
  recurringFrequency: varchar("recurring_frequency"), // weekly, biweekly, monthly
  recurringEndDate: timestamp("recurring_end_date"),
  parentBookingId: uuid("parent_booking_id"), // for recurring appointments
  totalPrice: decimal("total_price", { precision: 8, scale: 2 }).notNull(),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }), // price before fees
  platformFees: decimal("platform_fees", { precision: 10, scale: 2 }), // total platform fees
  tipAmount: decimal("tip_amount", { precision: 10, scale: 2 }).default("0"),
  notes: text("notes"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reviews
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  bookingId: uuid("booking_id").notNull().references(() => bookings.id),
  clientId: varchar("client_id").notNull().references(() => users.id),
  professionalId: integer("professional_id").notNull().references(() => professionals.id),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Professional availability
export const availability = pgTable("availability", {
  id: serial("id").primaryKey(),
  professionalId: integer("professional_id").notNull().references(() => professionals.id),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
  startTime: varchar("start_time").notNull(), // HH:MM format
  endTime: varchar("end_time").notNull(), // HH:MM format
  isActive: boolean("is_active").default(true),
});

// Earnings tracking
export const earnings = pgTable("earnings", {
  id: serial("id").primaryKey(),
  professionalId: integer("professional_id").notNull().references(() => professionals.id),
  bookingId: uuid("booking_id").notNull().references(() => bookings.id),
  amount: decimal("amount", { precision: 8, scale: 2 }).notNull(),
  platformFee: decimal("platform_fee", { precision: 8, scale: 2 }).notNull(),
  netAmount: decimal("net_amount", { precision: 8, scale: 2 }).notNull(),
  payoutStatus: varchar("payout_status").default("pending"), // pending, processing, paid
  payoutDate: timestamp("payout_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Smart Notification System
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // booking_reminder, payment_due, review_request, job_match, token_expiry
  category: varchar("category").notNull(), // booking, payment, marketing, system, business
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data"), // Additional notification data
  isRead: boolean("is_read").default(false),
  priority: varchar("priority").default("normal"), // low, normal, high, urgent
  actionRequired: boolean("action_required").default(false),
  actionUrl: varchar("action_url"),
  actionText: varchar("action_text"),
  expiresAt: timestamp("expires_at"),
  deliveryMethod: text("delivery_method").array().default(sql`ARRAY['in_app']::text[]`),
  sentAt: timestamp("sent_at"),
  readAt: timestamp("read_at"),
  dismissedAt: timestamp("dismissed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notification preferences per user
export const notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  category: varchar("category").notNull(),
  inAppEnabled: boolean("in_app_enabled").default(true),
  emailEnabled: boolean("email_enabled").default(true),
  smsEnabled: boolean("sms_enabled").default(false),
  pushEnabled: boolean("push_enabled").default(true),
  frequency: varchar("frequency").default("immediate"),
  quietHoursStart: varchar("quiet_hours_start").default("22:00"),
  quietHoursEnd: varchar("quiet_hours_end").default("08:00"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Smart notification templates
export const notificationTemplates = pgTable("notification_templates", {
  id: serial("id").primaryKey(),
  key: varchar("key").notNull().unique(),
  category: varchar("category").notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  variables: text("variables").array(),
  actionText: varchar("action_text"),
  actionUrl: varchar("action_url"),
  priority: varchar("priority").default("normal"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notification analytics
export const notificationAnalytics = pgTable("notification_analytics", {
  id: serial("id").primaryKey(),
  notificationId: uuid("notification_id").references(() => notifications.id),
  userId: varchar("user_id").references(() => users.id),
  templateKey: varchar("template_key"),
  category: varchar("category"),
  sent: boolean("sent").default(false),
  delivered: boolean("delivered").default(false),
  opened: boolean("opened").default(false),
  clicked: boolean("clicked").default(false),
  dismissed: boolean("dismissed").default(false),
  deliveryMethod: varchar("delivery_method"),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  dismissedAt: timestamp("dismissed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Waitlist for fully booked providers
export const waitlist = pgTable("waitlist", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: varchar("client_id").notNull().references(() => users.id),
  professionalId: integer("professional_id").notNull().references(() => professionals.id),
  serviceIds: integer("service_ids").array().notNull(),
  preferredDate: timestamp("preferred_date"),
  alternativeDates: timestamp("alternative_dates").array(),
  status: varchar("status").default("active"), // active, notified, expired
  createdAt: timestamp("created_at").defaultNow(),
});

// Group Bookings table for events/parties
export const groupBookings = pgTable("group_bookings", {
  id: serial("id").primaryKey(),
  clientId: varchar("client_id").notNull().references(() => users.id),
  professionalId: integer("professional_id").notNull().references(() => professionals.id),
  serviceId: varchar("service_id").notNull(),
  eventDate: timestamp("event_date").notNull(),
  startTime: varchar("start_time").notNull(),
  estimatedDuration: integer("estimated_duration").notNull(), // in hours
  groupSize: integer("group_size").notNull(),
  eventType: varchar("event_type").notNull(), // birthday, wedding, etc.
  location: varchar("location").notNull(), // provider-location, client-location, venue
  venueAddress: text("venue_address"),
  organizer: jsonb("organizer").notNull(), // { name, email, phone }
  participants: jsonb("participants").notNull(), // array of participant details
  specialRequests: text("special_requests"),
  budget: decimal("budget"),
  needsEquipment: boolean("needs_equipment").default(false),
  needsSupplies: boolean("needs_supplies").default(false),
  status: varchar("status").notNull().default("pending"), // pending, confirmed, cancelled
  totalPrice: decimal("total_price"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Skill badges for professionals
export const skillBadges = pgTable("skill_badges", {
  id: serial("id").primaryKey(),
  professionalId: integer("professional_id").notNull().references(() => professionals.id),
  badgeName: varchar("badge_name").notNull(),
  badgeType: varchar("badge_type").notNull(), // expertise, achievement, certification
  iconName: varchar("icon_name"),
  color: varchar("color"),
  earnedAt: timestamp("earned_at").defaultNow(),
  isVisible: boolean("is_visible").default(true),
});

// Client mood preferences for AI matching
export const clientMoodPreferences = pgTable("client_mood_preferences", {
  id: serial("id").primaryKey(),
  clientId: varchar("client_id").notNull().references(() => users.id),
  mood: varchar("mood").notNull(), // relaxed, energetic, professional, creative, luxurious
  serviceCategory: varchar("service_category"),
  preferredTime: varchar("preferred_time"), // morning, afternoon, evening
  createdAt: timestamp("created_at").defaultNow(),
});

// Video consultation sessions
export const videoConsultations = pgTable("video_consultations", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").references(() => bookings.id),
  sessionUrl: varchar("session_url"),
  scheduledAt: timestamp("scheduled_at"),
  duration: integer("duration").default(30), // minutes
  status: varchar("status").default("scheduled"), // scheduled, active, completed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
});

// AI matching scores for provider-client compatibility
export const aiMatchingScores = pgTable("ai_matching_scores", {
  id: serial("id").primaryKey(),
  clientId: varchar("client_id").notNull().references(() => users.id),
  professionalId: integer("professional_id").notNull().references(() => professionals.id),
  compatibilityScore: decimal("compatibility_score", { precision: 3, scale: 2 }), // 0.00-1.00
  factors: jsonb("factors"), // JSON object with matching factors
  lastCalculated: timestamp("last_calculated").defaultNow(),
});

// Provider token system for visibility boosting - Enhanced per wireframes
export const providerTokens = pgTable("provider_tokens", {
  id: serial("id").primaryKey(),
  professionalId: integer("professional_id").notNull().references(() => professionals.id),
  tokenBalance: integer("token_balance").default(0),
  totalTokensPurchased: integer("total_tokens_purchased").default(0),
  tokensUsed: integer("tokens_used").default(0),
  pointsEarned: integer("points_earned").default(0), // Points from completed jobs
  achievementLevel: varchar("achievement_level").default("bronze"), // bronze, silver, gold, platinum
  lastPurchaseAt: timestamp("last_purchase_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Token packages with different boost levels - Aligned with wireframes pricing
export const tokenPackages = pgTable("token_packages", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  tokenAmount: integer("token_amount").notNull(),
  price: integer("price").notNull(), // in cents ($10, $40, $75)
  boostType: varchar("boost_type").notNull(), // local, city, state, featured
  boostDuration: integer("boost_duration").notNull(), // hours
  description: text("description"),
  isPopular: boolean("is_popular").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Active visibility boosts for providers
export const activeBoosts = pgTable("active_boosts", {
  id: serial("id").primaryKey(),
  professionalId: integer("professional_id").notNull().references(() => professionals.id),
  packageId: integer("package_id").notNull().references(() => tokenPackages.id),
  boostType: varchar("boost_type").notNull(), // local, city, state, featured
  radius: integer("radius"), // miles for local boosts
  priority: integer("priority").default(1), // boost ranking
  tokensSpent: integer("tokens_spent").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  remainingTime: integer("remaining_time"), // minutes left
  isActive: boolean("is_active").default(true),
  impressions: integer("impressions").default(0), // times shown in search
  clicks: integer("clicks").default(0), // profile views from boost
  conversions: integer("conversions").default(0), // bookings from boost
  createdAt: timestamp("created_at").defaultNow(),
});

// Token transactions for tracking purchases and usage
export const tokenTransactions = pgTable("token_transactions", {
  id: serial("id").primaryKey(),
  professionalId: integer("professional_id").notNull().references(() => professionals.id),
  transactionType: varchar("transaction_type").notNull(), // purchase, usage, refund
  amount: integer("amount").notNull(), // number of tokens
  cost: decimal("cost", { precision: 10, scale: 2 }), // dollar amount for purchases
  description: text("description"),
  paymentIntentId: varchar("payment_intent_id"), // Stripe payment intent
  geoLocation: varchar("geo_location"), // where tokens are being used
  boostDuration: integer("boost_duration"), // hours of boost applied
  createdAt: timestamp("created_at").defaultNow(),
});

// Fee structure and commission tracking
export const feeStructure = pgTable("fee_structure", {
  id: serial("id").primaryKey(),
  bookingId: uuid("booking_id").notNull().references(() => bookings.id),
  serviceAmount: decimal("service_amount", { precision: 10, scale: 2 }).notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 4 }).default("0.15"), // 15%
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }),
  holdFeeRate: decimal("hold_fee_rate", { precision: 5, scale: 4 }).default("0.25"), // 25%
  holdFeeAmount: decimal("hold_fee_amount", { precision: 10, scale: 2 }),
  serviceFeeRate: decimal("service_fee_rate", { precision: 5, scale: 4 }).default("0.10"), // 10%
  serviceFeeAmount: decimal("service_fee_amount", { precision: 10, scale: 2 }),
  cancellationFeeRate: decimal("cancellation_fee_rate", { precision: 5, scale: 4 }).default("0.15"), // 15%
  cancellationFeeAmount: decimal("cancellation_fee_amount", { precision: 10, scale: 2 }),
  tipAmount: decimal("tip_amount", { precision: 10, scale: 2 }).default("0"),
  totalPlatformFees: decimal("total_platform_fees", { precision: 10, scale: 2 }),
  providerPayout: decimal("provider_payout", { precision: 10, scale: 2 }),
  payoutStatus: varchar("payout_status").default("pending"), // pending, processed, failed
  payoutDate: timestamp("payout_date"),
  stripeTransferId: varchar("stripe_transfer_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Job requests (clients posting jobs for providers to bid)
export const jobRequests = pgTable("job_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: varchar("client_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  serviceCategory: varchar("service_category").notNull(),
  preferredLocation: varchar("preferred_location").notNull(), // home, salon, mobile
  address: text("address"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  preferredDate: timestamp("preferred_date"),
  flexibleTiming: boolean("flexible_timing").default(false),
  homeVisitRequired: boolean("home_visit_required").default(false),
  urgency: varchar("urgency").default("normal"), // urgent, normal, flexible
  requirements: text("requirements"), // special requirements
  images: text("images").array(), // reference images
  status: varchar("status").default("open"), // open, assigned, completed, cancelled
  selectedProviderId: integer("selected_provider_id").references(() => professionals.id),
  bidCount: integer("bid_count").default(0),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Provider bids on job requests
export const providerBids = pgTable("provider_bids", {
  id: serial("id").primaryKey(),
  jobRequestId: uuid("job_request_id").notNull().references(() => jobRequests.id),
  professionalId: integer("professional_id").notNull().references(() => professionals.id),
  bidAmount: decimal("bid_amount", { precision: 10, scale: 2 }).notNull(),
  proposedDuration: integer("proposed_duration"), // minutes
  availability: varchar("availability"), // when they can start
  message: text("message"), // pitch to client
  canDoHomeVisit: boolean("can_do_home_visit").default(false),
  estimatedTravelTime: integer("estimated_travel_time"), // minutes
  status: varchar("status").default("pending"), // pending, accepted, declined
  submittedAt: timestamp("submitted_at").defaultNow(),
});

// Provider verification system - Enhanced per wireframes requirements
export const providerVerifications = pgTable("provider_verifications", {
  id: serial("id").primaryKey(),
  professionalId: integer("professional_id").notNull().references(() => professionals.id),
  verificationType: varchar("verification_type").notNull(), // certification, state_id, background_check, reference
  documentUrl: varchar("document_url"),
  documentName: varchar("document_name"),
  verificationStatus: varchar("verification_status").default("pending"), // pending, approved, rejected
  verifiedAt: timestamp("verified_at"),
  verifiedBy: varchar("verified_by"), // admin user id
  expiresAt: timestamp("expires_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Professional references (2 required per wireframes)
export const professionalReferences = pgTable("professional_references", {
  id: serial("id").primaryKey(),
  professionalId: integer("professional_id").notNull().references(() => professionals.id),
  referenceName: varchar("reference_name").notNull(),
  referenceEmail: varchar("reference_email").notNull(),
  referencePhone: varchar("reference_phone"),
  relationship: varchar("relationship").notNull(), // former_client, colleague, employer
  yearsKnown: integer("years_known"),
  verificationStatus: varchar("verification_status").default("pending"),
  contactedAt: timestamp("contacted_at"),
  responseReceived: boolean("response_received").default(false),
  rating: integer("rating"), // 1-5 stars from reference
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Trust score calculation for providers
export const trustScores = pgTable("trust_scores", {
  id: serial("id").primaryKey(),
  professionalId: integer("professional_id").notNull().references(() => professionals.id),
  overallScore: decimal("overall_score", { precision: 3, scale: 1 }), // 0.0-10.0
  verificationScore: decimal("verification_score", { precision: 3, scale: 1 }),
  reviewScore: decimal("review_score", { precision: 3, scale: 1 }),
  completionScore: decimal("completion_score", { precision: 3, scale: 1 }),
  responseScore: decimal("response_score", { precision: 3, scale: 1 }),
  backgroundCheckPassed: boolean("background_check_passed").default(false),
  stateIdVerified: boolean("state_id_verified").default(false),
  certificationsVerified: boolean("certifications_verified").default(false),
  referencesVerified: boolean("references_verified").default(false),
  workspacePhotosUploaded: boolean("workspace_photos_uploaded").default(false),
  lastCalculated: timestamp("last_calculated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Anonymous communication system - Per wireframes requirement
export const anonymousContacts = pgTable("anonymous_contacts", {
  id: serial("id").primaryKey(),
  bookingId: uuid("booking_id").references(() => bookings.id),
  clientId: varchar("client_id").notNull().references(() => users.id),
  professionalId: integer("professional_id").notNull().references(() => professionals.id),
  anonymousEmail: varchar("anonymous_email").notNull(), // masked email for communication
  anonymousPhone: varchar("anonymous_phone"), // masked phone number
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"), // expire after job completion
  createdAt: timestamp("created_at").defaultNow(),
});

// Provider certifications and verification documents
export const providerCertifications = pgTable("provider_certifications", {
  id: serial("id").primaryKey(),
  professionalId: integer("professional_id").notNull().references(() => professionals.id),
  certificationType: varchar("certification_type").notNull(), // license, certification, background_check
  documentName: varchar("document_name").notNull(),
  documentUrl: varchar("document_url").notNull(),
  issuer: varchar("issuer"), // who issued the certification
  issueDate: timestamp("issue_date"),
  expiryDate: timestamp("expiry_date"),
  verificationStatus: varchar("verification_status").default("pending"), // pending, verified, rejected
  verifiedBy: varchar("verified_by"), // admin who verified
  verifiedAt: timestamp("verified_at"),
  notes: text("notes"), // admin notes
  isRequired: boolean("is_required").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Provider references for trust building
export const providerReferences = pgTable("provider_references", {
  id: serial("id").primaryKey(),
  professionalId: integer("professional_id").notNull().references(() => professionals.id),
  referenceName: varchar("reference_name").notNull(),
  referenceEmail: varchar("reference_email").notNull(),
  referencePhone: varchar("reference_phone"),
  relationship: varchar("relationship"), // previous employer, client, etc.
  contactedAt: timestamp("contacted_at"),
  responseReceived: boolean("response_received").default(false),
  verificationStatus: varchar("verification_status").default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Add missing insert schemas and types
export const insertEarningsSchema = createInsertSchema(earnings).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertWaitlistSchema = createInsertSchema(waitlist).omit({
  id: true,
  createdAt: true,
});

export const insertGroupBookingSchema = createInsertSchema(groupBookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPortfolioImageSchema = createInsertSchema(portfolioImages).omit({
  id: true,
  createdAt: true,
});

// New schemas for Phase 1 MVP features
export const insertProviderTokenSchema = createInsertSchema(providerTokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTokenTransactionSchema = createInsertSchema(tokenTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertFeeStructureSchema = createInsertSchema(feeStructure).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJobRequestSchema = createInsertSchema(jobRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProviderBidSchema = createInsertSchema(providerBids).omit({
  id: true,
  submittedAt: true,
});

export const insertProviderCertificationSchema = createInsertSchema(providerCertifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProviderReferenceSchema = createInsertSchema(providerReferences).omit({
  id: true,
  createdAt: true,
});

export const insertTokenPackageSchema = createInsertSchema(tokenPackages).omit({
  id: true,
  createdAt: true,
});

export const insertActiveBoostSchema = createInsertSchema(activeBoosts).omit({
  id: true,
  createdAt: true,
});

export const insertProviderVerificationSchema = createInsertSchema(providerVerifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProfessionalReferenceSchema = createInsertSchema(professionalReferences).omit({
  id: true,
  createdAt: true,
});

export const insertTrustScoreSchema = createInsertSchema(trustScores).omit({
  id: true,
  createdAt: true,
});

// Types for the new tables
export type ProviderToken = typeof providerTokens.$inferSelect;
export type InsertProviderToken = z.infer<typeof insertProviderTokenSchema>;

export type TokenTransaction = typeof tokenTransactions.$inferSelect;
export type InsertTokenTransaction = z.infer<typeof insertTokenTransactionSchema>;

export type FeeStructure = typeof feeStructure.$inferSelect;
export type InsertFeeStructure = z.infer<typeof insertFeeStructureSchema>;

export type JobRequest = typeof jobRequests.$inferSelect;
export type InsertJobRequest = z.infer<typeof insertJobRequestSchema>;

export type ProviderBid = typeof providerBids.$inferSelect;
export type InsertProviderBid = z.infer<typeof insertProviderBidSchema>;

export type ProviderCertification = typeof providerCertifications.$inferSelect;
export type InsertProviderCertification = z.infer<typeof insertProviderCertificationSchema>;

export type ProviderReference = typeof providerReferences.$inferSelect;
export type InsertProviderReference = z.infer<typeof insertProviderReferenceSchema>;

export type TokenPackage = typeof tokenPackages.$inferSelect;
export type InsertTokenPackage = z.infer<typeof insertTokenPackageSchema>;

export type ActiveBoost = typeof activeBoosts.$inferSelect;
export type InsertActiveBoost = z.infer<typeof insertActiveBoostSchema>;

export type ProviderVerification = typeof providerVerifications.$inferSelect;
export type InsertProviderVerification = z.infer<typeof insertProviderVerificationSchema>;

export type ProfessionalReference = typeof professionalReferences.$inferSelect;
export type InsertProfessionalReference = z.infer<typeof insertProfessionalReferenceSchema>;

export type TrustScore = typeof trustScores.$inferSelect;
export type InsertTrustScore = z.infer<typeof insertTrustScoreSchema>;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  professional: many(professionals),
  bookings: many(bookings),
  reviews: many(reviews),
  moodPreferences: many(clientMoodPreferences),
  aiMatchingScores: many(aiMatchingScores),
  notifications: many(notifications),
  waitlist: many(waitlist),
  jobRequests: many(jobRequests),
}));

export const professionalsRelations = relations(professionals, ({ one, many }) => ({
  user: one(users, {
    fields: [professionals.userId],
    references: [users.id],
  }),
  services: many(services),
  portfolioImages: many(portfolioImages),
  bookings: many(bookings),
  reviews: many(reviews),
  availability: many(availability),
  skillBadges: many(skillBadges),
  aiMatchingScores: many(aiMatchingScores),
  earnings: many(earnings),
  waitlist: many(waitlist),
  providerTokens: one(providerTokens),
  tokenTransactions: many(tokenTransactions),
  jobBids: many(providerBids),
  certifications: many(providerCertifications),
  references: many(providerReferences),
}));

export const servicesRelations = relations(services, ({ one }) => ({
  professional: one(professionals, {
    fields: [services.professionalId],
    references: [professionals.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  client: one(users, {
    fields: [bookings.clientId],
    references: [users.id],
  }),
  professional: one(professionals, {
    fields: [bookings.professionalId],
    references: [professionals.id],
  }),
  review: many(reviews),
  videoConsultation: many(videoConsultations),
  earnings: many(earnings),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  booking: one(bookings, {
    fields: [reviews.bookingId],
    references: [bookings.id],
  }),
  client: one(users, {
    fields: [reviews.clientId],
    references: [users.id],
  }),
  professional: one(professionals, {
    fields: [reviews.professionalId],
    references: [professionals.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertProfessionalSchema = createInsertSchema(professionals).omit({
  id: true,
  rating: true,
  reviewCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertAvailabilitySchema = createInsertSchema(availability).omit({
  id: true,
});

export const insertSkillBadgeSchema = createInsertSchema(skillBadges).omit({
  id: true,
  earnedAt: true,
});

export const insertClientMoodPreferenceSchema = createInsertSchema(clientMoodPreferences).omit({
  id: true,
  createdAt: true,
});

export const insertVideoConsultationSchema = createInsertSchema(videoConsultations).omit({
  id: true,
  createdAt: true,
});

export const insertAIMatchingScoreSchema = createInsertSchema(aiMatchingScores).omit({
  id: true,
  lastCalculated: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Professional = typeof professionals.$inferSelect;
export type InsertProfessional = z.infer<typeof insertProfessionalSchema>;
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type PortfolioImage = typeof portfolioImages.$inferSelect;
export type Availability = typeof availability.$inferSelect;
export type InsertAvailability = z.infer<typeof insertAvailabilitySchema>;
export type SkillBadge = typeof skillBadges.$inferSelect;
export type InsertSkillBadge = z.infer<typeof insertSkillBadgeSchema>;
export type ClientMoodPreference = typeof clientMoodPreferences.$inferSelect;
export type InsertClientMoodPreference = z.infer<typeof insertClientMoodPreferenceSchema>;
export type VideoConsultation = typeof videoConsultations.$inferSelect;
export type InsertVideoConsultation = z.infer<typeof insertVideoConsultationSchema>;
export type AIMatchingScore = typeof aiMatchingScores.$inferSelect;
export type InsertAIMatchingScore = z.infer<typeof insertAIMatchingScoreSchema>;
export type Earnings = typeof earnings.$inferSelect;
export type InsertEarnings = z.infer<typeof insertEarningsSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Waitlist = typeof waitlist.$inferSelect;
export type InsertWaitlist = z.infer<typeof insertWaitlistSchema>;
export type GroupBooking = typeof groupBookings.$inferSelect;
export type InsertGroupBooking = z.infer<typeof insertGroupBookingSchema>;
export type InsertPortfolioImage = z.infer<typeof insertPortfolioImageSchema>;

// Platform statistics for super admin dashboard
export const platformStats = pgTable("platform_stats", {
  id: serial("id").primaryKey(),
  date: timestamp("date").defaultNow(),
  totalUsers: integer("total_users").default(0),
  totalProviders: integer("total_providers").default(0),
  totalBookings: integer("total_bookings").default(0),
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).default("0.00"),
  activeUsers: integer("active_users").default(0),
  newSignups: integer("new_signups").default(0),
  completedBookings: integer("completed_bookings").default(0),
  cancelledBookings: integer("cancelled_bookings").default(0),
});

// Admin action logs for audit trail
export const adminActionLogs = pgTable("admin_action_logs", {
  id: serial("id").primaryKey(),
  adminId: varchar("admin_id").notNull().references(() => users.id),
  action: varchar("action").notNull(), // user_suspended, provider_verified, content_moderated, etc.
  targetType: varchar("target_type").notNull(), // user, provider, booking, review
  targetId: varchar("target_id").notNull(),
  details: jsonb("details"), // Additional action details
  timestamp: timestamp("timestamp").defaultNow(),
});

// Content moderation queue
export const moderationQueue = pgTable("moderation_queue", {
  id: serial("id").primaryKey(),
  contentType: varchar("content_type").notNull(), // review, profile, image
  contentId: varchar("content_id").notNull(),
  reportedBy: varchar("reported_by").references(() => users.id),
  reason: varchar("reason").notNull(),
  status: varchar("status").default("pending"), // pending, approved, rejected
  moderatedBy: varchar("moderated_by").references(() => users.id),
  moderationNotes: text("moderation_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas for new tables
export const insertPlatformStatsSchema = createInsertSchema(platformStats).omit({
  id: true,
  date: true,
});

export const insertAdminActionLogSchema = createInsertSchema(adminActionLogs).omit({
  id: true,
  timestamp: true,
});

export const insertModerationQueueSchema = createInsertSchema(moderationQueue).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for new tables
export type PlatformStats = typeof platformStats.$inferSelect;
export type InsertPlatformStats = z.infer<typeof insertPlatformStatsSchema>;
export type AdminActionLog = typeof adminActionLogs.$inferSelect;
export type InsertAdminActionLog = z.infer<typeof insertAdminActionLogSchema>;
export type ModerationQueue = typeof moderationQueue.$inferSelect;
export type InsertModerationQueue = z.infer<typeof insertModerationQueueSchema>;

// Shop Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: varchar("category").notNull(), // skincare, haircare, makeup, tools, etc.
  brand: varchar("brand"),
  imageUrl: varchar("image_url"),
  inStock: boolean("in_stock").default(true),
  stockQuantity: integer("stock_quantity").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  isRecommendedByProviders: boolean("is_recommended_by_providers").default(false),
  ingredients: text("ingredients").array(),
  tags: text("tags").array(), // professional, organic, vegan, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product Reviews table
export const productReviews = pgTable("product_reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  isVerifiedPurchase: boolean("is_verified_purchase").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Shopping Cart table
export const shoppingCart = pgTable("shopping_cart", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

// Product Orders table
export const productOrders = pgTable("product_orders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  orderNumber: varchar("order_number").notNull().unique(),
  status: varchar("status").default("pending"), // pending, processing, shipped, delivered, cancelled
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  shippingAddress: jsonb("shipping_address").notNull(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }),
  trackingNumber: varchar("tracking_number"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order Items table
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => productOrders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  priceAtTime: decimal("price_at_time", { precision: 10, scale: 2 }).notNull(),
});

// Wishlist table
export const wishlist = pgTable("wishlist", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  productId: integer("product_id").notNull().references(() => products.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Product Relations
export const productsRelations = relations(products, ({ many }) => ({
  reviews: many(productReviews),
  cartItems: many(shoppingCart),
  orderItems: many(orderItems),
  wishlistItems: many(wishlist),
}));

export const productReviewsRelations = relations(productReviews, ({ one }) => ({
  product: one(products, {
    fields: [productReviews.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [productReviews.userId],
    references: [users.id],
  }),
}));

export const shoppingCartRelations = relations(shoppingCart, ({ one }) => ({
  user: one(users, {
    fields: [shoppingCart.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [shoppingCart.productId],
    references: [products.id],
  }),
}));

export const productOrdersRelations = relations(productOrders, ({ one, many }) => ({
  user: one(users, {
    fields: [productOrders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(productOrders, {
    fields: [orderItems.orderId],
    references: [productOrders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const wishlistRelations = relations(wishlist, ({ one }) => ({
  user: one(users, {
    fields: [wishlist.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [wishlist.productId],
    references: [products.id],
  }),
}));

// Insert schemas for shop tables
export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  rating: true,
  reviewCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductReviewSchema = createInsertSchema(productReviews).omit({
  id: true,
  createdAt: true,
});

export const insertShoppingCartSchema = createInsertSchema(shoppingCart).omit({
  id: true,
  createdAt: true,
});

export const insertProductOrderSchema = createInsertSchema(productOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export const insertWishlistSchema = createInsertSchema(wishlist).omit({
  id: true,
  createdAt: true,
});

// Shop types
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type ProductReview = typeof productReviews.$inferSelect;
export type InsertProductReview = z.infer<typeof insertProductReviewSchema>;

// Analytics and Business Intelligence Tables
export const analyticsEvents = pgTable("analytics_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  eventType: varchar("event_type").notNull(), // 'booking_created', 'payment_completed', 'profile_viewed', etc.
  eventData: jsonb("event_data"),
  timestamp: timestamp("timestamp").defaultNow(),
  sessionId: varchar("session_id"),
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
});

export const businessMetrics = pgTable("business_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metricType: varchar("metric_type").notNull(), // 'revenue', 'bookings', 'users', 'conversion_rate'
  metricValue: varchar("metric_value").notNull(),
  period: varchar("period").notNull(), // 'daily', 'weekly', 'monthly', 'yearly'
  date: timestamp("date").notNull(),
  providerId: varchar("provider_id").references(() => users.id),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const marketInsights = pgTable("market_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  insightType: varchar("insight_type").notNull(), // 'trend', 'prediction', 'recommendation'
  title: varchar("title").notNull(),
  description: varchar("description"),
  impact: varchar("impact"), // 'high', 'medium', 'low'
  category: varchar("category"), // 'revenue', 'customers', 'operations', 'competition'
  confidence: varchar("confidence"), // 'high', 'medium', 'low'
  data: jsonb("data"),
  validUntil: timestamp("valid_until"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const reportGeneration = pgTable("report_generation", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  reportType: varchar("report_type").notNull(), // 'revenue', 'performance', 'customer', 'comprehensive'
  timeRange: varchar("time_range").notNull(),
  format: varchar("format").notNull(), // 'pdf', 'csv', 'excel', 'json'
  status: varchar("status").default("generating"), // 'generating', 'completed', 'failed'
  downloadUrl: varchar("download_url"),
  generatedAt: timestamp("generated_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Analytics Types
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;
export type BusinessMetric = typeof businessMetrics.$inferSelect;
export type InsertBusinessMetric = typeof businessMetrics.$inferInsert;
export type MarketInsight = typeof marketInsights.$inferSelect;
export type InsertMarketInsight = typeof marketInsights.$inferInsert;
export type ReportGeneration = typeof reportGeneration.$inferSelect;
export type InsertReportGeneration = typeof reportGeneration.$inferInsert;

// Communication and messaging system
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  participantOneId: varchar("participant_one_id").notNull().references(() => users.id),
  participantTwoId: varchar("participant_two_id").notNull().references(() => users.id),
  lastMessageId: integer("last_message_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  messageType: varchar("message_type", { length: 50 }).default("text"), // text, image, file
  attachments: jsonb("attachments"), // Array of file URLs
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const videoCalls = pgTable("video_calls", {
  id: serial("id").primaryKey(),
  initiatorId: varchar("initiator_id").notNull().references(() => users.id),
  recipientId: varchar("recipient_id").notNull().references(() => users.id),
  status: varchar("status", { length: 50 }).default("initiated"), // initiated, connecting, connected, ended
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // in seconds
  callQuality: varchar("call_quality", { length: 20 }).default("HD"),
  recording: varchar("recording"), // URL to recording if available
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced review system
export const reviewPhotos = pgTable("review_photos", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull().references(() => reviews.id),
  imageUrl: varchar("image_url").notNull(),
  caption: varchar("caption"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reviewHelpful = pgTable("review_helpful", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull().references(() => reviews.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  isHelpful: boolean("is_helpful").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reviewResponses = pgTable("review_responses", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull().references(() => reviews.id),
  providerId: integer("provider_id").notNull().references(() => professionals.id),
  response: text("response").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reviewReports = pgTable("review_reports", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull().references(() => reviews.id),
  reporterId: varchar("reporter_id").notNull().references(() => users.id),
  reason: varchar("reason").notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("pending"), // pending, reviewed, resolved
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for communication system
export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertVideoCallSchema = createInsertSchema(videoCalls).omit({
  id: true,
  createdAt: true,
});

export const insertReviewPhotoSchema = createInsertSchema(reviewPhotos).omit({
  id: true,
  createdAt: true,
});

export const insertReviewHelpfulSchema = createInsertSchema(reviewHelpful).omit({
  id: true,
  createdAt: true,
});

export const insertReviewResponseSchema = createInsertSchema(reviewResponses).omit({
  id: true,
  createdAt: true,
});

export const insertReviewReportSchema = createInsertSchema(reviewReports).omit({
  id: true,
  createdAt: true,
});

// Types for communication system
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type VideoCall = typeof videoCalls.$inferSelect;
export type InsertVideoCall = z.infer<typeof insertVideoCallSchema>;
export type ReviewPhoto = typeof reviewPhotos.$inferSelect;
export type InsertReviewPhoto = z.infer<typeof insertReviewPhotoSchema>;
export type ReviewHelpful = typeof reviewHelpful.$inferSelect;
export type InsertReviewHelpful = z.infer<typeof insertReviewHelpfulSchema>;
export type ReviewResponse = typeof reviewResponses.$inferSelect;
export type InsertReviewResponse = z.infer<typeof insertReviewResponseSchema>;
export type ReviewReport = typeof reviewReports.$inferSelect;
export type InsertReviewReport = z.infer<typeof insertReviewReportSchema>;
export type ShoppingCart = typeof shoppingCart.$inferSelect;
export type InsertShoppingCart = z.infer<typeof insertShoppingCartSchema>;
export type ProductOrder = typeof productOrders.$inferSelect;
export type InsertProductOrder = z.infer<typeof insertProductOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type Wishlist = typeof wishlist.$inferSelect;
export type InsertWishlist = z.infer<typeof insertWishlistSchema>;

// Anonymous Communication Tables for Phase 2 Trust & Safety
export const anonymousChannels = pgTable("anonymous_channels", {
  id: serial("id").primaryKey(),
  channelCode: varchar("channel_code", { length: 50 }).unique().notNull(),
  clientId: varchar("client_id").notNull(),
  providerId: integer("provider_id").references(() => professionals.id).notNull(),
  bookingId: varchar("booking_id"),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const anonymousMessages = pgTable("anonymous_messages", {
  id: serial("id").primaryKey(),
  channelCode: varchar("channel_code", { length: 50 }).references(() => anonymousChannels.channelCode).notNull(),
  senderType: varchar("sender_type", { length: 20 }).notNull(), // 'client' or 'provider'
  message: text("message").notNull(),
  messageType: varchar("message_type", { length: 20 }).default("text"), // 'text', 'image', 'file'
  attachmentUrl: varchar("attachment_url"),
  isRead: boolean("is_read").default(false),
  sentAt: timestamp("sent_at").defaultNow(),
});

export const communicationHistory = pgTable("communication_history", {
  id: serial("id").primaryKey(),
  channelCode: varchar("channel_code", { length: 50 }).notNull(),
  clientId: varchar("client_id").notNull(),
  providerId: integer("provider_id").notNull(),
  totalMessages: integer("total_messages").default(0),
  lastActivityAt: timestamp("last_activity_at").defaultNow(),
  sessionRating: integer("session_rating"), // 1-5 rating after communication
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Two-Factor Authentication Tables
export const twoFactorAuth = pgTable("two_factor_auth", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  phoneNumber: varchar("phone_number"),
  email: varchar("email"),
  isPhoneVerified: boolean("is_phone_verified").default(false),
  isEmailVerified: boolean("is_email_verified").default(false),
  backupCodes: jsonb("backup_codes"), // Array of backup codes
  lastVerifiedAt: timestamp("last_verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const verificationCodes = pgTable("verification_codes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  code: varchar("code", { length: 10 }).notNull(),
  codeType: varchar("code_type", { length: 20 }).notNull(), // 'sms', 'email'
  isUsed: boolean("is_used").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Anonymous Communication Schema exports
export const insertAnonymousChannelSchema = createInsertSchema(anonymousChannels);
export const insertAnonymousMessageSchema = createInsertSchema(anonymousMessages);
export const insertCommunicationHistorySchema = createInsertSchema(communicationHistory);
export const insertTwoFactorAuthSchema = createInsertSchema(twoFactorAuth);
export const insertVerificationCodeSchema = createInsertSchema(verificationCodes);

export type AnonymousChannel = typeof anonymousChannels.$inferSelect;
export type InsertAnonymousChannel = z.infer<typeof insertAnonymousChannelSchema>;
export type AnonymousMessage = typeof anonymousMessages.$inferSelect;
export type InsertAnonymousMessage = z.infer<typeof insertAnonymousMessageSchema>;
export type CommunicationHistory = typeof communicationHistory.$inferSelect;
export type InsertCommunicationHistory = z.infer<typeof insertCommunicationHistorySchema>;
export type TwoFactorAuth = typeof twoFactorAuth.$inferSelect;
export type InsertTwoFactorAuth = z.infer<typeof insertTwoFactorAuthSchema>;
export type VerificationCode = typeof verificationCodes.$inferSelect;
export type InsertVerificationCode = z.infer<typeof insertVerificationCodeSchema>;

// Provider Payout System Tables
export const providerPayouts = pgTable("provider_payouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: integer("provider_id").references(() => professionals.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  fees: decimal("fees", { precision: 10, scale: 2 }).notNull(),
  netAmount: decimal("net_amount", { precision: 10, scale: 2 }).notNull(),
  payoutDate: timestamp("payout_date").notNull(),
  status: varchar("status", { length: 20 }).default("pending"), // pending, processing, completed, failed
  stripePayoutId: varchar("stripe_payout_id"),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  totalBookings: integer("total_bookings").default(0),
  totalCommission: decimal("total_commission", { precision: 10, scale: 2 }).default("0.00"),
  totalTips: decimal("total_tips", { precision: 10, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tips = pgTable("tips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull(),
  clientId: varchar("client_id").notNull(),
  providerId: integer("provider_id").references(() => professionals.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  stripeTipId: varchar("stripe_tip_id"),
  status: varchar("status", { length: 20 }).default("pending"), // pending, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
});

export const disputes = pgTable("disputes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull(),
  disputantId: varchar("disputant_id").notNull(), // user who filed dispute
  disputantType: varchar("disputant_type", { length: 10 }).notNull(), // client or provider
  reason: varchar("reason", { length: 50 }).notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("open"), // open, investigating, resolved, closed
  resolution: text("resolution"),
  resolutionType: varchar("resolution_type", { length: 20 }), // refund, partial_refund, no_action
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }),
  stripeRefundId: varchar("stripe_refund_id"),
  adminNotes: text("admin_notes"),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by"), // admin user id
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const disputeMessages = pgTable("dispute_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  disputeId: varchar("dispute_id").references(() => disputes.id).notNull(),
  senderId: varchar("sender_id").notNull(),
  senderType: varchar("sender_type", { length: 10 }).notNull(), // client, provider, admin
  message: text("message").notNull(),
  attachments: jsonb("attachments"), // array of file URLs
  createdAt: timestamp("created_at").defaultNow(),
});

export const payoutSchedules = pgTable("payout_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: integer("provider_id").references(() => professionals.id).notNull(),
  frequency: varchar("frequency", { length: 20 }).default("daily"), // daily, weekly, monthly
  minimumAmount: decimal("minimum_amount", { precision: 10, scale: 2 }).default("25.00"),
  nextPayoutDate: timestamp("next_payout_date").notNull(),
  isActive: boolean("is_active").default(true),
  stripeAccountId: varchar("stripe_account_id"), // Stripe Connect account
  bankAccountLast4: varchar("bank_account_last4", { length: 4 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enhanced bookings table to track payment details
export const paymentDetails = pgTable("payment_details", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  serviceFee: decimal("service_fee", { precision: 10, scale: 2 }).notNull(), // 10%
  commission: decimal("commission", { precision: 10, scale: 2 }).notNull(), // 15%
  holdFee: decimal("hold_fee", { precision: 10, scale: 2 }).notNull(), // 25%
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  providerEarnings: decimal("provider_earnings", { precision: 10, scale: 2 }).notNull(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  paymentStatus: varchar("payment_status", { length: 20 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ProviderPayout = typeof providerPayouts.$inferSelect;
export type InsertProviderPayout = typeof providerPayouts.$inferInsert;
export type Tip = typeof tips.$inferSelect;
export type InsertTip = typeof tips.$inferInsert;
export type Dispute = typeof disputes.$inferSelect;
export type InsertDispute = typeof disputes.$inferInsert;
export type DisputeMessage = typeof disputeMessages.$inferSelect;
export type InsertDisputeMessage = typeof disputeMessages.$inferInsert;
export type PayoutSchedule = typeof payoutSchedules.$inferSelect;
export type InsertPayoutSchedule = typeof payoutSchedules.$inferInsert;
export type PaymentDetail = typeof paymentDetails.$inferSelect;
export type InsertPaymentDetail = typeof paymentDetails.$inferInsert;

// Phase 4: Automation & Communication Tables

// Automated notifications system
export const automatedNotifications = pgTable("automated_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type", { length: 50 }).notNull(), // appointment_reminder, booking_confirmation, payment_due, etc.
  templateId: varchar("template_id").notNull(),
  recipientId: varchar("recipient_id").notNull(),
  recipientType: varchar("recipient_type", { length: 20 }).notNull(), // client, provider, admin
  relatedBookingId: varchar("related_booking_id"),
  relatedProviderId: integer("related_provider_id").references(() => professionals.id),
  scheduledFor: timestamp("scheduled_for").notNull(),
  sentAt: timestamp("sent_at"),
  status: varchar("status", { length: 20 }).default("scheduled"), // scheduled, sent, failed, cancelled
  channels: varchar("channels").array().notNull(), // ["sms", "email", "push"]
  metadata: jsonb("metadata"), // Additional data for template variables
  retryCount: integer("retry_count").default(0),
  lastError: text("last_error"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Phase 4 Notification templates
export const phase4NotificationTemplates = pgTable("notification_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  subject: varchar("subject", { length: 200 }),
  emailTemplate: text("email_template"),
  smsTemplate: text("sms_template"),
  pushTemplate: text("push_template"),
  variables: varchar("variables").array(), // Available template variables
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Calendar integrations
export const calendarIntegrations = pgTable("calendar_integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  providerId: integer("provider_id").references(() => professionals.id),
  calendarType: varchar("calendar_type", { length: 20 }).notNull(), // google, outlook, apple
  externalCalendarId: varchar("external_calendar_id").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  syncEnabled: boolean("sync_enabled").default(true),
  syncDirection: varchar("sync_direction", { length: 20 }).default("bidirectional"), // import, export, bidirectional
  lastSyncAt: timestamp("last_sync_at"),
  syncStatus: varchar("sync_status", { length: 20 }).default("active"), // active, error, paused
  settings: jsonb("settings"), // Sync preferences and configurations
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Calendar events sync tracking
export const calendarEvents = pgTable("calendar_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  integrationId: varchar("integration_id").references(() => calendarIntegrations.id).notNull(),
  bookingId: varchar("booking_id"),
  externalEventId: varchar("external_event_id").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  location: varchar("location", { length: 300 }),
  attendees: jsonb("attendees"), // Email addresses and details
  isAllDay: boolean("is_all_day").default(false),
  status: varchar("status", { length: 20 }).default("confirmed"), // confirmed, tentative, cancelled
  lastModified: timestamp("last_modified"),
  syncStatus: varchar("sync_status", { length: 20 }).default("synced"), // synced, pending, failed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SMS and communication tracking
export const communicationLog = pgTable("communication_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type", { length: 20 }).notNull(), // sms, email, push, call
  recipientId: varchar("recipient_id").notNull(),
  recipientPhone: varchar("recipient_phone", { length: 20 }),
  recipientEmail: varchar("recipient_email", { length: 255 }),
  senderId: varchar("sender_id"),
  subject: varchar("subject", { length: 200 }),
  content: text("content").notNull(),
  status: varchar("status", { length: 20 }).notNull(), // sent, delivered, failed, read
  provider: varchar("provider", { length: 20 }), // twilio, sendgrid, firebase
  externalId: varchar("external_id"), // Provider's message ID
  cost: decimal("cost", { precision: 10, scale: 4 }), // Cost in USD
  metadata: jsonb("metadata"),
  sentAt: timestamp("sent_at").notNull(),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  failureReason: text("failure_reason"),
  relatedBookingId: varchar("related_booking_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User communication preferences
export const communicationPreferences = pgTable("communication_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  appointmentReminders: boolean("appointment_reminders").default(true),
  bookingConfirmations: boolean("booking_confirmations").default(true),
  paymentNotifications: boolean("payment_notifications").default(true),
  marketingMessages: boolean("marketing_messages").default(false),
  smsEnabled: boolean("sms_enabled").default(true),
  emailEnabled: boolean("email_enabled").default(true),
  pushEnabled: boolean("push_enabled").default(true),
  reminderTimings: jsonb("reminder_timings").default(JSON.stringify({
    "24h": true,
    "2h": true,
    "30m": false
  })),
  quietHours: jsonb("quiet_hours").default(JSON.stringify({
    "enabled": false,
    "start": "22:00",
    "end": "08:00"
  })),
  timezone: varchar("timezone", { length: 50 }).default("America/New_York"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Push notification subscriptions
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dhKey: text("p256dh_key").notNull(),
  authKey: text("auth_key").notNull(),
  userAgent: text("user_agent"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastUsed: timestamp("last_used"),
});

export type AutomatedNotification = typeof automatedNotifications.$inferSelect;
export type InsertAutomatedNotification = typeof automatedNotifications.$inferInsert;
export type NotificationTemplate = typeof phase4NotificationTemplates.$inferSelect;
export type InsertNotificationTemplate = typeof phase4NotificationTemplates.$inferInsert;
export type CalendarIntegration = typeof calendarIntegrations.$inferSelect;
export type InsertCalendarIntegration = typeof calendarIntegrations.$inferInsert;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = typeof calendarEvents.$inferInsert;
export type CommunicationLog = typeof communicationLog.$inferSelect;
export type InsertCommunicationLog = typeof communicationLog.$inferInsert;
export type CommunicationPreferences = typeof communicationPreferences.$inferSelect;
export type InsertCommunicationPreferences = typeof communicationPreferences.$inferInsert;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;
