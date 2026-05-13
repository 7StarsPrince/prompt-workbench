import React from 'react';
import { Mic, Square } from 'lucide-react';

interface VoiceInputProps {
  onResult: (text: string) => void;
  isListening: boolean;
  onStart: (onResult: (text: string) => void) => void;
  onStop: () => void;
}

export default function VoiceInput({ onResult, isListening, onStart, onStop }: VoiceInputProps) {
  return (
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
          : 'bg-gray-100 text-secondary hover:bg-gray-200'
      }`}
      title={isListening ? '停止录音' : '语音输入'}
    >
      {isListening ? <Square size={20} /> : <Mic size={20} />}
    </button>
  );
}
