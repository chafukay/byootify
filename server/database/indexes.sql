-- Performance optimization indexes for Byootify platform
-- Run with: npm run db:execute-sql

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Professionals table indexes  
CREATE INDEX IF NOT EXISTS idx_professionals_user_id ON professionals(user_id);
CREATE INDEX IF NOT EXISTS idx_professionals_location ON professionals(location);
CREATE INDEX IF NOT EXISTS idx_professionals_rating ON professionals(rating DESC);
CREATE INDEX IF NOT EXISTS idx_professionals_is_active ON professionals(is_active);
CREATE INDEX IF NOT EXISTS idx_professionals_specialties ON professionals USING GIN(specialties);

-- Services table indexes
CREATE INDEX IF NOT EXISTS idx_services_professional_id ON services(professional_id);  
CREATE INDEX IF NOT EXISTS idx_services_price ON services(price);
CREATE INDEX IF NOT EXISTS idx_services_duration ON services(duration);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);

-- Bookings table indexes (most critical for performance)
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_professional_id ON bookings(professional_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_date_status ON bookings(date, status);
CREATE INDEX IF NOT EXISTS idx_bookings_professional_date ON bookings(professional_id, date);

-- Reviews table indexes
CREATE INDEX IF NOT EXISTS idx_reviews_professional_id ON reviews(professional_id);
CREATE INDEX IF NOT EXISTS idx_reviews_client_id ON reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);

-- Availability table indexes
CREATE INDEX IF NOT EXISTS idx_availability_professional_id ON availability(professional_id);
CREATE INDEX IF NOT EXISTS idx_availability_day_of_week ON availability(day_of_week);

-- Shop-related indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating DESC);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

CREATE INDEX IF NOT EXISTS idx_shopping_cart_user_id ON shopping_cart(user_id);
CREATE INDEX IF NOT EXISTS idx_product_orders_user_id ON product_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_product_orders_status ON product_orders(status);
CREATE INDEX IF NOT EXISTS idx_product_orders_created_at ON product_orders(created_at);

-- Analytics table indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);

-- Communication system indexes
CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_provider_id ON conversations(provider_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Provider dashboard indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_images_provider_id ON portfolio_images(provider_id);
CREATE INDEX IF NOT EXISTS idx_earnings_provider_id ON earnings(provider_id);
CREATE INDEX IF NOT EXISTS idx_earnings_date ON earnings(date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Advanced booking feature indexes
CREATE INDEX IF NOT EXISTS idx_group_bookings_provider_id ON group_bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_group_bookings_event_date ON group_bookings(event_date);
CREATE INDEX IF NOT EXISTS idx_group_bookings_status ON group_bookings(status);

CREATE INDEX IF NOT EXISTS idx_waitlist_provider_id ON waitlist(provider_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_requested_date ON waitlist(requested_date);
CREATE INDEX IF NOT EXISTS idx_waitlist_priority ON waitlist(priority);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_bookings_professional_date_status ON bookings(professional_id, date, status);
CREATE INDEX IF NOT EXISTS idx_reviews_professional_rating ON reviews(professional_id, rating DESC);
CREATE INDEX IF NOT EXISTS idx_professionals_location_rating ON professionals(location, rating DESC);
CREATE INDEX IF NOT EXISTS idx_services_professional_active ON services(professional_id, is_active);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_professionals_search ON professionals USING GIN(to_tsvector('english', business_name || ' ' || COALESCE(bio, '')));
CREATE INDEX IF NOT EXISTS idx_services_search ON services USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Performance statistics
ANALYZE users;
ANALYZE professionals;
ANALYZE services;  
ANALYZE bookings;
ANALYZE reviews;
ANALYZE availability;
ANALYZE products;
ANALYZE analytics_events;
ANALYZE conversations;
ANALYZE messages;