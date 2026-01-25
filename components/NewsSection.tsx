'use client';

import { useMemo } from 'react';
import { NewsArticle } from '@/lib/types';

interface NewsSectionProps {
  articles: NewsArticle[];
}

export default function NewsSection({ articles }: NewsSectionProps) {
  // Sort articles by date (newest first) and limit to top 10
  const sortedArticles = useMemo(
    () =>
      [...articles]
        .sort(
          (a, b) =>
            new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
        )
        .slice(0, 10), // Show top 10 items
    [articles]
  );

  // Calculate placeholder rows to maintain layout (if less than 10 items)
  const placeholderCount = Math.max(0, 10 - sortedArticles.length);

  const placeholderRows = useMemo(
    () =>
      Array.from({ length: placeholderCount }).map((_, idx) => (
        <div
          key={`news-placeholder-${idx}`}
          className="h-9 rounded-xl border border-transparent"
          aria-hidden="true"
        />
      )),
    [placeholderCount]
  );

  if (articles.length === 0) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-emerald-500/20 bg-emerald-900/35 backdrop-blur-md px-4 py-4 shadow-lg shadow-emerald-950/35">
      <div className="flex flex-col gap-2 pb-3 border-b border-emerald-500/20">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.35em] text-emerald-300/70">Current News</p>
            <h2 className="text-xl font-semibold text-white tracking-tight">Birding Headlines Worldwide</h2>
          </div>
          <span className="hidden sm:inline-flex items-center rounded-full border border-emerald-400/40 px-3 py-1 text-[0.65rem] uppercase tracking-[0.25em] text-emerald-200/80">
            {sortedArticles.length} stories
          </span>
        </div>
        <p className="text-xs text-emerald-100/70 max-w-3xl">
          A curated snapshot of the latest conservation breakthroughs, migration intel, and rare sightings from trusted birding outlets.
        </p>
      </div>

      <div className="mt-3">
        <div className="flex flex-col gap-1.5">
          {sortedArticles.map((article) => (
            <article
              key={article.id}
              className="rounded-xl border border-emerald-500/15 bg-emerald-950/30 px-4 py-2.5 transition-colors hover:border-emerald-400/40"
            >
              <div className="flex items-center gap-2">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-white tracking-tight hover:text-emerald-200 transition-colors"
                >
                  {article.title}
                </a>
                <time 
                  dateTime={article.published_at}
                  className="text-xs text-emerald-300/70 whitespace-nowrap"
                >
                  {new Date(article.published_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </time>
              </div>
            </article>
          ))}
          {placeholderRows}
        </div>
      </div>
    </section>
  );
}
