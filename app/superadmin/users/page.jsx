'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { getDefaultPermissions } from '@/lib/permissions';
import { toast } from '@/lib/toast';

export default function SuperAdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('agent'); // Track which role button was clicked
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'agent',
    permissions: []
  });
  
  // Update permissions when role changes (default permissions set automatically)
  useEffect(() => {
    if (formData.role) {
      const defaultPerms = getDefaultPermissions(formData.role);
      setFormData(prev => ({ ...prev, permissions: defaultPerms }));
    }
  }, [formData.role]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('User created successfully!');
        setShowModal(false);
        const defaultPerms = getDefaultPermissions('agent');
        setFormData({ name: '', email: '', password: '', role: 'agent', permissions: defaultPerms });
        setSelectedRole('agent');
        fetchUsers();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('User deleted successfully!');
        fetchUsers();
      } else {
        toast.error('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  return (
    <Layout userRole="superadmin">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setSelectedRole('admin');
                const defaultPerms = getDefaultPermissions('admin');
                setFormData({ name: '', email: '', password: '', role: 'admin', permissions: defaultPerms });
                setShowModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <span>+</span> Create Admin
            </button>
            <button
              onClick={() => {
                setSelectedRole('agent');
                const defaultPerms = getDefaultPermissions('agent');
                setFormData({ name: '', email: '', password: '', role: 'agent', permissions: defaultPerms });
                setShowModal(true);
              }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
            >
              <span>+</span> Create Agent
            </button>
          </div>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {users.map((user) => {
                const userId = user._id || user.id;
                return (
                  <li key={userId}>
                    <div className="px-4 py-4 sm:px-6 flex justify-between items-center">
                      <div>
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-indigo-600 truncate">{user.name}</p>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'superadmin' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">{user.email}</p>
                      </div>
                      <button
                        onClick={() => handleDelete(userId)}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative mx-auto p-6 border w-96 shadow-lg rounded-lg bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Create New {formData.role === 'admin' ? 'Admin' : 'Agent'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    const defaultPerms = getDefaultPermissions('agent');
                    setFormData({ name: '', email: '', password: '', role: 'agent', permissions: defaultPerms });
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Enter full name"
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="Enter email address"
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    placeholder="Enter password"
                    minLength={6}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'admin' })}
                      className={`flex-1 px-4 py-2 rounded-md border-2 transition ${
                        formData.role === 'admin'
                          ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'agent' })}
                      className={`flex-1 px-4 py-2 rounded-md border-2 transition ${
                        formData.role === 'agent'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Agent
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {formData.role === 'admin' 
                      ? 'Admin can manage products, sales, customers, and inventory'
                      : 'Agent can access POS interface and view personal sales'}
                  </p>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      const defaultPerms = getDefaultPermissions('agent');
                      setFormData({ name: '', email: '', password: '', role: 'agent', permissions: defaultPerms });
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 text-white rounded-lg transition ${
                      formData.role === 'admin'
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    Create {formData.role === 'admin' ? 'Admin' : 'Agent'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

