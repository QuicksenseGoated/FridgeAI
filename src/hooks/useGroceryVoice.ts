import { useCallback, useEffect, useRef, useState } from "react";
import { transcribeGrocery } from "../services/scanApi";

export type GroceryVoiceError =
  | "unsupported"
  | "insecure"
  | "mic-denied"
  | "no-speech"
  | "network"
  | "server-offline"
  | "failed";

type VoiceMode = "speech" | "recording";

const RECORDING_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/aac",
  "audio/ogg;codecs=opus",
];

const MAX_LISTEN_MS = 45_000;
const MAX_SPEECH_RETRIES = 4;
const STOP_WAIT_MS = 1_500;

function getSpeechRecognitionCtor(): (typeof SpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

function pickRecordingMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return RECORDING_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}

function isAppleDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function pickSpeechLang(): string {
  if (typeof navigator === "undefined") return "en-US";
  const lang = navigator.language?.trim();
  if (!lang) return "en-US";
  if (lang.startsWith("en")) return lang;
  return lang;
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
  if (message.includes("could not understand")) {
    return "no-speech";
  }
  return "failed";
}

async function unlockMicrophone(): Promise<boolean> {
  if (!navigator.mediaDevices?.getUserMedia) return false;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch {
    return false;
  }
}

function ingestSpeechResults(
  event: SpeechRecognitionEvent,
  finalsRef: { current: string },
  interimRef: { current: string },
  liveTextRef: { current: string },
  setLiveText: (value: string) => void,
) {
  let interim = "";

  for (let i = event.resultIndex; i < event.results.length; i++) {
    const result = event.results[i];
    const chunk = result[0]?.transcript ?? "";
    if (result.isFinal) {
      finalsRef.current += chunk;
    } else {
      interim += chunk;
    }
  }

  interimRef.current = interim;
  const live = `${finalsRef.current}${interimRef.current}`.trim();
  liveTextRef.current = live;
  setLiveText(live);
}

