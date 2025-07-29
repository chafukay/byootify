import type { Express } from "express";
import { db } from "./db";
import { conversations, messages, videoCalls, reviewPhotos, reviewHelpful, reviewResponses, reviewReports } from "@shared/schema";
import { eq, and, or, desc, sql } from "drizzle-orm";
import { isAuthenticated } from "./replitAuth";

export function registerCommunicationRoutes(app: Express) {
  // Get all conversations for a user
  app.get("/api/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const userConversations = await db
        .select({
          id: conversations.id,
          participantOneId: conversations.participantOneId,
          participantTwoId: conversations.participantTwoId,
          lastMessageId: conversations.lastMessageId,
          createdAt: conversations.createdAt,
          updatedAt: conversations.updatedAt,
          participantName: sql<string>`
            CASE 
              WHEN ${conversations.participantOneId} = ${userId} 
              THEN (SELECT CONCAT(first_name, ' ', last_name) FROM users WHERE id = ${conversations.participantTwoId})
              ELSE (SELECT CONCAT(first_name, ' ', last_name) FROM users WHERE id = ${conversations.participantOneId})
            END
          `,
          participantAvatar: sql<string>`
            CASE 
              WHEN ${conversations.participantOneId} = ${userId} 
              THEN (SELECT profile_image_url FROM users WHERE id = ${conversations.participantTwoId})
              ELSE (SELECT profile_image_url FROM users WHERE id = ${conversations.participantOneId})
            END
          `,
          lastMessage: sql<any>`
            (SELECT json_build_object(
              'content', content,
              'timestamp', created_at,
              'senderId', sender_id
            ) FROM messages WHERE id = ${conversations.lastMessageId})
          `,
          unreadCount: sql<number>`
            (SELECT COUNT(*) FROM messages 
             WHERE conversation_id = ${conversations.id} 
             AND sender_id != ${userId} 
             AND is_read = false)
          `
        })
        .from(conversations)
        .where(
          or(
            eq(conversations.participantOneId, userId),
            eq(conversations.participantTwoId, userId)
          )
        )
        .orderBy(desc(conversations.updatedAt));

      res.json(userConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Get messages for a conversation
  app.get("/api/conversations/:conversationId/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { conversationId } = req.params;

      // Verify user is participant in conversation
      const conversation = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, parseInt(conversationId)),
            or(
              eq(conversations.participantOneId, userId),
              eq(conversations.participantTwoId, userId)
            )
          )
        )
        .limit(1);

      if (conversation.length === 0) {
        return res.status(403).json({ message: "Access denied" });
      }

      const conversationMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, parseInt(conversationId)))
        .orderBy(messages.createdAt);

      res.json(conversationMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send a message
  app.post("/api/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { content, conversationId, recipientId } = req.body;

      let finalConversationId = conversationId;

      // If no conversation exists, create one
      if (!conversationId && recipientId) {
        // Check if conversation already exists
        const existingConversation = await db
          .select()
          .from(conversations)
          .where(
            or(
              and(
                eq(conversations.participantOneId, userId),
                eq(conversations.participantTwoId, recipientId)
              ),
              and(
                eq(conversations.participantOneId, recipientId),
                eq(conversations.participantTwoId, userId)
              )
            )
          )
          .limit(1);

        if (existingConversation.length > 0) {
          finalConversationId = existingConversation[0].id;
        } else {
          // Create new conversation
          const [newConversation] = await db
            .insert(conversations)
            .values({
              participantOneId: userId,
              participantTwoId: recipientId,
            })
            .returning();
          finalConversationId = newConversation.id;
        }
      }

      // Insert message
      const [newMessage] = await db
        .insert(messages)
        .values({
          conversationId: finalConversationId,
          senderId: userId,
          content,
          messageType: "text",
        })
        .returning();

      // Update conversation's last message
      await db
        .update(conversations)
        .set({
          lastMessageId: newMessage.id,
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, finalConversationId));

      res.json(newMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Mark message as read
  app.put("/api/messages/:messageId/read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { messageId } = req.params;

      // Only mark as read if user is the recipient
      await db
        .update(messages)
        .set({ isRead: true })
        .where(
          and(
            eq(messages.id, parseInt(messageId)),
            sql`sender_id != ${userId}`
          )
        );

      res.json({ success: true });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // Initiate video call
  app.post("/api/video-calls/initiate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { recipientId } = req.body;

      const [newCall] = await db
        .insert(videoCalls)
        .values({
          initiatorId: userId,
          recipientId,
          status: "initiated",
        })
        .returning();

      res.json({ callId: newCall.id, status: "initiated" });
    } catch (error) {
      console.error("Error initiating video call:", error);
      res.status(500).json({ message: "Failed to initiate video call" });
    }
  });

  // Get video call details
  app.get("/api/video-calls/:callId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { callId } = req.params;

      const call = await db
        .select()
        .from(videoCalls)
        .where(
          and(
            eq(videoCalls.id, parseInt(callId)),
            or(
              eq(videoCalls.initiatorId, userId),
              eq(videoCalls.recipientId, userId)
            )
          )
        )
        .limit(1);

      if (call.length === 0) {
        return res.status(404).json({ message: "Call not found" });
      }

      res.json(call[0]);
    } catch (error) {
      console.error("Error fetching video call:", error);
      res.status(500).json({ message: "Failed to fetch video call" });
    }
  });

  // End video call
  app.post("/api/video-calls/:callId/end", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { callId } = req.params;

      await db
        .update(videoCalls)
        .set({
          status: "ended",
          endTime: new Date(),
        })
        .where(
          and(
            eq(videoCalls.id, parseInt(callId)),
            or(
              eq(videoCalls.initiatorId, userId),
              eq(videoCalls.recipientId, userId)
            )
          )
        );

      res.json({ success: true });
    } catch (error) {
      console.error("Error ending video call:", error);
      res.status(500).json({ message: "Failed to end video call" });
    }
  });

  // Record video call details
  app.post("/api/video-calls/:callId/record", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { callId } = req.params;
      const { duration, quality } = req.body;

      await db
        .update(videoCalls)
        .set({
          duration,
          callQuality: quality,
        })
        .where(
          and(
            eq(videoCalls.id, parseInt(callId)),
            or(
              eq(videoCalls.initiatorId, userId),
              eq(videoCalls.recipientId, userId)
            )
          )
        );

      res.json({ success: true });
    } catch (error) {
      console.error("Error recording call details:", error);
      res.status(500).json({ message: "Failed to record call details" });
    }
  });

  // Enhanced review endpoints
  app.post("/api/reviews/:reviewId/helpful", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { reviewId } = req.params;
      const { isHelpful } = req.body;

      // Check if user already voted
      const existingVote = await db
        .select()
        .from(reviewHelpful)
        .where(
          and(
            eq(reviewHelpful.reviewId, parseInt(reviewId)),
            eq(reviewHelpful.userId, userId)
          )
        )
        .limit(1);

      if (existingVote.length > 0) {
        // Update existing vote
        await db
          .update(reviewHelpful)
          .set({ isHelpful })
          .where(
            and(
              eq(reviewHelpful.reviewId, parseInt(reviewId)),
              eq(reviewHelpful.userId, userId)
            )
          );
      } else {
        // Create new vote
        await db
          .insert(reviewHelpful)
          .values({
            reviewId: parseInt(reviewId),
            userId,
            isHelpful,
          });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error marking review as helpful:", error);
      res.status(500).json({ message: "Failed to mark review as helpful" });
    }
  });

  // Report review
  app.post("/api/reviews/:reviewId/report", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { reviewId } = req.params;
      const { reason, description } = req.body;

      await db
        .insert(reviewReports)
        .values({
          reviewId: parseInt(reviewId),
          reporterId: userId,
          reason,
          description,
        });

      res.json({ success: true });
    } catch (error) {
      console.error("Error reporting review:", error);
      res.status(500).json({ message: "Failed to report review" });
    }
  });

  // Get review statistics for provider
  app.get("/api/providers/:providerId/review-stats", async (req, res) => {
    try {
      const { providerId } = req.params;

      const stats = await db
        .select({
          totalReviews: sql<number>`COUNT(*)`,
          averageRating: sql<number>`AVG(rating::numeric)`,
          ratingDistribution: sql<any>`
            json_build_object(
              '5', COUNT(CASE WHEN rating = 5 THEN 1 END),
              '4', COUNT(CASE WHEN rating = 4 THEN 1 END),
              '3', COUNT(CASE WHEN rating = 3 THEN 1 END),
              '2', COUNT(CASE WHEN rating = 2 THEN 1 END),
              '1', COUNT(CASE WHEN rating = 1 THEN 1 END)
            )
          `,
          verifiedReviews: sql<number>`COUNT(CASE WHEN booking_id IS NOT NULL THEN 1 END)`,
        })
        .from(sql`reviews`)
        .where(sql`professional_id = ${providerId}`)
        .groupBy(sql`professional_id`);

      if (stats.length === 0) {
        return res.json({
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
          verifiedReviews: 0,
          recentTrend: 0,
          percentile: 0,
        });
      }

      res.json({
        ...stats[0],
        recentTrend: Math.floor(Math.random() * 20) - 5, // Mock data for trend
        percentile: Math.floor(Math.random() * 30) + 70, // Mock data for percentile
      });
    } catch (error) {
      console.error("Error fetching review stats:", error);
      res.status(500).json({ message: "Failed to fetch review stats" });
    }
  });
}