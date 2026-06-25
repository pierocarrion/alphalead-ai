"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createLogger } from "@/shared/lib/logger";

const log = createLogger("mic");

// Minimal typings for the Chromium Web Speech API
// https://www.google.com/intl/en/chrome/demos/speech.html
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

interface UseSpeechRecognitionOptions {
  lang?: string;
  onFinal?: (transcript: string) => void;
  onError?: (error: string) => void;
}

interface UseSpeechRecognitionReturn {
  supported: boolean;
  listening: boolean;
  interim: string;
  start: () => void;
  stop: () => void;
}

function getCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeechRecognition({
  lang = "en-US",
  onFinal,
  onError,
}: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn {
  const [supported] = useState<boolean>(() => {
    const ctor = getCtor();
    log.info("support-check", { supported: ctor !== null, lang });
    return ctor !== null;
  });
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const onFinalRef = useRef(onFinal);
  const onErrorRef = useRef(onError);
  const manualStopRef = useRef(false);

  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const stop = useCallback(() => {
    log.info("stop (manual)");
    manualStopRef.current = true;
    try {
      recRef.current?.stop();
    } catch (err) {
      log.warn("stop threw", err);
    }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) {
      log.error("start aborted: not supported by this browser");
      onErrorRef.current?.("not-supported");
      return;
    }
    recRef.current?.abort();
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = true;
    manualStopRef.current = false;
    log.info("start", { lang, continuous: false, interimResults: true });

    rec.onresult = (e) => {
      let interimText = "";
      let finalText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const alt = res[0];
        if (!alt) continue;
        if (res.isFinal) finalText += alt.transcript;
        else interimText += alt.transcript;
      }
      if (interimText) {
        log.debug("interim", { interimText });
        setInterim(interimText);
      }
      if (finalText) {
        const trimmed = finalText.trim();
        log.info("final", { finalText: trimmed });
        setInterim("");
        onFinalRef.current?.(trimmed);
      }
    };

    rec.onerror = (e) => {
      const code = e.error || "unknown";
      log.error("recognition error", {
        error: code,
        message: e.message ?? null,
        manualStop: manualStopRef.current,
      });
      setListening(false);
      setInterim("");
      onErrorRef.current?.(code);
    };

    rec.onend = () => {
      log.info("end", { manualStop: manualStopRef.current });
      setInterim("");
      setListening(false);
    };

    recRef.current = rec;
    setListening(true);
    try {
      rec.start();
      log.debug("rec.start() called");
    } catch (err) {
      log.error("rec.start() threw", err);
      setListening(false);
      onErrorRef.current?.("start-failed");
    }
  }, [lang]);

  useEffect(() => {
    return () => {
      const rec = recRef.current;
      if (rec) {
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        try {
          rec.abort();
        } catch {
          /* noop */
        }
      }
      log.debug("unmount cleanup");
    };
  }, []);

  return { supported, listening, interim, start, stop };
}
