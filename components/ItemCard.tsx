'use client';

import { Item } from '@/lib/types';
import { ExternalLink } from 'lucide-react';

interface ItemCardProps {
  item: Item;
}

export default function ItemCard({ item }: ItemCardProps) {
  const locationLabel = item.is_global
    ? 'Global'
    : item.country?.name || item.region?.name || 'Regional';

  return (
    <div className="py-1">
      <div className="flex items-center gap-3 rounded-lg border-2 border-emerald-500/20 bg-emerald-950/40 px-4 py-2.5 text-emerald-100 transition-all duration-200 hover:border-emerald-400/40 hover:bg-emerald-900/50 hover:shadow-md">
        <h3 className="text-sm font-bold tracking-tight text-white truncate max-w-[11rem] sm:max-w-[14rem]">
          {item.title}
        </h3>
        {item.description && (
          <span className="hidden text-emerald-400/60 sm:inline text-lg">•</span>
        )}
        {item.description && (
          <span className="text-xs font-medium text-emerald-100/85 truncate flex-1 leading-relaxed">
            {item.description}
          </span>
        )}
        {locationLabel && (
          <span className="hidden md:inline-flex items-center whitespace-nowrap rounded-full border-2 border-emerald-400/40 bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-100">
            {locationLabel}
          </span>
        )}
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 text-emerald-300 transition-colors hover:text-emerald-100 hover:scale-110"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={14} />
          </a>
        )}
      </div>
    </div>
  );
}