export function useGroceryVoice(onTranscript: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [liveText, setLiveText] = useState("");
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState<GroceryVoiceError | null>(null);
  const [mode, setMode] = useState<VoiceMode | null>(null);

  const onTranscriptRef = useRef(onTranscript);
  const sessionRef = useRef(0);
  const listeningRef = useRef(false);
  const stoppingRef = useRef(false);
  const modeRef = useRef<VoiceMode | null>(null);
  const finalsRef = useRef("");
  const interimRef = useRef("");
  const liveTextRef = useRef("");
  const speechRetriesRef = useRef(0);
  const speechLangRef = useRef(pickSpeechLang());

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef("audio/webm");
  const stopTimerRef = useRef<number | null>(null);
  const restartTimerRef = useRef<number | null>(null);
  const stopWaitTimerRef = useRef<number | null>(null);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" &&
        window.isSecureContext &&
        (Boolean(getSpeechRecognitionCtor()) ||
          (Boolean(navigator.mediaDevices?.getUserMedia) &&
            typeof MediaRecorder !== "undefined" &&
            Boolean(pickRecordingMimeType()))),
    );
  }, []);

  const clearTimers = useCallback(() => {
    if (stopTimerRef.current !== null) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (restartTimerRef.current !== null) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    if (stopWaitTimerRef.current !== null) {
      window.clearTimeout(stopWaitTimerRef.current);
      stopWaitTimerRef.current = null;
    }
  }, []);

  const resetTranscript = useCallback(() => {
    finalsRef.current = "";
    interimRef.current = "";
    liveTextRef.current = "";
    setLiveText("");
  }, []);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const detachSpeechHandlers = useCallback((recognition: SpeechRecognition) => {
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    recognition.onstart = null;
  }, []);

  const abortSpeech = useCallback(() => {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (!recognition) return;
    detachSpeechHandlers(recognition);
    try {
      recognition.abort();
    } catch {
      // already stopped
    }
  }, [detachSpeechHandlers]);

  const resetRecording = useCallback(() => {
    recorderRef.current = null;
    chunksRef.current = [];
    releaseStream();
  }, [releaseStream]);

  const teardown = useCallback(() => {
    clearTimers();
    stoppingRef.current = false;
    abortSpeech();
    resetRecording();
  }, [abortSpeech, clearTimers, resetRecording]);

  const currentTranscript = useCallback(() => {
    return `${finalsRef.current}${interimRef.current}`.trim() || liveTextRef.current.trim();
  }, []);

  const deliverTranscript = useCallback(() => {
    const text = currentTranscript();
    resetTranscript();
    stoppingRef.current = false;
    modeRef.current = null;
    setMode(null);

    if (!text) {
      setError("no-speech");
      return;
    }

    setError(null);
    onTranscriptRef.current(text);
  }, [currentTranscript, resetTranscript]);

  const fail = useCallback(
    (code: GroceryVoiceError) => {
      listeningRef.current = false;
      stoppingRef.current = false;
      setListening(false);
      setProcessing(false);
      modeRef.current = null;
      setMode(null);
      setError(code);
      teardown();
    },
    [teardown],
  );

  const transcribeRecording = useCallback(
    async (session: number, blob: Blob) => {
      if (session !== sessionRef.current) return;

      if (blob.size < 400) {
        fail("no-speech");
        return;
      }

      try {
        const audioBase64 = await blobToBase64(blob);
        if (session !== sessionRef.current) return;

        const { text } = await transcribeGrocery(audioBase64, mimeTypeRef.current);
        if (session !== sessionRef.current) return;

        const cleaned = text.trim();
        if (!cleaned) {
          fail("no-speech");
          return;
        }

        setError(null);
        onTranscriptRef.current(cleaned);
      } catch (err) {
        if (session !== sessionRef.current) return;
        fail(mapTranscribeError(err));
      } finally {
        if (session === sessionRef.current) {
          setProcessing(false);
          modeRef.current = null;
          setMode(null);
        }
      }
    },
    [fail],
  );

  const finishRecording = useCallback(
    async (session: number) => {
      if (session !== sessionRef.current || modeRef.current !== "recording") return;

      clearTimers();
      listeningRef.current = false;
      setListening(false);
      setProcessing(true);

      const recorder = recorderRef.current;
      recorderRef.current = null;
      releaseStream();

      if (!recorder || recorder.state === "inactive") {
        setProcessing(false);
        fail("no-speech");
        return;
      }

      const blob = await new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          resolve(new Blob(chunksRef.current, { type: mimeTypeRef.current }));
        };
        recorder.stop();
      });

      chunksRef.current = [];
      await transcribeRecording(session, blob);
    },
    [clearTimers, fail, releaseStream, transcribeRecording],
  );

  const beginRecording = useCallback(
    async (session: number) => {
      clearTimers();
      abortSpeech();

      const mimeType = pickRecordingMimeType();
      if (!mimeType) {
        fail("unsupported");
        return;
      }

      modeRef.current = "recording";
      setMode("recording");
      setLiveText("Recording… speak your grocery list, then tap Stop.");

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        });

        if (session !== sessionRef.current || !listeningRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        mimeTypeRef.current = mimeType.split(";")[0] ?? mimeType;
        chunksRef.current = [];

        const recorder = new MediaRecorder(stream, { mimeType });
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunksRef.current.push(event.data);
        };
        recorder.onerror = () => {
          if (session !== sessionRef.current) return;
          fail("failed");
        };

        recorderRef.current = recorder;
        recorder.start(250);
        listeningRef.current = true;
        setListening(true);
        setError(null);

        stopTimerRef.current = window.setTimeout(() => {
          void finishRecording(session);
        }, MAX_LISTEN_MS);
      } catch {
        if (session !== sessionRef.current) return;
        fail("mic-denied");
      }
    },
    [abortSpeech, clearTimers, fail, finishRecording],
  );

  const finalizeSpeechStop = useCallback(() => {
    if (!stoppingRef.current) return;

    clearTimers();
    abortSpeech();
    listeningRef.current = false;
    setListening(false);
    deliverTranscript();
  }, [abortSpeech, clearTimers, deliverTranscript]);

  const beginSpeechSegment = useCallback(
    (session: number) => {
      if (
        session !== sessionRef.current ||
        !listeningRef.current ||
        modeRef.current !== "speech" ||
        stoppingRef.current
      ) {
        return;
      }

      const Ctor = getSpeechRecognitionCtor();
      if (!Ctor) {
        void beginRecording(session);
        return;
      }

      abortSpeech();

      const recognition = new Ctor();
      recognition.continuous = !isAppleDevice();
      recognition.interimResults = true;
      recognition.lang = speechLangRef.current;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        if (session !== sessionRef.current) return;
        speechRetriesRef.current = 0;
        setListening(true);
      };

      recognition.onresult = (event) => {
        if (session !== sessionRef.current) return;
        ingestSpeechResults(event, finalsRef, interimRef, liveTextRef, setLiveText);
      };

      recognition.onerror = (event) => {
        if (session !== sessionRef.current || stoppingRef.current) return;

        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          fail("mic-denied");
          return;
        }

        if (event.error === "language-not-supported" && speechLangRef.current !== "en-US") {
          speechLangRef.current = "en-US";
          speechRetriesRef.current += 1;
          restartTimerRef.current = window.setTimeout(() => beginSpeechSegment(session), 80);
          return;
        }

        if (
          event.error === "no-speech" ||
          event.error === "aborted" ||
          event.error === "network"
        ) {
          speechRetriesRef.current += 1;
          if (stoppingRef.current) {
            finalizeSpeechStop();
            return;
          }
          if (event.error === "network" && speechRetriesRef.current >= MAX_SPEECH_RETRIES) {
            if (pickRecordingMimeType()) {
              void beginRecording(session);
              return;
            }
            fail("network");
          }
          return;
        }

        if (event.error === "audio-capture") {
          fail("mic-denied");
          return;
        }

        speechRetriesRef.current += 1;
        if (speechRetriesRef.current >= MAX_SPEECH_RETRIES && pickRecordingMimeType()) {
          void beginRecording(session);
        }
      };

      recognition.onend = () => {
        if (recognitionRef.current !== recognition) return;
        recognitionRef.current = null;

        if (stoppingRef.current) {
          finalizeSpeechStop();
          return;
        }

        if (!listeningRef.current || session !== sessionRef.current || modeRef.current !== "speech") {
          return;
        }

        if (speechRetriesRef.current >= MAX_SPEECH_RETRIES && pickRecordingMimeType()) {
          void beginRecording(session);
          return;
        }

        restartTimerRef.current = window.setTimeout(() => beginSpeechSegment(session), 120);
      };

      recognitionRef.current = recognition;

      try {
        recognition.start();
      } catch {
        speechRetriesRef.current += 1;
        if (speechRetriesRef.current >= MAX_SPEECH_RETRIES && pickRecordingMimeType()) {
          void beginRecording(session);
          return;
        }
        restartTimerRef.current = window.setTimeout(() => beginSpeechSegment(session), 220);
      }
    },
    [abortSpeech, beginRecording, fail, finalizeSpeechStop],
  );

  const stopSpeech = useCallback(() => {
    stoppingRef.current = true;
    listeningRef.current = false;
    setListening(false);
    clearTimers();

    const recognition = recognitionRef.current;
    if (!recognition) {
      deliverTranscript();
      return;
    }

    stopWaitTimerRef.current = window.setTimeout(() => {
      finalizeSpeechStop();
    }, STOP_WAIT_MS);

    try {
      recognition.stop();
    } catch {
      finalizeSpeechStop();
    }
  }, [clearTimers, deliverTranscript, finalizeSpeechStop]);

  const stop = useCallback(() => {
    if (!listeningRef.current && !processing) return;

    const session = sessionRef.current;
    listeningRef.current = false;
    setListening(false);
    clearTimers();

    if (modeRef.current === "recording") {
      void finishRecording(session);
      return;
    }

    if (modeRef.current === "speech") {
      stopSpeech();
      return;
    }

    deliverTranscript();
  }, [clearTimers, deliverTranscript, finishRecording, processing, stopSpeech]);

  const start = useCallback(async () => {
    if (!window.isSecureContext) {
      setError("insecure");
      return;
    }

    if (!getSpeechRecognitionCtor() && !pickRecordingMimeType()) {
      setError("unsupported");
      return;
    }

    const session = sessionRef.current + 1;
    sessionRef.current = session;
    listeningRef.current = true;
    stoppingRef.current = false;
    speechRetriesRef.current = 0;
    speechLangRef.current = pickSpeechLang();
    setError(null);
    setProcessing(false);
    resetTranscript();
    teardown();

    const micOk = await unlockMicrophone();
    if (session !== sessionRef.current) return;

    if (!micOk) {
      fail("mic-denied");
      return;
    }

    if (getSpeechRecognitionCtor()) {
      modeRef.current = "speech";
      setMode("speech");
      beginSpeechSegment(session);

      stopTimerRef.current = window.setTimeout(() => {
        stop();
      }, MAX_LISTEN_MS);
      return;
    }

    void beginRecording(session);
  }, [beginRecording, beginSpeechSegment, fail, resetTranscript, stop, teardown]);

  const toggle = useCallback(() => {
    if (processing) return;
    if (listeningRef.current) stop();
    else void start();
  }, [processing, start, stop]);

  useEffect(
    () => () => {
      sessionRef.current += 1;
      listeningRef.current = false;
      stoppingRef.current = false;
      teardown();
      setListening(false);
      setProcessing(false);
    },
    [teardown],
  );

  return {
    listening,
    processing,
    liveText,
    mode,
    supported,
    error,
    start,
    stop,
    toggle,
  };
}
