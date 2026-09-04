import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, Sparkles, Trophy, Flame, Zap } from "lucide-react";

export const WEEKS = [
  { number: 0, label: "Week 0", subtitle: "Dublin & Season Openers", date: "Aug 29", badge: "KICKOFF", tag: "DUBLIN CLASSIC", bg: "from-emerald-950/60 via-black to-slate-900", highlight: "#10b981" },
  { number: 1, label: "Week 1", subtitle: "Labor Day Kickoff", date: "Sept 3 - 7", badge: "LIVE NOW", tag: "MARQUEE", bg: "from-amber-900/40 via-black to-slate-900", highlight: "#f59e0b" },
  { number: 2, label: "Week 2", subtitle: "Non-Conf Showdowns", date: "Sept 11 - 13", badge: "UPCOMING", tag: "REGULAR", bg: "from-blue-950/50 via-black to-slate-900", highlight: "#38bdf8" },
  { number: 3, label: "Week 3", subtitle: "SEC Openers", date: "Sept 17 - 20", badge: "UPCOMING", tag: "REGULAR", bg: "from-red-950/50 via-black to-slate-900", highlight: "#f87171" },
  { number: 4, label: "Week 4", subtitle: "Conference Clashes", date: "Sept 24 - 27", badge: "UPCOMING", tag: "REGULAR", bg: "from-purple-950/50 via-black to-slate-900", highlight: "#c084fc" },
  { number: 5, label: "Week 5", subtitle: "Top 25 Showdowns", date: "Oct 2 - 4", badge: "UPCOMING", tag: "REGULAR", bg: "from-emerald-950/50 via-black to-slate-900", highlight: "#4ade80" },
  { number: 6, label: "Week 6", subtitle: "Midseason Surge", date: "Oct 7 - 11", badge: "UPCOMING", tag: "REGULAR", bg: "from-amber-950/50 via-black to-slate-900", highlight: "#fbbf24" },
  { number: 7, label: "Week 7", subtitle: "Rivalry Primers", date: "Oct 14 - 18", badge: "UPCOMING", tag: "REGULAR", bg: "from-cyan-950/50 via-black to-slate-900", highlight: "#22d3ee" },
  { number: 8, label: "Week 8", subtitle: "National Spotlight", date: "Oct 22 - 24", badge: "UPCOMING", tag: "REGULAR", bg: "from-indigo-950/50 via-black to-slate-900", highlight: "#818cf8" },
  { number: 9, label: "Week 9", subtitle: "Title Contenders", date: "Oct 27 - Nov 1", badge: "UPCOMING", tag: "REGULAR", bg: "from-orange-950/50 via-black to-slate-900", highlight: "#fb923c" },
  { number: 10, label: "Week 10", subtitle: "November Push", date: "Nov 4 - 8", badge: "UPCOMING", tag: "REGULAR", bg: "from-rose-950/50 via-black to-slate-900", highlight: "#fb7185" },
  { number: 11, label: "Week 11", subtitle: "Championship Hunt", date: "Nov 11 - 15", badge: "UPCOMING", tag: "REGULAR", bg: "from-blue-950/50 via-black to-slate-900", highlight: "#60a5fa" },
  { number: 12, label: "Week 12", subtitle: "Penultimate Tests", date: "Nov 18 - 22", badge: "UPCOMING", tag: "REGULAR", bg: "from-emerald-950/50 via-black to-slate-900", highlight: "#34d399" },
  { number: 13, label: "Week 13", subtitle: "Rivalry Weekend", date: "Nov 24 - 29", badge: "RIVALRY", tag: "THANKSGIVING & RIVALRIES", bg: "from-yellow-950/50 via-black to-slate-900", highlight: "#facc15" },
  { number: 14, label: "Week 14", subtitle: "Conference Titles", date: "Dec 4 - 5", badge: "CHAMPIONSHIPS", tag: "SEC / B1G / ACC / B12 CCGs", bg: "from-purple-950/60 via-black to-slate-900", highlight: "#a855f7" },
  { number: 15, label: "Week 15", subtitle: "Army vs Navy Classic", date: "Dec 12", badge: "TRADITION", tag: "ARMY VS NAVY", bg: "from-red-950/60 via-black to-slate-900", highlight: "#ef4444" },
  { number: 16, label: "CFP Round 1", subtitle: "12-Team Playoff", date: "Dec 19 - 20", badge: "POSTSEASON", tag: "FIRST ROUND ON CAMPUS", bg: "from-amber-950/60 via-black to-slate-900", highlight: "#eab308" },
  { number: 17, label: "Bowls & CFP", subtitle: "Quarter & Semis", date: "Dec 31 - Jan 2", badge: "NEW YEARS SIX", tag: "ROSE / SUGAR / ORANGE", bg: "from-emerald-950/60 via-black to-slate-900", highlight: "#10b981" },
  { number: 18, label: "Natl Title", subtitle: "National Championship", date: "Jan 18, 2027", badge: "TITLE GAME", tag: "CFP TROPHY", bg: "from-amber-900/70 via-black to-slate-900", highlight: "#fbbf24" }
];

