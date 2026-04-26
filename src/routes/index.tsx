import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ChatColumn } from "@/components/meeting/ChatColumn";
import { SuggestionsColumn } from "@/components/meeting/SuggestionsColumn";
import { TopBar } from "@/components/meeting/TopBar";
import { TranscriptColumn } from "@/components/meeting/TranscriptColumn";
import { SettingsModal } from "@/components/SettingsModal";
import { SettingsProvider, useSettings } from "@/context/SettingsContext";
import { useAudioCapture } from "@/hooks/useAudioCapture";
import { useSuggestions } from "@/hooks/useSuggestions";
import { streamChatResponse } from "@/lib/groq";
import { downloadSessionTxt } from "@/lib/sessionExport";
import { type Message, type Suggestion } from "@/lib/settings";

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

function Index() {
  return (
    <SettingsProvider>
      <MeetingWorkspace />
    </SettingsProvider>
  );
}

function MeetingWorkspace() {
  const { settings } = useSettings();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const sessionStartRef = useRef(new Date());
  const transcriptHistoryRef = useRef<Array<{ text: string; timestamp: Date }>>([]);
  const { isRecording, isTranscribing, transcript, startRecording, stopRecording } = useAudioCapture({
    apiKey: settings.groqApiKey,
  });
  const { suggestionBatches, refresh, isLoading, meetingType } = useSuggestions({
    transcript,
    isRecording,
    settings,
    onRefreshed: () => setRefreshKey((v) => v + 1),
  });
  useEffect(() => {
    transcriptHistoryRef.current = transcript;
  }, [transcript]);
  const transcriptText = useMemo(() => transcript.map((entry) => entry.text).join("\n"), [transcript]);

  const streamAssistant = async (nextMessages: Message[], systemPromptOverride?: string) => {
    const assistantId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "", timestamp: new Date() }]);
    setIsStreaming(true);
    await streamChatResponse(nextMessages, transcriptText, meetingType, settings, (chunk) => {
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m)));
    }, systemPromptOverride);
    setIsStreaming(false);
  };

  const sendUserMessage = async (text: string, systemPromptOverride?: string) => {
    if (!text.trim()) return;
    if (!settings.groqApiKey.trim()) return void toast.error("Please add your Groq API key in Settings");
    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: text, timestamp: new Date() };
    const next = [...messages, userMessage];
    setMessages(next);
    setInput("");
    try {
      await streamAssistant(next, systemPromptOverride);
    } catch {
      setIsStreaming(false);
    }
  };

  const onSuggestionClick = async (suggestion: Suggestion) => {
    const clickPrompt = settings.clickExpandPrompt
      .replace("{{meetingType}}", meetingType)
      .replace("{{suggestionTitle}}", suggestion.title)
      .replace("{{suggestionPreview}}", suggestion.preview)
      .replace("{{transcript}}", transcriptText);
    await sendUserMessage(suggestion.title, clickPrompt);
  };

  const toggleRecording = () => {
    if (!settings.groqApiKey.trim()) {
      toast.error("Please add your Groq API key in Settings");
      return;
    }
    if (isRecording) stopRecording();
    else void startRecording();
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      {!settings.groqApiKey.trim() && (
        <div className="border-b bg-muted px-4 py-2 text-xs">Add your Groq API key in Settings to get started</div>
      )}
      <TopBar
        onOpenSettings={() => setSettingsOpen(true)}
        onExport={() =>
          downloadSessionTxt({
            sessionStart: sessionStartRef.current,
            transcript: transcriptHistoryRef.current,
            suggestionBatches,
            messages,
            meetingType,
          })
        }
      />
      <main className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-3">
        <TranscriptColumn
          isRecording={isRecording}
          isTranscribing={isTranscribing}
          transcript={transcript}
          onToggleRecording={toggleRecording}
        />
        <SuggestionsColumn
          meetingType={meetingType}
          suggestionBatches={suggestionBatches}
          isLoading={isLoading}
          refreshKey={refreshKey}
          onRefresh={() => void refresh()}
          onClickSuggestion={(s) => void onSuggestionClick(s)}
        />
        <ChatColumn
          messages={messages}
          input={input}
          isStreaming={isStreaming}
          onInputChange={setInput}
          onSend={() => void sendUserMessage(input)}
        />
      </main>
      <SettingsModal open={isSettingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
