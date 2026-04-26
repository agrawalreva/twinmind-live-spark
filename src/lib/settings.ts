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

export const DEFAULT_SUGGESTION_PROMPT = `You are an AI meeting copilot. Analyze the conversation transcript and generate exactly 3 suggestions to help the user right now.
Meeting type: {{meetingType}}
Previous suggestions already shown (do not repeat these): {{previousSuggestions}}
Transcript (most recent first):
{{transcript}}
Rules:

Reason about the conversation state before choosing suggestion types
If a question was just asked -> at least one suggestion should be type "Answer"
If a factual claim was made -> consider a "Fact check"
If the topic is shifting -> include a "Talking point"
If something is ambiguous -> use "Clarify"
If it is a good moment to ask something -> use "Ask this"
Each suggestion must be genuinely useful RIGHT NOW, not generic
Never repeat a previous suggestion
The preview alone should deliver value even without clicking

Respond with a JSON array of exactly 3 objects:
[
{
"type": "Ask this" | "Fact check" | "Talking point" | "Clarify" | "Answer",
"title": "short compelling title under 10 words",
"preview": "2 sentence preview that already delivers value",
"fullContext": "3-5 sentences with full detail for when user clicks"
}
]
Respond with JSON only. No markdown, no explanation.`;

export const DEFAULT_CLICK_EXPAND_PROMPT = `You are an AI meeting copilot. The user clicked on a suggestion during a live meeting. Give a detailed, immediately useful answer.
Meeting type: {{meetingType}}
Suggestion clicked: {{suggestionTitle}}
Suggestion preview: {{suggestionPreview}}
Full transcript context:
{{transcript}}
Give a thorough 3-5 paragraph response that the user can act on immediately. Be specific to what was said in the transcript. Do not be generic.`;

export const DEFAULT_CHAT_PROMPT = `You are an AI meeting copilot embedded in a live meeting. Answer the user's question using the transcript as context. Be concise, specific, and immediately useful.
Meeting type: {{meetingType}}
Transcript:
{{transcript}}
Keep responses under 150 words. Be direct.`;

export const DEFAULT_SETTINGS: Settings = {
  groqApiKey: "",
  suggestionPrompt: DEFAULT_SUGGESTION_PROMPT,
  chatPrompt: DEFAULT_CHAT_PROMPT,
  clickExpandPrompt: DEFAULT_CLICK_EXPAND_PROMPT,
  suggestionContextWindow: 2000,
  chatContextWindow: 6000,
};

export const SETTINGS_STORAGE_KEY = "twinmind-live-settings";
