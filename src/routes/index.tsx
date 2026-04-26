import { createFileRoute } from "@tanstack/react-router";
import {
  Mic,
  RefreshCw,
  Send,
  Settings as SettingsIcon,
  Download,
  ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "TwinMind Live Suggestions" },
      {
        name: "description",
        content:
          "Live transcription, AI suggestions, and chat in a premium real-time conversation workspace.",
      },
    ],
  }),
});

type BadgeType = "ask" | "fact" | "talk" | "clarify" | "answer";

const badgeStyles: Record<BadgeType, { label: string; cls: string }> = {
  ask:     { label: "Ask this",      cls: "bg-badge-ask text-badge-ask-fg" },
  fact:    { label: "Fact check",    cls: "bg-badge-fact text-badge-fact-fg" },
  talk:    { label: "Talking point", cls: "bg-badge-talk text-badge-talk-fg" },
  clarify: { label: "Clarify",       cls: "bg-badge-clarify text-badge-clarify-fg" },
  answer:  { label: "Answer",        cls: "bg-badge-answer text-badge-answer-fg" },
};

type Suggestion = { type: BadgeType; title: string; preview: string };

const batch1: Suggestion[] = [
  { type: "ask",  title: "What's their current MRR growth rate?",
    preview: "Anchors the conversation in concrete metrics before discussing pricing tiers." },
  { type: "fact", title: "Verify the 2024 SaaS churn benchmark",
    preview: "The 5.6% figure mentioned may be outdated. Recent reports suggest a higher median." },
  { type: "talk", title: "Mention the new enterprise SSO rollout",
    preview: "Aligns directly with the security concerns the prospect raised earlier in the call." },
];

const batch2: Suggestion[] = [
  { type: "clarify", title: "Clarify the integration timeline",
    preview: "Their team seems unsure whether onboarding includes data migration support." },
  { type: "answer",  title: "Yes, annual plans include a 15% discount",
    preview: "Combined with quarterly business reviews and priority support on the Growth tier." },
  { type: "ask",     title: "Who else is involved in this decision?",
    preview: "Identifying additional stakeholders early helps tailor the next demo session." },
];

function Index() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <TopBar />
      <main className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-3">
        <TranscriptColumn />
        <SuggestionsColumn />
        <ChatColumn />
      </main>
    </div>
  );
}

function TopBar() {
  return (
    <header
      className="flex h-12 shrink-0 items-center justify-between border-b px-4"
      style={{ backgroundColor: "var(--primary-deep)", borderColor: "var(--primary-deep)" }}
    >
      <div className="flex items-center text-[15px] font-semibold tracking-tight text-white">
        <span>twin</span>
        <span style={{ color: "var(--accent)" }}>mind</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md border border-white/40 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/10"
        >
          <SettingsIcon className="h-3.5 w-3.5" />
          Settings
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--accent)" }}
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </button>
      </div>
    </header>
  );
}

function TranscriptColumn() {
  return (
    <section className="flex h-full min-h-0 flex-col border-r" style={{ borderColor: "var(--divider)" }}>
      <div className="px-6 pt-6 pb-3">
        <h1 className="text-base font-semibold text-primary">Transcript</h1>
        <p className="text-xs text-muted-foreground">Live audio transcription</p>
      </div>

      <div className="flex justify-center pt-4 pb-6">
        <div className="relative h-20 w-20">
          <span className="sonar-ring" />
          <span className="sonar-ring delay-1" />
          <span className="sonar-ring delay-2" />
          <button
            type="button"
            className="relative flex h-20 w-20 items-center justify-center rounded-full text-white shadow-card transition-transform hover:scale-105"
            style={{ backgroundColor: "var(--accent)" }}
            aria-label="Toggle recording"
          >
            <Mic className="h-7 w-7" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6">
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>This is where your live transcript will appear as you speak…</p>
          <p>
            Audio is being captured and converted in real time. Segments will stream
            into this panel sentence by sentence.
          </p>
          <p>Speakers will be labeled automatically once the conversation begins.</p>
        </div>
      </div>

      <div
        className="flex items-center justify-center gap-2 border-t px-6 py-3"
        style={{ borderColor: "var(--divider)" }}
      >
        <span className="rec-dot" />
        <span className="text-xs font-medium text-foreground/80">Recording…</span>
      </div>
    </section>
  );
}

function SuggestionsColumn() {
  return (
    <section className="flex h-full min-h-0 flex-col border-r" style={{ borderColor: "var(--divider)" }}>
      <div className="flex items-start justify-between px-6 pt-6 pb-4">
        <div>
          <h2 className="text-base font-semibold text-primary">Live Suggestions</h2>
          <p className="text-xs text-muted-foreground">AI-generated cues from your conversation</p>
        </div>

        <div className="progress-ring" aria-label="Refresh in 75%">
          <button type="button" className="text-primary transition-colors hover:text-accent">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-6">
        <SuggestionBatch label="Just now" items={batch1} />
        <SuggestionBatch label="2 min ago" items={batch2} />
      </div>
    </section>
  );
}

function SuggestionBatch({ label, items }: { label: string; items: Suggestion[] }) {
  return (
    <div>
      <div className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="space-y-2.5">
        {items.map((s, i) => (
          <SuggestionCard key={i} suggestion={s} />
        ))}
      </div>
    </div>
  );
}

function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  const badge = badgeStyles[suggestion.type];
  return (
    <button
      type="button"
      className="suggestion-card group flex w-full items-start gap-3 rounded-xl border bg-card p-3.5 text-left shadow-card"
    >
      <div className="min-w-0 flex-1">
        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}>
          {badge.label}
        </span>
        <h3 className="mt-2 truncate text-sm font-semibold text-foreground">{suggestion.title}</h3>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {suggestion.preview}
        </p>
      </div>
      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-accent" />
    </button>
  );
}

function ChatColumn() {
  return (
    <section className="flex h-full min-h-0 flex-col">
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-base font-semibold text-primary">Ask Anything</h2>
        <p className="text-xs text-muted-foreground">Follow-up questions, instantly answered</p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-6">
        <div className="flex justify-end">
          <div
            className="max-w-[85%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm text-white shadow-card"
            style={{ backgroundColor: "var(--accent)" }}
          >
            What pricing tier should I recommend for a 50-seat team?
          </div>
        </div>

        <div className="flex justify-start">
          <div
            className="max-w-[85%] rounded-2xl rounded-bl-sm border border-primary/30 bg-card px-4 py-2.5 text-sm leading-relaxed shadow-card"
            style={{ color: "#374151" }}
          >
            <p>For a team of that size, the Growth plan typically offers the best value.</p>
            <p className="mt-1.5">It includes priority support, advanced analytics, and unlimited integrations.</p>
            <p className="mt-1.5">You may also bundle annual billing for a 15% discount on the total contract.</p>
          </div>
        </div>
      </div>

      <div className="border-t px-6 py-3" style={{ borderColor: "var(--divider)" }}>
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span>Typing</span>
          <span className="flex items-center gap-1">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border bg-card p-1.5 shadow-card">
          <input
            type="text"
            placeholder="Ask a follow-up or click a suggestion..."
            className="flex-1 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--primary)" }}
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
