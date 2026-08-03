import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { makeConversationTitle } from "@/lib/specialist-agents";

/**
 * GET /api/symptom-checker/history
 * Retrieves past AI conversation logs and triage records for the current user.
 * Optional query parameter: ?id=<conversationId> to fetch a single conversation.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();

  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("id");

    if (conversationId) {
      const conversation = await prisma.aIConversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        return NextResponse.json({ error: "Conversation session not found." }, { status: 404 });
      }

      // Check ownership if user is logged in
      if (session?.userId && conversation.userId && conversation.userId !== session.userId) {
        return NextResponse.json({ error: "Unauthorized access to conversation record." }, { status: 403 });
      }

      let parsedMessages: any[] = [];
      try {
        parsedMessages = JSON.parse(conversation.messages);
      } catch {
        parsedMessages = [];
      }

      const firstUserMessage = parsedMessages.find((m: any) => m.role === "user");

      return NextResponse.json({
        success: true,
        conversation: {
          id: conversation.id,
          conversationType: conversation.conversationType,
          title:
            conversation.title ||
            (firstUserMessage?.content ? makeConversationTitle(firstUserMessage.content) : "Symptom Triage Session"),
          createdAt: conversation.createdAt,
          messages: parsedMessages,
        },
      });
    }

    // Otherwise fetch list of past conversations
    const whereCondition: any = {};
    if (session?.userId) {
      whereCondition.userId = session.userId;
    } else {
      // Return recent anonymous sessions or empty list if no session
      whereCondition.userId = null;
    }

    const conversations = await prisma.aIConversation.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const formattedList = conversations.map((conv) => {
      let parsedMessages: any[] = [];
      try {
        parsedMessages = JSON.parse(conv.messages);
      } catch {
        parsedMessages = [];
      }

      const firstUserMsg = parsedMessages.find((m: any) => m.role === "user");
      const firstBotMsg = parsedMessages.find((m: any) => m.role === "assistant" && m.triageResult);

      const triageResult = firstBotMsg?.triageResult || null;

      return {
        id: conv.id,
        conversationType: conv.conversationType,
        createdAt: conv.createdAt,
        title:
          conv.title ||
          (firstUserMsg?.content ? makeConversationTitle(firstUserMsg.content) : "Symptom Triage Session"),
        symptomPrompt: firstUserMsg?.content || "Symptom Triage Session",
        severityLevel: triageResult?.severityLevel || "LOW",
        suggestedSpecialty: triageResult?.suggestedSpecialty || "General Physician",
        summary: triageResult?.summary || "Advisory symptom triage session.",
        recommendDoctor: triageResult?.recommendDoctor ?? false,
        messageCount: parsedMessages.length,
        triageResult,
      };
    });

    return NextResponse.json({
      success: true,
      history: formattedList,
    });
  } catch (error: any) {
    console.error("Fetch conversation history error: ", error);
    return NextResponse.json(
      { error: "Failed to fetch symptom triage history from database." },
      { status: 500 },
    );
  }
}
