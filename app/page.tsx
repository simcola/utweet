'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import RegionFilter from '@/components/RegionFilter';
import Section from '@/components/Section';
import NewsSection from '@/components/NewsSection';
import PhotoGallery from '@/components/PhotoGallery';
import { Region, Category, Item, Country, NewsArticle } from '@/lib/types';

export default function Home() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCountries = async (regionCode: string) => {
    try {
      setCountries([]);
      const response = await fetch(`/api/countries${regionCode ? `?region=${regionCode}` : ''}`);
      if (!response.ok) {
        console.error('Countries API error:', response.status, response.statusText);
        setCountries([]);
        return;
      }

      const data = await response.json();
      setCountries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching countries:', error);
      setCountries([]);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [regionsRes, categoriesRes, itemsRes, newsRes] = await Promise.all([
          fetch('/api/regions'),
          fetch('/api/categories'),
          fetch('/api/items'),
          fetch('/api/news', { cache: 'no-store' }), // Always fetch fresh news on page load
        ]);

        // Helper to parse JSON or get error text
        const parseResponse = async (res: Response, name: string) => {
          if (!res.ok) {
            const text = await res.text();
            let errorObj;
            try {
              errorObj = JSON.parse(text);
            } catch {
              errorObj = { error: text || res.statusText };
            }
            console.error(`${name} API error:`, res.status, errorObj);
            return { error: errorObj.error || 'Unknown error' };
          }
          return await res.json();
        };

        const [regionsData, categoriesData, itemsData, newsData] = await Promise.all([
          parseResponse(regionsRes, 'Regions'),
          parseResponse(categoriesRes, 'Categories'),
          parseResponse(itemsRes, 'Items'),
          parseResponse(newsRes, 'News'),
        ]);

        // Log counts for debugging
        console.log('Data loaded:', {
          regions: Array.isArray(regionsData) ? regionsData.length : 0,
          categories: Array.isArray(categoriesData) ? categoriesData.length : 0,
          items: Array.isArray(itemsData) ? itemsData.length : 0,
        });
        
        // Debug: Log category and item associations
        if (Array.isArray(categoriesData) && Array.isArray(itemsData)) {
          console.log('Categories:', categoriesData.map((c: Category) => ({ id: c.id, name: c.name, parent_id: c.parent_id })));
          console.log('Items by category:', categoriesData.map((c: Category) => {
            const catItems = itemsData.filter((i: Item) => i.category_id === c.id);
            return { category: c.name, itemCount: catItems.length, items: catItems.map((i: Item) => ({ id: i.id, title: i.title, is_global: i.is_global, region: i.region?.code })) };
          }));
        }

        // Ensure regions is always an array
        setRegions(Array.isArray(regionsData) ? regionsData : []);
        
        // Organize categories with subcategories
        const safeCategories = Array.isArray(categoriesData) ? categoriesData : [];
        const mainCategories = safeCategories.filter((cat: Category) => !cat.parent_id);
        const subcategories = safeCategories.filter((cat: Category) => cat.parent_id);
        
        const organizedCategories = mainCategories.map((cat: Category) => ({
          ...cat,
          subcategories: subcategories.filter(
            (sub: Category) => sub.parent_id === cat.id
          ).sort((a: Category, b: Category) => a.display_order - b.display_order),
        })).sort((a: Category, b: Category) => a.display_order - b.display_order);
        
        setCategories(organizedCategories);
        setItems(Array.isArray(itemsData) ? itemsData : []);
        const sortedNews = Array.isArray(newsData)
          ? [...newsData].sort(
              (a: NewsArticle, b: NewsArticle) =>
                new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
            )
          : [];
        setNews(sortedNews);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Log response details for debugging
        if (error instanceof Error) {
          console.error('Error details:', error.message);
        }
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (selectedRegion) {
      loadCountries(selectedRegion);
      setSelectedCountries([]); // Clear selected countries when region changes
    }
  }, [selectedRegion]);

  const handleRegionChange = (regionCode: string) => {
    setSelectedRegion(regionCode);
  };

  const handleCountryAdd = (countryCode: string) => {
    if (!selectedCountries.includes(countryCode)) {
      setSelectedCountries([...selectedCountries, countryCode]);
    }
  };

  const handleCountryRemove = (countryCode: string) => {
    setSelectedCountries(selectedCountries.filter(code => code !== countryCode));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-950 text-emerald-100">
        <Header />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-12">
          <div className="text-center text-emerald-50/70 text-sm tracking-wide uppercase">
            Loading intelligence...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-950 text-emerald-100">
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-4 md:py-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300 mb-2">
              curated directory
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
              uTweet — Birding Intelligence Hub
            </h1>
            <p className="text-base md:text-lg text-emerald-100/90 max-w-2xl leading-relaxed">
              Navigate the latest birding resources, hotspots, and travel intel across the globe without losing sight of the details.
            </p>
          </div>
        </div>

        <RegionFilter
          regions={regions}
          countries={countries}
          selectedRegion={selectedRegion}
          selectedCountries={selectedCountries}
          onRegionChange={handleRegionChange}
          onCountryAdd={handleCountryAdd}
          onCountryRemove={handleCountryRemove}
        />

        {/* News and Photo Gallery - First Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {news.length > 0 && (
            <div>
              <NewsSection articles={news} />
            </div>
          )}
          <div>
            <PhotoGallery />
          </div>
        </div>

        {/* Other Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {categories.map((category) => {
            const categoryItems = items.filter(
              (item) => item.category_id === category.id
            );

            // Include subcategory items
            const subcategoryIds = category.subcategories?.map((sub) => sub.id) || [];
            const allCategoryItems = [
              ...categoryItems,
              ...items.filter((item) => subcategoryIds.includes(item.category_id)),
            ];

            // Use column_span from database (default to 1 if not set)
            const columnSpan = category.column_span || 1;

            return (
              <div key={category.id} className={columnSpan === 2 ? 'md:col-span-2' : ''}>
                <Section
                  category={category}
                  items={allCategoryItems}
                  regionCode={selectedRegion}
                  countryCodes={selectedCountries}
                />
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

