'use client';

import { Region, Country } from '@/lib/types';
import { X } from 'lucide-react';

interface RegionFilterProps {
  regions: Region[];
  countries: Country[];
  selectedRegion: string;
  selectedCountries: string[];
  onRegionChange: (regionCode: string) => void;
  onCountryAdd: (countryCode: string) => void;
  onCountryRemove: (countryCode: string) => void;
}

export default function RegionFilter({
  regions,
  countries,
  selectedRegion,
  selectedCountries,
  onRegionChange,
  onCountryAdd,
  onCountryRemove,
}: RegionFilterProps) {
  // Ensure regions is always an array
  const safeRegions = Array.isArray(regions) ? regions : [];
  const safeCountries = Array.isArray(countries) ? countries : [];
  const sortedCountries = safeCountries.slice().sort((a, b) => a.name.localeCompare(b.name));
  
  // Get selected country names for display
  const selectedCountryNames = selectedCountries
    .map(code => {
      const country = sortedCountries.find(c => c.code === code);
      return country ? { code, name: country.name } : null;
    })
    .filter((item): item is { code: string; name: string } => item !== null);
  
  // Filter out already selected countries from dropdown
  const availableCountries = sortedCountries.filter(
    country => !selectedCountries.includes(country.code)
  );
  
  const handleCountrySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const countryCode = e.target.value;
    if (countryCode && !selectedCountries.includes(countryCode)) {
      onCountryAdd(countryCode);
      e.target.value = ''; // Reset dropdown
    }
  };

  return (
    <section className="rounded-2xl border border-emerald-500/25 bg-emerald-900/40 backdrop-blur-xl px-5 py-4 shadow-lg shadow-emerald-950/40">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
        <div className="flex-1 flex flex-col">
          <label className="text-xs font-semibold uppercase tracking-wide text-emerald-200 block mb-2.5">
            Region
          </label>
          <div className="relative">
            <select
              value={selectedRegion}
              onChange={(e) => onRegionChange(e.target.value)}
              className="w-full appearance-none rounded-lg border-2 border-emerald-500/40 bg-emerald-950/80 px-4 py-2.5 text-base font-medium text-white transition-all hover:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 shadow-sm"
            >
              {safeRegions.map((region) => (
                <option key={region.code} value={region.code} className="bg-emerald-900 text-white font-medium">
                  {region.name}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-emerald-300 text-sm">
              ▼
            </span>
          </div>
          {/* Spacer to match country section height when badge is shown */}
          <div className="min-h-[2.5rem] mt-2"></div>
        </div>

        <div className="flex-1 flex flex-col">
          <label className="text-xs font-semibold uppercase tracking-wide text-emerald-200 block mb-2.5">
            Country
          </label>
          <div className="relative">
            <select
              onChange={handleCountrySelect}
              className="w-full appearance-none rounded-lg border-2 border-emerald-500/40 bg-emerald-950/80 px-4 py-2.5 text-base font-medium text-white transition-all hover:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-emerald-500/40 shadow-sm"
              disabled={safeCountries.length === 0 || availableCountries.length === 0}
              defaultValue=""
            >
              <option value="" className="bg-emerald-900 text-white font-medium">
                {availableCountries.length === 0 ? 'All countries selected' : 'Select a country...'}
              </option>
              {availableCountries.map((country) => (
                <option key={country.code} value={country.code} className="bg-emerald-900 text-white font-medium">
                  {country.name}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-emerald-300 text-sm">
              ▼
            </span>
          </div>
          {selectedCountryNames.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2.5">
              {selectedCountryNames.map(({ code, name }) => (
                <span
                  key={code}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-500/30 border border-emerald-400/40 px-3.5 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-500/40 transition-colors"
                >
                  <span>{name}</span>
                  <button
                    onClick={() => onCountryRemove(code)}
                    className="hover:bg-emerald-600/50 rounded-full p-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                    aria-label={`Remove ${name}`}
                  >
                    <X size={14} className="text-white" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

