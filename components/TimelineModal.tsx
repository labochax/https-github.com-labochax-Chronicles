import React, { useEffect, useState, useRef } from 'react';
import { HistoricalEvent } from '../types';
import { getEventSummary, createEventChatSession, sendEventChatMessage, generateEventImage, ChatMessage } from '../services/geminiService';
import { Chat } from '@google/genai';

interface TimelineModalProps {
  event: HistoricalEvent | null;
  onClose: () => void;
}

type ModalTab = 'overview' | 'chat' | 'visualize';

export const TimelineModal: React.FC<TimelineModalProps> = ({ event, onClose }) => {
  const [activeTab, setActiveTab] = useState<ModalTab>('overview');
  
  // Overview State
  const [aiSummary, setAiSummary] = useState<string>('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Chat State
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Visualize State
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  // Initialization when event opens
  useEffect(() => {
    if (event) {
      // Reset all states
      setActiveTab('overview');
      setAiSummary('');
      setGeneratedImage(null);
      setChatHistory([{ role: 'model', text: `Hello! I'm your AI historian for "${event.title}". What would you like to know?` }]);
      setChatSession(createEventChatSession(event));
    }
  }, [event]);

  // Auto-scroll chat
  useEffect(() => {
    if (activeTab === 'chat') {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, activeTab]);

  // Handlers
  const handleAiSummarize = async () => {
    if (!event) return;
    setSummaryLoading(true);
    const summary = await getEventSummary(event);
    setAiSummary(summary);
    setSummaryLoading(false);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim() || !event) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatLoading(true);

    const responseText = await sendEventChatMessage(chatSession, userMsg);
    
    setChatHistory(prev => [...prev, { role: 'model', text: responseText }]);
    setChatLoading(false);
  };

  const handleGenerateImage = async () => {
    if (!event) return;
    setImageLoading(true);
    const imgData = await generateEventImage(event);
    setGeneratedImage(imgData);
    setImageLoading(false);
  };

  if (!event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-background-dark/90 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative bg-[#1c1f27] w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col h-[85vh] animate-slide-up">
        
        {/* Header Image (Always visible as banner) */}
        <div className="h-40 w-full relative shrink-0">
            <img 
                src={event.imageUrl || `https://picsum.photos/seed/${event.id}/800/400`} 
                alt={event.title} 
                className="w-full h-full object-cover opacity-60" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1c1f27] to-transparent"></div>
            
            {/* Close Button */}
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 backdrop-blur-md transition-colors z-20"
            >
                <span className="material-symbols-outlined">close</span>
            </button>

            {/* Title Overlay */}
            <div className="absolute bottom-4 left-6 right-6">
                <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-primary/80 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                        {event.yearDisplay}
                    </span>
                    <span className="text-gray-300 text-xs font-medium uppercase tracking-widest border-l border-white/20 pl-2">
                        {event.type.replace('_', ' ')}
                    </span>
                </div>
                <h2 className="text-2xl font-bold text-white leading-tight shadow-black drop-shadow-md">
                    {event.title}
                </h2>
            </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/5 bg-white/5">
            <button 
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === 'overview' ? 'text-white' : 'text-text-secondary hover:text-gray-300'}`}
            >
                Overview
                {activeTab === 'overview' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-glow"></div>}
            </button>
            <button 
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-3 text-sm font-medium transition-colors relative flex items-center justify-center gap-2 ${activeTab === 'chat' ? 'text-white' : 'text-text-secondary hover:text-gray-300'}`}
            >
                <span className="material-symbols-outlined text-base">chat_bubble</span>
                Chat
                {activeTab === 'chat' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-glow"></div>}
            </button>
            <button 
                onClick={() => setActiveTab('visualize')}
                className={`flex-1 py-3 text-sm font-medium transition-colors relative flex items-center justify-center gap-2 ${activeTab === 'visualize' ? 'text-white' : 'text-text-secondary hover:text-gray-300'}`}
            >
                <span className="material-symbols-outlined text-base">image</span>
                Visualize
                {activeTab === 'visualize' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-glow"></div>}
            </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden relative bg-surface-dark">
            
            {/* --- OVERVIEW TAB --- */}
            {activeTab === 'overview' && (
                <div className="h-full overflow-y-auto custom-scrollbar p-6 animate-fade-in">
                    <p className="text-gray-300 leading-relaxed text-lg mb-6">
                        {event.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-8">
                        {event.tags.map(tag => (
                            <span key={tag} className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs text-text-secondary">
                                #{tag}
                            </span>
                        ))}
                    </div>

                    {/* AI Insight Box */}
                    <div className="bg-gradient-to-br from-primary/10 to-transparent rounded-xl p-5 border border-primary/20 mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-primary">
                                <span className="material-symbols-outlined">auto_awesome</span>
                                <span className="font-semibold text-sm">AI Analysis</span>
                            </div>
                            {!aiSummary && !summaryLoading && (
                                <button 
                                    onClick={handleAiSummarize}
                                    className="text-xs bg-primary hover:bg-primary-glow text-white px-3 py-1.5 rounded-full transition-colors shadow-glow"
                                >
                                    Generate Insight
                                </button>
                            )}
                        </div>
                        
                        {summaryLoading && (
                            <div className="flex items-center gap-2 text-text-secondary text-sm animate-pulse py-2">
                                <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                                Analyzing historical archives...
                            </div>
                        )}
                        
                        {aiSummary && (
                            <p className="text-sm text-gray-200 leading-relaxed italic border-l-2 border-primary/50 pl-3 animate-fade-in">
                                "{aiSummary}"
                            </p>
                        )}
                    </div>

                    {/* External Link */}
                    {event.sourceUrl && (
                        <a 
                            href={event.sourceUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/5 font-medium"
                        >
                            <span>Read Original Source</span>
                            <span className="material-symbols-outlined text-sm">open_in_new</span>
                        </a>
                    )}
                </div>
            )}

            {/* --- CHAT TAB --- */}
            {activeTab === 'chat' && (
                <div className="h-full flex flex-col animate-fade-in">
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
                        {chatHistory.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                                    msg.role === 'user' 
                                        ? 'bg-primary text-white rounded-tr-none' 
                                        : 'bg-white/10 text-gray-200 rounded-tl-none border border-white/5'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {chatLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white/10 rounded-2xl rounded-tl-none px-4 py-3 flex gap-1 items-center">
                                    <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce delay-100"></div>
                                    <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce delay-200"></div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>
                    
                    <form onSubmit={handleSendMessage} className="p-4 bg-background-dark/50 border-t border-white/5">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Ask about this event..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-text-secondary/50"
                            />
                            <button 
                                type="submit"
                                disabled={!chatInput.trim() || chatLoading}
                                className="size-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <span className="material-symbols-outlined text-lg">send</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* --- VISUALIZE TAB --- */}
            {activeTab === 'visualize' && (
                <div className="h-full flex flex-col items-center justify-center p-6 animate-fade-in text-center">
                    
                    {!generatedImage && !imageLoading && (
                        <div className="flex flex-col items-center max-w-sm">
                            <div className="size-20 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                                <span className="material-symbols-outlined text-4xl text-primary">palette</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Reimagine History</h3>
                            <p className="text-text-secondary text-sm mb-6">
                                Use AI to generate a unique, artistic representation of this event based on historical records.
                            </p>
                            <button 
                                onClick={handleGenerateImage}
                                className="px-6 py-3 bg-gradient-to-r from-primary to-primary-glow text-white rounded-full font-bold shadow-glow hover:scale-105 transition-transform flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined">auto_awesome</span>
                                Generate Scene
                            </button>
                        </div>
                    )}

                    {imageLoading && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative size-24">
                                <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                            </div>
                            <p className="text-primary font-medium animate-pulse">Painting historical scene...</p>
                            <p className="text-text-secondary text-xs">This may take a few seconds.</p>
                        </div>
                    )}

                    {generatedImage && (
                        <div className="flex flex-col items-center w-full h-full">
                            <div className="relative w-full flex-1 rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-black/50 mb-4 group">
                                <img 
                                    src={generatedImage} 
                                    alt="AI Generated" 
                                    className="w-full h-full object-contain"
                                />
                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a 
                                        href={generatedImage} 
                                        download={`chronicles-${event.id}.png`}
                                        className="size-8 bg-black/60 backdrop-blur text-white rounded-full flex items-center justify-center hover:bg-black/80"
                                        title="Download"
                                    >
                                        <span className="material-symbols-outlined text-sm">download</span>
                                    </a>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button 
                                    onClick={handleGenerateImage}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-lg">refresh</span>
                                    Regenerate
                                </button>
                                <span className="text-xs text-text-secondary flex items-center">
                                    Generated by Gemini 2.5 Flash Image
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};