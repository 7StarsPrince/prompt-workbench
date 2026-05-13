import React, { useState, useEffect } from 'react';
import { Cpu, ChevronDown } from 'lucide-react';

interface Model {
  id: string;
  name: string;
  description: string;
}

interface ModelRouterProps {
  apiBase: string;
  selected: string;
  onSelect: (id: string) => void;
}

export default function ModelRouter({ apiBase, selected, onSelect }: ModelRouterProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch(`${apiBase}/api/llm/models`)
      .then(r => r.json())
      .then(data => setModels(data))
      .catch(console.error);
  }, [apiBase]);

  const current = models.find(m => m.id === selected);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
      >
        <Cpu size={16} />
        <span className="font-medium">{current?.name || 'Claude'}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-20 py-2">
            {models.map(model => (
              <button
                key={model.id}
                onClick={() => {
                  onSelect(model.id);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                  selected === model.id ? 'bg-primary/5' : ''
                }`}
              >
                <div className="font-medium text-sm">{model.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{model.description}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
