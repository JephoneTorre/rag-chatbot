export async function askLLM(prompt: string): Promise<string> {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "",
          "X-Title": "RAG Chatbot"
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [{ role: "user", content: prompt }]
        })
      });
  
      const data = await res.json();
  
      return data?.choices?.[0]?.message?.content
        || "I don't have information about that.";
    } catch (err) {
      console.error(err);
      return "AI provider error.";
    }
  }