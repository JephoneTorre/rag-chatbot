export async function askLLM(prompt: string): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://via-ruddy-pi.vercel.app",
      "X-Title": "RAG Chatbot",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("OpenRouter error:", data);
    return "AI provider error.";
  }

  return data?.choices?.[0]?.message?.content ?? "No response.";
}