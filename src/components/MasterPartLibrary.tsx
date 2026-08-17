import React, { useState, useEffect, useMemo } from 'react';
import { PackageOpen, Search, Plus, Edit3, Trash2, Database, Info, Filter, X, RefreshCw } from 'lucide-react';
import { MasterPartItem, CategoryType, PartCategoryType } from '../types/bom';
import { masterPartsApi } from '../api/client';
import { formatCurrency } from '../utils/costCalculator';

export const MasterPartLibrary: React.FC = () => {
  const [masterParts, setMasterParts] = useState<MasterPartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<MasterPartItem | null>(null);

  // Form state
  const [partName, setPartName] = useState('');
  const [typeSpec, setTypeSpec] = useState('');
  const [category, setCategory] = useState<CategoryType>('MC');
  const [partType, setPartType] = useState<PartCategoryType>('Standard Part');
  const [unit, setUnit] = useState('EA');
  const [maker, setMaker] = useState('');
  const [supplier, setSupplier] = useState('');
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [storeLocation, setStoreLocation] = useState('');
  const [purchaseLink, setPurchaseLink] = useState('');
  const [description, setDescription] = useState('');

  const fetchMasterParts = async () => {
    try {
      setIsLoading(true);
      const data = await masterPartsApi.getAll();
      setMasterParts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterParts();
  }, []);

  const openAddModal = () => {
    setEditingPart(null);
    setPartName('');
    setTypeSpec('');
    setCategory('MC');
    setPartType('Standard Part');
    setUnit('EA');
    setMaker('');
    setSupplier('');
    setUnitPrice(0);
    setStoreLocation('');
    setPurchaseLink('');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (part: MasterPartItem) => {
    setEditingPart(part);
    setPartName(part.partName);
    setTypeSpec(part.typeSpec);
    setCategory(part.category);
    setPartType(part.partType);
    setUnit(part.unit);
    setMaker(part.maker);
    setSupplier(part.supplier);
    setUnitPrice(part.unitPrice);
    setStoreLocation(part.storeLocation);
    setPurchaseLink(part.purchaseLink || '');
    setDescription(part.description);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      partName, typeSpec, category, partType, unit, maker, supplier, unitPrice: Number(unitPrice), storeLocation, purchaseLink, description
    };
    try {
      if (editingPart) {
        await masterPartsApi.update(editingPart.id, payload);
      } else {
        await masterPartsApi.create(payload);
      }
      setIsModalOpen(false);
      fetchMasterParts();
    } catch (err) {
      alert('Failed to save master part');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ยืนยันการลบรายการอะไหล่นี้ออกจากคลัง?')) return;
    try {
      await masterPartsApi.delete(id);
      fetchMasterParts();
    } catch (err) {
      alert('Failed to delete master part');
    }
  };

  const handleSync = async () => {
    if (!confirm('ต้องการนำเข้ารายการ Part ที่ไม่ซ้ำจากทุกโปรเจกต์เดิม เข้ามายังคลังอะไหล่หรือไม่? (ใช้เวลาสักครู่)')) return;
    try {
      setIsLoading(true);
      const res = await masterPartsApi.sync();
      alert(`นำเข้าสำเร็จ! เพิ่มรายการใหม่ลงคลังทั้งหมด ${res.count} รายการ`);
      fetchMasterParts();
    } catch (err) {
      alert('Failed to sync master parts');
      setIsLoading(false);
    }
  };

  const filteredParts = useMemo(() => {
    if (!searchQuery.trim()) return masterParts;
    const q = searchQuery.toLowerCase();
    return masterParts.filter(p => 
      p.partName.toLowerCase().includes(q) || 
      p.typeSpec.toLowerCase().includes(q) || 
      p.maker.toLowerCase().includes(q) || 
      p.supplier.toLowerCase().includes(q)
    );
  }, [masterParts, searchQuery]);

  return (
    <div className="space-y-3">
      <div className="p-3 rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs">
        <div>
          <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 mb-1">
            <Database className="w-3 h-3 mr-1" />
            Master Data
          </div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center">
            <PackageOpen className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
            คลังอะไหล่มาตรฐาน (Part Library)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5">
            จัดการแคตตาล็อกอะไหล่มาตรฐานของบริษัท เพื่อความรวดเร็วในการสร้าง BOM
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, สเปค, ยี่ห้อ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={handleSync}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center whitespace-nowrap"
            title="นำเข้ารายการที่ไม่ซ้ำจากโปรเจกต์เดิม"
          >
            <RefreshCw className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Sync จาก BOM เดิม</span>
          </button>
          <button
            onClick={openAddModal}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center whitespace-nowrap"
          >
            <Plus className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">เพิ่มอะไหล่ในคลัง</span>
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="max-h-[calc(100vh-280px)] overflow-y-auto overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-black">
              <tr>
                <th className="p-2.5 w-10 text-center">NO.</th>
                <th className="p-2.5">PART NAME & TYPE SPEC</th>
                <th className="p-2.5 text-center">CAT</th>
                <th className="p-2.5 text-center">PART TYPE</th>
                <th className="p-2.5">MAKER</th>
                <th className="p-2.5">SUPPLIER</th>
                <th className="p-2.5 text-center">LINK</th>
                <th className="p-2.5 text-right">STANDARD PRICE</th>
                <th className="p-2.5 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">Loading...</td>
                </tr>
              ) : filteredParts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400 font-medium">
                    <PackageOpen className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p>ยังไม่มีรายการอะไหล่ในคลัง</p>
                  </td>
                </tr>
              ) : (
                filteredParts.map((part, index) => (
                  <tr key={part.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors">
                    <td className="p-2.5 font-mono font-bold text-slate-500 text-center">{index + 1}</td>
                    <td className="p-2.5">
                      <div className="font-extrabold text-slate-900 dark:text-white">{part.partName}</div>
                      <div className="text-[10px] font-mono text-slate-500">{part.typeSpec || '-'}</div>
                    </td>
                    <td className="p-2.5 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                        part.category === 'MC' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' 
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {part.category}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        part.partType === 'Standard Part'
                          ? 'bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                          : 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                      }`}>
                        {part.partType}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-600 dark:text-slate-400">{part.maker || '-'}</td>
                    <td className="p-2.5 text-slate-600 dark:text-slate-400">{part.supplier || '-'}</td>
                    <td className="p-2.5 text-center">
                      {part.purchaseLink ? (
                        <a
                          href={part.purchaseLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          title="เปิดลิงก์สั่งซื้อ"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">-</span>
                      )}
                    </td>
                    <td className="p-2.5 text-right font-mono font-black text-slate-900 dark:text-white">
                      {formatCurrency(part.unitPrice)}
                    </td>
                    <td className="p-2.5">
                      <div className="flex items-center justify-center space-x-2">
                        <button onClick={() => openEditModal(part)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="แก้ไข">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(part.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="ลบ">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center">
                <Database className="w-4 h-4 mr-2 text-indigo-500" />
                {editingPart ? 'แก้ไขอะไหล่ในคลัง' : 'เพิ่มอะไหล่ลงคลัง (New Master Part)'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Part Name <span className="text-rose-500">*</span></label>
                  <input type="text" required value={partName} onChange={e => setPartName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Type / Spec</label>
                  <input type="text" value={typeSpec} onChange={e => setTypeSpec(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">หมวดหมู่ (Category)</label>
                  <select value={category} onChange={e => setCategory(e.target.value as CategoryType)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="MC">MC (Mechanical)</option>
                    <option value="EE">EE (Electrical)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">ประเภท (Type)</label>
                  <select value={partType} onChange={e => setPartType(e.target.value as PartCategoryType)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="Standard Part">Standard Part</option>
                    <option value="Feb Part">Feb Part</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">หน่วย (Unit)</label>
                  <input type="text" value={unit} onChange={e => setUnit(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">ราคามาตรฐาน (฿)</label>
                  <input type="number" value={unitPrice} onChange={e => setUnitPrice(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Maker (ผู้ผลิต)</label>
                  <input type="text" value={maker} onChange={e => setMaker(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Supplier (ผู้จัดจำหน่าย)</label>
                  <input type="text" value={supplier} onChange={e => setSupplier(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Link สั่งซื้อ (URL)</label>
                  <input type="url" value={purchaseLink} onChange={e => setPurchaseLink(e.target.value)} placeholder="https://..." className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 mr-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                  ยกเลิก
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 shadow-md">
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
