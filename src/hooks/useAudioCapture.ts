import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { transcribeAudio } from "@/lib/groq";

type UseAudioCaptureArgs = {
  apiKey: string;
};

type UseAudioCaptureResult = {
  isRecording: boolean;
  isTranscribing: boolean;
  transcript: Array<{ text: string; timestamp: Date }>;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
};

function extractNewText(fullText: string, previousText: string): string {
  if (!previousText) return fullText;
  const overlapIndex = fullText.indexOf(previousText.slice(-100));
  if (overlapIndex === -1) {
    const breakPoint = fullText.search(/[.!?]\s/);
    return breakPoint > 0 ? fullText.slice(breakPoint + 2) : fullText;
  }
  const rawNew = fullText.slice(
    overlapIndex + previousText.slice(-100).length,
  ).trim();
  const firstCap = rawNew.search(/[A-Z]/);
  return firstCap > 0 ? rawNew.slice(firstCap) : rawNew;
}

export function useAudioCapture({ apiKey }: UseAudioCaptureArgs): UseAudioCaptureResult {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<Array<{ text: string; timestamp: Date }>>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const lastTranscriptRef = useRef("");
  const isProcessingRef = useRef(false);

  const processAccumulatedAudio = useCallback(async () => {
    if (!chunksRef.current.length || isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsTranscribing(true);
    const audioType = chunksRef.current[0]?.type || "audio/webm";
    const fullBlob = new Blob(chunksRef.current, { type: audioType });
    try {
      const fullText = (await transcribeAudio(fullBlob, apiKey)).trim();
      if (!fullText) return;
      if (!lastTranscriptRef.current) {
        setTranscript((prev) => [...prev, { text: fullText, timestamp: new Date() }]);
        lastTranscriptRef.current = fullText;
        return;
      }
      const newText = extractNewText(fullText, lastTranscriptRef.current).trim();
      if (newText.length > 20) {
        setTranscript((prev) => [...prev, { text: newText, timestamp: new Date() }]);
        lastTranscriptRef.current = fullText;
      } else {
        lastTranscriptRef.current = fullText;
      }
    } catch (err) {
      console.error("Transcription failed:", err);
    } finally {
      setIsTranscribing(false);
      isProcessingRef.current = false;
    }
  }, [apiKey]);

  const startRecording = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (!window.MediaRecorder || !window.navigator?.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm"
            : "";
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      lastTranscriptRef.current = "";
      recorder.addEventListener("dataavailable", (event) => {
        if (!event.data.size) return;
        chunksRef.current.push(event.data);
      });
      recorder.addEventListener("stop", () => {
        void processAccumulatedAudio();
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        mediaRecorderRef.current = null;
        setIsRecording(false);
      });
      recorder.start(5_000);
      setIsRecording(true);
    } catch {
      toast.error("Microphone permission was denied. Please enable microphone access.");
    }
  }, [processAccumulatedAudio]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.requestData();
      mediaRecorderRef.current.stop();
      return;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    setIsRecording(false);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isRecording) return;
    const transcribeTimer = window.setInterval(() => {
      void processAccumulatedAudio();
    }, 15_000);
    return () => window.clearInterval(transcribeTimer);
  }, [isRecording, processAccumulatedAudio]);

  useEffect(() => () => stopRecording(), [stopRecording]);

  return {
    isRecording,
    isTranscribing,
    transcript,
    startRecording,
    stopRecording,
  };
}
