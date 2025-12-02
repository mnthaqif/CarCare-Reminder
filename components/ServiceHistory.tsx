import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Vehicle, ServiceLog } from '../types';
import { Plus, Calendar, DollarSign, PenTool } from 'lucide-react';

interface ServiceHistoryProps {
  vehicle: Vehicle;
  onAddService: (log: ServiceLog) => void;
}

export const ServiceHistory: React.FC<ServiceHistoryProps> = ({ vehicle, onAddService }) => {
  const [showForm, setShowForm] = useState(false);
  
  // Aggregate data for chart (cost per year)
  const chartData = vehicle.history.reduce((acc, log) => {
    const year = new Date(log.date).getFullYear().toString();
    const existing = acc.find(item => item.year === year);
    if (existing) {
      existing.amount += log.cost;
    } else {
      acc.push({ year, amount: log.cost });
    }
    return acc;
  }, [] as { year: string; amount: number }[]).sort((a, b) => parseInt(a.year) - parseInt(b.year));

  const totalCost = vehicle.history.reduce((sum, log) => sum + log.cost, 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Cost Summary Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-slate-400 text-xs uppercase font-semibold tracking-wider">Total Spent</p>
            <h2 className="text-3xl font-bold text-slate-800">${totalCost.toLocaleString()}</h2>
          </div>
          <button 
            onClick={() => setShowForm(true)}
            className="bg-slate-900 text-white p-3 rounded-full hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
          >
            <Plus size={20} />
          </button>
        </div>
        
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="year" hide />
              <Tooltip 
                cursor={{fill: 'transparent'}}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="amount" radius={[6, 6, 6, 6]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="#3b82f6" fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* History List */}
      <div>
        <h3 className="text-slate-800 font-bold text-lg mb-4 ml-1">Service Log</h3>
        <div className="space-y-3">
          {vehicle.history.length === 0 ? (
            <p className="text-center text-slate-400 py-8">No service history yet.</p>
          ) : (
            vehicle.history.map((log) => (
              <div key={log.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50 flex items-center justify-between">
                <div className="flex gap-4 items-center">
                  <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
                    <PenTool size={18} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{log.type}</h4>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1"><Calendar size={12}/> {log.date}</span>
                      <span>•</span>
                      <span>{log.mileage.toLocaleString()} km</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block font-bold text-slate-800">${log.cost}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Simple Add Form Modal */}
      {showForm && (
        <AddServiceForm 
          onClose={() => setShowForm(false)} 
          onSubmit={(log) => { onAddService(log); setShowForm(false); }} 
        />
      )}
    </div>
  );
};

interface AddServiceFormProps {
  onClose: () => void;
  onSubmit: (log: ServiceLog) => void;
}

const AddServiceForm: React.FC<AddServiceFormProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    type: 'Oil Change',
    date: new Date().toISOString().split('T')[0],
    cost: '',
    mileage: '',
    notes: ''
  });

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
