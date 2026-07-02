'use client';

import Link from 'next/link';
import { Building2, Briefcase, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';

interface Villa {
  id: string;
  display_name: string;
  internal_code?: string;
}

interface EntitySelectorProps {
  villas: Villa[];
}

export function EntitySelector({ villas }: EntitySelectorProps) {
  return (
    <div className="space-y-8">
      {/* Management Company Card */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">
          Management Company
        </h2>
        <Link href="/accounting/management_company/mc" className="group block">
          <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-taksu-jungle hover:shadow-md">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-taksu-forest text-white">
              <Briefcase className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">PT Taksu Living Management</p>
              <p className="text-sm text-gray-500">Management company income & expenses</p>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-taksu-jungle" />
          </div>
        </Link>
      </div>

      {/* Villas Grid */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">
          Villas ({villas.length})
        </h2>
        {villas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
            No villas found.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {villas.map((villa) => (
              <Link
                key={villa.id}
                href={`/accounting/villa/${villa.id}`}
                className="group block"
              >
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-taksu-jungle hover:shadow-md">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-taksu-bamboo/10">
                    <Building2 className="h-5 w-5 text-taksu-jungle" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-gray-900">{villa.display_name}</p>
                    {villa.internal_code && (
                      <p className="text-xs text-gray-500">{villa.internal_code}</p>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-taksu-jungle" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
