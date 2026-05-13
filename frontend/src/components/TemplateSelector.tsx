import React, { useState, useEffect } from 'react';
import { BookOpen, Check, Plus, X } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
}

interface TemplateSelectorProps {
  apiBase: string;
  selected: string | null;
  onSelect: (id: string | null) => void;
}

export default function TemplateSelector({ apiBase, selected, onSelect }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', description: '', systemPrompt: '' });

  useEffect(() => {
    fetch(`${apiBase}/api/templates`)
      .then(r => r.json())
      .then(data => setTemplates(data))
      .catch(console.error);
  }, [apiBase]);

  const handleCreate = async () => {
    if (!newTemplate.name || !newTemplate.systemPrompt) return;
    try {
      const res = await fetch(`${apiBase}/api/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate)
      });
      if (res.ok) {
        const data = await res.json();
        setTemplates([...templates, { ...newTemplate, id: data.id }]);
        setNewTemplate({ name: '', description: '', systemPrompt: '' });
        setShowCreate(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">提示词模板</span>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="新建模板"
        >
          {showCreate ? <X size={14} /> : <Plus size={14} />}
        </button>
      </div>

      {showCreate ? (
        <div className="space-y-2 mb-3">
          <input
            placeholder="模板名称"
            className="input text-sm py-1.5"
            value={newTemplate.name}
            onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
          />
          <input
            placeholder="描述"
            className="input text-sm py-1.5"
            value={newTemplate.description}
            onChange={e => setNewTemplate({ ...newTemplate, description: e.target.value })}
          />
          <textarea
            placeholder="System Prompt..."
            className="input text-sm py-1.5 min-h-[60px] resize-none"
            value={newTemplate.systemPrompt}
            onChange={e => setNewTemplate({ ...newTemplate, systemPrompt: e.target.value })}
          />
          <button onClick={handleCreate} className="btn-primary text-xs w-full py-1.5">创建</button>
        </div>
      ) : (
        <div className="space-y-1">
          <button
            onClick={() => onSelect(null)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
              !selected ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 text-gray-600'
            }`}
          >
            <span>默认模式</span>
            {!selected && <Check size={14} />}
          </button>
          {templates.map(t => (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                selected === t.id ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 text-gray-600'
              }`}
              title={t.description}
            >
              <span className="truncate">{t.name}</span>
              {selected === t.id && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
