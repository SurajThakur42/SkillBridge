import React, { useEffect, useState } from 'react';
import { useVoiceControl } from '../context/VoiceControlContext.js';
import { Hash, X } from 'lucide-react';

export function VoiceBadgeOverlay() {
  const { showBadges, activeBadges, toggleBadges, executeCommand } = useVoiceControl();
  const [elements, setElements] = useState(activeBadges);

  // Recalculate badge positions on scroll / resize
  useEffect(() => {
    if (!showBadges) return;

    const updatePositions = () => {
      setElements(prev =>
        prev.map(item => ({
          ...item,
          rect: item.element.getBoundingClientRect()
        })).filter(item => {
          const r = item.rect;
          return r.width > 0 && r.height > 0 && r.top < window.innerHeight && r.bottom > 0;
        })
      );
    };

    window.addEventListener('scroll', updatePositions, { passive: true });
    window.addEventListener('resize', updatePositions, { passive: true });

    return () => {
      window.removeEventListener('scroll', updatePositions);
      window.removeEventListener('resize', updatePositions);
    };
  }, [showBadges]);

  useEffect(() => {
    setElements(activeBadges);
  }, [activeBadges]);

  if (!showBadges || elements.length === 0) return null;

  return (
    <div 
      id="voice-badge-overlay-root"
      className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
      aria-hidden="true"
    >
      {/* Banner indicator at top */}
      <div className="pointer-events-auto absolute top-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3.5 py-1.5 rounded-full shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-4">
        <Hash className="w-3.5 h-3.5" />
        <span>Voice Badges Active: Say <em>"click [number]"</em> (e.g. "click 1")</span>
        <button
          onClick={toggleBadges}
          className="ml-1 p-0.5 hover:bg-blue-700 rounded-full cursor-pointer text-blue-200 hover:text-white"
          title="Hide Voice Badges (Alt+B)"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating Badges pinned to element coordinates */}
      {elements.map((item) => {
        const top = item.rect.top;
        const left = item.rect.left;

        // Position slightly overlapping the top-left corner of the element
        return (
          <div
            key={item.badgeNumber}
            style={{
              top: `${Math.max(4, top - 8)}px`,
              left: `${Math.max(4, left - 8)}px`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              executeCommand(`click ${item.badgeNumber}`);
            }}
            className="pointer-events-auto absolute z-[9999] cursor-pointer group animate-in zoom-in-75 duration-150"
            title={`Voice target #${item.badgeNumber}: "${item.label}" (Click or say "click ${item.badgeNumber}")`}
          >
            <div className="flex items-center gap-1 bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-md font-mono text-[11px] font-black shadow-lg border-2 border-slate-900 ring-2 ring-amber-400/50 group-hover:scale-125 group-hover:bg-amber-300 transition-transform select-none">
              <span>{item.badgeNumber}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
