import React, { useState, useMemo, useEffect, useRef } from "react";
import { MOCK_EVENTS } from "./services/mockData";
import { TimelineEvent } from "./components/TimelineEvent";
import { TimelineModal } from "./components/TimelineModal";
import { HistoricalEvent, EventType } from "./types";

// --- Themes Configuration ---
interface LensTheme {
    id: string;
    label: string;
    icon: string;
    description: string;
    tags: string[]; // Empty = All
}

const LENSES: LensTheme[] = [
    { 
        id: 'all', 
        label: 'Grand Timeline', 
        icon: 'public', 
        description: 'The complete history of everything.',
        tags: [] 
    },
    { 
        id: 'cosmos', 
        label: 'Cosmic & Earth', 
        icon: 'planet', 
        description: 'From the Big Bang to the dawn of life.',
        tags: ['Cosmic', 'Earth', 'Space', 'Biology', 'Prehistory'] 
    },
    { 
        id: 'humanity', 
        label: 'Human Saga', 
        icon: 'swords', 
        description: 'War, politics, and the rise of nations.',
        tags: ['Politics', 'War', 'Society', 'Law', 'Government', 'Rome', 'Greece', 'UK', 'USA', 'France', 'China', 'Japan', 'Russia', 'History', 'Disaster'] 
    },
    { 
        id: 'innovation', 
        label: 'Innovation', 
        icon: 'science', 
        description: 'Scientific breakthroughs and technological marvels.',
        tags: ['Technology', 'Science', 'Industry', 'Aviation', 'Mobile', 'AI', 'Internet', 'Space', 'Health', 'Finance', 'Innovation', 'Physics'] 
    },
    { 
        id: 'culture', 
        label: 'Art & Culture', 
        icon: 'palette', 
        description: 'Religion, philosophy, and the arts.',
        tags: ['Art', 'Religion', 'Literature', 'Education', 'Philosophy', 'Culture', 'Architecture'] 
    },
];

