import { type Message, type SuggestionBatch } from "@/lib/settings";

type TranscriptEntry = {
  text: string;
  timestamp: Date;
};

type ExportArgs = {
  sessionStart: Date;
  transcript: TranscriptEntry[];
  suggestionBatches: SuggestionBatch[];
  messages: Message[];
  meetingType: string;
};

function fmt(date: Date) {
  return date.toLocaleString();
}

export function downloadSessionTxt({
  sessionStart,
  transcript,
  suggestionBatches,
  messages,
  meetingType,
}: ExportArgs) {
  const chunks: string[] = [];
  chunks.push(`Session start time: ${fmt(sessionStart)}`);
  chunks.push(`Meeting type detected: ${meetingType}`);
  chunks.push("");
  chunks.push("Transcript:");
  transcript.forEach((entry) => {
    chunks.push(`[${fmt(entry.timestamp)}] ${entry.text}`);
  });
  chunks.push("");
  chunks.push("Suggestion batches:");
  suggestionBatches.forEach((batch) => {
    chunks.push(`- ${fmt(batch.timestamp)}`);
    batch.suggestions.forEach((s, i) => {
      chunks.push(`  ${i + 1}. [${s.type}] ${s.title}`);
      chunks.push(`     Preview: ${s.preview}`);
      chunks.push(`     Full: ${s.fullContext}`);
    });
  });
  chunks.push("");
  chunks.push("Chat history:");
  messages.forEach((m) => {
    chunks.push(`[${fmt(m.timestamp)}] ${m.role}: ${m.content}`);
  });
  const blob = new Blob([chunks.join("\n")], { type: "text/plain" });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = `twinmind-session-${Date.now()}.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
}
