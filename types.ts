export enum EventType {
    ERA = 'ERA',
    EVENT = 'EVENT',
    SUB_EVENT = 'SUB_EVENT'
}

export interface HistoricalEvent {
    id: string;
    type: EventType;
    title: string;
    year: number;
    yearDisplay: string; // e.g. "1764" or "2000 BC"
    dateDisplay?: string; // e.g. "May 15th"
    description: string;
    longDescription?: string; // For AI summary or modal
    imageUrl?: string;
    importance: number; // 1-10, used for zooming. 10 = Always visible, 1 = Deep zoom only.
    tags: string[];
    sourceUrl?: string;
    parentId?: string; // For clustering
}

export interface TimelineState {
    density: number; // 0 to 100
    searchQuery: string;
    selectedEventId: string | null;
}