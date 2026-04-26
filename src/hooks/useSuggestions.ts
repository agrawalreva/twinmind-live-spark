import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { detectMeetingType, generateSuggestions } from "@/lib/groq";
import { type Settings, type SuggestionBatch } from "@/lib/settings";

type UseSuggestionsArgs = {
  transcript: Array<{ text: string; timestamp: Date }>;
  isRecording: boolean;
  settings: Settings;
  onRefreshed?: () => void;
};

type UseSuggestionsResult = {
  suggestionBatches: SuggestionBatch[];
  refresh: () => Promise<void>;
  isLoading: boolean;
  meetingType: string;
};

const REFRESH_INTERVAL_MS = 30_000;
const DETECT_AFTER_MS = 60_000;

export function useSuggestions({
  transcript,
  isRecording,
  settings,
  onRefreshed,
}: UseSuggestionsArgs): UseSuggestionsResult {
  const [suggestionBatches, setSuggestionBatches] = useState<SuggestionBatch[]>([]);
  const [previousSuggestions, setPreviousSuggestions] = useState<string[]>([]);
  const [meetingType, setMeetingType] = useState("general");
  const [isLoading, setIsLoading] = useState(false);
  const recordingStartedAtRef = useRef<number | null>(null);
  const detectedRef = useRef(false);
  const transcriptRef = useRef(transcript);
  const isRecordingRef = useRef(isRecording);
  const settingsRef = useRef(settings);
  const previousSuggestionsRef = useRef<string[]>([]);
  const meetingTypeRef = useRef(meetingType);
  const onRefreshedRef = useRef(onRefreshed);

  const transcriptText = useMemo(() => transcript.map((entry) => entry.text).join("\n"), [transcript]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    previousSuggestionsRef.current = previousSuggestions;
  }, [previousSuggestions]);

  useEffect(() => {
    meetingTypeRef.current = meetingType;
  }, [meetingType]);

  useEffect(() => {
    onRefreshedRef.current = onRefreshed;
  }, [onRefreshed]);

  const generateAndStoreSuggestions = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setIsLoading(true);
    try {
      console.log("Generating suggestions for transcript:", text.slice(0, 100));
      const suggestions = await generateSuggestions(
        text,
        previousSuggestionsRef.current,
        meetingTypeRef.current,
        settingsRef.current,
      );
      console.log("Suggestions received:", suggestions);
      setSuggestionBatches((prev) => [{ timestamp: new Date(), suggestions }, ...prev]);
      setPreviousSuggestions((prev) => {
        const next = [...prev, ...suggestions.map((s) => s.title)];
        previousSuggestionsRef.current = next;
        return next;
      });
    } catch (err) {
      console.error("Suggestion generation failed:", err);
      setSuggestionBatches((prev) =>
        prev.length > 0
          ? [{ ...prev[0], isRetrying: true }, ...prev.slice(1)]
          : prev,
      );
      toast.error("Suggestion refresh failed. Retrying...");
    } finally {
      setIsLoading(false);
      onRefreshedRef.current?.();
    }
  }, []);

  const refresh = useCallback(async () => {
    await generateAndStoreSuggestions(transcriptText);
  }, [generateAndStoreSuggestions, transcriptText]);

  useEffect(() => {
    if (isRecording && !recordingStartedAtRef.current) {
      recordingStartedAtRef.current = Date.now();
    }
    if (!isRecording) {
      recordingStartedAtRef.current = null;
      detectedRef.current = false;
    }
  }, [isRecording]);

  useEffect(() => {
    if (!isRecording) return;
    console.log("Suggestions interval started");
    const id = window.setInterval(() => {
      console.log(
        "Interval tick, isRecording:",
        isRecordingRef.current,
        "transcript entries:",
        transcriptRef.current.length,
      );
      if (!isRecordingRef.current) return;
      const intervalTranscriptText = transcriptRef.current
        .map((entry) => entry.text)
        .join("\n")
        .slice(-settingsRef.current.suggestionContextWindow);
      console.log("Suggestion interval fired, transcript length:", transcriptRef.current.length);
      void generateAndStoreSuggestions(intervalTranscriptText);
    }, REFRESH_INTERVAL_MS);
    return () => {
      console.log("Suggestions interval cleared");
      window.clearInterval(id);
    };
  }, [isRecording, generateAndStoreSuggestions]);

  useEffect(() => {
    if (!isRecording || detectedRef.current || !recordingStartedAtRef.current) return;
    if (Date.now() - recordingStartedAtRef.current < DETECT_AFTER_MS) return;
    detectedRef.current = true;
    void detectMeetingType(transcriptText, settings)
      .then(setMeetingType)
      .catch(() => {
        toast.error("Could not detect meeting type. Using general.");
      });
  }, [isRecording, settings, transcriptText]);

  return { suggestionBatches, refresh, isLoading, meetingType };
}
