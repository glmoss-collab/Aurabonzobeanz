
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Camera, Upload, Trash2, Sparkles, Wand2, Filter, Palette, RefreshCcw, AlertCircle, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import Button from './components/Button';
import OutfitCard from './components/OutfitCard';
import { analyzeItem, generateOutfitImage, getGeminiErrorMessage } from './services/geminiService';
import { takePhoto, getImageDataUrl, getCameraErrorMessage, isUserCancellation } from './services/cameraService';
import {
  processImageFile,
  processBase64Image,
  getErrorMessage,
  formatFileSize,
  IMAGE_CONFIG,
} from './services/imageValidationService';
import { AnalysisResult, OutfitSuggestion, StyleType } from './types';

// Toast notification component
interface ToastProps {
  message: string;
  type: 'error' | 'warning' | 'info';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'error' ? 'bg-red-50 border-red-200' : type === 'warning' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200';
  const textColor = type === 'error' ? 'text-red-800' : type === 'warning' ? 'text-amber-800' : 'text-blue-800';
  const iconColor = type === 'error' ? 'text-red-500' : type === 'warning' ? 'text-amber-500' : 'text-blue-500';

  return (
    <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[90%] ${bgColor} border rounded-2xl p-4 shadow-lg animate-in slide-in-from-top-4 duration-300`}>
      <div className="flex items-start gap-3">
        <AlertCircle className={`${iconColor} shrink-0 mt-0.5`} size={20} />
        <p className={`${textColor} text-sm flex-1`}>{message}</p>
        <button onClick={onClose} className={`${iconColor} hover:opacity-70`}>
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [outfits, setOutfits] = useState<OutfitSuggestion[]>([]);
  const [activeColorFilter, setActiveColorFilter] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'warning' | 'info' } | null>(null);
  const isNative = Capacitor.isNativePlatform();

  // Refs for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  const imageUrlsRef = useRef<Set<string>>(new Set());

  // Cleanup function for memory management
  const cleanupImageUrls = useCallback(() => {
    imageUrlsRef.current.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    imageUrlsRef.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupImageUrls();
      abortControllerRef.current?.abort();
    };
  }, [cleanupImageUrls]);

  const showToast = useCallback((message: string, type: 'error' | 'warning' | 'info' = 'error') => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  // Handle file upload for web with validation and compression
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input for re-selection of same file
    e.target.value = '';

    setIsProcessingImage(true);
    try {
      const processed = await processImageFile(file);

      // Show compression info if image was compressed
      if (processed.wasCompressed) {
        const saved = processed.originalSize - processed.processedSize;
        if (saved > 100 * 1024) { // Only show if saved > 100KB
          showToast(
            `Image optimized: ${formatFileSize(processed.originalSize)} → ${formatFileSize(processed.processedSize)}`,
            'info'
          );
        }
      }

      // Clear previous state
      cleanupImageUrls();
      setImage(processed.dataUrl);
      setAnalysis(null);
      setOutfits([]);
      setActiveColorFilter(null);
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setIsProcessingImage(false);
    }
  }, [cleanupImageUrls, showToast]);

  // Handle camera/photo library for mobile with validation
  const handleMobileImageSelect = useCallback(async (source: 'camera' | 'library') => {
    setIsProcessingImage(true);
    try {
      const cameraImage = await takePhoto(source);
      if (!cameraImage) {
        return; // User cancelled or no image
      }

      // Process and validate the image
      const processed = await processBase64Image(cameraImage.base64String, cameraImage.format);

      // Show compression info
      if (processed.wasCompressed) {
        const saved = processed.originalSize - processed.processedSize;
        if (saved > 100 * 1024) {
          showToast(
            `Image optimized for faster analysis`,
            'info'
          );
        }
      }

      // Clear previous state
      cleanupImageUrls();
      setImage(processed.dataUrl);
      setAnalysis(null);
      setOutfits([]);
      setActiveColorFilter(null);
    } catch (error) {
      // Don't show error for user cancellation
      if (!isUserCancellation(error)) {
        showToast(getCameraErrorMessage(error), 'error');
      }
    } finally {
      setIsProcessingImage(false);
    }
  }, [cleanupImageUrls, showToast]);

  const clearImage = useCallback(() => {
    // Abort any ongoing requests
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

    // Clean up memory
    cleanupImageUrls();

    setImage(null);
    setAnalysis(null);
    setOutfits([]);
    setActiveColorFilter(null);
  }, [cleanupImageUrls]);

  const startStyling = useCallback(async () => {
    if (!image) return;

    // Abort previous request if any
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      setIsAnalyzing(true);
      const result = await analyzeItem(image);
      setAnalysis(result);

      const initialOutfits: OutfitSuggestion[] = result.suggestions.map(s => ({
        type: s.type as StyleType,
        description: s.description,
        colorsUsed: s.colorsUsed,
        isGenerating: true
      }));
      setOutfits(initialOutfits);

      // Generate images with proper error handling
      const generateImage = async (outfit: OutfitSuggestion, index: number) => {
        try {
          const imageUrl = await generateOutfitImage(result.description, outfit.description, outfit.type);

          // Track generated image URL for cleanup
          imageUrlsRef.current.add(imageUrl);

          setOutfits(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], imageUrl, isGenerating: false };
            return updated;
          });
        } catch (err) {
          const errorMessage = getGeminiErrorMessage(err);
          setOutfits(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], isGenerating: false, error: errorMessage };
            return updated;
          });
        }
      };

      // Generate all images concurrently
      await Promise.allSettled(
        initialOutfits.map((outfit, index) => generateImage(outfit, index))
      );

    } catch (err) {
      const errorMessage = getGeminiErrorMessage(err);
      showToast(errorMessage, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  }, [image, showToast]);

  const filteredOutfits = useMemo(() => {
    if (!activeColorFilter) return outfits;
    return outfits.filter(o =>
      o.colorsUsed.some(c => c.toLowerCase() === activeColorFilter.toLowerCase())
    );
  }, [outfits, activeColorFilter]);

  const updateOutfitImage = useCallback((index: number, newImageUrl: string) => {
    // Track new image URL for cleanup
    imageUrlsRef.current.add(newImageUrl);

    setOutfits(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], imageUrl: newImageUrl };
      return updated;
    });
  }, []);

  const toggleFilter = useCallback((color: string) => {
    setActiveColorFilter(prev => prev === color ? null : color);
  }, []);

  return (
    <div className="min-h-screen pb-20 bg-[#FBFBFB]">
      {/* Toast notification */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Sparkles className="text-white w-4 h-4" />
            </div>
            <h1 className="text-lg font-bold tracking-widest">AURA <span className="font-light text-zinc-400">STYLIST</span></h1>
          </div>
          <nav className="hidden md:flex gap-8 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
            <a href="#" className="hover:text-black transition-colors">Trends</a>
            <a href="#" className="hover:text-black transition-colors">Archive</a>
            <a href="#" className="hover:text-black transition-colors">Vault</a>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-16">
        <div className="grid lg:grid-cols-12 gap-16">

          <div className="lg:col-span-4">
            <div className="sticky top-32 space-y-12">
              <div>
                <h2 className="text-5xl md:text-6xl font-serif mb-6 leading-[1.1]">
                  Style<br /><span className="text-zinc-300">Intelligent.</span>
                </h2>
                <p className="text-zinc-500 max-w-sm font-light leading-relaxed">
                  Bridge the gap between your wardrobe and color theory. Upload an item to unlock three curated worlds.
                </p>
              </div>

              {!image ? (
                <div className="space-y-4">
                  {isNative ? (
                    // Mobile: Show camera and library buttons
                    <>
                      <button
                        onClick={() => handleMobileImageSelect('camera')}
                        disabled={isProcessingImage}
                        className="group relative w-full border-2 border-dashed border-zinc-200 rounded-[2.5rem] p-12 transition-all hover:border-black hover:bg-white text-center disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex flex-col items-center gap-6">
                          <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center group-hover:bg-zinc-100 transition-all duration-500">
                            {isProcessingImage ? (
                              <div className="w-8 h-8 border-2 border-zinc-300 border-t-black rounded-full animate-spin" />
                            ) : (
                              <Camera className="text-zinc-300 w-8 h-8 group-hover:text-black transition-colors" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-900 mb-1">Take Photo</p>
                            <p className="text-xs text-zinc-400 uppercase tracking-widest">Use Camera</p>
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => handleMobileImageSelect('library')}
                        disabled={isProcessingImage}
                        className="group relative w-full border-2 border-dashed border-zinc-200 rounded-[2.5rem] p-12 transition-all hover:border-black hover:bg-white text-center disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex flex-col items-center gap-6">
                          <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center group-hover:bg-zinc-100 transition-all duration-500">
                            {isProcessingImage ? (
                              <div className="w-8 h-8 border-2 border-zinc-300 border-t-black rounded-full animate-spin" />
                            ) : (
                              <Upload className="text-zinc-300 w-8 h-8 group-hover:text-black transition-colors" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-900 mb-1">Choose from Library</p>
                            <p className="text-xs text-zinc-400 uppercase tracking-widest">Select Photo</p>
                          </div>
                        </div>
                      </button>
                    </>
                  ) : (
                    // Web: Show file input
                    <div className="group relative border-2 border-dashed border-zinc-200 rounded-[2.5rem] p-16 transition-all hover:border-black hover:bg-white text-center">
                      <input
                        type="file"
                        accept={IMAGE_CONFIG.ALLOWED_TYPES.join(',')}
                        onChange={handleFileUpload}
                        disabled={isProcessingImage}
                        className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <div className="flex flex-col items-center gap-6">
                        <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center group-hover:bg-zinc-100 transition-all duration-500">
                          {isProcessingImage ? (
                            <div className="w-8 h-8 border-2 border-zinc-300 border-t-black rounded-full animate-spin" />
                          ) : (
                            <Upload className="text-zinc-300 w-8 h-8 group-hover:text-black transition-colors" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-900 mb-1">
                            {isProcessingImage ? 'Processing...' : 'Upload Garment'}
                          </p>
                          <p className="text-xs text-zinc-400 uppercase tracking-widest">
                            {isProcessingImage ? 'Optimizing image' : 'Drag & Drop or Click'}
                          </p>
                          <p className="text-[10px] text-zinc-300 mt-2">
                            Max {formatFileSize(IMAGE_CONFIG.MAX_FILE_SIZE)} • JPEG, PNG, WebP
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl bg-zinc-100 group">
                    <img src={image} alt="Selected item" className="w-full h-full object-cover grayscale-[0.2] transition-all duration-700 hover:grayscale-0 hover:scale-105" />
                    <button
                      onClick={clearImage}
                      className="absolute top-6 right-6 bg-white/90 p-3 rounded-full shadow-lg hover:bg-white text-zinc-600 transition-all hover:rotate-90"
                    >
                      <Trash2 size={18} />
                    </button>
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-md flex items-center justify-center">
                        <div className="flex flex-col items-center gap-6">
                          <div className="relative">
                             <div className="w-16 h-16 border-2 border-zinc-100 rounded-full"></div>
                             <div className="absolute inset-0 w-16 h-16 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                          </div>
                          <p className="font-bold text-[10px] uppercase tracking-[0.3em] text-black">Decoding Color DNA</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {!analysis && (
                    <Button
                      onClick={startStyling}
                      className="w-full py-5 text-sm uppercase tracking-widest rounded-2xl"
                      isLoading={isAnalyzing}
                    >
                      <Wand2 size={16} />
                      Curate Wardrobe
                    </Button>
                  )}
                </div>
              )}

              {analysis && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                  <div className="p-8 bg-white rounded-[2rem] border border-zinc-100 shadow-xl space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Palette size={18} className="text-zinc-900" />
                        <h3 className="font-bold text-xs uppercase tracking-[0.2em] text-zinc-900">Color Profile</h3>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-300 mb-4">Original Palette</p>
                        <div className="flex flex-wrap gap-3">
                          {analysis.originalPalette.map((color, i) => (
                            <button
                              key={i}
                              onClick={() => toggleFilter(color)}
                              className={`group relative w-12 h-12 rounded-2xl transition-all duration-300 border-2 ${activeColorFilter === color ? 'border-black scale-110 shadow-lg' : 'border-transparent hover:scale-105 hover:shadow-md'}`}
                              style={{ backgroundColor: color }}
                              title={`Filter by ${color}`}
                            >
                              {activeColorFilter === color && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="bg-white/40 backdrop-blur-sm rounded-full p-1">
                                    <Filter size={12} className="text-black" />
                                  </div>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-300 mb-4">Complimentary Accents</p>
                        <div className="flex flex-wrap gap-3">
                          {analysis.complimentaryPalette.map((color, i) => (
                            <button
                              key={i}
                              onClick={() => toggleFilter(color)}
                              className={`group relative w-12 h-12 rounded-2xl transition-all duration-300 border-2 ${activeColorFilter === color ? 'border-black scale-110 shadow-lg' : 'border-transparent hover:scale-105 hover:shadow-md'}`}
                              style={{ backgroundColor: color }}
                              title={`Filter by ${color}`}
                            >
                              {activeColorFilter === color && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="bg-white/40 backdrop-blur-sm rounded-full p-1">
                                    <Filter size={12} className="text-black" />
                                  </div>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-zinc-50">
                      <p className="text-sm text-zinc-400 font-light leading-relaxed italic">
                        &ldquo;{analysis.description}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-8">
            {outfits.length > 0 ? (
              <div className="space-y-12">
                <div className="flex items-end justify-between border-b border-zinc-100 pb-8">
                  <div>
                    <h3 className="text-3xl font-serif mb-2">The Collection</h3>
                    <p className="text-xs text-zinc-400 uppercase tracking-widest">
                      {activeColorFilter ? 'Filtered by active shade' : 'Three perspectives on your piece'}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    {activeColorFilter && (
                      <button
                        onClick={() => setActiveColorFilter(null)}
                        className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] hover:text-black transition-colors"
                      >
                        <RefreshCcw size={12} />
                        Reset Filter
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-12">
                  {filteredOutfits.length > 0 ? (
                    filteredOutfits.map((outfit, idx) => (
                      <OutfitCard
                        key={idx}
                        outfit={outfit}
                        activeFilter={activeColorFilter}
                        onColorClick={toggleFilter}
                        onUpdate={(newImg) => updateOutfitImage(idx, newImg)}
                      />
                    ))
                  ) : (
                    <div className="col-span-full py-32 flex flex-col items-center justify-center bg-white rounded-[3rem] border border-zinc-100 shadow-sm animate-in zoom-in-95 duration-500">
                      <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mb-8">
                         <Filter size={32} strokeWidth={1} className="text-zinc-200" />
                      </div>
                      <h4 className="text-xl font-medium text-zinc-900 mb-2">No direct color matches</h4>
                      <p className="text-sm text-zinc-400 font-light mb-8 max-w-xs text-center">Try selecting a complimentary shade or resetting the filter to see the full collection.</p>
                      <button
                        onClick={() => setActiveColorFilter(null)}
                        className="px-8 py-3 bg-black text-white text-[10px] uppercase tracking-widest rounded-full hover:bg-zinc-800 transition-colors"
                      >
                        Show All Looks
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[600px] flex flex-col items-center justify-center bg-white rounded-[3rem] border border-zinc-100 shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-50/50 to-transparent pointer-events-none"></div>
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 shadow-xl relative z-10 transition-transform duration-700 group-hover:scale-110">
                  <Sparkles size={32} className="text-zinc-100" />
                </div>
                <h3 className="text-2xl font-serif text-zinc-300 relative z-10">Studio View</h3>
                <p className="text-xs text-zinc-200 uppercase tracking-[0.4em] mt-4 relative z-10">Awaiting curation</p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;
