"use client";

import React, { useEffect, useState, useRef } from "react";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";

interface VoiceHandlerProps {
  currentQuestion: string | null;
  onAnswer: (answer: "yes" | "no" | "dont_know") => void;
  voiceActive: boolean;
  setVoiceActive: (active: boolean) => void;
  coins: number;
  onSkip?: () => void;
}

export default function VoiceHandler({
  currentQuestion,
  onAnswer,
  voiceActive,
  setVoiceActive,
  coins,
  onSkip,
}: VoiceHandlerProps) {
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);

  const recognitionRef = useRef<any>(null);
  const lastSpokenRef = useRef<string>("");

  // Initialize Speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        setSpeechSupported(true);
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = false;
        rec.lang = "en-US";

        rec.onstart = () => {
          setIsListening(true);
          setTranscribedText("Listening...");
        };

        rec.onend = () => {
          setIsListening(false);
          // Auto-restart if voice mode is still enabled
          if (voiceActive) {
            try {
              rec.start();
            } catch (e) {
              // Ignore already started errors
            }
          }
        };

        rec.onresult = (event: any) => {
          const resultIndex = event.resultIndex;
          const transcript = event.results[resultIndex][0].transcript.toLowerCase().trim();
          setTranscribedText(transcript);

          // Process spoken command
          if (transcript.includes("yes") || transcript.includes("yeah") || transcript.includes("yep") || transcript.includes("correct")) {
            onAnswer("yes");
          } else if (transcript.includes("no") || transcript.includes("nah") || transcript.includes("nope") || transcript.includes("wrong")) {
            onAnswer("no");
          } else if (transcript.includes("don't know") || transcript.includes("dont know") || transcript.includes("maybe") || transcript.includes("not sure")) {
            onAnswer("dont_know");
          } else if (transcript.includes("skip") && onSkip) {
            onSkip();
          }
        };

        rec.onerror = (err: any) => {
          console.warn("Speech recognition error:", err.error);
          if (err.error === "not-allowed") {
            setVoiceActive(false);
          }
        };

        recognitionRef.current = rec;
      }
    }
  }, [onAnswer, setVoiceActive, voiceActive, onSkip]);

  // Handle active speech recognition trigger
  useEffect(() => {
    if (!speechSupported || !recognitionRef.current) return;

    if (voiceActive) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // already active
      }
    } else {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
        setTranscribedText("");
      } catch (e) {
        // already stopped
      }
    }
  }, [voiceActive, speechSupported]);

  // Read aloud the AI questions when they update
  useEffect(() => {
    if (typeof window === "undefined" || !soundEnabled || !currentQuestion) return;

    // Avoid double speaking same question
    if (lastSpokenRef.current === currentQuestion) return;
    lastSpokenRef.current = currentQuestion;

    window.speechSynthesis.cancel(); // Stop any pending speech

    const utterance = new SpeechSynthesisUtterance(currentQuestion);

    // Find a nice digital/commentator voice if available
    const voices = window.speechSynthesis.getVoices();
    const targetVoice = voices.find(
      (v) =>
        v.name.toLowerCase().includes("google") ||
        v.name.toLowerCase().includes("natural") ||
        v.name.toLowerCase().includes("david")
    );

    if (targetVoice) utterance.voice = targetVoice;
    utterance.pitch = 1.1; // slightly higher pitch for robotic look
    utterance.rate = 1.05; // slightly faster announcer pace

    window.speechSynthesis.speak(utterance);
  }, [currentQuestion, soundEnabled]);

  // Handle cleanup
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!speechSupported) {
    return null; // hide if not supported by browser
  }

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div className="flex items-center gap-4">
        {/* Toggle Listening Mic Button */}
        <button
          onClick={() => setVoiceActive(!voiceActive)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 font-medium ${voiceActive
              ? "bg-rose-100/70 border-rose-400/60 text-rose-600 shadow-[0_0_12px_rgba(244,63,94,0.15)] animate-pulse"
              : "bg-white/40 border-white/60 text-slate-700 hover:bg-white/70 hover:border-slate-300"
            }`}
          title={voiceActive ? "Disable Voice Input" : "Enable Voice Input"}
        >
          {voiceActive ? (
            <>
              <Mic className="w-4 h-4 animate-bounce" />
              <span>Voice Mode: Active</span>
            </>
          ) : (
            <>
              <MicOff className="w-4 h-4" />
              <span>Voice Mode: Off</span>
            </>
          )}
        </button>

        {/* Speak Announcer toggle button */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-2 rounded-full border transition-all ${soundEnabled
              ? "bg-white/40 border-sky-300/40 text-sky-600 hover:bg-white/60"
              : "bg-slate-100/40 border-slate-200 text-slate-400/60"
            }`}
          title={soundEnabled ? "Mute Announcer Speech" : "Unmute Announcer Speech"}
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      {/* Spoken Transcription Text overlay */}
      {voiceActive && (
        <div className="text-center">
          <p className="text-xs text-rose-500/80 uppercase tracking-widest font-semibold font-mono h-4">
            {isListening ? "Listening for 'Yes', 'No', 'Don't Know', 'Skip'..." : ""}
          </p>
          {transcribedText && (
            <p className="text-sm text-slate-600 font-mono italic mt-1 bg-white/50 px-3 py-1 rounded-md border border-white/60">
              Hear: &ldquo;{transcribedText}&rdquo;
            </p>
          )}
        </div>
      )}
    </div>
  );
}
