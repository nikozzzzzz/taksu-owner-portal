import { NextResponse } from 'next/server';
import os from 'os';
import { getAuthUser } from '@/lib/auth/middleware';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || (user.app_metadata?.role !== 'admin' && user.app_metadata?.role !== 'root')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;

    const cpus1 = os.cpus();
    let totalIdle1 = 0;
    let totalTick1 = 0;
    cpus1.forEach((cpu) => {
      for (const type in cpu.times) {
        totalTick1 += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle1 += cpu.times.idle;
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    const cpus2 = os.cpus();
    let totalIdle2 = 0;
    let totalTick2 = 0;
    cpus2.forEach((cpu) => {
      for (const type in cpu.times) {
        totalTick2 += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle2 += cpu.times.idle;
    });

    const idleDiff = totalIdle2 - totalIdle1;
    const tickDiff = totalTick2 - totalTick1;
    const cpuUsagePercent = tickDiff === 0 ? 0 : 100 - (idleDiff / tickDiff) * 100;

    return NextResponse.json({
      cpuPercent: cpuUsagePercent.toFixed(1),
      ramPercent: memoryUsagePercent.toFixed(1),
      ramUsedMB: (usedMemory / 1024 / 1024).toFixed(0),
      ramTotalMB: (totalMemory / 1024 / 1024).toFixed(0),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
