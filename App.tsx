import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Wrench, MapPin, ScanLine, Car, Plus } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { ServiceHistory } from './components/ServiceHistory';
import { WorkshopFinder } from './components/WorkshopFinder';
import { PartIdentifier } from './components/PartIdentifier';
import { VehicleSelector } from './components/VehicleSelector';
import { Vehicle, ServiceLog } from './types';

// Mock Data
const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: '1',
    name: 'Toyota Camry',
    year: 2019,
    mileage: 45200,
    history: [
      { id: 'l1', date: '2023-10-15', type: 'Oil Change', cost: 65, mileage: 40000, notes: 'Synthetic oil' },
      { id: 'l2', date: '2023-06-20', type: 'Tire Rotation', cost: 40, mileage: 35000 },
      { id: 'l3', date: '2023-01-10', type: 'Brake Pads', cost: 250, mileage: 30000, notes: 'Front pads replaced' },
    ]
  },
  {
    id: '2',
    name: 'Honda CR-V',
    year: 2021,
    mileage: 22100,
    history: [
      { id: 'l4', date: '2024-01-05', type: 'Oil Change', cost: 70, mileage: 20000 },
    ]
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'workshops' | 'scan'>('dashboard');
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [activeVehicleId, setActiveVehicleId] = useState<string>(INITIAL_VEHICLES[0].id);
  const [showVehicleSelector, setShowVehicleSelector] = useState(false);

  const activeVehicle = vehicles.find(v => v.id === activeVehicleId) || vehicles[0];

  const handleAddService = (log: ServiceLog) => {
    const updatedVehicles = vehicles.map(v => {
      if (v.id === activeVehicleId) {
        return {
          ...v,
          mileage: Math.max(v.mileage, log.mileage), // Update car mileage if service was higher
          history: [log, ...v.history]
        };
      }
      return v;
    });
    setVehicles(updatedVehicles);
  };

  const handleAddVehicle = (vehicle: Vehicle) => {
    setVehicles([...vehicles, vehicle]);
    setActiveVehicleId(vehicle.id);
    setShowVehicleSelector(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-0 md:p-4">
      {/* Mobile Container Simulator */}
      <div className="w-full max-w-md bg-slate-50 md:rounded-3xl shadow-2xl overflow-hidden h-screen md:h-[90vh] flex flex-col relative">
        
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md px-6 py-4 flex justify-between items-center sticky top-0 z-20 border-b border-slate-100">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-2 rounded-xl transition-colors"
            onClick={() => setShowVehicleSelector(true)}
          >
            <div className="bg-blue-100 p-2 rounded-full text-blue-600">
              <Car size={20} />
            </div>
            <div>
              <h1 className="text-sm text-slate-500 font-medium leading-none">Current Vehicle</h1>
              <p className="text-lg font-bold text-slate-800 leading-tight">{activeVehicle.name}</p>
            </div>
          </div>
          <button 
            className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            onClick={() => setShowVehicleSelector(true)}
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-24 relative">
          {activeTab === 'dashboard' && (
            <Dashboard vehicle={activeVehicle} />
          )}
          {activeTab === 'history' && (
            <ServiceHistory vehicle={activeVehicle} onAddService={handleAddService} />
          )}
          {activeTab === 'workshops' && (
            <WorkshopFinder />
          )}
          {activeTab === 'scan' && (
            <PartIdentifier vehicleName={activeVehicle.name} />
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-4 flex justify-between items-center z-20 pb-8 md:pb-4">
          <NavButton 
            icon={<LayoutDashboard size={22} />} 
            label="Home" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavButton 
            icon={<Wrench size={22} />} 
            label="History" 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')} 
          />
          <NavButton 
            icon={<MapPin size={22} />} 
            label="Nearby" 
            active={activeTab === 'workshops'} 
            onClick={() => setActiveTab('workshops')} 
          />
          <NavButton 
            icon={<ScanLine size={22} />} 
            label="Scan" 
            active={activeTab === 'scan'} 
            onClick={() => setActiveTab('scan')} 
          />
        </div>

        {/* Vehicle Selector Modal Overlay */}
        {showVehicleSelector && (
          <VehicleSelector 
            vehicles={vehicles} 
            activeId={activeVehicleId}
            onSelect={(id) => { setActiveVehicleId(id); setShowVehicleSelector(false); }}
            onClose={() => setShowVehicleSelector(false)}
            onAdd={handleAddVehicle}
          />
        )}

      </div>
    </div>
  );
}

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all duration-300 ${
      active ? 'text-blue-600 transform -translate-y-1' : 'text-slate-400 hover:text-slate-600'
    }`}
  >
    <div className={`${active ? 'bg-blue-50' : 'bg-transparent'} p-2 rounded-xl transition-colors`}>
      {icon}
    </div>
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);
