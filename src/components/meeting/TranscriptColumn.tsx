import { Mic } from "lucide-react";
import { useEffect, useRef } from "react";

type Props = {
  isRecording: boolean;
  isTranscribing: boolean;
  transcript: Array<{ text: string; timestamp: Date }>;
  onToggleRecording: () => void;
};

export function TranscriptColumn({ isRecording, isTranscribing, transcript, onToggleRecording }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [transcript]);

  return (
    <section className="flex h-full min-h-0 flex-col border-r" style={{ borderColor: "var(--divider)" }}>
      <div className="px-6 pt-6 pb-3">
        <h1 className="text-base font-semibold text-primary">Transcript</h1>
        <p className="text-xs text-muted-foreground">Live audio transcription</p>
      </div>
      <div className="flex justify-center pt-4 pb-6">
        <div className="relative h-20 w-20">
          {isRecording && (
            <>
              <span className="sonar-ring" />
              <span className="sonar-ring delay-1" />
              <span className="sonar-ring delay-2" />
            </>
          )}
          <button
            type="button"
            onClick={onToggleRecording}
            className="relative flex h-20 w-20 items-center justify-center rounded-full text-white shadow-card transition-transform hover:scale-105"
            style={{ backgroundColor: "var(--accent)" }}
            aria-label="Toggle recording"
          >
            <Mic className="h-7 w-7" />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6">
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          {transcript.length === 0 ? (
            <p>This is where your live transcript will appear as you speak…</p>
          ) : (
            transcript.map((item, i) => <p key={`${item.timestamp.toISOString()}-${i}`}>{item.text}</p>)
          )}
          {isTranscribing && <p className="animate-pulse">Transcribing...</p>}
        </div>
      </div>
      <div
        className="flex items-center justify-center gap-2 border-t px-6 py-3"
        style={{ borderColor: "var(--divider)" }}
      >
        {isRecording && <span className="rec-dot" />}
        <span className="text-xs font-medium text-foreground/80">
          {isRecording ? "Recording…" : "Recorder idle"}
        </span>
      </div>
    </section>
  );
}
