import { useCallback, useEffect, useRef, useState } from "react";
import { transcribeGrocery } from "../services/scanApi";

export type GroceryVoiceError =
  | "unsupported"
  | "insecure"
  | "unavailable"
  | "server-offline"
  | "mic-denied"
  | "no-speech"
  | "failed";

const RECORDING_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/aac",
  "audio/ogg;codecs=opus",
];

const MAX_RECORDING_MS = 8_000;

function pickRecordingMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return RECORDING_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const [, base64 = ""] = result.split(",");
      if (!base64) {
        reject(new Error("Could not read recording"));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Could not read recording"));
    reader.readAsDataURL(blob);
  });
}

function mapTranscribeError(err: unknown): GroceryVoiceError {
  const message = err instanceof Error ? err.message.toLowerCase() : "";

  if (message.includes("server_offline") || message.includes("failed to fetch")) {
    return "server-offline";
  }
  if (
    message.includes("gemini_api_key") ||
    message.includes("transcription unavailable") ||
    message.includes("gemini api key")
  ) {
    return "unavailable";
  }
  if (message.includes("could not understand")) {
    return "no-speech";
  }
  return "failed";
}

export function useGroceryVoice(onTranscript: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState<GroceryVoiceError | null>(null);

  const onTranscriptRef = useRef(onTranscript);
  const sessionRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef("audio/webm");
  const stopTimerRef = useRef<number | null>(null);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" &&
        window.isSecureContext &&
        Boolean(navigator.mediaDevices?.getUserMedia) &&
        typeof MediaRecorder !== "undefined" &&
        Boolean(pickRecordingMimeType()),
    );
  }, []);

  const clearStopTimer = useCallback(() => {
    if (stopTimerRef.current !== null) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
  }, []);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const resetRecorder = useCallback(() => {
    clearStopTimer();
    recorderRef.current = null;
    chunksRef.current = [];
    releaseStream();
  }, [clearStopTimer, releaseStream]);

  const transcribeRecording = useCallback(async (session: number, blob: Blob) => {
    if (session !== sessionRef.current) return;

    if (blob.size < 800) {
      setError("no-speech");
      setProcessing(false);
      return;
    }

    try {
      const audioBase64 = await blobToBase64(blob);
      if (session !== sessionRef.current) return;

      const { text } = await transcribeGrocery(audioBase64, mimeTypeRef.current);
      if (session !== sessionRef.current) return;

      const cleaned = text.trim();
      if (!cleaned) {
        setError("no-speech");
        return;
      }

      onTranscriptRef.current(cleaned);
      setError(null);
    } catch (err) {
      if (session !== sessionRef.current) return;
      setError(mapTranscribeError(err));
    } finally {
      if (session === sessionRef.current) {
        setProcessing(false);
      }
    }
  }, []);

  const finishRecording = useCallback(
    async (session: number) => {
      if (session !== sessionRef.current) return;

      clearStopTimer();
      const recorder = recorderRef.current;
      recorderRef.current = null;
      releaseStream();

      if (!recorder || recorder.state === "inactive") {
        setListening(false);
        setProcessing(false);
        return;
      }

      setListening(false);
      setProcessing(true);

      const blob = await new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          resolve(new Blob(chunksRef.current, { type: mimeTypeRef.current }));
        };
        recorder.stop();
      });

      chunksRef.current = [];
      await transcribeRecording(session, blob);
    },
    [clearStopTimer, releaseStream, transcribeRecording],
  );

  const stop = useCallback(() => {
    void finishRecording(sessionRef.current);
  }, [finishRecording]);

  const start = useCallback(async () => {
    if (!window.isSecureContext) {
      setError("insecure");
      return;
    }

    const mimeType = pickRecordingMimeType();
    if (!mimeType || typeof MediaRecorder === "undefined") {
      setError("unsupported");
      return;
    }

    const session = sessionRef.current + 1;
    sessionRef.current = session;
    setError(null);
    resetRecorder();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      if (session !== sessionRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      mimeTypeRef.current = mimeType.split(";")[0] ?? mimeType;

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onerror = () => {
        if (session !== sessionRef.current) return;
        setError("failed");
        setListening(false);
        setProcessing(false);
        resetRecorder();
      };

      recorderRef.current = recorder;
      recorder.start(250);
      setListening(true);

      stopTimerRef.current = window.setTimeout(() => {
        void finishRecording(session);
      }, MAX_RECORDING_MS);
    } catch {
      if (session !== sessionRef.current) return;
      setError("mic-denied");
      setListening(false);
      setProcessing(false);
      resetRecorder();
    }
  }, [finishRecording, resetRecorder]);

  const toggle = useCallback(() => {
    if (processing) return;
    if (listening) stop();
    else void start();
  }, [listening, processing, start, stop]);

  useEffect(
    () => () => {
      sessionRef.current += 1;
      resetRecorder();
      setListening(false);
      setProcessing(false);
    },
    [resetRecorder],
  );

  return { listening, processing, supported, error, start, stop, toggle };
}
