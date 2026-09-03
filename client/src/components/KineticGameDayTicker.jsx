import React, { useState } from "react";
import { Flame, Zap, Trophy, Shield, Sparkles, TrendingUp } from "lucide-react";

const TICKER_ITEMS = [
  {
    type: "MARQUEE",
    tag: "GAME OF THE WEEK",
    matchup: "#1 Georgia vs #11 Ole Miss",
    time: "Sat 3:30 PM ET • ABC",
    spread: "UGA -7.5 (O/U 54.5)",
    accent: "#ba0c2f",
    icon: "🔥"
  },
  {
    type: "RIVALRY",
    tag: "IRON BOWL",
    matchup: "#6 Alabama vs #24 Auburn",
    time: "Sat 7:30 PM ET • ESPN",
    spread: "BAMA -10.5",
    accent: "#9e1b32",
    icon: "⚔️"
  },
  {
    type: "TOP 10",
    tag: "BIG NOON KICKOFF",
    matchup: "#2 Ohio State vs #8 Penn State",
    time: "Sat 12:00 PM ET • FOX",
    spread: "OSU -4.5 (O/U 49.5)",
    accent: "#bb0000",
    icon: "⭐"
  },
  {
    type: "RIVALRY",
    tag: "RED RIVER RIVALRY",
    matchup: "#5 Texas vs #18 Oklahoma",
    time: "Sat 3:30 PM ET • ABC",
    spread: "TEX -6.5 (Cotton Bowl)",
    accent: "#bf5700",
    icon: "🐂"
  },
  {
    type: "CFP",
    tag: "12-TEAM PLAYOFF RACE",
    matchup: "Projected Top 4 Byes: UGA • OSU • TEX • CLEM",
    time: "Live Projection Updated",
    spread: "CFB 2026 Season",
    accent: "#eab308",
    icon: "🏆"
  },
  {
    type: "LIVE",
    tag: "STANDINGS RADAR",
    matchup: "#12 Tennessee & #14 LSU locked in SEC Title Hunt",
    time: "Week 1 Live",
    spread: "Bowl Eligibility: 6 Wins Needed",
    accent: "#f97316",
    icon: "⚡"
  }
];

export function KineticGameDayTicker({ onSelectMatchup }) {
  const [isPaused, setIsPaused] = useState(false);
  const duplicatedItems = [...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div
      className="relative w-full bg-[#080b10] border-y border-amber-500/20 shadow-lg overflow-hidden select-none z-20 group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-[#080b10] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-[#080b10] to-transparent z-10 pointer-events-none" />

      <div className="flex items-center">
        <div className="hidden md:flex items-center space-x-1.5 px-3.5 py-2 bg-amber-500 text-black font-black text-[11px] uppercase tracking-wider shrink-0 z-10 shadow-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-black"></span>
          </span>
          <span>CFB 2026 TICKER</span>
        </div>

        <div className="flex overflow-hidden py-1.5 sm:py-2">
          <div
            className={"flex items-center space-x-4 shrink-0 animate-marquee " + (isPaused ? "[animation-play-state:paused]" : "")}
            style={{ animationDuration: "38s" }}
          >
            {duplicatedItems.map((item, idx) => (
              <div
                key={idx}
                onClick={() => onSelectMatchup && onSelectMatchup(item)}
                className="inline-flex items-center space-x-2.5 px-3 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-amber-400/40 transition cursor-pointer text-xs shrink-0 shadow-sm"
              >
                <span className="flex items-center space-x-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  <span>{item.icon}</span>
                  <span>{item.tag}</span>
                </span>
                <span className="font-extrabold text-[#faf6e8] athletic-title tracking-wide">
                  {item.matchup}
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:inline font-mono">
                  {item.time}
                </span>
                <span className="font-mono font-bold text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {item.spread}
                </span>
                <span className="text-white/20 pl-2">•</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
