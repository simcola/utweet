'use client';

import { useEffect, useState } from 'react';
import { Category, Item } from '@/lib/types';
import ItemCard from './ItemCard';
import { US_COUNTRY_CODE } from '@/lib/us-states';

interface SectionProps {
  category: Category;
  items: Item[];
  regionCode: string;
  countryCodes: string[];
  selectedUsStates: string[];
}

export default function Section({ category, items, regionCode, countryCodes, selectedUsStates }: SectionProps) {
  const regionFiltered = items.filter((item) => {
    if (regionCode === 'ALL') return true;
    if (item.is_global) return true;
    if (!item.region) return true;
    return item.region?.code === regionCode;
  });

  const filteredItems = regionFiltered.filter((item) => {
    if (countryCodes.length === 0) return true;
    if (item.is_global) return true;
    if (!item.country) return false;
    if (!countryCodes.includes(item.country.code)) return false;
    // When filtering by US and user selected specific states, only include US items that apply to those states (or to all US)
    if (item.country.code === US_COUNTRY_CODE && selectedUsStates.length > 0) {
      const itemStates = item.us_states ?? [];
      if (itemStates.length === 0) return true; // item applies to all US states
      return itemStates.some((s) => selectedUsStates.includes(s));
    }
    return true;
  });

  // Show section even if empty, but with a message
  // if (filteredItems.length === 0) {
  //   return null;
  // }

  const hasSubcategories = category.subcategories && category.subcategories.length > 0;
  const itemsPerPage = 12;
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [regionCode, countryCodes, selectedUsStates]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageItems = filteredItems.length > 0 ? filteredItems.slice(startIndex, startIndex + itemsPerPage) : [];
  const placeholderCount = Math.max(0, itemsPerPage - pageItems.length);
  const placeholderNodes = Array.from({ length: placeholderCount }).map((_, idx) => (
    <div
      key={`placeholder-${idx}`}
      className="h-8 rounded-xl border border-transparent"
      aria-hidden="true"
    />
  ));

  return (
    <section className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-900/40 backdrop-blur-md px-5 py-5 shadow-lg shadow-emerald-950/40 transition-transform duration-200 hover:-translate-y-[2px] hover:shadow-xl hover:shadow-emerald-950/50">
      <div className="flex items-center justify-between gap-3 pb-4 border-b-2 border-emerald-500/20">
        <h2 className="text-xl font-bold text-white tracking-tight">
          {category.name}
        </h2>
        <span className="text-xs font-semibold px-3.5 py-1.5 rounded-full border-2 border-emerald-400/50 bg-emerald-500/20 text-emerald-100 uppercase tracking-wide">
          {filteredItems.length} items
        </span>
      </div>

      {filteredItems.length === 0 && (
        <div className="pt-3 text-center text-emerald-200/70 text-sm">
          No items found for the selected region/country filter.
        </div>
      )}

      {hasSubcategories ? (
        <div className="flex-1 pt-3 space-y-3">
          {category.subcategories!.map((subcategory) => {
            const subItems = pageItems.filter(
              (item) => item.category_id === subcategory.id
            );
            if (subItems.length === 0) return null;

            return (
              <div key={subcategory.id} className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <h3 className="text-sm font-semibold text-emerald-100 tracking-wide uppercase">
                    {subcategory.name}
                  </h3>
                </div>
                <div className="space-y-0.5">
                  {subItems.map((item) => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            );
          })}
          {placeholderNodes}
        </div>
      ) : (
        <div className="flex-1 pt-3 space-y-0.5">
          {pageItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
          {placeholderNodes}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-emerald-100/90">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border-2 border-emerald-600 bg-emerald-800 px-4 py-1.5 text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-700 hover:border-emerald-500 active:bg-emerald-900"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border-2 border-emerald-600 bg-emerald-800 px-4 py-1.5 text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-700 hover:border-emerald-500 active:bg-emerald-900"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

