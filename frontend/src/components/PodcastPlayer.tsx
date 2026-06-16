"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Play, Pause, RotateCcw, Volume2, Sparkles, Headphones, 
  ChevronRight, VolumeX, ListMusic, AudioLines
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL } from "@/lib/api";

interface DialogueTurn {
  speaker: string;
  text: string;
}

interface PodcastScript {
  title: string;
  dialogue: DialogueTurn[];
}

interface PodcastPlayerProps {
  selectedDoc: string | null;
}

export default function PodcastPlayer({ selectedDoc }: PodcastPlayerProps) {
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState<PodcastScript | null>(null);
  
  // Player Playback States
  const [playing, setPlaying] = useState(false);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [muted, setMuted] = useState(false);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load voices when speechSynthesis is ready
  useEffect(() => {
    // Stop any speech when component unmounts
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  const handleGeneratePodcast = async () => {
    if (!selectedDoc) return;
    setLoading(true);
    window.speechSynthesis?.cancel();
    setPlaying(false);
    setCurrentTurnIndex(0);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/audio/podcast-script?document_id=${encodeURIComponent(selectedDoc)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      setScript(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const playTurn = (index: number) => {
    if (!script || !window.speechSynthesis) return;

    window.speechSynthesis.cancel(); // Stop anything playing
    
    if (index >= script.dialogue.length) {
      // Finished podcast
      setPlaying(false);
      setCurrentTurnIndex(0);
      return;
    }

    const turn = script.dialogue[index];
    const utterance = new SpeechSynthesisUtterance(turn.text);
    utteranceRef.current = utterance;
    
    // Choose voice based on speaker
    const voices = window.speechSynthesis.getVoices();
    
    // Simple voice assignment heuristic:
    // Try to find a male voice for Host A, female for Host B, or adjust pitch/rate
    if (voices.length > 0) {
      if (turn.speaker === "Host A") {
        // Find a deeper voice or default voice 0
        const maleVoice = voices.find(v => v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("david") || v.name.toLowerCase().includes("google us english"));
        utterance.voice = maleVoice || voices[0];
        utterance.pitch = 0.95; // slightly lower pitch
        utterance.rate = 1.0;
      } else {
        // Find a lighter voice or default voice 1
        const femaleVoice = voices.find(v => v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("zira") || v.name.toLowerCase().includes("hazel") || v.name.toLowerCase().includes("google uk english female"));
        utterance.voice = femaleVoice || voices[1] || voices[0];
        utterance.pitch = 1.15; // slightly higher pitch
        utterance.rate = 1.05; // slightly faster rate
      }
    }

    if (muted) {
      utterance.volume = 0;
    } else {
      utterance.volume = 1;
    }

    utterance.onend = () => {
      // Move to next turn automatically
      if (playing) {
        const nextIdx = index + 1;
        setCurrentTurnIndex(nextIdx);
        playTurn(nextIdx);
      }
    };

    utterance.onerror = (e) => {
      console.error("Speech error:", e);
      setPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePlayPause = () => {
    if (!script) return;
    
    if (playing) {
      window.speechSynthesis.pause();
      setPlaying(false);
    } else {
      setPlaying(true);
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      } else {
        playTurn(currentTurnIndex);
      }
    }
  };

  const handleRestart = () => {
    window.speechSynthesis.cancel();
    setCurrentTurnIndex(0);
    if (playing) {
      playTurn(0);
    } else {
      setPlaying(false);
    }
  };

  const handleMuteToggle = () => {
    setMuted(!muted);
    if (utteranceRef.current) {
      utteranceRef.current.volume = !muted ? 0 : 1;
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 flex flex-col gap-6 shadow-sm overflow-hidden relative">
      
      {/* Waveforms Decoration */}
      <div className="absolute right-0 bottom-[-15px] opacity-10 pointer-events-none text-blue-500">
        <AudioLines size={120} />
      </div>

      <div className="flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900 rounded-xl">
            <Headphones size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-150">StudySphere Audio Overview</h3>
            <p className="text-[10px] text-zinc-450 mt-0.5">NotebookLM-style alternating podcast summaries</p>
          </div>
        </div>
        
        {selectedDoc && (
          <button
            onClick={handleGeneratePodcast}
            disabled={loading}
            className="py-1.5 px-3 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 text-white font-semibold text-xs rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles size={12} className="animate-pulse" />
            {loading ? "Generating..." : script ? "Regenerate Podcast" : "Generate Podcast"}
          </button>
        )}
      </div>

      {script ? (
        <div className="flex flex-col gap-6">
          {/* Simulated Player Box */}
          <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800/60 p-5 rounded-2xl flex flex-col gap-4">
            
            {/* Title / Duration */}
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-zinc-700 dark:text-zinc-350 truncate max-w-[250px]">
                📻 {script.title}
              </span>
              <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                {currentTurnIndex + 1} / {script.dialogue.length} turns
              </span>
            </div>

            {/* Equalizer Visualizer */}
            <div className="flex items-center justify-center gap-1.5 py-4 h-12">
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    height: playing ? [12, Math.random() * 32 + 8, 12] : 8
                  }}
                  transition={{
                    duration: 0.8 + i * 0.05,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-1 bg-blue-600 rounded-full"
                />
              ))}
            </div>

            {/* Controls Bar */}
            <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-850 pt-4">
              <button 
                onClick={handleRestart}
                className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors"
                title="Restart"
              >
                <RotateCcw size={15} />
              </button>

              <button 
                onClick={handlePlayPause}
                className="p-3 bg-blue-600 text-white rounded-full hover:scale-105 active:scale-95 transition-transform flex items-center justify-center shadow-lg"
              >
                {playing ? <Pause size={18} /> : <Play size={18} className="translate-x-0.5" />}
              </button>

              <button 
                onClick={handleMuteToggle}
                className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors"
                title={muted ? "Unmute" : "Mute"}
              >
                {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>
            </div>

          </div>

          {/* Transcript highlight */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <ListMusic size={12} />
              Active Transcript
            </h4>
            <div className="max-h-[160px] overflow-y-auto space-y-2 border border-zinc-100 dark:border-zinc-900 p-3 rounded-xl scrollbar-thin">
              {script.dialogue.map((turn, idx) => {
                const isActive = currentTurnIndex === idx;
                return (
                  <div 
                    key={idx}
                    className={`p-2 rounded-lg transition-all text-xs ${
                      isActive 
                        ? "bg-blue-50/50 dark:bg-blue-950/20 border-l-2 border-blue-500 pl-3 font-semibold text-blue-600 dark:text-blue-400 shadow-sm" 
                        : "text-zinc-500 dark:text-zinc-500 opacity-60"
                    }`}
                  >
                    <span className="uppercase tracking-wider text-[9px] font-bold block mb-0.5">
                      {turn.speaker}
                    </span>
                    <p className="leading-relaxed">{turn.text}</p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      ) : (
        <div className="py-8 text-center text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-2">
          <Headphones size={32} className="text-zinc-300 dark:text-zinc-800" />
          <p className="text-xs">
            {selectedDoc 
              ? `Ready to generate podcast overview for "${selectedDoc}"` 
              : "Upload and select a study document to enable audio podcasts summaries."}
          </p>
        </div>
      )}

    </div>
  );
}
