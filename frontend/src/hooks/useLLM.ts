import { useState, useCallback } from 'react';

interface ChatRequest {
  message: string;
  model: string;
  topicId?: string;
  templateId?: string;
  history?: { role: string; content: string }[];
}

interface ChatResponse {
  content: string;
  model: string;
  latencyMs: number;
  usage?: { inputTokens: number; outputTokens: number };
}

export function useLLM(apiBase: string) {
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (req: ChatRequest): Promise<ChatResponse> => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/llm/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '请求失败');
      }
      return await res.json();
    } finally {
      setIsLoading(false);
    }
  }, [apiBase]);

  return { sendMessage, isLoading };
}
