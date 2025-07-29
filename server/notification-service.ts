import { storage } from './storage';
import { db } from './db';
import { notifications, notificationTemplates, notificationAnalytics } from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

interface NotificationData {
  userId: string;
  type: string;
  category: string;
  title: string;
  message: string;
  data?: any;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  actionRequired?: boolean;
  actionUrl?: string;
  actionText?: string;
  expiresAt?: Date;
  deliveryMethod?: string[];
}

interface NotificationTemplate {
  key: string;
  category: string;
  title: string;
  message: string;
  variables?: string[];
  actionText?: string;
  actionUrl?: string;
  priority?: string;
}

export class SmartNotificationService {
  
  // Create a notification from template
  async createFromTemplate(templateKey: string, userId: string, variables: Record<string, any> = {}) {
    try {
      // Get template
      const [template] = await db
        .select()
        .from(notificationTemplates)
        .where(and(
          eq(notificationTemplates.key, templateKey),
          eq(notificationTemplates.isActive, true)
        ));

      if (!template) {
        throw new Error(`Notification template not found: ${templateKey}`);
      }

      // Replace variables in title and message
      let title = template.title;
      let message = template.message;
      let actionUrl = template.actionUrl;

      if (template.variables) {
        template.variables.forEach(variable => {
          const value = variables[variable] || '';
          title = title.replace(new RegExp(`{${variable}}`, 'g'), value);
          message = message.replace(new RegExp(`{${variable}}`, 'g'), value);
          if (actionUrl) {
            actionUrl = actionUrl.replace(new RegExp(`{${variable}}`, 'g'), value);
          }
        });
      }

      // Create notification
      const notificationData: NotificationData = {
        userId,
        type: templateKey,
        category: template.category,
        title,
        message,
        priority: template.priority as any || 'normal',
        actionRequired: !!template.actionText,
        actionUrl,
        actionText: template.actionText,
        data: variables
      };

      return await this.createNotification(notificationData);
    } catch (error) {
      console.error('Error creating notification from template:', error);
      throw error;
    }
  }

