import { useState, useCallback } from 'react';

export interface Agent {
  id: string;
  name: string;
  description: string;
  available: boolean;
}

interface ChatRequest {
  message: string;
  agentId: string;
  topicId?: string;
  templateId?: string;
  history?: { role: string; content: string }[];
}

export function useAgent(apiBase: string) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadAgents = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/api/agents`);
      const data = await res.json();
      setAgents(data);
    } catch (e) {
      console.error('Failed to load agents:', e);
    }
  }, [apiBase]);

  const sendMessage = useCallback(async (
    req: ChatRequest,
    onChunk: (text: string) => void,
    onDone: (topicId: string) => void
  ) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/agents/${req.agentId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '请求失败');
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (!reader) throw new Error('No response body');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'chunk') {
                onChunk(data.content);
              } else if (data.type === 'done') {
                onDone(data.topicId);
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [apiBase]);

  return { agents, loadAgents, sendMessage, isLoading };
}
