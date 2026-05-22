  'use client';

  import { useState, useEffect } from 'react';
  import { useRouter } from 'next/navigation';
  import Link from 'next/link';
  import { MapComponent } from '@/components/MapComponent';
  import { useProjects } from '@/hooks/useProjects';
  import { useAuth } from '@/hooks/useAuth';
  import { CATEGORIES } from '@/lib/utils/constants';

  export default function CreateProjectPage() {
    const router = useRouter();
    const { createProject, isLoading, error } = useProjects();
    const { isAuthenticated, user,isLoading: authLoading, } = useAuth();

    const [formData, setFormData] = useState({
      firstName: user?.name?.split(' ')[0] || '',
      lastName: user?.name?.split(' ').slice(1).join(' ') || '',
      title: '',
      objective: '',
      description: '',
      category: 'Human',
      startDate: '',
      endDate: '',
      latitude: 28.7041,
      longitude: 77.1025,
      address: '',
      pictureOfSuccess: '',
      supportItems: [{ item: '', quantity: 1, byWhen: '', dropLocation: '' }],
    });

    // Set user data once loaded
    useEffect(() => {
      if (user) {
        setFormData((prev) => ({
          ...prev,
          firstName: user.name?.split(' ')[0] || '',
          lastName:
            user.name?.split(' ').slice(1).join(' ') || '',
        }));
      }
    }, [user]);

    // Redirect only AFTER auth loading completes
    useEffect(() => {
      if (!authLoading && !isAuthenticated) {
        router.push('/login');
      }
    }, [authLoading, isAuthenticated, router]);

    const handleInputChange = (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSupportItemChange = (
      index: number,
      field: string,
      value: any
    ) => {
      const items = [...formData.supportItems];
      items[index] = { ...items[index], [field]: value };
      setFormData((prev) => ({ ...prev, supportItems: items }));
    };

    const addSupportItem = () => {
      setFormData((prev) => ({
        ...prev,
        supportItems: [
          ...prev.supportItems,
          { item: '', quantity: 1, byWhen: '', dropLocation: '' },
        ],
      }));
    };

    const removeSupportItem = (index: number) => {
      setFormData((prev) => ({
        ...prev,
        supportItems: prev.supportItems.filter((_, i) => i !== index),
      }));
    };

    const handleLocationSelect = (lat: number, lng: number) => {
      setFormData((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
      }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (formData.supportItems.some((item) => !item.item || !item.dropLocation)) {
        alert('Please fill in all support item details');
        return;
      }

      const project = await createProject(formData);

      if (project) {
        router.push(`/projects/${project._id}`);
      }
    };

    if (!isAuthenticated) return null;

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Create Project</h1>
          <p className="text-gray-600 mb-8">
            Share your social impact initiative with the community
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Basic Information
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="E.g., Community Water Well Project"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Objective
                </label>
                <input
                  type="text"
                  name="objective"
                  value={formData.objective}
                  onChange={handleInputChange}
                  placeholder="What is your main goal?"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Detailed description of your project"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  {Object.values(CATEGORIES).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Timeline</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Location</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Project location address"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-3">
                  Click on the map to select location
                </p>
                <MapComponent
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  address={formData.address || 'Select location'}
                  onLocationSelect={handleLocationSelect}
                  interactive={true}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Support Items Needed
              </h2>

              <div className="space-y-4 mb-4">
                {formData.supportItems.map((item, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Item
                        </label>
                        <input
                          type="text"
                          value={item.item}
                          onChange={(e) =>
                            handleSupportItemChange(index, 'item', e.target.value)
                          }
                          placeholder="E.g., Water Tanks"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          value={item.quantity ?? ''}
                          onChange={(e) =>
                            handleSupportItemChange(
                              index,
                              'quantity',
                              e.target.value === ''
                                ? ''
                                : Number(e.target.value)
                            )
                          }
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Needed By
                        </label>
                        <input
                          type="date"
                          value={item.byWhen}
                          onChange={(e) =>
                            handleSupportItemChange(index, 'byWhen', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Drop Location
                        </label>
                        <input
                          type="text"
                          value={item.dropLocation}
                          onChange={(e) =>
                            handleSupportItemChange(
                              index,
                              'dropLocation',
                              e.target.value
                            )
                          }
                          placeholder="Where to drop"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          required
                        />
                      </div>
                    </div>

                    {formData.supportItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSupportItem(index)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Remove Item
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addSupportItem}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                + Add Another Item
              </button>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Project'}
              </button>
              <Link
                href="/dashboard"
                className="flex-1 bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-400 text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }