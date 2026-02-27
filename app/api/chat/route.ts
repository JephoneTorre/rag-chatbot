import { NextResponse } from "next/server";
import { retrieveContext } from "@/lib/rag";
import { askLLM } from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    /* =========================
       1. READ REQUEST
    ========================= */

    const body = await req.json();
    const message: string | undefined = body?.message;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "No message provided" },
        { status: 400 }
      );
    }

    const cleanMessage = message.trim();


    /* =========================
       2. RETRIEVE CONTEXT (RAG)
    ========================= */

    const context = retrieveContext(cleanMessage);

    // 🚫 HARD GUARD — prevents hallucinations completely
    if (context === "NO_CONTEXT_FOUND") {
      return NextResponse.json({
        reply: "I don't have information about that."
      });
    }


    /* =========================
       3. BUILD PROMPT
    ========================= */

    const prompt = `
You are VIA, a strict knowledge-base assistant.

RULES:
- Answer ONLY using the provided context
- Do NOT use outside knowledge
- If the answer is not clearly in the context, reply exactly:
  "I don't have information about that."

Keep answers concise and natural.

CONTEXT:
${context}

QUESTION:
${cleanMessage}
`;


    /* =========================
       4. ASK LLM
    ========================= */

    const reply = await askLLM(prompt);


    /* =========================
       5. RETURN RESPONSE
    ========================= */

    return NextResponse.json({
      reply: reply || "I don't have information about that."
    });

  } catch (err) {
    console.error("CHAT API ERROR:", err);

    return NextResponse.json(
      { error: "Server crashed" },
      { status: 500 }
    );
  }
}