export type SuggestionType =
  | "Ask this"
  | "Fact check"
  | "Talking point"
  | "Clarify"
  | "Answer";

export type Suggestion = {
  id: string;
  type: SuggestionType;
  title: string;
  preview: string;
  fullContext: string;
};

export type SuggestionBatch = {
  timestamp: Date;
  suggestions: Suggestion[];
  isRetrying?: boolean;
};

export type ChatRole = "user" | "assistant";

export type Message = {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: Date;
};

export type Settings = {
  groqApiKey: string;
  suggestionPrompt: string;
  chatPrompt: string;
  clickExpandPrompt: string;
  suggestionContextWindow: number;
  chatContextWindow: number;
};

export const DEFAULT_SUGGESTION_PROMPT = `You are an expert meeting copilot. Surface the 3 most useful things the user could say or know RIGHT NOW based on the transcript.

Meeting type: {{meetingType}}
Already shown - never repeat these: {{previousSuggestions}}

Recent transcript:
{{transcript}}

STRICT RULES:
- Every suggestion must reference specific words, names, numbers or claims from the transcript. Never be generic.
- If a question was just asked -> answer it directly
- If a factual claim was made -> fact check that exact claim
- If a topic just shifted -> give sharpest talking point on it
- If something is ambiguous -> clarify that exact thing
- Preview must deliver standalone value, not just tease a click

BAD: "Ask about their goals"
GOOD: "Ask why the 15-mile trail matters for seasonal access given the creek flooding patterns just mentioned"

Return JSON only. No markdown. Array of exactly 3:
[{
  "type": "Ask this"|"Fact check"|"Talking point"|"Clarify"|"Answer",
  "title": "under 8 words, specific to transcript",
  "preview": "2 sentences of specific standalone value",
  "fullContext": "3-5 sentences of immediately actionable detail"
}]`;

export const DEFAULT_CLICK_EXPAND_PROMPT = `You are an AI meeting copilot. The user clicked on a suggestion during a live meeting. Give a detailed, immediately useful answer.
Meeting type: {{meetingType}}
Suggestion clicked: {{suggestionTitle}}
Suggestion preview: {{suggestionPreview}}
Full transcript context:
{{transcript}}
Give a thorough 3-5 paragraph response that the user can act on immediately. Be specific to what was said in the transcript. Do not be generic.
Use bullet points for any list of 3 or more items. Otherwise write in clean short paragraphs. Be specific to what was said. Keep under 200 words.`;

export const DEFAULT_CHAT_PROMPT = `You are an AI meeting copilot embedded in a live meeting. Answer the user's question using the transcript as context. Be concise, specific, and immediately useful.
Meeting type: {{meetingType}}
Transcript:
{{transcript}}
Format as clean prose. No bold text. Maximum 3 short paragraphs. Be specific to the transcript. Keep under 150 words.`;

export const DEFAULT_SETTINGS: Settings = {
  groqApiKey: "",
  suggestionPrompt: DEFAULT_SUGGESTION_PROMPT,
  chatPrompt: DEFAULT_CHAT_PROMPT,
  clickExpandPrompt: DEFAULT_CLICK_EXPAND_PROMPT,
  suggestionContextWindow: 2000,
  chatContextWindow: 6000,
};

export const SETTINGS_STORAGE_KEY = "twinmind-live-settings";
