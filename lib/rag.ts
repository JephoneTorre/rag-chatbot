import melinda from "@/app/data/melinda.json";
import xfinite from "@/app/data/xfinite.json";

type KBItem = { title: string; content: string; source: string };

/* =========================
   BUILD KNOWLEDGE BASE
========================= */

const KB: KBItem[] = [
  ...melinda.map(x => ({ ...x, source: "melinda" })),
  ...xfinite.map(x => ({ ...x, source: "xfinite" })),
];


/* =========================
   TEXT NORMALIZATION
========================= */

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")   // remove punctuation
    .replace(/\s+/g, " ")       // collapse spaces
    .trim();
}

function tokenize(text: string): string[] {
  return normalize(text).split(" ");
}


/* =========================
   TOPIC DETECTION
========================= */

const topicKeywords = {
  melinda: [
    "melinda",
    "doctor",
    "dr",
    "physician",
    "pediatrician",
    "willingham",
    "clinic"
  ],

  xfinite: [
    "xfinite",
    "xfnite",
    "labeling",
    "annotation",
    "project",
    "task",
    "training",
    "work"
  ]
};

function detectTopic(query: string): "melinda" | "xfinite" | "any" {
  const words = tokenize(query);

  for (const topic of Object.keys(topicKeywords) as (keyof typeof topicKeywords)[]) {
    if (words.some(w => topicKeywords[topic].includes(w))) {
      return topic;
    }
  }

  return "any";
}


/* =========================
   INTENT DETECTION
========================= */

const intents: Record<string, string[]> = {
  requirements: ["requirement","requirements","qualifications","needed","need","prerequisite"],
  apply: ["apply","application","join","register","enroll","start"],
  pay: ["salary","pay","income","earn","earnings","rate","payment"],
  hours: ["time","hours","schedule","shift","workload"],
  training: ["training","orientation","lesson","course","tutorial"],
  contact: ["contact","email","facebook","instagram","link"],
};

function detectIntent(query: string): string | null {
  const words = tokenize(query);

  for (const key in intents) {
    if (words.some(w => intents[key].includes(w))) {
      return key;
    }
  }
  return null;
}


/* =========================
   SCORING FUNCTION
========================= */

function scoreItem(item: KBItem, query: string, intent: string | null): number {
  let score = 0;

  const qWords = tokenize(query);
  const text = normalize(item.title + " " + item.content);

  // keyword overlap
  for (const word of qWords) {
    if (text.includes(word)) score += 2;
  }

  // intent boost
  if (intent && text.includes(intent)) score += 6;

  // title priority boost
  if (intent && normalize(item.title).includes(intent)) score += 10;

  // length normalization (prevents huge paragraphs always winning)
  score = score / Math.sqrt(text.length);

  return score;
}


/* =========================
   MAIN RETRIEVER
========================= */

export function retrieveContext(query: string): string {

  const topic = detectTopic(query);
  const intent = detectIntent(query);

  let filtered = KB;

  // filter by detected topic
  if (topic !== "any") {
    filtered = KB.filter(x => x.source === topic);
  }

  // rank
  const ranked = filtered
    .map(item => ({
      item,
      score: scoreItem(item, query, intent),
    }))
    .filter(x => x.score > 0.05) // threshold prevents garbage matches
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (!ranked.length) {
    return "NO_CONTEXT_FOUND";
  }

  return ranked
    .map(x => `${x.item.title}: ${x.item.content}`)
    .join("\n");
}