import React, { useEffect, useState } from 'react';
import { getUsers } from '../../firebase';

export const AdminCustomers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-brand-text border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium text-brand-text">Customers</h2>
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 px-4 py-3 border-b border-neutral-100 text-[13px] uppercase tracking-wider text-neutral-500">
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-neutral-500">
                    No customers found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         {user.photoURL ? (
                           <img src={user.photoURL} alt={user.name || 'User'} className="w-10 h-10 rounded-full" />
                         ) : (
                           <div className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center text-neutral-500 font-medium">
                             {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                           </div>
                         )}
                         <span className="text-[14px] font-medium text-brand-text">{user.name || 'Unnamed User'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[14px] text-neutral-600">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[12px] px-3 py-1 rounded-full font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-neutral-100 text-neutral-700'}`}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[13px] text-neutral-500">
                       {user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : 'Unknown'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
