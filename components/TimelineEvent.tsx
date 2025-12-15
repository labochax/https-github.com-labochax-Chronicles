import React from "react";
import { HistoricalEvent, EventType } from "../types";

interface TimelineEventProps {
  event: HistoricalEvent;
  onSelect: (event: HistoricalEvent) => void;
  index: number;
  hiddenChildCount?: number;
}

export const TimelineEvent: React.FC<TimelineEventProps> = ({ event, onSelect, hiddenChildCount = 0 }) => {
  const isEra = event.type === EventType.ERA;
  const isSubEvent = event.type === EventType.SUB_EVENT;

  // Render Era (Major Section Header)
  if (isEra) {
    return (
      <div 
        id={`event-${event.id}`}
        className="group relative grid grid-cols-[40px_1fr] gap-x-4 mb-10 animate-fade-in scroll-mt-32"
      >
        <div className="flex flex-col items-center pt-1 z-10">
          <div className="size-8 rounded-full bg-primary border-4 border-background-dark shadow-glow flex items-center justify-center">
            <span className="material-symbols-outlined text-sm text-white font-bold">
              history_edu
            </span>
          </div>
        </div>
        <div className="flex flex-col pt-1">
          <span className="text-primary font-bold text-sm tracking-wide uppercase mb-1">
            Major Era
          </span>
          <h2 className="text-2xl font-bold text-white leading-tight">
            {event.title}
          </h2>
          <p className="text-text-secondary text-sm mt-1 font-medium">
            {event.yearDisplay}
          </p>
          <p className="text-text-secondary/70 text-xs mt-2 line-clamp-2">
            {event.description}
          </p>

          {/* CLUSTERING: Show hidden child count if > 0 */}
          {hiddenChildCount > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 w-fit animate-pulse">
                <span className="material-symbols-outlined text-primary text-sm">layers</span>
                <span className="text-xs text-white font-medium">
                    Contains {hiddenChildCount} more events
                </span>
                <span className="text-[10px] text-text-secondary uppercase tracking-wide ml-1">
                    (Zoom to see)
                </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render Standard Event or Sub Event
  return (
    <div 
        id={`event-${event.id}`}
        className={`group relative grid grid-cols-[40px_1fr] gap-x-4 mb-8 animate-slide-up scroll-mt-48 ${isSubEvent ? 'opacity-90' : ''}`}
        onClick={() => onSelect(event)}
    >
      <div className="flex flex-col items-center z-10">
        {/* Connector Line Logic implied by parent container's gradient line */}
        <div className={`rounded-full bg-background-dark border-2 border-primary mt-6 transition-all duration-300 ${isSubEvent ? 'w-2 h-2 border-text-secondary' : 'w-3 h-3 group-hover:bg-primary group-hover:scale-125'}`}></div>
      </div>

      <div 
        className={`bg-surface-dark border border-white/5 rounded-lg overflow-hidden active:scale-[0.99] transition-all duration-200 ease-out cursor-pointer hover:border-primary/50 hover:shadow-glow ${
            isSubEvent ? 'p-3' : 'p-4 shadow-sm'
        }`}
      >
        {/* Optional Image Header */}
        {event.imageUrl && !isSubEvent && (
          <div className="h-32 w-full relative mb-3 rounded-md overflow-hidden bg-gray-800">
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-dark/80 to-transparent"></div>
          </div>
        )}

        {/* Content Header */}
        <div className="flex justify-between items-start mb-1">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
                <span className={`${isSubEvent ? 'text-sm' : 'text-lg'} text-primary font-bold`}>{event.yearDisplay}</span>
                {event.dateDisplay && <span className="text-text-secondary text-xs">{event.dateDisplay}</span>}
            </div>
            <h3 className={`text-white font-semibold leading-snug ${isSubEvent ? 'text-base' : 'text-lg'}`}>
              {event.title}
            </h3>
          </div>
          {!isSubEvent && (
            <button className="text-text-secondary hover:text-white transition-colors">
                <span className="material-symbols-outlined text-xl">open_in_full</span>
            </button>
          )}
        </div>

        {/* Description & Tags */}
        <div className={`flex flex-col gap-2 ${isSubEvent ? 'mt-1' : 'mt-2'}`}>
          <p className="text-text-secondary text-sm leading-relaxed line-clamp-3">
            {event.description}
          </p>
          
          {/* Source Link */}
          {event.sourceUrl && (
             <a
                href={event.sourceUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-primary hover:text-primary-glow hover:underline flex items-center gap-1 w-fit mt-1"
             >
                Read more <span className="material-symbols-outlined text-[10px]">open_in_new</span>
             </a>
          )}

          <div className="flex flex-wrap gap-2 mt-2">
            {event.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-text-secondary border border-white/5 uppercase tracking-wider"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};