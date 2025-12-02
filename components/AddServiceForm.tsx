import React, { useState, useEffect } from 'react';
import { ServiceLog } from '../types';

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

  useEffect(() => {
    if (initialType) {
      setFormData(prev => ({ ...prev, type: initialType }));
    }
    if (initialMileage) {
      setFormData(prev => ({ ...prev, mileage: initialMileage.toString() }));
    }
  }, [initialType, initialMileage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: Date.now().toString(),
      type: formData.type,
      date: formData.date,
      cost: Number(formData.cost),
      mileage: Number(formData.mileage),
      notes: formData.notes
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
        <h3 className="text-xl font-bold text-slate-900 mb-6">Add Service Log</h3>
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
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Cost ($)</label>
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

          <div className="flex gap-3 pt-4">
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