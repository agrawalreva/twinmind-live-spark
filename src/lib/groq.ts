import { toast } from "sonner";
import { type Message, type Settings, type Suggestion } from "@/lib/settings";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const CHAT_MODEL = "llama-3.3-70b-versatile";
const TRANSCRIBE_MODEL = "whisper-large-v3";

function ensureApiKey(apiKey: string) {
  if (!apiKey.trim()) {
    const message = "Please add your Groq API key in Settings";
    toast.error(message);
    throw new Error(message);
  }
}

async function parseError(response: Response): Promise<never> {
  const body = await response.text();
  const message = body || "Groq request failed";
  toast.error(message);
  throw new Error(message);
}

export async function transcribeAudio(audioBlob: Blob, apiKey: string): Promise<string> {
  ensureApiKey(apiKey);
  const formData = new FormData();
  const extension = audioBlob.type.includes("mp4")
    ? "mp4"
    : audioBlob.type.includes("webm")
      ? "webm"
      : "wav";
  formData.append("file", audioBlob, `audio.${extension}`);
  formData.append("model", TRANSCRIBE_MODEL);
  formData.append("response_format", "text");
  const response = await fetch(`${GROQ_BASE_URL}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });
  if (!response.ok) {
    const err = (await response.json()) as unknown;
    const message = JSON.stringify(err);
    toast.error(message);
    throw new Error(message);
  }
  return (await response.text()).trim();
}

function trimTranscript(fullTranscript: string, contextWindow: number) {
  return fullTranscript.slice(Math.max(0, fullTranscript.length - contextWindow));
}

function normalizeSuggestion(raw: Omit<Suggestion, "id">, index: number): Suggestion {
  return {
    id: `${Date.now()}-${index}`,
    ...raw,
  };
}

export async function generateSuggestions(
  transcript: string,
  previousSuggestions: string[],
  meetingType: string,
  settings: Settings,
): Promise<Suggestion[]> {
  ensureApiKey(settings.groqApiKey);
  const prompt = settings.suggestionPrompt
    .replace("{{meetingType}}", meetingType)
    .replace("{{previousSuggestions}}", previousSuggestions.join(" | "))
    .replace("{{transcript}}", trimTranscript(transcript, settings.suggestionContextWindow));
  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settings.groqApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!response.ok) {
    return parseError(response);
  }
  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content ?? "[]";
  const clean = content.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean) as Array<Omit<Suggestion, "id">>;
  return parsed.slice(0, 3).map(normalizeSuggestion);
}

export async function streamChatResponse(
  messages: Message[],
  transcript: string,
  meetingType: string,
  settings: Settings,
  onChunk: (text: string) => void,
  systemPromptOverride?: string,
): Promise<void> {
  ensureApiKey(settings.groqApiKey);
  const baseSystemPrompt =
    systemPromptOverride ??
    settings.chatPrompt
      .replace("{{meetingType}}", meetingType)
      .replace("{{transcript}}", trimTranscript(transcript, settings.chatContextWindow));
  const systemPrompt = `${baseSystemPrompt}\n\nBe concise. Maximum 3 paragraphs. Use short sentences.`;
  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settings.groqApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      stream: true,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  });
  if (!response.ok || !response.body) {
    return parseError(response);
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.replace("data: ", "").trim();
      if (payload === "[DONE]") continue;
      const json = JSON.parse(payload) as { choices?: Array<{ delta?: { content?: string } }> };
      const token = json.choices?.[0]?.delta?.content ?? "";
      if (token) onChunk(token);
    }
  }
}

export async function detectMeetingType(transcript: string, settings: Settings): Promise<string> {
  ensureApiKey(settings.groqApiKey);
  const prompt = `Classify this meeting transcript into exactly one label:
sales call | interview | brainstorm | 1:1 | lecture | general
Only return the label.
Transcript:
${trimTranscript(transcript, settings.suggestionContextWindow)}`;
  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settings.groqApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      temperature: 0,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!response.ok) {
    return parseError(response);
  }
  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const label = data.choices?.[0]?.message?.content?.trim().toLowerCase() ?? "general";
  const valid = new Set(["sales call", "interview", "brainstorm", "1:1", "lecture", "general"]);
  return valid.has(label) ? label : "general";
}
