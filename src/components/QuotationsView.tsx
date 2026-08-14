import React, { useState, useEffect } from 'react';
import { QuotationItem, BomPartItem } from '../types/bom';
import { quotationsApi, partsApi } from '../api/client';
import { Plus, Edit3, Trash2, FileText, Search, Link as LinkIcon, DollarSign, ExternalLink } from 'lucide-react';

interface QuotationsViewProps {
  projectId: string;
}

export const QuotationsView: React.FC<QuotationsViewProps> = ({ projectId }) => {
  const [quotations, setQuotations] = useState<QuotationItem[]>([]);
  const [parts, setParts] = useState<BomPartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<QuotationItem> | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [quotesRes, partsRes] = await Promise.all([
        quotationsApi.getAll(projectId),
        partsApi.getAll(projectId)
      ]);
      setQuotations(quotesRes);
      setParts(partsRes);
    } catch (error) {
      console.error('Failed to load quotations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) loadData();
  }, [projectId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem?.id) {
        await quotationsApi.update(editingItem.id, { ...editingItem, projectId });
      } else {
        await quotationsApi.create({ ...editingItem, projectId });
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Failed to save quotation:', error);
      alert('บันทึกไม่สำเร็จ');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('คุณต้องการลบใบเสนอราคานี้ใช่หรือไม่? (Part ที่ผูกไว้จะไม่ถูกลบ แต่จะหลุดการเชื่อมต่อ)')) return;
    try {
      await quotationsApi.delete(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete quotation:', error);
      alert('ลบไม่สำเร็จ');
    }
  };

  const filteredQuotations = quotations.filter(q => 
    q.quotationNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.supplier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">กำลังโหลด...</div>;
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center">
            <FileText className="w-6 h-6 mr-2 text-rose-600" />
            ระบบจัดการใบเสนอราคา (Quotations)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            บันทึกใบเสนอราคาจาก Supplier และตรวจสอบรายการ Part ที่เกี่ยวข้อง
          </p>
        </div>
        
        <button
          onClick={() => { setEditingItem({}); setIsModalOpen(true); }}
          className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-800 text-white rounded-xl text-sm font-bold shadow-sm flex items-center transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มใบเสนอราคา
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="ค้นหาเลขที่ใบเสนอราคา, ชื่อ Supplier..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-96 pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-red-500 text-sm"
        />
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredQuotations.map(quote => {
          const linkedParts = parts.filter(p => p.quotationId === quote.id);
          const totalLinkedAmount = linkedParts.reduce((sum, p) => sum + (p.totalAmount || p.qty * p.unitPrice), 0);

          return (
            <div key={quote.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 relative group">
              <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditingItem(quote); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(quote.id)} className="p-1.5 text-slate-400 hover:text-rose-600 bg-rose-50 dark:bg-rose-900/30 rounded-lg">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mb-3 pr-16">
                <h3 className="font-black text-lg text-slate-900 dark:text-white">{quote.quotationNo}</h3>
                <p className="text-sm text-slate-500 font-medium">{quote.supplier}</p>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">วันที่:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{quote.date || '-'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">ยอดรวม (ตามใบเสนอราคา):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    ฿{quote.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">ยอดรวม (Part ที่ผูกไว้):</span>
                  <span className={`font-mono font-bold ${Math.abs(quote.totalAmount - totalLinkedAmount) < 1 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    ฿{totalLinkedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center text-xs font-bold text-slate-600 dark:text-slate-400">
                  <LinkIcon className="w-3.5 h-3.5 mr-1" />
                  ผูกไว้ {linkedParts.length} รายการ
                </div>
                {quote.fileUrl && (
                  <a href={quote.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs font-bold text-blue-600 hover:text-blue-700">
                    <ExternalLink className="w-3.5 h-3.5 mr-1" />
                    เปิดดูไฟล์
                  </a>
                )}
              </div>
            </div>
          );
        })}
        {filteredQuotations.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <FileText className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-slate-500 font-medium">ยังไม่มีใบเสนอราคาในระบบ</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {editingItem?.id ? 'แก้ไขใบเสนอราคา' : 'เพิ่มใบเสนอราคา'}
              </h2>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">เลขที่ใบเสนอราคา (Quotation No) *</label>
                <input
                  required
                  type="text"
                  value={editingItem?.quotationNo || ''}
                  onChange={e => setEditingItem({ ...editingItem, quotationNo: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">ชื่อ Supplier *</label>
                <input
                  required
                  type="text"
                  value={editingItem?.supplier || ''}
                  onChange={e => setEditingItem({ ...editingItem, supplier: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">วันที่</label>
                  <input
                    type="date"
                    value={editingItem?.date || ''}
                    onChange={e => setEditingItem({ ...editingItem, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">ยอดรวมทั้งหมด (฿)</label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      step="0.01"
                      value={editingItem?.totalAmount || ''}
                      onChange={e => setEditingItem({ ...editingItem, totalAmount: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">ลิงก์ไฟล์แนบ (URL เช่น Google Drive)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={editingItem?.fileUrl || ''}
                  onChange={e => setEditingItem({ ...editingItem, fileUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">หมายเหตุ</label>
                <textarea
                  rows={2}
                  value={editingItem?.remarks || ''}
                  onChange={e => setEditingItem({ ...editingItem, remarks: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
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
