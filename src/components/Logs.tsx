import React from 'react';
import { Terminal, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { LogEntry } from '../types';

interface LogsProps {
  logs: LogEntry[];
  logsEndRef: React.RefObject<HTMLDivElement>;
}

export const Logs: React.FC<LogsProps> = ({ logs, logsEndRef }) => {
  return (
    <section>
      <div className="flex items-center gap-2 mb-6">
        <Terminal className="w-5 h-5 text-indigo-400" />
        <h2 className="text-lg font-semibold text-white">Sistemski Logovi</h2>
      </div>
      
      <div className="bg-black border border-green-500/20 rounded-xl p-4 flex-1 overflow-y-auto font-mono text-xs custom-scrollbar max-h-64">
        <div className="space-y-1">
          {logs.map((log) => (
            <div key={log.id} className="flex gap-2">
              <span className="text-green-500 shrink-0">
                [{log.timestamp.toLocaleTimeString()}]
              </span>
              <span className={
                log.type === 'success' ? 'text-green-300' :
                log.type === 'error' ? 'text-red-400' :
                log.type === 'warning' ? 'text-amber-400' :
                'text-slate-300'
              }>
                › {log.message}
              </span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
    </section>
  );
};
