import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, PackageOpen, Check } from 'lucide-react';
import { MasterPartItem } from '../types/bom';
import { masterPartsApi } from '../api/client';
import { formatCurrency } from '../utils/costCalculator';

interface PartLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPart: (part: MasterPartItem) => void;
}

export const PartLibraryModal: React.FC<PartLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectPart,
}) => {
  const [masterParts, setMasterParts] = useState<MasterPartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      const fetchParts = async () => {
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
      fetchParts();
    }
  }, [isOpen]);

  const filteredParts = useMemo(() => {
    if (!searchQuery.trim()) return masterParts;
    const q = searchQuery.toLowerCase();
    return masterParts.filter(p => 
      p.partName.toLowerCase().includes(q) || 
      p.typeSpec.toLowerCase().includes(q) || 
      p.maker.toLowerCase().includes(q)
    );
  }, [masterParts, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-4xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center">
            <Search className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
            ค้นหาชิ้นส่วนจากคลัง (Search from Library)
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="พิมพ์ชื่อ, สเปค, หรือ ยี่ห้อ เพื่อค้นหา..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-900/50 p-4">
          {isLoading ? (
            <div className="text-center py-10 text-slate-400">Loading library...</div>
          ) : filteredParts.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <PackageOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p>ไม่พบรายการที่ค้นหา</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredParts.map(part => (
                <div 
                  key={part.id}
                  onClick={() => {
                    onSelectPart(part);
                    onClose();
                  }}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {part.partName}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{part.typeSpec || '-'}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                      part.category === 'MC' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {part.category}
                    </span>
                  </div>
                  <div className="mt-3 flex justify-between items-end">
                    <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                      <p>Maker: <span className="font-semibold">{part.maker || '-'}</span></p>
                      <p>Supplier: <span className="font-semibold">{part.supplier || '-'}</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 mb-0.5">Standard Price</p>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        ฿{formatCurrency(part.unitPrice)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
