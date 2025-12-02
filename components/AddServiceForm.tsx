import React, { useState, useEffect } from 'react';
import { ServiceLog, ServicePart } from '../types';
import { Plus, Trash2, X } from 'lucide-react';

interface AddServiceFormProps {
  onClose: () => void;
  onSubmit: (log: ServiceLog) => void;
  initialType?: string;
  initialMileage?: number;
}

export const AddServiceForm: React.FC<AddServiceFormProps> = ({ onClose, onSubmit, initialType, initialMileage }) => {
  const [formData, setFormData] = useState({
    type: 'Oil Change',
    date: new Date().toISOString().split('T')[0],
    cost: '',
    mileage: '',
    notes: ''
  });

  const [parts, setParts] = useState<ServicePart[]>([]);
  const [showPartInput, setShowPartInput] = useState(false);
  const [newPart, setNewPart] = useState({ name: '', brand: '', cost: '' });

  useEffect(() => {
    if (initialType) {
      setFormData(prev => ({ ...prev, type: initialType }));
    }
    if (initialMileage) {
      setFormData(prev => ({ ...prev, mileage: initialMileage.toString() }));
    }
  }, [initialType, initialMileage]);

  const handleAddPart = () => {
    if (newPart.name) {
      setParts([...parts, {
        name: newPart.name,
        brand: newPart.brand,
        cost: newPart.cost ? Number(newPart.cost) : undefined
      }]);
      setNewPart({ name: '', brand: '', cost: '' });
      setShowPartInput(false);
    }
  };

  const removePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: Date.now().toString(),
      type: formData.type,
      date: formData.date,
      cost: Number(formData.cost),
      mileage: Number(formData.mileage),
      notes: formData.notes,
      parts: parts.length > 0 ? parts : undefined
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900">Add Service Log</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-400">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Service Type</label>
            <select 
              className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
            >
              <option>Oil Change</option>
              <option>Tire Rotation</option>
              <option>Brake Service</option>
              <option>Battery Replacement</option>
              <option>Cabin Air Filter</option>
              <option>Engine Air Filter</option>
              <option>Brake Fluid</option>
              <option>Coolant Flush</option>
              <option>Transmission Fluid</option>
              <option>Spark Plugs</option>
              <option>Timing Belt</option>
              <option>Inspection</option>
              <option>Other</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Cost ($)</label>
              <input 
                type="number" 
                required
                className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.cost}
                onChange={(e) => setFormData({...formData, cost: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Mileage</label>
              <input 
                type="number" 
                required
                className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.mileage}
                onChange={(e) => setFormData({...formData, mileage: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</label>
            <input 
              type="date" 
              required
              className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
            />
          </div>

          {/* Parts Section */}
          <div className="pt-2">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Replaced Parts</label>
              <button 
                type="button" 
                onClick={() => setShowPartInput(true)} 
                className="text-xs text-blue-600 font-bold flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors"
              >
                <Plus size={14} /> Add Part
              </button>
            </div>
            
            {/* Added Parts List */}
            {parts.length > 0 && (
              <div className="space-y-2 mb-3">
                {parts.map((p, i) => (
                  <div key={i} className="flex justify-between items-center text-sm bg-slate-50 p-3 rounded-xl border border-slate-100">
                     <div className="flex flex-col">
                        <span className="font-medium text-slate-700">{p.name}</span>
                        {(p.brand || p.cost) && (
                          <span className="text-xs text-slate-400">
                            {p.brand} {p.brand && p.cost ? '•' : ''} {p.cost ? `$${p.cost}` : ''}
                          </span>
                        )}
                     </div>
                     <button 
                       type="button"
                       onClick={() => removePart(i)}
                       className="text-slate-400 hover:text-red-500 p-1"
                     >
                       <Trash2 size={16} />
                     </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Part Inputs */}
            {showPartInput && (
              <div className="bg-slate-50 p-3 rounded-xl space-y-2 mb-3 border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
                 <input 
                   placeholder="Part Name (e.g. Oil Filter)" 
                   className="w-full p-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-blue-400"
                   value={newPart.name}
                   onChange={e => setNewPart({...newPart, name: e.target.value})}
                   autoFocus
                 />
                 <div className="flex gap-2">
                   <input 
                     placeholder="Brand (Optional)" 
                     className="flex-1 p-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-blue-400"
                     value={newPart.brand}
                     onChange={e => setNewPart({...newPart, brand: e.target.value})}
                   />
                   <input 
                     type="number"
                     placeholder="Cost" 
                     className="w-20 p-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-blue-400"
                     value={newPart.cost}
                     onChange={e => setNewPart({...newPart, cost: e.target.value})}
                   />
                 </div>
                 <div className="flex gap-2 pt-1">
                   <button 
                     type="button" 
                     onClick={() => setShowPartInput(false)} 
                     className="flex-1 py-2 text-slate-500 text-xs font-bold rounded-lg hover:bg-slate-200"
                   >
                     Cancel
                   </button>
                   <button 
                     type="button" 
                     onClick={handleAddPart} 
                     disabled={!newPart.name}
                     className="flex-1 py-2 bg-blue-100 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     Add to List
                   </button>
                 </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes</label>
            <textarea 
              className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
              placeholder="Any additional details..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 p-3 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 p-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
            >
              Save Log
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};