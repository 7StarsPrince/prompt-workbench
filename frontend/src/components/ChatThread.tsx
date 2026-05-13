import React from 'react';
import { User, Bot, AlertCircle, Loader2 } from 'lucide-react';
import { Message } from '../App';

interface ChatThreadProps {
  messages: Message[];
  isLoading?: boolean;
}

export default function ChatThread({ messages, isLoading }: ChatThreadProps) {
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <Bot size={48} className="mb-4 opacity-50" />
        <p className="text-lg">开始一个新的对话，或选择一个已有话题</p>
        <p className="text-sm mt-2">支持语音输入 · 本地 Agent 路由 · 智能话题分组</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            msg.role === 'user' ? 'bg-red-600 text-white' :
            msg.role === 'assistant' ? 'bg-gray-800 text-white' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {msg.role === 'user' ? <User size={16} /> :
             msg.role === 'assistant' ? <Bot size={16} /> :
             <AlertCircle size={16} />}
          </div>
          <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
            msg.role === 'user' ? 'bg-red-600 text-white' :
            msg.role === 'assistant' ? 'bg-white border border-gray-200 text-gray-800' :
            'bg-yellow-50 border border-yellow-200 text-yellow-800'
          }`}>
            {msg.model && msg.role === 'assistant' && (
              <div className="text-xs text-gray-400 mb-1 font-medium">
                {msg.model}
              </div>
            )}
            <div className="whitespace-pre-wrap leading-relaxed">
              {msg.content}
              {msg.id === 'streaming' && (
                <span className="inline-block w-2 h-4 bg-gray-400 ml-1 animate-pulse" />
              )}
            </div>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center shrink-0">
            <Bot size={16} />
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl px-5 py-3">
            <Loader2 size={20} className="animate-spin text-gray-400" />
          </div>
        </div>
      )}
    </div>
  );
}
