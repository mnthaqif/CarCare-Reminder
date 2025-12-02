import React, { useEffect, useState } from 'react';
import { Vehicle, Reminder } from '../types';
import { Droplet, Battery, Disc, CircleDot, Wind, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getCareTips } from '../services/geminiService';

interface DashboardProps {
  vehicle: Vehicle;
}

export const Dashboard: React.FC<DashboardProps> = ({ vehicle }) => {
  const [tips, setTips] = useState<string>('');
  const [loadingTips, setLoadingTips] = useState(false);

  // Simulated logic to generate reminders based on mileage/history
  // In a real app, this would calculate difference from last service log
  const generateReminders = (v: Vehicle): Reminder[] => {
    const lastOil = v.history.find(h => h.type.includes('Oil'))?.mileage || 0;
    const oilDue = lastOil + 10000;
    const oilProgress = Math.min(100, Math.max(0, ((v.mileage - lastOil) / 10000) * 100));

    const lastBrake = v.history.find(h => h.type.includes('Brake'))?.mileage || 0;
    const brakeDue = lastBrake + 40000;
    const brakeProgress = Math.min(100, Math.max(0, ((v.mileage - lastBrake) / 40000) * 100));

    return [
      {
        id: 'r1',
        title: 'Oil Change',
        dueMileage: oilDue,
        status: oilProgress > 90 ? 'soon' : (oilProgress > 100 ? 'overdue' : 'ok'),
        percentage: oilProgress,
        icon: 'oil'
      },
      {
        id: 'r2',
        title: 'Brake Check',
        dueMileage: brakeDue,
        status: brakeProgress > 90 ? 'soon' : 'ok',
        percentage: brakeProgress,
        icon: 'brake'
      },
      {
        id: 'r3',
        title: 'Tire Rotation',
        dueMileage: v.mileage + 3000, // Mock
        status: 'ok',
        percentage: 60,
        icon: 'tire'
      }
    ];
  };

  const reminders = generateReminders(vehicle);

  useEffect(() => {
    setLoadingTips(true);
    getCareTips(vehicle.name, vehicle.mileage)
      .then(setTips)
      .finally(() => setLoadingTips(false));
  }, [vehicle.name, vehicle.mileage]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Mileage Card */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-6 text-white shadow-lg shadow-blue-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-blue-100 text-sm font-medium">Total Mileage</p>
            <h2 className="text-4xl font-bold tracking-tight mt-1">
              {vehicle.mileage.toLocaleString()} <span className="text-xl font-normal opacity-80">km</span>
            </h2>
          </div>
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
             <CarIcon className="text-white" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-blue-100 bg-blue-900/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
          <CheckCircle2 size={14} />
          <span>Condition: Good</span>
        </div>
      </div>

      {/* Reminders Grid */}
      <div>
        <h3 className="text-slate-800 font-bold text-lg mb-4 flex items-center gap-2">
          <AlertCircle size={18} className="text-orange-500" />
          Upcoming Service
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {reminders.map(reminder => (
            <ReminderCard key={reminder.id} reminder={reminder} currentMileage={vehicle.mileage} />
          ))}
        </div>
      </div>

      {/* AI Tips */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-slate-800 font-bold text-lg mb-3">AI Care Tips</h3>
        {loadingTips ? (
          <div className="space-y-2">
            <div className="h-3 bg-slate-100 rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-slate-100 rounded w-full animate-pulse" />
            <div className="h-3 bg-slate-100 rounded w-5/6 animate-pulse" />
          </div>
        ) : (
          <div className="prose prose-sm prose-slate max-w-none">
             <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
               {tips}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ReminderCard: React.FC<{ reminder: Reminder, currentMileage: number }> = ({ reminder, currentMileage }) => {
  const isUrgent = reminder.status === 'soon' || reminder.status === 'overdue';
  
  const getIcon = () => {
    switch (reminder.icon) {
      case 'oil': return <Droplet size={20} />;
      case 'brake': return <Disc size={20} />;
      case 'battery': return <Battery size={20} />;
      case 'tire': return <CircleDot size={20} />;
      default: return <Wind size={20} />;
    }
  };

  const getColor = () => {
    switch (reminder.status) {
      case 'overdue': return 'bg-red-50 text-red-600 border-red-100';
      case 'soon': return 'bg-orange-50 text-orange-600 border-orange-100';
      default: return 'bg-white text-blue-600 border-slate-100';
    }
  };

  const getProgressColor = () => {
    switch (reminder.status) {
      case 'overdue': return 'bg-red-500';
      case 'soon': return 'bg-orange-500';
      default: return 'bg-blue-500';
    }
  };

  const distRemaining = reminder.dueMileage - currentMileage;

  return (
    <div className={`p-4 rounded-2xl border ${getColor()} shadow-sm transition-transform active:scale-98`}>
      <div className="flex items-center gap-4 mb-3">
        <div className={`p-3 rounded-full ${isUrgent ? 'bg-white' : 'bg-blue-50'}`}>
          {getIcon()}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <h4 className="font-semibold text-slate-800">{reminder.title}</h4>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isUrgent ? 'bg-white/50' : 'bg-slate-100 text-slate-500'}`}>
              {distRemaining > 0 ? `${distRemaining} km left` : `${Math.abs(distRemaining)} km overdue`}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full rounded-full ${getProgressColor()}`} 
              style={{ width: `${Math.min(100, reminder.percentage)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const CarIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
    <circle cx="7" cy="17" r="2" />
    <path d="M9 17h6" />
    <circle cx="17" cy="17" r="2" />
  </svg>
);
