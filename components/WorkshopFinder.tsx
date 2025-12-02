import React, { useState, useEffect } from 'react';
import { MapPin, Star, Navigation, Loader2, ExternalLink } from 'lucide-react';
import { getNearbyWorkshops } from '../services/geminiService';
import { GroundingChunk } from '../types';
import ReactMarkdown from 'react-markdown';

export const WorkshopFinder: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');
  const [chunks, setChunks] = useState<GroundingChunk[]>([]);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    // Initial load: get location
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          fetchWorkshops(position.coords.latitude, position.coords.longitude);
        },
        (err) => {
          setLoading(false);
          setError("Location access denied. Cannot find nearby workshops.");
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchWorkshops = async (lat: number, lng: number) => {
    try {
      const result = await getNearbyWorkshops(lat, lng);
      setContent(result.text);
      setChunks(result.chunks);
    } catch (e) {
      setError("Failed to fetch workshop data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-full flex flex-col">
      <div className="bg-slate-900 text-white p-6 rounded-3xl mb-6 shadow-xl shadow-slate-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
            <MapPin size={20} className="text-blue-200" />
          </div>
          <h2 className="text-xl font-bold">Nearby Mechanics</h2>
        </div>
        <p className="text-slate-400 text-sm">
          AI-recommended workshops based on your current location and ratings.
        </p>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 py-10">
          <Loader2 className="animate-spin text-blue-500" size={32} />
          <p className="text-sm font-medium">Scanning area...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-center text-sm">
          {error}
          <button 
            onClick={() => window.location.reload()}
            className="block w-full mt-2 font-bold underline"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Main AI Response Text */}
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 prose prose-sm prose-slate max-w-none">
             <ReactMarkdown>{content}</ReactMarkdown>
          </div>

          {/* Extracted Links / Sources */}
          {chunks.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Locations Found</h3>
              <div className="space-y-3">
                {chunks.map((chunk, i) => {
                  const mapData = chunk.maps;
                  if (!mapData) return null;
                  
                  return (
                    <a 
                      key={i} 
                      href={mapData.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                            {mapData.title}
                          </h4>
                          {mapData.placeAnswerSources?.reviewSnippets?.[0] && (
                             <p className="text-xs text-slate-500 mt-2 italic line-clamp-2">
                               "{mapData.placeAnswerSources.reviewSnippets[0].reviewText}"
                             </p>
                          )}
                        </div>
                        <ExternalLink size={16} className="text-slate-300 group-hover:text-blue-500" />
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
