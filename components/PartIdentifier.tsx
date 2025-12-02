import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2, Info } from 'lucide-react';
import { identifyCarPart } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface PartIdentifierProps {
  vehicleName: string;
}

export const PartIdentifier: React.FC<PartIdentifierProps> = ({ vehicleName }) => {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImage(base64);
      analyzeImage(base64.split(',')[1]); // Remove data:image/jpeg;base64, prefix
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async (base64Data: string) => {
    setAnalyzing(true);
    setResult(null);
    const text = await identifyCarPart(base64Data, vehicleName);
    setResult(text);
    setAnalyzing(false);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 rounded-3xl text-white shadow-lg shadow-emerald-100 mb-6">
        <h2 className="text-xl font-bold mb-1">Part Scanner</h2>
        <p className="text-emerald-100 text-sm">Snap a photo of a car part or barcode to identify it and get replacement info.</p>
      </div>

      <div className="flex-1 flex flex-col">
        {!image ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 border-2 border-dashed border-slate-300 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-blue-400 transition-colors min-h-[300px]"
          >
            <div className="bg-blue-50 p-4 rounded-full text-blue-500 mb-4">
              <Camera size={32} />
            </div>
            <p className="font-semibold text-slate-600">Tap to Take Photo</p>
            <p className="text-xs text-slate-400 mt-2">or upload from gallery</p>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative rounded-3xl overflow-hidden shadow-md max-h-64 w-full">
              <img src={image} alt="Captured Part" className="w-full h-full object-cover" />
              <button 
                onClick={() => { setImage(null); setResult(null); }}
                className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 backdrop-blur-md"
              >
                Retake
              </button>
            </div>

            {analyzing ? (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center gap-3">
                <Loader2 className="animate-spin text-blue-600" />
                <span className="text-slate-600 font-medium">Analyzing with Gemini AI...</span>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-4 text-emerald-600">
                  <Info size={18} />
                  <span className="font-bold uppercase text-xs tracking-wider">Analysis Result</span>
                </div>
                <div className="prose prose-sm prose-slate max-w-none">
                  <ReactMarkdown>{result || ''}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
