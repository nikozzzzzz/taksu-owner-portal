'use client';

import { useState, useEffect, useRef } from 'react';
import { getApiLogs } from '@/lib/actions/admin-actions';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { RefreshCw, ArrowUpRight, ArrowDownLeft, AlertCircle } from 'lucide-react';

export function ApiLogsViewer() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const fetchLogs = async () => {
    try {
      const data = await getApiLogs(100);
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch API logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="overflow-hidden border border-taksu-bamboo/30 shadow-sm flex flex-col h-[70vh]">
      <div className="flex justify-between items-center p-4 border-b border-taksu-bamboo/30 bg-taksu-cream/30">
        <h3 className="font-semibold text-taksu-forest flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-taksu-sage' : 'text-taksu-forest'}`} />
          Beds24 Live API Logs
        </h3>
        <span className="text-xs text-taksu-sage bg-white px-2 py-1 rounded-md border border-gray-100">
          Auto-refreshing every 5s
        </span>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 bg-gray-50/50 space-y-3 font-mono text-xs"
      >
        {logs.length === 0 && !loading && (
          <div className="text-center text-gray-400 py-12">No API logs recorded yet.</div>
        )}
        
        {logs.map((log) => (
          <div 
            key={log.id} 
            className={`p-3 rounded-lg border ${
              log.error_message || (log.response_status && log.response_status >= 400) 
                ? 'border-red-200 bg-red-50' 
                : 'border-gray-200 bg-white'
            } shadow-sm transition-all hover:shadow-md`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                {log.direction === 'outbound' ? (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    OUTBOUND
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <ArrowDownLeft className="h-3 w-3 mr-1" />
                    INBOUND
                  </Badge>
                )}
                
                <span className="font-semibold text-gray-700">{log.endpoint}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">
                  {new Date(log.created_at).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                {log.response_status && (
                  <Badge 
                    variant={log.response_status >= 400 ? 'destructive' : 'secondary'}
                    className={log.response_status < 400 ? 'bg-gray-100' : ''}
                  >
                    HTTP {log.response_status}
                  </Badge>
                )}
              </div>
            </div>

            {log.error_message && (
              <div className="text-red-600 flex items-center gap-1 mt-2 mb-2 font-semibold">
                <AlertCircle className="h-3 w-3" />
                {log.error_message}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-100">
              <div>
                <span className="text-[10px] uppercase text-gray-400 font-semibold mb-1 block">Payload</span>
                <pre className="bg-gray-100 p-2 rounded text-[11px] overflow-x-auto max-h-40 overflow-y-auto">
                  {log.payload ? JSON.stringify(log.payload, null, 2) : 'No payload'}
                </pre>
              </div>
              <div>
                <span className="text-[10px] uppercase text-gray-400 font-semibold mb-1 block">Response</span>
                <pre className="bg-gray-100 p-2 rounded text-[11px] overflow-x-auto max-h-40 overflow-y-auto">
                  {log.response_body ? (
                    typeof log.response_body === 'string' && log.response_body.startsWith('{') 
                      ? JSON.stringify(JSON.parse(log.response_body), null, 2) 
                      : log.response_body
                  ) : 'No response body'}
                </pre>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
