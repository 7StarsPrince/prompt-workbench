import React from 'react';
import { Mic, Square } from 'lucide-react';

interface VoiceInputProps {
  onResult: (text: string) => void;
  isListening: boolean;
  interimText?: string;
  onStart: (onResult: (text: string) => void) => void;
  onStop: () => void;
}

export default function VoiceInput({ onResult, isListening, interimText, onStart, onStop }: VoiceInputProps) {
  return (
    <div className="relative">
      <button
        onClick={() => {
          if (isListening) {
            onStop();
          } else {
            onStart(onResult);
          }
        }}
        className={`p-3 rounded-full transition-all ${
          isListening
            ? 'bg-red-500 text-white animate-pulse'
            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
        }`}
        title={isListening ? '停止录音' : '语音输入'}
      >
        {isListening ? <Square size={20} /> : <Mic size={20} />}
      </button>
      {isListening && interimText && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-800 text-white text-sm rounded-lg whitespace-nowrap">
          {interimText}
          <span className="inline-block w-1.5 h-4 bg-gray-400 ml-1 animate-pulse" />
        </div>
      )}
    </div>
  );
}
