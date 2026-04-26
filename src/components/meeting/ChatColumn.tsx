import { Send } from "lucide-react";
import { useEffect, useRef } from "react";
import { type Message } from "@/lib/settings";

type Props = {
  messages: Message[];
  input: string;
  isStreaming: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
};

export function ChatColumn({ messages, input, isStreaming, onInputChange, onSend }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isStreaming]);

  return (
    <section className="flex h-full min-h-0 flex-col">
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-base font-semibold text-primary">Ask Anything</h2>
        <p className="text-xs text-muted-foreground">Follow-up questions, instantly answered</p>
      </div>
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-6">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={
                message.role === "user"
                  ? "max-w-[85%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm text-white shadow-card"
                  : "max-w-[85%] rounded-2xl rounded-bl-sm border border-primary/30 bg-card px-4 py-2.5 text-sm leading-relaxed shadow-card"
              }
              style={message.role === "user" ? { backgroundColor: "var(--accent)" } : { color: "#374151" }}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t px-6 py-3" style={{ borderColor: "var(--divider)" }}>
        {isStreaming && (
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span>Typing</span>
            <span className="flex items-center gap-1">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 rounded-xl border bg-card p-1.5 shadow-card">
          <input
            type="text"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSend()}
            placeholder="Ask a follow-up or click a suggestion..."
            className="flex-1 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            type="button"
            onClick={onSend}
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
