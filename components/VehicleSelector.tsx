import React, { useState } from 'react';
import { Vehicle } from '../types';
import { Car, Check, X, Plus } from 'lucide-react';

interface VehicleSelectorProps {
  vehicles: Vehicle[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  onAdd: (v: Vehicle) => void;
}

export const VehicleSelector: React.FC<VehicleSelectorProps> = ({ vehicles, activeId, onSelect, onClose, onAdd }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newCarName, setNewCarName] = useState('');
  const [newCarYear, setNewCarYear] = useState('');
  const [newCarMileage, setNewCarMileage] = useState('');
  const [newCarPurchaseDate, setNewCarPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      id: Date.now().toString(),
      name: newCarName,
      year: Number(newCarYear),
      mileage: Number(newCarMileage),
      purchaseDate: newCarPurchaseDate,
      history: []
    });
    setIsAdding(false);
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-end md:items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 relative animate-in slide-in-from-bottom-10 duration-300">
        
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800">
            {isAdding ? 'Add New Vehicle' : 'My Garage'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <X size={20} />
          </button>
        </div>

        {isAdding ? (
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Model Name</label>
              <input 
                className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200"
                placeholder="e.g. Ford F-150"
                value={newCarName}
                onChange={e => setNewCarName(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Year</label>
                <input 
                  type="number"
                  className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200"
                  placeholder="2022"
                  value={newCarYear}
                  onChange={e => setNewCarYear(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Mileage (km)</label>
                <input 
                  type="number"
                  className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200"
                  placeholder="0"
                  value={newCarMileage}
                  onChange={e => setNewCarMileage(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Purchase Date</label>
              <input 
                type="date"
                className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200"
                value={newCarPurchaseDate}
                onChange={e => setNewCarPurchaseDate(e.target.value)}
                required
              />
              <p className="text-[10px] text-slate-400 mt-1">Used to calculate maintenance schedules</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                type="button" 
                onClick={() => setIsAdding(false)}
                className="flex-1 py-3 text-slate-600 font-semibold"
              >
                Back
              </button>
              <button 
                type="submit"
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-200"
              >
                Save Vehicle
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            {vehicles.map(v => (
              <div 
                key={v.id}
                onClick={() => onSelect(v.id)}
                className={`p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                  v.id === activeId 
                    ? 'bg-blue-50 border-2 border-blue-500 shadow-sm' 
                    : 'bg-white border border-slate-100 hover:border-blue-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${v.id === activeId ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <Car size={20} />
                  </div>
                  <div>
                    <h4 className={`font-bold ${v.id === activeId ? 'text-blue-900' : 'text-slate-700'}`}>{v.name}</h4>
                    <p className="text-xs text-slate-500">{v.year} • {v.mileage.toLocaleString()} km</p>
                  </div>
                </div>
                {v.id === activeId && <Check size={20} className="text-blue-500" />}
              </div>
            ))}
            
            <button 
              onClick={() => setIsAdding(true)}
              className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-blue-300 hover:text-blue-500 transition-all mt-4"
            >
              <Plus size={20} />
              Add Another Vehicle
            </button>
          </div>
        )}
      </div>
    </div>
  );
};