export async function askLLM(prompt: string): Promise<string> {
  try {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://rag-chatbot-hjqk.vercel.app";

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": siteUrl,
        "X-Title": "VIA RAG Chatbot",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    const text = await res.text();

    if (!res.ok) {
      console.error("OPENROUTER RAW ERROR:", text);
      return "AI provider error.";
    }

    const data = JSON.parse(text);

    return (
      data?.choices?.[0]?.message?.content ||
      "I don't have information about that."
    );
  } catch (err) {
    console.error("LLM CRASH:", err);
    return "AI provider error.";
  }
}