export function CoverflowWeekSelector({ currentWeek, onSelectWeek, year = 2026 }) {
  const currentIndex = WEEKS.findIndex(w => w.number === currentWeek);
  const activeIdx = currentIndex >= 0 ? currentIndex : 0;
  const [touchStart, setTouchStart] = useState(null);

  const handlePrev = () => {
    if (activeIdx > 0) {
      onSelectWeek(WEEKS[activeIdx - 1].number);
    }
  };

  const handleNext = () => {
    if (activeIdx < WEEKS.length - 1) {
      onSelectWeek(WEEKS[activeIdx + 1].number);
    }
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (diff > 45) handleNext();
    else if (diff < -45) handlePrev();
    setTouchStart(null);
  };

  return (
    <div className="w-full bg-[#0a0d14]/90 border border-white/10 rounded-3xl p-4 sm:p-6 shadow-2xl mb-8 overflow-hidden relative">
      {/* Top Header Control */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider athletic-title flex items-center space-x-2">
              <span>2026 Season Schedule</span>
              <span className="text-[10px] text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30 font-sans font-bold">
                3D Coverflow
              </span>
            </h3>
          </div>
        </div>

        {/* Prev / Next Arrows */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrev}
            disabled={activeIdx === 0}
            className="w-9 h-9 rounded-xl bg-black/60 hover:bg-black/90 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 text-white flex items-center justify-center transition hover:border-amber-400/50 shadow-md"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            disabled={activeIdx === WEEKS.length - 1}
            className="w-9 h-9 rounded-xl bg-black/60 hover:bg-black/90 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 text-white flex items-center justify-center transition hover:border-amber-400/50 shadow-md"
            aria-label="Next week"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 3D Coverflow Perspective Stage */}
      <div
        className="relative h-48 sm:h-56 w-full flex items-center justify-center overflow-hidden my-2 select-none"
        style={{ perspective: "1000px" }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative w-full h-full flex items-center justify-center" style={{ transformStyle: "preserve-3d" }}>
          {WEEKS.map((w, idx) => {
            const offset = idx - activeIdx;
            const absOffset = Math.abs(offset);
            const isVisible = absOffset <= 3;

            if (!isVisible) return null;

            // 3D Matrix Math (Inspired by iTunes Coverflow & Cinematic Modules)
            const tx = offset * (window.innerWidth < 640 ? 110 : 180);
            const ry = offset < 0 ? 36 : offset > 0 ? -36 : 0;
            const sc = absOffset === 0 ? 1.05 : Math.max(0.75, 1 - absOffset * 0.12);
            const tz = absOffset === 0 ? 40 : -absOffset * 50;
            const op = absOffset === 0 ? 1 : Math.max(0.25, 1 - absOffset * 0.28);
            const zIndex = absOffset === 0 ? 30 : 30 - absOffset;
            const isSelected = absOffset === 0;

            return (
              <div
                key={w.number}
                onClick={() => onSelectWeek(w.number)}
                className={"absolute w-44 sm:w-56 h-40 sm:h-48 rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all duration-500 ease-out border backdrop-blur-md shadow-2xl " +
                  (isSelected
                    ? "border-amber-400 ring-2 ring-amber-400/40 shadow-[0_0_30px_rgba(245,158,11,0.3)] bg-gradient-to-br from-amber-500/20 via-black to-[#0e1218]"
                    : "border-white/10 hover:border-white/30 bg-gradient-to-br " + w.bg)
                }
                style={{
                  transform: "translateX(" + tx + "px) translateZ(" + tz + "px) rotateY(" + ry + "deg) scale(" + sc + ")",
                  zIndex: zIndex,
                  opacity: op,
                  filter: isSelected ? "brightness(1.05)" : "brightness(0.65)"
                }}
              >
                {/* Top Badge */}
                <div className="flex items-center justify-between">
                  <span className={"text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border " +
                    (isSelected
                      ? "bg-amber-500 text-black border-amber-400 shadow-md"
                      : "bg-black/60 text-slate-300 border-white/10")
                  }>
                    {w.number <= 14 ? "WEEK " + w.number : "POSTSEASON"}
                  </span>

                  {isSelected && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                    </span>
                  )}
                </div>

                {/* Center Content */}
                <div className="my-auto text-left">
                  <div className={"text-base sm:text-lg font-black athletic-title leading-tight " + (isSelected ? "text-white" : "text-slate-200")}>
                    {w.label}
                  </div>
                  <div className="text-[11px] font-medium text-amber-300/90 mt-0.5 truncate">
                    {w.subtitle}
                  </div>
                </div>

                {/* Bottom Date & Tag */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] text-slate-400 font-mono">
                  <span>{w.date}</span>
                  <span className={"font-bold " + (isSelected ? "text-amber-400" : "text-slate-500")}>
                    {w.badge}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Jump Ribbon */}
      <div className="mt-3 pt-3 border-t border-white/5 flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
        {WEEKS.map(w => {
          const isSelected = w.number === currentWeek;
          return (
            <button
              key={w.number}
              onClick={() => onSelectWeek(w.number)}
              className={"flex-shrink-0 px-2.5 py-1 rounded-xl text-[11px] font-bold transition duration-150 " +
                (isSelected
                  ? "bg-amber-500 text-black shadow-md shadow-amber-500/20 font-black"
                  : "bg-black/40 hover:bg-black/80 text-slate-400 hover:text-white border border-white/5")
              }
            >
              {w.number <= 14 ? "W" + w.number : w.label.replace("CFP ", "").replace("Week", "")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
