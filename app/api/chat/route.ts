import { NextResponse } from "next/server";
import { retrieveContext } from "@/lib/rag";
import { askLLM } from "@/lib/llm";
import { getTopic, setTopic } from "@/lib/chatMemory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const sessionId =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "local";

    /* LOAD MEMORY */
    const lastTopic = getTopic(sessionId);

    /* RETRIEVE */
    let { context, detectedTopic } = retrieveContext(message);

    /* MEMORY RETRY */
    if (context === "NO_CONTEXT_FOUND" && lastTopic) {
      const retry = retrieveContext(lastTopic + " " + message, lastTopic);
      context = retry.context;
      detectedTopic = retry.detectedTopic || lastTopic;
    }

    if (context === "NO_CONTEXT_FOUND") {
      const tokens = message.toLowerCase().split(/\s+/);
      const socialPhrases = ["hi", "hello", "hey", "kamusta", "kumusta", "thanks", "thank you", "salamat", "thankyou"];
      const isSocial = socialPhrases.some(p => message.toLowerCase().includes(p)) || tokens.some((t: string) => socialPhrases.includes(t));
      
      if (isSocial) {
        const lowerMsg = message.toLowerCase();
        if (lowerMsg.includes("thank") || lowerMsg.includes("salamat")) {
          return NextResponse.json({
            reply: "Your welcome po!",
          });
        }
        return NextResponse.json({
          reply: "Hello po! I'm Lia Satella. Ano po ang matutulong ko?",
        });
      }

      return NextResponse.json({
        reply: "Sorry, limited lang ang info ko about dyan.",
      });
    }


    /* SAVE TOPIC */
    if (detectedTopic) setTopic(sessionId, detectedTopic as string);

    const prompt = `
You are Lia Satella, a knowledge-base assistant.

[STRICT RESPONSE CONTROL]
- BE EXTREMELY CONCISE. Answer ONLY what is specifically asked.
- NO INTRODUCTIONS: Do not say "I'd be happy to help" or "Regarding your question".
- NO OUTROS: Do not ask "May I know if you have other questions" or similar follow-ups.
- NO FILLER: Do not use phrases like "According to the context" or "Ah, let me see".
- LANGUAGE: Use Taglish (mixture of English and Filipino). No translations/duplicates.
- Focus strictly on the xfinite data set.
- If the answer is not in the context, just say: "Pasensya na, wala sa record ko ang information na yan."

[ACCOUNT/REGISTRATION RULE]
- If the user asks about account generation, signup, or registration problems:
  - Account generation is tied ONLY to passing the Precourse Exam.
  - State that they must check if they passed or retake it.
  - DO NOT suggest websites or other steps.

CONTEXT:
${context}

QUESTION:
${message}

GUIDELINES:
- FORMATTING: Plain text and bullet points only. NO BOLD (no **).
- Pick one language per sentence or mix naturally (Taglish).
`;


    const reply = await askLLM(prompt);

    return NextResponse.json({ reply });

  } catch (err) { 
    console.error(err);
    return NextResponse.json({ error: "Server crashed" }, { status: 500 });
  }
}