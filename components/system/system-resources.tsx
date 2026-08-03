'use client';

import { useEffect, useState } from 'react';
import { Cpu, MemoryStick } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface SystemResourcesData {
  cpuPercent: string;
  ramPercent: string;
  ramUsedMB: string;
  ramTotalMB: string;
  error?: string;
}

export function SystemResources() {
  const [data, setData] = useState<SystemResourcesData | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchResources = async () => {
      try {
        const res = await fetch('/api/system/resources');
        if (res.ok) {
          const json = await res.json();
          if (isMounted) setData(json);
        }
      } catch (err) {
        // silently fail or log
      }
    };

    fetchResources();
    const interval = setInterval(fetchResources, 5000); // every 5s

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!data || data.error) {
    return null; // hide if error or not yet loaded
  }

  const cpu = parseFloat(data.cpuPercent);
  const ram = parseFloat(data.ramPercent);

  const getStatusColor = (percent: number) => {
    if (percent > 85) return 'text-red-400';
    if (percent > 70) return 'text-yellow-400';
    return 'text-emerald-400';
  };

  return (
    <div className="border-t border-white/10 px-4 py-3 bg-taksu-forest/50">
      <div className="text-[10px] uppercase tracking-widest text-white/50 mb-2 font-semibold">System Resources</div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-white/70">
            <Cpu className="h-3.5 w-3.5" />
            <span>CPU</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("font-medium", getStatusColor(cpu))}>{data.cpuPercent}%</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-white/70">
            <MemoryStick className="h-3.5 w-3.5" />
            <span>RAM</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("font-medium", getStatusColor(ram))}>{data.ramPercent}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
