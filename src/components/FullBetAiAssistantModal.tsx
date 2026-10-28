import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  X,
  Send,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Mail,
  Wallet,
  CheckCircle2,
  Lock,
  MessageSquare
} from 'lucide-react';
import { serverAskAssistant } from '../utils/api';

interface ChatMessage {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  time: string;
}

interface FullBetAiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWallet?: () => void;
}

const QUICK_PROMPTS = [
  "Quels sont les modes de paiement acceptés ?",
  "Comment déposer avec Binance Pay ?",
  "Comment recharger via Moncash ou Natcash ?",
  "Comment contacter le support officiel ?",
  "Sécurité de mon compte et masquage des données"
];

export const FullBetAiAssistantModal: React.FC<FullBetAiAssistantModalProps> = ({
  isOpen,
  onClose,
  onOpenWallet
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: "Bonjour ! Je suis l'Assistant Virtuel officiel de Full Bet. Je suis à votre service pour vous guider sur les paiements sécurisés (Binance Pay, Moncash online, Natcash online), vos paris et la sécurité de votre compte.",
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsLoading(true);

    try {
      const res = await serverAskAssistant(text);
      const reply = res.reply || res.message || "Pour tout support technique, contactez l'équipe officielle à fullbet509@gmail.com.";

      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: reply,
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `ast-err-${Date.now()}`,
          sender: 'assistant',
          text: "Pour toute assistance technique urgente, notre support officiel est disponible à fullbet509@gmail.com. Les options de paiement restent Binance Pay, Moncash online, et Natcash online.",
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0f172a] border border-[#eab308]/30 rounded-2xl shadow-2xl flex flex-col h-[640px] max-h-[92vh] overflow-hidden text-[#f8fafc]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#1e293b] border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-[#eab308] to-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20">
              <Bot className="w-6 h-6 text-slate-950" />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#1e293b] rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#f8fafc] tracking-wide">Assistant Virtuel Full Bet</h3>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                  En ligne
                </span>
              </div>
              <p className="text-[11px] text-[#94a3b8] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#eab308]" />
                Sécurisé • Modèle Gemini Flash
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setMessages([
                  {
                    id: `init-${Date.now()}`,
                    sender: 'assistant',
                    text: "Conversation réinitialisée. Comment puis-je vous aider ?",
                    time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                  }
                ]);
              }}
              title="Réinitialiser la discussion"
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Security and Masking Banner */}
        <div className="px-3.5 py-1.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5 text-amber-300">
            <Lock className="w-3 h-3 text-[#eab308]" />
            Confidentialité active : Numéro masqué
          </span>
          <a
            href="mailto:fullbet509@gmail.com"
            className="flex items-center gap-1 text-[#eab308] hover:underline"
          >
            <Mail className="w-3 h-3" />
            fullbet509@gmail.com
          </a>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gradient-to-b from-[#0f172a] to-[#1e293b]/50">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-md ${
                  msg.sender === 'user'
                    ? 'bg-[#eab308] text-slate-950 font-medium rounded-br-xs'
                    : 'bg-[#1e293b] border border-slate-700/70 text-[#f8fafc] rounded-bl-xs'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 px-1">
                {msg.time}
              </span>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-[#94a3b8] bg-[#1e293b] border border-slate-700/60 rounded-xl px-3.5 py-2.5 w-fit">
              <Sparkles className="w-4 h-4 text-[#eab308] animate-spin" />
              <span>Full Bet Assistant analyse votre requête...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Action Chips */}
        <div className="px-3 py-2 bg-[#1e293b]/80 border-t border-slate-800 flex gap-1.5 overflow-x-auto no-scrollbar">
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={isLoading}
              className="text-[11px] whitespace-nowrap bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-full border border-slate-700 transition-colors cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-[#1e293b] border-t border-slate-700/60">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            {onOpenWallet && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenWallet();
                }}
                title="Accéder au Portefeuille de dépôt"
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-[#eab308] border border-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                <Wallet className="w-4 h-4" />
              </button>
            )}

            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Posez votre question sur les paiements, cotes, borlette..."
              disabled={isLoading}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#f8fafc] placeholder:text-slate-500 focus:outline-none focus:border-[#eab308] transition-colors"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="px-4 py-2.5 bg-[#eab308] hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold rounded-xl flex items-center justify-center transition-colors cursor-pointer shadow-md shadow-amber-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 px-1">
            <span>Passerelles : Binance Pay (Crypto) • Moncash online • Natcash online</span>
            <span className="text-[#eab308] font-medium">Full Bet v1.0.0</span>
          </div>
        </div>

      </div>
    </div>
  );
};
