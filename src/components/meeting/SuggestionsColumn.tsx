import { ChevronRight, RefreshCw } from "lucide-react";
import { type Suggestion, type SuggestionBatch } from "@/lib/settings";

const badgeStyles: Record<Suggestion["type"], { label: string; cls: string }> = {
  "Ask this": { label: "Ask this", cls: "bg-badge-ask text-badge-ask-fg" },
  "Fact check": { label: "Fact check", cls: "bg-badge-fact text-badge-fact-fg" },
  "Talking point": { label: "Talking point", cls: "bg-badge-talk text-badge-talk-fg" },
  Clarify: { label: "Clarify", cls: "bg-badge-clarify text-badge-clarify-fg" },
  Answer: { label: "Answer", cls: "bg-badge-answer text-badge-answer-fg" },
};

type Props = {
  meetingType: string;
  suggestionBatches: SuggestionBatch[];
  isLoading: boolean;
  refreshKey: number;
  onRefresh: () => void;
  onClickSuggestion: (suggestion: Suggestion) => void;
};

export function SuggestionsColumn({
  meetingType,
  suggestionBatches,
  isLoading,
  refreshKey,
  onRefresh,
  onClickSuggestion,
}: Props) {
  return (
    <section className="flex h-full min-h-0 flex-col border-r" style={{ borderColor: "var(--divider)" }}>
      <div className="flex items-start justify-between px-6 pt-6 pb-4">
        <div>
          <h2 className="text-base font-semibold text-primary">Live Suggestions</h2>
          <p className="text-xs text-muted-foreground">AI-generated cues from your conversation</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Type: {meetingType}</p>
        </div>
        <div key={refreshKey} className="progress-ring progress-ring-animate" aria-label="Refresh in 30s">
          <button type="button" onClick={onRefresh} className="text-primary transition-colors hover:text-accent">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-6">
        {suggestionBatches.map((batch) => (
          <div key={batch.timestamp.toISOString()}>
            <div className="mb-2 flex items-center gap-2 px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <span>{batch.timestamp.toLocaleTimeString()}</span>
              {batch.isRetrying && <span className="rounded bg-muted px-1.5 py-0.5">Retrying...</span>}
            </div>
            <div className="space-y-2.5">
              {batch.suggestions.map((s) => (
                <SuggestionCard key={s.id} suggestion={s} onClick={() => onClickSuggestion(s)} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SuggestionCard({ suggestion, onClick }: { suggestion: Suggestion; onClick: () => void }) {
  const badge = badgeStyles[suggestion.type];
  return (
    <button
      type="button"
      onClick={onClick}
      className="suggestion-card group flex w-full items-start gap-3 rounded-xl border bg-card p-3.5 text-left shadow-card"
    >
      <div className="min-w-0 flex-1">
        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}>
          {badge.label}
        </span>
        <h3 className="mt-2 truncate text-sm font-semibold text-foreground">{suggestion.title}</h3>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{suggestion.preview}</p>
      </div>
      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-accent" />
    </button>
  );
}
