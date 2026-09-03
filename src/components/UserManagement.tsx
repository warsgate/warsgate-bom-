import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Edit2, Trash2, Key, Shield, AlertCircle, Loader2, Save, X } from 'lucide-react';
import { usersApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface UserItem {
  id: string;
  username: string;
  name: string;
  role: 'LEVEL_1' | 'LEVEL_2';
  createdAt: string;
}

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    role: 'LEVEL_1' as 'LEVEL_1' | 'LEVEL_2',
    password: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await usersApi.getAll();
      setUsers(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (user?: UserItem) => {
    setFormError(null);
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        name: user.name,
        role: user.role,
        password: '' // Don't populate password on edit
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        name: '',
        role: 'LEVEL_1',
        password: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!editingUser && !formData.password) {
      setFormError('กรุณากำหนดรหัสผ่านสำหรับผู้ใช้ใหม่');
      return;
    }

    try {
      setIsSaving(true);
      if (editingUser) {
        // Update
        const updated = await usersApi.update(editingUser.id, {
          name: formData.name,
          role: formData.role,
          password: formData.password
        });
        setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u));
      } else {
        // Create
        const created = await usersApi.create({
          username: formData.username,
          name: formData.name,
          role: formData.role,
          password: formData.password
        });
        setUsers(prev => [...prev, created]);
      }
      handleCloseModal();
    } catch (err: any) {
      setFormError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, username: string) => {
    if (id === currentUser?.id) {
      alert('ไม่สามารถลบบัญชีของตนเองขณะที่เข้าสู่ระบบอยู่ได้');
      return;
    }
    if (!confirm(`ยืนยันการลบผู้ใช้งาน: ${username} ?`)) return;

    try {
      await usersApi.delete(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการลบผู้ใช้งาน');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center">
            <Shield className="w-6 h-6 mr-2 text-indigo-500" />
            การจัดการผู้ใช้งาน (User Management)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mt-1">
            เพิ่ม, แก้ไข และกำหนดสิทธิ์การเข้าถึงระบบให้กับทีมงาน
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-800 text-white rounded-xl text-sm font-black shadow-md transition-all flex items-center"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          + เพิ่มผู้ใช้ใหม่
        </button>
      </div>

      {error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 p-6 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400 font-bold">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b-2 border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">ชื่อ - นามสกุล</th>
                  <th className="px-4 py-3">ระดับสิทธิ์ (Role)</th>
                  <th className="px-4 py-3 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white flex items-center">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mr-3">
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      {u.username}
                      {u.id === currentUser?.id && (
                        <span className="ml-2 px-2 py-0.5 text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 rounded uppercase font-black">
                          You
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">{u.name}</td>
                    <td className="px-4 py-3">
                      {u.role === 'LEVEL_2' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-black bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                          <Key className="w-3 h-3 mr-1" />
                          LEVEL_2 (Admin)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-black bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          <Users className="w-3 h-3 mr-1" />
                          LEVEL_1 (User)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center items-center space-x-2">
                        <button
                          onClick={() => handleOpenModal(u)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-50 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="แก้ไขผู้ใช้"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id, u.username)}
                          disabled={u.id === currentUser?.id}
                          className={`p-1.5 rounded-lg transition-colors ${
                            u.id === currentUser?.id
                              ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed bg-slate-50 dark:bg-slate-800'
                              : 'text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-50 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-900/30'
                          }`}
                          title={u.id === currentUser?.id ? "ไม่สามารถลบตัวเองได้" : "ลบผู้ใช้"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-bold">
                      ไม่พบผู้ใช้งานในระบบ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
              <h3 className="font-black text-slate-900 dark:text-white flex items-center text-lg">
                {editingUser ? <Edit2 className="w-5 h-5 mr-2 text-blue-500" /> : <UserPlus className="w-5 h-5 mr-2 text-indigo-500" />}
                {editingUser ? 'แก้ไขข้อมูลผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold border border-red-200 dark:border-red-800 flex items-start">
                  <AlertCircle className="w-4 h-4 mr-1.5 shrink-0" />
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingUser}
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="e.g., admin, user01"
                />
                {editingUser && <p className="text-[10px] text-slate-500 mt-1">Username ไม่สามารถเปลี่ยนได้หลังจากสร้างแล้ว</p>}
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                  ชื่อ - นามสกุล (Display Name) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ชื่อที่ใช้แสดงในระบบ"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                  ระดับสิทธิ์ (Role)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex flex-col items-center justify-center p-3 border rounded-xl cursor-pointer transition-all ${
                    formData.role === 'LEVEL_1' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm' 
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="LEVEL_1"
                      className="sr-only"
                      checked={formData.role === 'LEVEL_1'}
                      onChange={() => setFormData({ ...formData, role: 'LEVEL_1' })}
                    />
                    <Users className="w-5 h-5 mb-1" />
                    <span className="text-[11px] font-black">LEVEL_1</span>
                    <span className="text-[9px] text-center mt-0.5 opacity-80">ทีมงานทั่วไป</span>
                  </label>
                  
                  <label className={`flex flex-col items-center justify-center p-3 border rounded-xl cursor-pointer transition-all ${
                    formData.role === 'LEVEL_2' 
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 shadow-sm' 
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="LEVEL_2"
                      className="sr-only"
                      checked={formData.role === 'LEVEL_2'}
                      onChange={() => setFormData({ ...formData, role: 'LEVEL_2' })}
                    />
                    <Key className="w-5 h-5 mb-1" />
                    <span className="text-[11px] font-black">LEVEL_2</span>
                    <span className="text-[9px] text-center mt-0.5 opacity-80">ผู้บริหาร/แอดมิน</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                  รหัสผ่าน (Password) {!editingUser && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={editingUser ? "ปล่อยว่างไว้หากไม่ต้องการเปลี่ยนรหัสผ่าน" : "ตั้งรหัสผ่านสำหรับเข้าใช้งาน"}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-black shadow-md flex items-center transition-all disabled:opacity-70"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
