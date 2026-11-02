import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Camera, X, Loader2, Send } from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from '../utils';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const AIPortalAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string, image?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !capturedImage) return;

    const userMessage = { role: 'user' as const, content: input, image: capturedImage || undefined };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setCapturedImage(null);
    setIsLoading(true);

    try {
      const model = "gemini-3.8-flash";
      let parts: any[] = [{ text: input || "Analyze the image and provide advice related to our services (Beauty, Plumbing, Roofing, Handyman, Electric, Pest Control, Cloud Kitchen, and Shopping)." }];
      
      if (userMessage.image) {
        parts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: userMessage.image.split(',')[1]
          }
        });
      }

      const response = await ai.models.generateContent({
        model,
        contents: [{ parts }],
        config: {
          systemInstruction: "You are Opal, a world-class multi-service and retail consultant for Opal Portal. You provide expert advice on Beauty, Handyman & home repairs, Plumbing, Roofing, Electrical work, Pest Control, Party Planning, Cloud Kitchen dining, and Luxury Department Shopping (Clothing, Shoes, Kitchen wear, Autocare, Home & Living). Be professional, helpful, and encouraging. Answer questions about services, department products, payment methods (Cash, Zelle, Card, In-Store), and fulfillment options (Express Carrier Delivery, Boutique Showroom Pickup). Keep your responses concise and formatted with markdown.",
        }
      });

      const aiResponse = response.text || "I'm sorry, I couldn't process that. How else can I help you today?";
      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'ai', content: "I'm having a bit of trouble connecting to my AI brain right now. Please try again in a moment." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-brand-gold text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50 group"
      >
        <Sparkles className="w-8 h-8 group-hover:animate-pulse" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-28 right-8 w-[400px] h-[600px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden z-50 border border-brand-gold/20"
          >
            {/* Header */}
            <div className="bg-brand-dark p-6 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-gold flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif text-xl">Opal AI</h3>
                  <p className="text-xs text-white/60">Your Service Assistant</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-brand-cream/30">
              {messages.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-brand-muted italic font-serif text-lg">"How may I assist you with our services today?"</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex flex-col", msg.role === 'user' ? "items-end" : "items-start")}>
                  {msg.image && (
                    <img src={msg.image} alt="User capture" className="w-48 rounded-xl mb-2 border-2 border-brand-gold/30 shadow-md" />
                  )}
                  <div className={cn(
                    "max-w-[85%] p-4 rounded-2xl text-sm",
                    msg.role === 'user' 
                      ? "bg-brand-gold text-white rounded-tr-none" 
                      : "bg-white text-brand-dark shadow-sm border border-brand-gold/10 rounded-tl-none"
                  )}>
                    <div className="markdown-body">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-brand-muted italic text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Opal is thinking...
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-brand-gold/10">
              {isCameraActive ? (
                <div className="relative rounded-xl overflow-hidden mb-4 bg-black aspect-video">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                    <button onClick={capturePhoto} className="bg-brand-gold text-white px-6 py-2 rounded-full font-medium shadow-lg">Capture</button>
                    <button onClick={stopCamera} className="bg-white/20 backdrop-blur-md text-white px-6 py-2 rounded-full font-medium">Cancel</button>
                  </div>
                </div>
              ) : capturedImage ? (
                <div className="relative w-24 h-24 mb-4">
                  <img src={capturedImage} className="w-full h-full object-cover rounded-lg border-2 border-brand-gold" />
                  <button onClick={() => setCapturedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full"><X className="w-3 h-3" /></button>
                </div>
              ) : null}

              <div className="flex items-center gap-2">
                <button 
                  onClick={startCamera}
                  className="p-3 text-brand-muted hover:text-brand-gold hover:bg-brand-gold/5 rounded-full transition-all"
                  title="Take a photo for analysis"
                >
                  <Camera className="w-6 h-6" />
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about any service..."
                  className="flex-1 bg-brand-cream/50 border-none rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-brand-gold/30 outline-none"
                />
                <button 
                  onClick={handleSend}
                  disabled={isLoading || (!input.trim() && !capturedImage)}
                  className="p-3 bg-brand-dark text-white rounded-full disabled:opacity-50 hover:bg-brand-gold transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <canvas ref={canvasRef} className="hidden" />
    </>
  );
};
