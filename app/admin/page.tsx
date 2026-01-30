'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Category, Region, Item, Country, Photo } from '@/lib/types';
import { Plus, Edit, Trash2, Save, X, LogOut, Check, XCircle } from 'lucide-react';

const ADMIN_USERNAME = 'simcola';
const ADMIN_PASSWORD = 'Tasdev11';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'items' | 'categories' | 'gallery'>('items');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoFilter, setPhotoFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [editingLikes, setEditingLikes] = useState<string>('');
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [isSubcategory, setIsSubcategory] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    category_id: '',
    region_id: '',
    country_id: '',
    is_global: false,
    image_url: '',
  });

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    slug: '',
    parent_id: '',
    display_order: 0,
    column_span: 1,
  });

  useEffect(() => {
    // Check if user is already authenticated
    const authStatus = localStorage.getItem('admin_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      fetchData();
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('admin_authenticated', 'true');
      fetchData();
    } else {
      setLoginError('Invalid username or password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_authenticated');
    setUsername('');
    setPassword('');
  };

  const fetchData = async () => {
    try {
      const [categoriesRes, regionsRes, countriesRes, itemsRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/regions'),
        fetch('/api/countries?region=ALL'),
        fetch('/api/items'),
      ]);

      // Check for errors
      if (!categoriesRes.ok) {
        const errorData = await categoriesRes.json();
        console.error('Categories API error:', categoriesRes.status, errorData);
      }
      if (!regionsRes.ok) {
        const errorData = await regionsRes.json();
        console.error('Regions API error:', regionsRes.status, errorData);
      }
      if (!itemsRes.ok) {
        const errorData = await itemsRes.json();
        console.error('Items API error:', itemsRes.status, errorData);
      }

      const [categoriesData, regionsData, countriesData, itemsData] = await Promise.all([
        categoriesRes.json(),
        regionsRes.json(),
        countriesRes.json(),
        itemsRes.json(),
      ]);

      console.log('Admin fetchData results:', {
        categories: Array.isArray(categoriesData) ? categoriesData.length : 'not array',
        categoriesData: categoriesData,
        regions: Array.isArray(regionsData) ? regionsData.length : 'not array',
        countries: Array.isArray(countriesData) ? countriesData.length : 'not array',
        items: Array.isArray(itemsData) ? itemsData.length : 'not array',
      });

      // Check if responses are error objects
      if (categoriesData && categoriesData.error) {
        console.error('Categories API returned error:', categoriesData);
        alert(`Error loading categories: ${categoriesData.message || categoriesData.error}`);
      }
      if (itemsData && itemsData.error) {
        console.error('Items API returned error:', itemsData);
      }

      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setRegions(Array.isArray(regionsData) ? regionsData.filter((r: Region) => r.code !== 'ALL') : []);
      setCountries(Array.isArray(countriesData) ? countriesData : []);
      setItems(Array.isArray(itemsData) ? itemsData : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const fetchPhotos = async () => {
    try {
      let url = '/api/photos/admin';
      if (photoFilter === 'approved') {
        url += '?approved=true';
      } else if (photoFilter === 'pending') {
        url += '?approved=false';
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Photos API error:', response.status, errorData);
        setPhotos([]);
        return;
      }

      const data = await response.json();
      console.log('Admin fetchPhotos result:', {
        count: Array.isArray(data) ? data.length : 'not array',
        filter: photoFilter,
        data: Array.isArray(data) ? data : data
      });

      // Check if response is an error object
      if (data && data.error) {
        console.error('Photos API returned error:', data);
        alert(`Error loading photos: ${data.message || data.error}`);
        setPhotos([]);
        return;
      }

      setPhotos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching photos:', error);
      setPhotos([]);
    }
  };

  useEffect(() => {
    if (isAuthenticated && activeTab === 'gallery') {
      fetchPhotos();
    }
  }, [isAuthenticated, activeTab, photoFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingItem
        ? `/api/items/${editingItem.id}`
        : '/api/items';
      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          category_id: parseInt(formData.category_id),
          region_id: formData.region_id ? parseInt(formData.region_id) : null,
          country_id: formData.country_id ? parseInt(formData.country_id) : null,
        }),
      });

      if (response.ok) {
        await fetchData();
        resetForm();
      } else {
        alert('Failed to save item');
      }
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error saving item');
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCategory
        ? `/api/categories/${editingCategory.id}`
        : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const categoryData = {
        name: categoryFormData.name,
        slug: categoryFormData.slug || categoryFormData.name.toLowerCase().replace(/\s+/g, '-'),
        parent_id: isSubcategory && categoryFormData.parent_id ? parseInt(categoryFormData.parent_id) : null,
        display_order: categoryFormData.display_order,
        column_span: categoryFormData.column_span,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
      });

      if (response.ok) {
        await fetchData();
        resetCategoryForm();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save category');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error saving category');
    }
  };

  const handleDelete = async (itemId: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchData();
      } else {
        alert('Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item');
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm('Are you sure you want to delete this category? This will also delete all subcategories and items in this category.')) return;

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error deleting category');
    }
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || '',
      url: item.url || '',
      category_id: item.category_id.toString(),
      region_id: item.region_id?.toString() || '',
      country_id: item.country_id?.toString() || '',
      is_global: item.is_global,
      image_url: item.image_url || '',
    });
    setShowItemForm(true);
  };

  const handleEditCategory = (category: Category, isSub: boolean = false) => {
    setEditingCategory(category);
    setIsSubcategory(isSub);
    setCategoryFormData({
      name: category.name,
      slug: category.slug,
      parent_id: category.parent_id?.toString() || '',
      display_order: category.display_order,
      column_span: category.column_span || 1,
    });
    setShowCategoryForm(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setShowItemForm(false);
    setFormData({
      title: '',
      description: '',
      url: '',
      category_id: '',
      region_id: '',
      country_id: '',
      is_global: false,
      image_url: '',
    });
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setShowCategoryForm(false);
    setIsSubcategory(false);
    setCategoryFormData({
      name: '',
      slug: '',
      parent_id: '',
      display_order: 0,
      column_span: 1,
    });
  };

  const selectedRegionId = formData.region_id ? parseInt(formData.region_id, 10) : null;
  const filteredCountries = selectedRegionId
    ? countries.filter((country) => country.region_id === selectedRegionId)
    : countries;

  const getCategoryName = (categoryId: number) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  const mainCategories = categories.filter((cat) => !cat.parent_id);
  const getSubcategories = (parentId: number) => {
    return categories.filter((cat) => cat.parent_id === parentId);
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-950">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
          <div className="bg-emerald-900/40 backdrop-blur-md rounded-2xl border border-emerald-500/20 p-8 w-full max-w-md shadow-xl">
            <h1 className="text-3xl font-bold text-white mb-6 text-center">Admin Login</h1>
            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-md text-sm">
                  {loginError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-emerald-200 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-emerald-950/50 border border-emerald-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-emerald-200 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-emerald-950/50 border border-emerald-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors font-medium"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-950">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-emerald-100">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-950 text-emerald-100">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

        <div className="bg-emerald-900/30 backdrop-blur-md rounded-lg border border-emerald-500/20 mb-6">
          <div className="border-b border-emerald-500/20">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('items')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'items'
                    ? 'border-b-2 border-emerald-400 text-emerald-200'
                    : 'text-emerald-300/70 hover:text-emerald-200'
                }`}
              >
                Items
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'categories'
                    ? 'border-b-2 border-emerald-400 text-emerald-200'
                    : 'text-emerald-300/70 hover:text-emerald-200'
                }`}
              >
                Categories
              </button>
              <button
                onClick={() => setActiveTab('gallery')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'gallery'
                    ? 'border-b-2 border-emerald-400 text-emerald-200'
                    : 'text-emerald-300/70 hover:text-emerald-200'
                }`}
              >
                Photo Gallery
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'items' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-white">Manage Items</h2>
              <button
                onClick={() => setShowItemForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
              >
                <Plus size={20} />
                Add New Item
              </button>
            </div>

            {showItemForm && (
              <div className="bg-emerald-900/40 backdrop-blur-md rounded-lg border border-emerald-500/20 p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-white">
                    {editingItem ? 'Edit Item' : 'Add New Item'}
                  </h3>
                  <button
                    onClick={resetForm}
                    className="text-emerald-300/70 hover:text-emerald-200"
                  >
                    <X size={24} />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-emerald-200 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-emerald-950/50 border border-emerald-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-emerald-200 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      rows={3}
                      className="w-full px-3 py-2 bg-emerald-950/50 border border-emerald-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-emerald-200 mb-1">
                      URL
                    </label>
                    <input
                      type="url"
                      value={formData.url}
                      onChange={(e) =>
                        setFormData({ ...formData, url: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-emerald-950/50 border border-emerald-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-emerald-200 mb-1">
                        Category *
                      </label>
                      <select
                        required
                        value={formData.category_id}
                        onChange={(e) =>
                          setFormData({ ...formData, category_id: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-emerald-950/50 border border-emerald-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      >
                        <option value="">Select a category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-emerald-200 mb-1">
                        Region
                      </label>
                      <select
                        value={formData.region_id}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData({
                            ...formData,
                            region_id: value,
                            country_id: '',
                          });
                        }}
                        className="w-full px-3 py-2 bg-emerald-950/50 border border-emerald-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      >
                        <option value="">None (Global)</option>
                        {regions.map((region) => (
                          <option key={region.id} value={region.id}>
                            {region.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-emerald-200 mb-1">
                      Country
                    </label>
                    <select
                      value={formData.country_id}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (!value) {
                          setFormData({ ...formData, country_id: '' });
                          return;
                        }

                        const selected = countries.find(
                          (country) => country.id === parseInt(value, 10)
                        );

                        setFormData({
                          ...formData,
                          country_id: value,
                          region_id: selected
                            ? selected.region_id.toString()
                            : formData.region_id,
                        });
                      }}
                      className="w-full px-3 py-2 bg-emerald-950/50 border border-emerald-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      disabled={filteredCountries.length === 0}
                    >
                      <option value="">None (Global)</option>
                      {filteredCountries
                        .slice()
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((country) => (
                          <option key={country.id} value={country.id}>
                            {country.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-emerald-200 mb-1">
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={formData.image_url}
                      onChange={(e) =>
                        setFormData({ ...formData, image_url: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-emerald-950/50 border border-emerald-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_global"
                      checked={formData.is_global}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormData({
                          ...formData,
                          is_global: checked,
                          region_id: checked ? '' : formData.region_id,
                          country_id: checked ? '' : formData.country_id,
                        });
                      }}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-400 border-emerald-500/30 rounded bg-emerald-950/50"
                    />
                    <label htmlFor="is_global" className="ml-2 text-sm text-emerald-200">
                      Global (available in all regions)
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                    >
                      <Save size={20} />
                      {editingItem ? 'Update' : 'Create'} Item
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 bg-emerald-800/50 text-emerald-200 rounded-md hover:bg-emerald-800/70 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-emerald-900/40 backdrop-blur-md rounded-lg border border-emerald-500/20 overflow-hidden">
              <table className="min-w-full divide-y divide-emerald-500/20">
                <thead className="bg-emerald-900/60">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-emerald-200">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-emerald-200">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-emerald-200">Region</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-emerald-200">Country</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-emerald-200">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-500/10 bg-emerald-950/40">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-emerald-900/40 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-emerald-100">
                          {item.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-emerald-200/70">
                          {getCategoryName(item.category_id)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-emerald-200/70">
                          {item.is_global ? 'Global' : item.region?.name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-emerald-200/70">
                          {item.is_global
                            ? 'Global'
                            : item.country?.name || (item.region ? 'Region-wide' : 'N/A')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-emerald-300 hover:text-emerald-100 transition-colors"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-white">Manage Categories</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsSubcategory(false);
                    resetCategoryForm();
                    setShowCategoryForm(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                >
                  <Plus size={20} />
                  Add Category
                </button>
                <button
                  onClick={() => {
                    setIsSubcategory(true);
                    resetCategoryForm();
                    setShowCategoryForm(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-md hover:bg-emerald-800 transition-colors"
                >
                  <Plus size={20} />
                  Add Subcategory
                </button>
              </div>
            </div>

            {showCategoryForm && (
              <div className="bg-emerald-900/40 backdrop-blur-md rounded-lg border border-emerald-500/20 p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-white">
                    {editingCategory ? `Edit ${isSubcategory ? 'Subcategory' : 'Category'}` : `Add New ${isSubcategory ? 'Subcategory' : 'Category'}`}
                  </h3>
                  <button
                    onClick={resetCategoryForm}
                    className="text-emerald-300/70 hover:text-emerald-200"
                  >
                    <X size={24} />
                  </button>
                </div>
                <form onSubmit={handleCategorySubmit} className="space-y-4">
                  {isSubcategory && (
                    <div>
                      <label className="block text-sm font-medium text-emerald-200 mb-1">
                        Parent Category *
                      </label>
                      <select
                        required
                        value={categoryFormData.parent_id}
                        onChange={(e) =>
                          setCategoryFormData({ ...categoryFormData, parent_id: e.target.value })
                        }
                        disabled={!!editingCategory}
                        className="w-full px-3 py-2 bg-emerald-950/50 border border-emerald-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50"
                      >
                        <option value="">Select a parent category</option>
                        {mainCategories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-emerald-200 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={categoryFormData.name}
                      onChange={(e) =>
                        setCategoryFormData({ ...categoryFormData, name: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-emerald-950/50 border border-emerald-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-emerald-200 mb-1">
                      Slug
                    </label>
                    <input
                      type="text"
                      value={categoryFormData.slug}
                      onChange={(e) =>
                        setCategoryFormData({ ...categoryFormData, slug: e.target.value })
                      }
                      placeholder="Auto-generated from name if empty"
                      className="w-full px-3 py-2 bg-emerald-950/50 border border-emerald-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-emerald-200 mb-1">
                        Display Order
                      </label>
                      <input
                        type="number"
                        value={categoryFormData.display_order}
                        onChange={(e) =>
                          setCategoryFormData({ ...categoryFormData, display_order: parseInt(e.target.value) || 0 })
                        }
                        className="w-full px-3 py-2 bg-emerald-950/50 border border-emerald-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    </div>
                    {!isSubcategory && (
                      <div>
                        <label className="block text-sm font-medium text-emerald-200 mb-1">
                          Column Span
                        </label>
                        <select
                          value={categoryFormData.column_span}
                          onChange={(e) =>
                            setCategoryFormData({ ...categoryFormData, column_span: parseInt(e.target.value) })
                          }
                          className="w-full px-3 py-2 bg-emerald-950/50 border border-emerald-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        >
                          <option value={1}>1 Column</option>
                          <option value={2}>2 Columns</option>
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                    >
                      <Save size={20} />
                      {editingCategory ? 'Update' : 'Create'} {isSubcategory ? 'Subcategory' : 'Category'}
                    </button>
                    <button
                      type="button"
                      onClick={resetCategoryForm}
                      className="px-4 py-2 bg-emerald-800/50 text-emerald-200 rounded-md hover:bg-emerald-800/70 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-emerald-900/40 backdrop-blur-md rounded-lg border border-emerald-500/20 p-6">
              {mainCategories.length === 0 ? (
                <div className="p-8 text-center text-emerald-200/70">
                  <p className="mb-2">No categories found.</p>
                  <p className="text-sm text-emerald-300/50">
                    Total categories in database: {categories.length}
                  </p>
                  <p className="text-sm text-emerald-300/50 mt-2">
                    Click "Add Category" above to create your first category.
                  </p>
                </div>
              ) : (
              <div className="space-y-6">
                {mainCategories.map((category) => (
                  <div key={category.id} className="border-b border-emerald-500/20 pb-4 last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-white">
                          {category.name}
                        </h3>
                        <span className="text-xs px-2 py-1 bg-emerald-800/50 text-emerald-200 rounded">
                          {category.column_span || 1} column{category.column_span === 2 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditCategory(category, false)}
                          className="text-emerald-300 hover:text-emerald-100 transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    {getSubcategories(category.id).length > 0 && (
                      <div className="mt-3 ml-4 space-y-2">
                        {getSubcategories(category.id).map((subcategory) => (
                          <div
                            key={subcategory.id}
                            className="flex items-center justify-between bg-emerald-950/30 rounded-md px-3 py-2"
                          >
                            <span className="text-sm text-emerald-200">
                              • {subcategory.name}
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditCategory(subcategory, true)}
                                className="text-emerald-300 hover:text-emerald-100 transition-colors"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(subcategory.id)}
                                className="text-red-400 hover:text-red-300 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'gallery' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-white">Manage Photo Gallery</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setPhotoFilter('all')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    photoFilter === 'all'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-800/50 text-emerald-200 hover:bg-emerald-800/70'
                  }`}
                >
                  All Photos
                </button>
                <button
                  onClick={() => setPhotoFilter('approved')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    photoFilter === 'approved'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-800/50 text-emerald-200 hover:bg-emerald-800/70'
                  }`}
                >
                  Approved
                </button>
                <button
                  onClick={() => setPhotoFilter('pending')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    photoFilter === 'pending'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-800/50 text-emerald-200 hover:bg-emerald-800/70'
                  }`}
                >
                  Pending Approval
                </button>
              </div>
            </div>

            <div className="bg-emerald-900/40 backdrop-blur-md rounded-lg border border-emerald-500/20 overflow-hidden">
              {photos.length === 0 ? (
                <div className="p-8 text-center text-emerald-200/70">
                  No photos found
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="bg-emerald-950/40 rounded-lg overflow-hidden border border-emerald-500/20"
                    >
                      <div className="relative aspect-video bg-emerald-950/60">
                        <img
                          src={photo.image_url}
                          alt={`Photo by ${photo.username}`}
                          className="w-full h-full object-cover"
                        />
                        {!photo.approved && (
                          <div className="absolute top-2 right-2 bg-yellow-500/90 text-yellow-900 px-2 py-1 rounded text-xs font-semibold">
                            Pending
                          </div>
                        )}
                      </div>
                      <div className="p-4 space-y-2">
                        <div>
                          <p className="text-sm font-medium text-emerald-200">
                            {photo.username}
                          </p>
                          <p className="text-xs text-emerald-300/70">{photo.email}</p>
                          {photo.location && (
                            <p className="text-xs text-emerald-300/70 mt-1">
                              📍 {photo.location}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-emerald-500/20">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-emerald-200">Likes:</span>
                            {editingPhoto?.id === photo.id ? (
                              <input
                                type="number"
                                value={editingLikes}
                                onChange={(e) => setEditingLikes(e.target.value)}
                                className="w-20 px-2 py-1 bg-emerald-950/50 border border-emerald-500/30 rounded text-white text-sm"
                                min="0"
                              />
                            ) : (
                              <span className="text-sm text-emerald-300">{photo.likes}</span>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {editingPhoto?.id === photo.id ? (
                              <>
                                <button
                                  onClick={async () => {
                                    try {
                                      const likesValue = parseInt(editingLikes);
                                      if (isNaN(likesValue) || likesValue < 0) {
                                        alert('Please enter a valid number (0 or greater)');
                                        return;
                                      }
                                      
                                      const response = await fetch(`/api/photos/${photo.id}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          likes: likesValue,
                                        }),
                                      });
                                      
                                      if (response.ok) {
                                        setEditingPhoto(null);
                                        setEditingLikes('');
                                        await fetchPhotos();
                                      } else {
                                        const errorData = await response.json();
                                        alert(errorData.error || 'Failed to update likes');
                                      }
                                    } catch (error) {
                                      console.error('Error updating likes:', error);
                                      alert('Error updating likes. Please try again.');
                                    }
                                  }}
                                  className="text-emerald-300 hover:text-emerald-100"
                                >
                                  <Save size={16} />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingPhoto(null);
                                    setEditingLikes('');
                                  }}
                                  className="text-emerald-300/70 hover:text-emerald-200"
                                >
                                  <X size={16} />
                                </button>
                              </>
                            ) : (
                              <>
                                {!photo.approved && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        const response = await fetch(`/api/photos/${photo.id}`, {
                                          method: 'PUT',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ approved: true }),
                                        });
                                        if (response.ok) {
                                          fetchPhotos();
                                        }
                                      } catch (error) {
                                        console.error('Error approving photo:', error);
                                      }
                                    }}
                                    className="text-green-400 hover:text-green-300"
                                    title="Approve"
                                  >
                                    <Check size={16} />
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setEditingPhoto(photo);
                                    setEditingLikes(photo.likes.toString());
                                  }}
                                  className="text-emerald-300 hover:text-emerald-100"
                                  title="Edit likes"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (!confirm('Are you sure you want to delete this photo?')) return;
                                    try {
                                      const response = await fetch(`/api/photos/${photo.id}`, {
                                        method: 'DELETE',
                                      });
                                      if (response.ok) {
                                        fetchPhotos();
                                      }
                                    } catch (error) {
                                      console.error('Error deleting photo:', error);
                                    }
                                  }}
                                  className="text-red-400 hover:text-red-300"
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
