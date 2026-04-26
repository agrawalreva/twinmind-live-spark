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
    console.log("Sending to Whisper, blob size:", fullBlob.size);
    try {
      const fullText = (await transcribeAudio(fullBlob, apiKey)).trim();
      console.log("Transcript received:", fullText);
      if (!fullText) return;
      if (!lastTranscriptRef.current) {
        console.log("Setting transcript:", fullText);
        setTranscript((prev) => [...prev, { text: fullText, timestamp: new Date() }]);
        lastTranscriptRef.current = fullText;
        return;
      }
      const newText = fullText.slice(lastTranscriptRef.current.length).trim();
      if (newText.length > 20) {
        const sentenceEnd = newText.search(/[.!?][^.!?]*$/);
        const cleanText = sentenceEnd > 20
          ? newText.slice(0, sentenceEnd + 1).trim()
          : newText;
        console.log("Setting transcript:", cleanText);
        setTranscript((prev) => [...prev, { text: cleanText, timestamp: new Date() }]);
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
    console.log("startRecording called");
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
      console.log("MediaRecorder created with mimeType:", mimeType);
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      lastTranscriptRef.current = "";
      recorder.addEventListener("dataavailable", (event) => {
        console.log("Audio chunk received, size:", event.data.size);
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
