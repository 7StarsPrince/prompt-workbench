import React, { useState, useEffect } from 'react';
import { Cpu, ChevronDown, CheckCircle2, XCircle } from 'lucide-react';
import { Agent } from '../hooks/useAgent';

interface AgentSelectorProps {
  apiBase: string;
  selected: string;
  onSelect: (id: string) => void;
}

export default function AgentSelector({ apiBase, selected, onSelect }: AgentSelectorProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch(`${apiBase}/api/agents`)
      .then(r => r.json())
      .then(data => {
        setAgents(data);
        // Auto-select first available
        if (!selected) {
          const firstAvailable = data.find((a: Agent) => a.available);
          if (firstAvailable) onSelect(firstAvailable.id);
        }
      })
      .catch(console.error);
  }, [apiBase]);

  const current = agents.find(a => a.id === selected);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
      >
        <Cpu size={16} />
        <span className="font-medium">
          {current ? `${current.name} ${current.available ? '✓' : '✗'}` : '选择 Agent'}
        </span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-xl shadow-lg border border-gray-200 z-20 py-2">
            {agents.map(agent => (
              <button
                key={agent.id}
                onClick={() => {
                  if (agent.available) {
                    onSelect(agent.id);
                    setOpen(false);
                  }
                }}
                className={`w-full text-left px-4 py-3 transition-colors ${
                  selected === agent.id ? 'bg-primary/5' : 'hover:bg-gray-50'
                } ${!agent.available ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{agent.name}</span>
                  {agent.available ? (
                    <CheckCircle2 size={14} className="text-green-500" />
                  ) : (
                    <XCircle size={14} className="text-red-400" />
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{agent.description}</div>
                {!agent.available && (
                  <div className="text-xs text-red-400 mt-1">本地未安装或未运行</div>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