const App: React.FC = () => {
  const mainRef = useRef<HTMLDivElement>(null);
  
  const [density, setDensity] = useState<number>(30); // 0 (Key) to 100 (All)
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<HistoricalEvent | null>(null);
  
  // Navigation & Filtering State
  const [activeLensId, setActiveLensId] = useState<string>('all');
  const [activeCustomTag, setActiveCustomTag] = useState<string | null>(null);
  const [showLensMenu, setShowLensMenu] = useState<boolean>(false);
  
  // Tag Explorer State
  const [tagSearch, setTagSearch] = useState<string>("");
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);

  // Derive active lens object
  const activeLens = LENSES.find(l => l.id === activeLensId) || LENSES[0];

  // Helper: Compute visible events
  const visibleEvents = useMemo(() => {
    // If a lens is active (and not 'all'), we naturally want to see more details about that theme,
    // so we lower the importance threshold (effectively increasing zoom) unless the user manually set density very low.
    // However, to respect the slider, we calculate normally but user might need to slide up.
    // Better UX: relying on the slider state but ensuring the filter logic works.
    
    const importanceThreshold = 10 - (density / 10); 

    return MOCK_EVENTS.filter((event) => {
        // 1. Search Query (Highest priority)
        if (searchQuery.trim().length > 0) {
            const query = searchQuery.toLowerCase();
            const matchesSearch = (
                event.title.toLowerCase().includes(query) ||
                event.description.toLowerCase().includes(query) ||
                event.yearDisplay.toLowerCase().includes(query)
            );
            if (!matchesSearch) return false;
        }

        // 2. Custom Tag Filter (Overrides Lens)
        if (activeCustomTag) {
            // Strict filtering for custom tags. 
            // We do NOT strictly filter Eras here to allow context, UNLESS the Era itself doesn't match and isn't a parent.
            // Simplified: If event doesn't have tag, hide it. 
            if (!event.tags.includes(activeCustomTag) && event.type !== EventType.ERA) return false;
            
            // For Eras: optionally hide if they really don't match, but keeping them usually looks better.
            // Let's hide Eras that are completely irrelevant to reduce noise in "Tag Mode".
            if (event.type === EventType.ERA && !event.tags.includes(activeCustomTag)) {
                // Check if any of its children (by time approx or manual parentId) match? 
                // Too complex for mock. Simple tag check.
                // We added tags to Eras in mockData, so this should work better now.
                return false; 
            }
        } 
        // 3. Lens Filter
        else if (activeLens.tags.length > 0) {
            const hasTag = event.tags.some(t => activeLens.tags.includes(t));
            
            if (!hasTag) {
                // If it's an Era, we usually want to keep it for structure, BUT if it's completely unrelated to the theme 
                // (e.g. "Middle Ages" in a "Cosmic" lens), we should probably hide it.
                // We updated Mock Data to include relevant tags on Eras.
                // So now we can strictly filter Eras too.
                return false;
            }
        }

        // 4. Importance/Density
        // Eras always show if they passed the filter above
        if (event.type === EventType.ERA) return true;
        
        // Check importance
        return event.importance >= importanceThreshold;
    });
  }, [density, searchQuery, activeLens, activeCustomTag]);

  // Extract Top Tags for "Explore" menu
  const availableTags = useMemo(() => {
    const uniqueTags = new Set<string>();
    MOCK_EVENTS.forEach(e => e.tags.forEach(t => uniqueTags.add(t)));
    return Array.from(uniqueTags).sort();
  }, []);

  // Filtered tags for dropdown
  const filteredTagSuggestions = useMemo(() => {
     if (!tagSearch) return availableTags;
     return availableTags.filter(t => t.toLowerCase().includes(tagSearch.toLowerCase()));
  }, [availableTags, tagSearch]);

  // --- Handlers ---

  const handleShuffle = () => {
    const candidates = visibleEvents.filter(e => e.type !== EventType.ERA);
    if (candidates.length === 0) return;

    const randomIdx = Math.floor(Math.random() * candidates.length);
    const target = candidates[randomIdx];

    const element = document.getElementById(`event-${target.id}`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
            setSelectedEvent(target);
        }, 600);
    }
  };

  const handleSelectLens = (lensId: string) => {
    setActiveLensId(lensId);
    setActiveCustomTag(null); 
    setTagSearch(""); // Reset tag search
    setShowLensMenu(false);
    setSearchQuery('');
    
    // Auto-adjust density for specific lenses to ensure content is visible
    if (lensId !== 'all') {
        setDensity(80); 
    } else {
        setDensity(30); // Reset to default for 'All'
    }

    if (mainRef.current) {
        mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectTag = (tag: string) => {
    setActiveCustomTag(tag);
    setActiveLensId('all'); 
    setShowLensMenu(false);
    setSearchQuery('');
    setDensity(100); // Max density for specific tag view
    
    if (mainRef.current) {
        mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleReset = () => {
    setActiveLensId('all');
    setActiveCustomTag(null);
    setTagSearch("");
    setDensity(30);
    setSearchQuery("");
    if (mainRef.current) {
        mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Header */}
      <header className="flex-none bg-background-dark/95 backdrop-blur-md z-30 border-b border-white/5 sticky top-0 transition-colors duration-500">
        <div className="flex items-center p-4 justify-between">
          <button 
            className="text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            onClick={() => setShowLensMenu(!showLensMenu)}
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
          
          <div className="flex flex-col items-center flex-1 pr-10">
            <h1 className="text-white text-lg font-bold leading-tight tracking-tight font-display">
                Chronicles
            </h1>
            {/* Active Context Indicator */}
            {(activeLensId !== 'all' || activeCustomTag) && (
                <div className="flex items-center gap-1 mt-0.5 animate-fade-in">
                    <span className="text-[10px] uppercase tracking-widest text-primary font-bold">
                        {activeCustomTag ? `#${activeCustomTag}` : activeLens.label}
                    </span>
                    {activeCustomTag && (
                        <button onClick={() => {setActiveCustomTag(null); setTagSearch("");}} className="text-text-secondary hover:text-white">
                            <span className="material-symbols-outlined text-[12px]">close</span>
                        </button>
                    )}
                </div>
            )}
          </div>
          
          <div className="w-10"></div>
        </div>
      </header>

      {/* Main Content */}
      <main ref={mainRef} className="flex-1 overflow-y-auto no-scrollbar relative scroll-smooth">
        {/* Search Bar */}
        <div className="sticky top-0 z-20 px-4 py-3 bg-gradient-to-b from-background-dark via-background-dark/95 to-transparent pb-6">
          <div className="flex w-full items-center rounded-lg bg-[#282e39]/80 backdrop-blur-md border border-white/10 shadow-lg h-12 transition-all focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
            <div className="text-text-secondary flex items-center justify-center pl-3">
              <span className="material-symbols-outlined text-2xl">search</span>
            </div>
            <input
              className="flex w-full bg-transparent border-none text-white placeholder:text-text-secondary focus:ring-0 px-3 text-base font-normal h-full outline-none"
              placeholder="Find events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
                 <button onClick={() => setSearchQuery('')} className="pr-3 text-text-secondary hover:text-white">
                    <span className="material-symbols-outlined text-lg">cancel</span>
                 </button>
            )}
          </div>
        </div>

        {/* Timeline Container */}
        <div className="relative px-4 pb-36 pt-2 max-w-3xl mx-auto min-h-[50vh]">
          {/* Vertical Line */}
          <div className="absolute left-[34px] md:left-[40px] top-0 bottom-0 w-[2px] timeline-gradient z-0"></div>

          {/* Events List */}
          {visibleEvents.length === 0 ? (
            <div className="text-center py-20 text-text-secondary animate-fade-in">
                <span className="material-symbols-outlined text-4xl mb-4 opacity-50">filter_list_off</span>
                <p className="text-lg font-medium text-white mb-2">No events found.</p>
                <p className="text-sm">Try adjusting your search, filters,<br/>or the density slider below.</p>
                <button 
                    onClick={handleReset}
                    className="mt-6 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-full text-sm font-medium transition-colors"
                >
                    Reset Everything
                </button>
            </div>
          ) : (
            visibleEvents.map((event, index) => (
                <TimelineEvent 
                    key={event.id} 
                    event={event} 
                    index={index}
                    onSelect={setSelectedEvent}
                />
            ))
          )}
        </div>
      </main>

      {/* --- LENS MENU OVERLAY --- */}
      {showLensMenu && (
        <div className="absolute inset-0 z-40 bg-background-dark/95 backdrop-blur-xl animate-fade-in flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Filters & Lenses</h2>
                <button 
                    onClick={() => setShowLensMenu(false)}
                    className="size-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                
                {/* 1. Tag Explorer Section */}
                <div className="mb-8">
                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3 pl-1 flex justify-between items-center">
                        <span>Tag Explorer</span>
                        {activeCustomTag && (
                            <button 
                                onClick={() => {setActiveCustomTag(null); setTagSearch("");}}
                                className="text-primary text-[10px] bg-primary/10 px-2 py-1 rounded hover:bg-primary/20 transition-colors"
                            >
                                CLEAR FILTER
                            </button>
                        )}
                    </h3>
                    <div className="relative group">
                         <div className="flex items-center bg-surface-dark border border-white/10 rounded-lg focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                            <span className="material-symbols-outlined text-text-secondary pl-3">tag</span>
                            <input 
                                type="text"
                                className="bg-transparent border-none text-white w-full h-10 px-3 focus:ring-0 text-sm placeholder:text-text-secondary/50"
                                placeholder="Search tags (e.g. Science, War)..."
                                value={tagSearch}
                                onChange={(e) => {
                                    setTagSearch(e.target.value);
                                    setIsTagDropdownOpen(true);
                                }}
                                onFocus={() => setIsTagDropdownOpen(true)}
                            />
                            {tagSearch && (
                                <button onClick={() => setTagSearch('')} className="pr-3 text-text-secondary hover:text-white">
                                    <span className="material-symbols-outlined text-base">cancel</span>
                                </button>
                            )}
                         </div>

                         {/* Dropdown Suggestions */}
                         {(isTagDropdownOpen || tagSearch) && (
                            <div className="mt-2 max-h-48 overflow-y-auto bg-surface-dark border border-white/10 rounded-lg shadow-2xl p-1 grid grid-cols-2 gap-1 custom-scrollbar">
                                {filteredTagSuggestions.length > 0 ? (
                                    filteredTagSuggestions.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => {
                                                handleSelectTag(tag);
                                                setTagSearch(tag);
                                                setIsTagDropdownOpen(false);
                                            }}
                                            className={`text-left px-3 py-2 rounded text-xs transition-colors ${
                                                activeCustomTag === tag 
                                                    ? 'bg-primary text-white font-bold' 
                                                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                            }`}
                                        >
                                            #{tag}
                                        </button>
                                    ))
                                ) : (
                                    <div className="col-span-2 p-3 text-center text-text-secondary text-xs">
                                        No tags match "{tagSearch}"
                                    </div>
                                )}
                            </div>
                         )}
                    </div>
                </div>

                {/* 2. Curated Themes Section */}
                <div className="mb-6">
                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3 pl-1">Curated Lenses</h3>
                    <div className="grid gap-3">
                        {LENSES.map(lens => (
                            <button
                                key={lens.id}
                                onClick={() => handleSelectLens(lens.id)}
                                className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left group ${
                                    activeLensId === lens.id && !activeCustomTag
                                        ? 'bg-primary/20 border-primary shadow-glow'
                                        : 'bg-surface-dark border-white/5 hover:border-white/10'
                                }`}
                            >
                                <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${
                                     activeLensId === lens.id && !activeCustomTag ? 'bg-primary text-white' : 'bg-white/5 text-text-secondary group-hover:text-white'
                                }`}>
                                    <span className="material-symbols-outlined">{lens.icon}</span>
                                </div>
                                <div>
                                    <div className={`font-bold text-base ${activeLensId === lens.id && !activeCustomTag ? 'text-white' : 'text-gray-200'}`}>
                                        {lens.label}
                                    </div>
                                    <div className="text-xs text-text-secondary mt-0.5 line-clamp-1">
                                        {lens.description}
                                    </div>
                                </div>
                                {activeLensId === lens.id && !activeCustomTag && (
                                    <span className="material-symbols-outlined text-primary ml-auto">check_circle</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

            </div>
        </div>
      )}

      {/* Density Slider Controls (Floating) */}
      {!showLensMenu && (
        <div className="fixed left-4 right-4 bottom-24 z-30 max-w-md mx-auto pointer-events-none">
            <div className="bg-surface-dark/90 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl ring-1 ring-white/5 flex items-center gap-3 animate-slide-up pointer-events-auto">
            <div className="flex flex-col items-center justify-center w-10 text-text-secondary cursor-pointer" onClick={() => setDensity(0)}>
                <span className={`material-symbols-outlined text-lg mb-0.5 transition-colors ${density < 20 ? 'text-primary' : ''}`}>star</span>
                <span className="text-[9px] font-bold uppercase tracking-wide">Key</span>
            </div>
            
            <div className="relative flex-1 h-6 flex items-center">
                <div className="absolute w-full h-1.5 bg-background-dark rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-primary transition-all duration-100" 
                        style={{ width: `${density}%` }}
                    ></div>
                </div>
                
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={density}
                    onChange={(e) => setDensity(parseInt(e.target.value))}
                    className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                    aria-label="Zoom Level"
                />
                
                <div 
                    className="absolute size-4 bg-white rounded-full shadow-glow pointer-events-none transition-all duration-100"
                    style={{ left: `calc(${density}% - 8px)` }}
                ></div>
            </div>

            <div className="flex flex-col items-center justify-center w-10 text-text-secondary cursor-pointer" onClick={() => setDensity(100)}>
                <span className={`material-symbols-outlined text-lg mb-0.5 transition-colors ${density > 80 ? 'text-primary' : ''}`}>grain</span>
                <span className="text-[9px] font-bold uppercase tracking-wide">All</span>
            </div>
            </div>
        </div>
      )}

      {/* Floating Action Button (Shuffle) */}
      <div className="fixed right-4 bottom-48 z-30 md:right-8">
        <button 
            onClick={handleShuffle}
            className="flex items-center justify-center size-14 rounded-full bg-gradient-to-tr from-primary to-primary-glow text-white shadow-glow hover:shadow-glow-lg transition-all hover:scale-110 active:scale-95 group"
            title="Serendipity Shuffle"
        >
          <span className="material-symbols-outlined text-3xl group-hover:rotate-180 transition-transform duration-500">shuffle</span>
        </button>
      </div>

      {/* Updated Bottom Navigation */}
      <nav className="flex-none bg-surface-dark border-t border-white/5 px-6 pb-6 pt-3 z-30">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <NavIcon 
            icon="home" 
            label="Home" 
            active={activeLensId === 'all' && !activeCustomTag}
            onClick={handleReset}
          />
          <NavIcon 
            icon="filter_alt" 
            label="Lenses" 
            active={showLensMenu || (activeLensId !== 'all' || activeCustomTag !== null)}
            onClick={() => setShowLensMenu(true)}
          />
          <NavIcon 
            icon="shuffle" 
            label="Surprise" 
            onClick={handleShuffle}
          />
        </div>
      </nav>

      {/* Details Modal */}
      <TimelineModal 
        event={selectedEvent} 
        onClose={() => setSelectedEvent(null)} 
      />
    </>
  );
};

const NavIcon: React.FC<{ icon: string; label: string; active?: boolean; onClick: () => void }> = ({
  icon,
  label,
  active,
  onClick
}) => (
  <button 
    className="flex flex-col items-center gap-1 group cursor-pointer bg-transparent border-none w-16" 
    onClick={onClick}
  >
    <div
      className={`flex items-center justify-center size-8 rounded-full transition-colors ${
        active
          ? "bg-primary/20 text-primary"
          : "text-text-secondary group-hover:bg-white/5 group-hover:text-white"
      }`}
    >
      <span className="material-symbols-outlined text-[24px]">{icon}</span>
    </div>
    <span
      className={`text-xs font-medium transition-colors ${
        active ? "text-white" : "text-text-secondary group-hover:text-white"
      }`}
    >
      {label}
    </span>
  </button>
);

export default App;