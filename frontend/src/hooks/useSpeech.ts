import { useState, useCallback, useRef } from 'react';

export function useSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback((onResult: (text: string) => void) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('您的浏览器不支持语音识别，请使用 Chrome 或 Edge');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    
    // Optimize for Chinese
    recognition.grammars = null; // No grammar constraints for better general recognition
    
    recognitionRef.current = recognition;

    let finalTranscript = '';

    recognition.onresult = (e: any) => {
      let interim = '';
      
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalTranscript += transcript;
          onResult(transcript);
        } else {
          interim += transcript;
        }
      }
      
      setInterimText(interim);
    };

    recognition.onerror = (e: any) => {
      console.error('Speech recognition error:', e.error);
      if (e.error === 'no-speech') {
        // Auto-restart on no-speech
        return;
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
      // If we have accumulated final text, send it
      if (finalTranscript) {
        onResult(finalTranscript);
        finalTranscript = '';
      }
    };

    recognition.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      setInterimText('');
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    // Split long text into sentences for better TTS
    const sentences = text.match(/[^。！？.!?]+[。！？.!?]?/g) || [text];
    let index = 0;

    function speakNext() {
      if (index >= sentences.length) return;
      
      const utterance = new SpeechSynthesisUtterance(sentences[index]);
      utterance.lang = 'zh-CN';
      utterance.rate = 1.1;
      utterance.pitch = 1;
      utterance.onend = () => {
        index++;
        speakNext();
      };
      window.speechSynthesis.speak(utterance);
    }

    speakNext();
  }, []);

  return { isListening, interimText, startListening, stopListening, speak };
}
