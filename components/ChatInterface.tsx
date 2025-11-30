import React, { useState, useRef, useEffect } from 'react';
import { chatWithPortfolio } from '../services/geminiService';
import { FundHolding, ChatMessage } from '../types';
import { Send, Bot, User, Sparkles, AlertCircle, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatInterfaceProps {
  holdings: FundHolding[];
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ holdings }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: '你好！我是你的智能基金助手。我可以帮你分析当前持仓表现，或者推荐市场上的热门基金。请问有什么可以帮你？',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare history for API
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      
      const response = await chatWithPortfolio(history, userMsg.text, holdings);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text || 'Sorry, I could not generate a response.',
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, aiMsg]);
      
      // Optionally handle sources if needed to display
      if (response.sources && response.sources.length > 0) {
          console.log("Grounding sources:", response.sources);
      }

    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: '抱歉，我现在遇到了一些连接问题，请稍后再试。',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center gap-3">
        <div className="bg-white/20 p-2 rounded-lg">
          <Sparkles className="text-white" size={20} />
        </div>
        <div>
          <h3 className="text-white font-semibold">AI 智投顾问</h3>
          <p className="text-blue-100 text-xs">基于 Gemini 2.5 Flash 模型</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-indigo-100' : 'bg-blue-100'}`}>
              {msg.role === 'user' ? <User size={16} className="text-indigo-600" /> : <Bot size={16} className="text-blue-600" />}
            </div>
            
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-sm' 
                : 'bg-white text-gray-800 border border-gray-200 rounded-tl-sm'
            }`}>
              <ReactMarkdown 
                components={{
                    ul: ({node, ...props}) => <ul className="list-disc ml-4 my-2" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal ml-4 my-2" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-bold text-indigo-700" {...props} />,
                    a: ({node, ...props}) => <a className="text-blue-500 underline flex items-center gap-1 inline-flex" target="_blank" rel="noopener noreferrer" {...props}>{props.children}<ExternalLink size={10}/></a>
                }}
              >
                {msg.text}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
               <Bot size={16} className="text-blue-600" />
             </div>
             <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm border border-gray-200 shadow-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="询问持仓建议，或查询市场动态..."
            className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 px-1">
          <AlertCircle size={12} />
          <span>AI 建议仅供参考，不构成投资建议。市场有风险，投资需谨慎。</span>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;