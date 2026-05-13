import React, { useState, useEffect, useRef } from 'react';
import { Send, Layers, Download, Volume2, VolumeX } from 'lucide-react';
import VoiceInput from './components/VoiceInput';
import ChatThread from './components/ChatThread';
import TopicGroup from './components/TopicGroup';
import TemplateSelector from './components/TemplateSelector';
import AgentSelector from './components/AgentSelector';
import { useSpeech } from './hooks/useSpeech';
import { useAgent } from './hooks/useAgent';
import { useTopics } from './hooks/useTopics';
import * as XLSX from 'xlsx';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  templateId?: string;
  createdAt: string;
}

export interface Topic {
  id: string;
  name: string;
  messageCount: number;
  updatedAt: string;
}

export default function App() {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTopicId, setCurrentTopicId] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [streamingText, setStreamingText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { speak, isListening, interimText, startListening, stopListening } = useSpeech();
  const { agents, loadAgents, sendMessage } = useAgent(API_BASE);
  const { topics, loadTopics, switchTopic, currentTopicMessages, exportTopic } = useTopics(API_BASE);

  useEffect(() => {
    loadAgents();
    loadTopics();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const handleVoiceResult = (text: string) => {
    setInputText(prev => prev + text);
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading || !selectedAgent) return;

    const text = inputText.trim();
    setInputText('');
    setIsLoading(true);
    setStreamingText('');

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      model: selectedAgent,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);

    let assistantContent = '';

    try {
      await sendMessage(
        {
          message: text,
          agentId: selectedAgent,
          topicId: currentTopicId || undefined,
          templateId: selectedTemplate || undefined,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        },
        (chunk) => {
          assistantContent += chunk;
          setStreamingText(assistantContent);
        },
        (topicId) => {
          setCurrentTopicId(topicId);
          setStreamingText('');
          const assistantMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: assistantContent,
            model: selectedAgent,
            createdAt: new Date().toISOString()
          };
          setMessages(prev => [...prev, assistantMsg]);
          if (soundEnabled) {
            speak(assistantContent.slice(0, 300));
          }
          loadTopics();
        }
      );
    } catch (error) {
      setStreamingText('');
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!currentTopicId) return;
    const data = await exportTopic(currentTopicId);
    if (data && data.messages) {
      const ws = XLSX.utils.json_to_sheet(data.messages);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Messages');
      XLSX.writeFile(wb, `${data.topic.replace(/[^a-z0-9\u4e00-\u9fa5]/gi, '_')}.xlsx`);
    }
  };

  const handleTopicSelect = (topicId: string) => {
    setCurrentTopicId(topicId);
    switchTopic(topicId);
    setMessages(currentTopicMessages);
  };

  const handleNewChat = () => {
    setCurrentTopicId(null);
    setMessages([]);
    setInputText('');
    setStreamingText('');
  };

  // Combine messages with streaming text for display
  const displayMessages = streamingText
    ? [...messages, {
        id: 'streaming',
        role: 'assistant' as const,
        content: streamingText,
        model: selectedAgent,
        createdAt: new Date().toISOString()
      }]
    : messages.length > 0 ? messages : currentTopicMessages;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col overflow-hidden`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              🖖 Prompt Workbench
            </h1>
          </div>
          <button onClick={handleNewChat} className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors text-sm">
            + 新对话
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <TopicGroup
            topics={topics}
            currentTopicId={currentTopicId}
            onSelect={handleTopicSelect}
          />
        </div>

        <div className="p-4 border-t border-gray-200 space-y-3">
          <TemplateSelector
            apiBase={API_BASE}
            selected={selectedTemplate}
            onSelect={setSelectedTemplate}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Layers size={20} />
            </button>
            <AgentSelector
              apiBase={API_BASE}
              selected={selectedAgent}
              onSelect={setSelectedAgent}
            />
            {selectedTemplate && (
              <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-full">
                模板模式
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentTopicId && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Download size={16} />
                导出Excel
              </button>
            )}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title={soundEnabled ? '关闭语音播报' : '开启语音播报'}
            >
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <ChatThread
            messages={displayMessages}
            isLoading={isLoading && !streamingText}
          />
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto flex items-end gap-3">
            <VoiceInput
              onResult={handleVoiceResult}
              isListening={isListening}
              interimText={interimText}
              onStart={startListening}
              onStop={stopListening}
            />
            <div className="flex-1 relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="输入消息，或点击麦克风语音输入..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent min-h-[56px] max-h-40 resize-none pr-12"
                rows={1}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={isLoading || !inputText.trim() || !selectedAgent}
              className="bg-red-600 text-white p-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