  // Create a custom notification
  async createNotification(data: NotificationData) {
    try {
      const [notification] = await db
        .insert(notifications)
        .values({
          userId: data.userId,
          type: data.type,
          category: data.category,
          title: data.title,
          message: data.message,
          data: data.data,
          priority: data.priority || 'normal',
          actionRequired: data.actionRequired || false,
          actionUrl: data.actionUrl,
          actionText: data.actionText,
          expiresAt: data.expiresAt,
          deliveryMethod: data.deliveryMethod || ['in_app'],
          sentAt: new Date(),
        })
        .returning();

      // Track analytics
      await this.trackAnalytics(notification.id, {
        userId: data.userId,
        category: data.category,
        sent: true,
        sentAt: new Date(),
      });

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Get user notifications
  async getUserNotifications(userId: string, options: {
    category?: string;
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      let query = db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId));

      if (options.category) {
        query = query.where(eq(notifications.category, options.category));
      }

      if (options.unreadOnly) {
        query = query.where(eq(notifications.isRead, false));
      }

      query = query
        .orderBy(desc(notifications.createdAt))
        .limit(options.limit || 50)
        .offset(options.offset || 0);

      return await query;
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string) {
    try {
      const [notification] = await db
        .update(notifications)
        .set({
          isRead: true,
          readAt: new Date(),
        })
        .where(and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        ))
        .returning();

      if (notification) {
        await this.trackAnalytics(notificationId, {
          userId,
          opened: true,
          openedAt: new Date(),
        });
      }

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Dismiss notification
  async dismissNotification(notificationId: string, userId: string) {
    try {
      const [notification] = await db
        .update(notifications)
        .set({
          dismissedAt: new Date(),
        })
        .where(and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        ))
        .returning();

      if (notification) {
        await this.trackAnalytics(notificationId, {
          userId,
          dismissed: true,
          dismissedAt: new Date(),
        });
      }

      return notification;
    } catch (error) {
      console.error('Error dismissing notification:', error);
      throw error;
    }
  }

  // Track notification analytics
  async trackAnalytics(notificationId: string, data: any) {
    try {
      await db
        .insert(notificationAnalytics)
        .values({
          notificationId,
          ...data,
        })
        .onConflictDoUpdate({
          target: notificationAnalytics.notificationId,
          set: data,
        });
    } catch (error) {
      console.error('Error tracking notification analytics:', error);
    }
  }

  // Contextual notification triggers
  async triggerBookingReminder(bookingId: string, clientId: string, appointmentTime: Date) {
    const variables = {
      bookingId,
      appointmentTime: appointmentTime.toLocaleString(),
      actionUrl: `/booking/${bookingId}`,
    };

    return await this.createFromTemplate('booking_reminder', clientId, variables);
  }

  async triggerPaymentDue(bookingId: string, clientId: string, amount: number) {
    const variables = {
      bookingId,
      amount: amount.toFixed(2),
      actionUrl: `/checkout/${bookingId}`,
    };

    return await this.createFromTemplate('payment_due', clientId, variables);
  }

  async triggerJobMatch(providerId: string, jobId: string, clientName: string) {
    const variables = {
      jobId,
      clientName,
      actionUrl: `/jobs/${jobId}`,
    };

    return await this.createFromTemplate('job_match', providerId, variables);
  }

  async triggerTokenExpiry(providerId: string, expiryDate: Date) {
    const variables = {
      expiryDate: expiryDate.toLocaleDateString(),
      actionUrl: '/dashboard?tab=tokens',
    };

    return await this.createFromTemplate('token_expiry', providerId, variables);
  }

  async triggerReviewRequest(providerId: string, bookingId: string, clientName: string) {
    const variables = {
      bookingId,
      clientName,
      actionUrl: `/booking/${bookingId}/review`,
    };

    return await this.createFromTemplate('review_request', providerId, variables);
  }

  // Initialize default notification templates
  async initializeTemplates() {
    const defaultTemplates: NotificationTemplate[] = [
      {
        key: 'booking_reminder',
        category: 'booking',
        title: 'Upcoming Appointment Reminder',
        message: 'You have an appointment scheduled for {appointmentTime}. Don\'t forget to prepare!',
        variables: ['appointmentTime'],
        actionText: 'View Booking',
        actionUrl: '/booking/{bookingId}',
        priority: 'normal',
      },
      {
        key: 'payment_due',
        category: 'payment',
        title: 'Payment Required',
        message: 'Your payment of ${amount} is due. Please complete your payment to confirm your booking.',
        variables: ['amount'],
        actionText: 'Pay Now',
        actionUrl: '/checkout/{bookingId}',
        priority: 'high',
      },
      {
        key: 'job_match',
        category: 'business',
        title: 'New Job Match Available',
        message: '{clientName} has posted a job that matches your skills. Apply now!',
        variables: ['clientName'],
        actionText: 'View Job',
        actionUrl: '/jobs/{jobId}',
        priority: 'normal',
      },
      {
        key: 'token_expiry',
        category: 'business',
        title: 'Token Boost Expiring Soon',
        message: 'Your visibility boost expires on {expiryDate}. Renew now to maintain top ranking.',
        variables: ['expiryDate'],
        actionText: 'Renew Tokens',
        actionUrl: '/dashboard?tab=tokens',
        priority: 'normal',
      },
      {
        key: 'review_request',
        category: 'business',
        title: 'Review Request',
        message: 'Please take a moment to review your recent service with {clientName}.',
        variables: ['clientName'],
        actionText: 'Leave Review',
        actionUrl: '/booking/{bookingId}/review',
        priority: 'low',
      },
      {
        key: 'welcome_provider',
        category: 'system',
        title: 'Welcome to Byootify!',
        message: 'Welcome to Byootify! Complete your profile to start receiving bookings.',
        actionText: 'Complete Profile',
        actionUrl: '/onboarding/provider',
        priority: 'high',
      },
      {
        key: 'booking_confirmed',
        category: 'booking',
        title: 'Booking Confirmed',
        message: 'Your booking has been confirmed! We\'ll send you a reminder before your appointment.',
        actionText: 'View Details',
        actionUrl: '/booking/{bookingId}',
        priority: 'normal',
      },
    ];

    try {
      for (const template of defaultTemplates) {
        await db
          .insert(notificationTemplates)
          .values(template)
          .onConflictDoUpdate({
            target: notificationTemplates.key,
            set: {
              title: template.title,
              message: template.message,
              variables: template.variables,
              actionText: template.actionText,
              actionUrl: template.actionUrl,
              priority: template.priority,
              updatedAt: new Date(),
            },
          });
      }
      console.log('Notification templates initialized successfully');
    } catch (error) {
      console.error('Error initializing notification templates:', error);
    }
  }
}

export const notificationService = new SmartNotificationService();