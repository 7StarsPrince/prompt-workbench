import { useState, useCallback } from 'react';
import { Message, Topic } from '../App';

export function useTopics(apiBase: string) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [currentTopicMessages, setCurrentTopicMessages] = useState<Message[]>([]);

  const loadTopics = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/api/topics`);
      const data = await res.json();
      setTopics(data.map((t: any) => ({
        id: t.id,
        name: t.name,
        messageCount: t.message_count,
        updatedAt: t.updated_at
      })));
    } catch (e) {
      console.error('Failed to load topics:', e);
    }
  }, [apiBase]);

  const createTopic = useCallback(async (message: string, name?: string) => {
    try {
      const res = await fetch(`${apiBase}/api/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, message, autoGroup: true })
      });
      const data = await res.json();
      if (!data.existing) {
        await loadTopics();
      }
      return data;
    } catch (e) {
      console.error('Failed to create topic:', e);
      return null;
    }
  }, [apiBase, loadTopics]);

  const switchTopic = useCallback(async (topicId: string) => {
    try {
      const res = await fetch(`${apiBase}/api/topics/${topicId}`);
      const data = await res.json();
      setCurrentTopicMessages(data.messages?.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        model: m.model,
        templateId: m.template_id,
        createdAt: m.created_at
      })) || []);
    } catch (e) {
      console.error('Failed to switch topic:', e);
    }
  }, [apiBase]);

  const exportTopic = useCallback(async (topicId: string) => {
    try {
      const res = await fetch(`${apiBase}/api/topics/${topicId}/export`);
      return await res.json();
    } catch (e) {
      console.error('Failed to export topic:', e);
      return null;
    }
  }, [apiBase]);

  return { topics, currentTopicMessages, loadTopics, createTopic, switchTopic, exportTopic };
}
