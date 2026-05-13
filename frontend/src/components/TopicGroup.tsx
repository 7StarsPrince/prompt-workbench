import React from 'react';
import { MessageSquare, Clock } from 'lucide-react';
import { Topic } from '../App';

interface TopicGroupProps {
  topics: Topic[];
  currentTopicId: string | null;
  onSelect: (id: string) => void;
}

export default function TopicGroup({ topics, currentTopicId, onSelect }: TopicGroupProps) {
  if (topics.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">暂无话题</p>
        <p className="text-xs mt-1">发送第一条消息自动创建</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
        话题列表
      </h3>
      {topics.map((topic) => (
        <button
          key={topic.id}
          onClick={() => onSelect(topic.id)}
          className={`w-full text-left p-3 rounded-xl transition-all ${
            currentTopicId === topic.id
              ? 'bg-primary/10 border border-primary/20'
              : 'hover:bg-gray-50 border border-transparent'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`font-medium text-sm truncate ${
              currentTopicId === topic.id ? 'text-primary' : 'text-gray-700'
            }`}>
              {topic.name}
            </span>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0 ml-2">
              {topic.messageCount}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
            <Clock size={12} />
            {new Date(topic.updatedAt).toLocaleDateString('zh-CN')}
          </div>
        </button>
      ))}
    </div>
  );
}
