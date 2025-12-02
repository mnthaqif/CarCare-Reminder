import React, { useEffect, useState } from 'react';
import { Vehicle, Reminder, ServiceLog } from '../types';
import { Droplet, Battery, Disc, CircleDot, Wind, AlertCircle, CheckCircle2, FlaskConical, Thermometer, Settings, Check } from 'lucide-react';
import { getCareTips } from '../services/geminiService';
import { AddServiceForm } from './AddServiceForm';

interface DashboardProps {
  vehicle: Vehicle;
  onAddService?: (log: ServiceLog) => void;
}

// Maintenance Rules (Months, KM)
const MAINTENANCE_SCHEDULE = [
  { type: 'Oil Change', months: 6, km: 10000, icon: 'oil' },
  { type: 'Tire Rotation', months: 6, km: 10000, icon: 'tire' },
  { type: 'Cabin Air Filter', months: 12, km: 24000, icon: 'filter' },
  { type: 'Engine Air Filter', months: 36, km: 48000, icon: 'filter' },
  { type: 'Brake Fluid', months: 24, km: 40000, icon: 'fluid' },
  { type: 'Coolant Flush', months: 60, km: 100000, icon: 'fluid' },
  { type: 'Transmission Fluid', months: 48, km: 96000, icon: 'fluid' },
  { type: 'Spark Plugs', months: 60, km: 100000, icon: 'other' },
  { type: 'Battery Replacement', months: 36, km: 0, icon: 'battery' }, // Time based mostly
];

export const Dashboard: React.FC<DashboardProps> = ({ vehicle, onAddService }) => {
  const [tips, setTips] = useState<string>('');
  const [loadingTips, setLoadingTips] = useState(false);
  const [completingTask, setCompletingTask] = useState<Reminder | null>(null);

  // Generate reminders based on Purchase Date OR Last Service
  const generateReminders = (v: Vehicle): Reminder[] => {
    const today = new Date();
    // Default to a guess if purchase date is missing (Jan 1st of model year)
    const purchaseDate = v.purchaseDate ? new Date(v.purchaseDate) : new Date(v.year, 0, 1);
    
    return MAINTENANCE_SCHEDULE.map((item, index) => {
      // Find last service of this type
      const lastService = v.history.find(h => h.type.includes(item.type));
      
      let nextDueDate: Date;
      let nextDueKm: number;
      let progress = 0;
      let isTimeBased = false;

      // 1. Calculate Next Due Date (Time based)
      const lastDate = lastService ? new Date(lastService.date) : purchaseDate;
      nextDueDate = new Date(lastDate);
      nextDueDate.setMonth(nextDueDate.getMonth() + item.months);

      // 2. Calculate Next Due Mileage (Distance based)
      const lastKm = lastService ? lastService.mileage : 0;
      nextDueKm = lastKm + item.km;

      // 3. Determine status based on which comes first or if KM is 0 (time only)
      const monthsDiff = (nextDueDate.getTime() - today.getTime()) / (1000 * 3600 * 24 * 30);
      const kmDiff = nextDueKm - v.mileage;

      // Calculate progress (0 to 100%)
      // Time progress
      const totalMonths = item.months;
      const elapsedMonths = totalMonths - monthsDiff;
      const timeProgress = (elapsedMonths / totalMonths) * 100;

      // Km progress
      const kmProgress = item.km > 0 ? ((v.mileage - lastKm) / item.km) * 100 : 0;

      // Use the higher progress to determine urgency
      progress = Math.max(timeProgress, kmProgress);
      
      // If item is pure time based (km = 0)
      if (item.km === 0) {
        isTimeBased = true;
        progress = timeProgress;
      }

      let status: 'ok' | 'soon' | 'overdue' = 'ok';
      if (progress >= 100) status = 'overdue';
      else if (progress >= 85) status = 'soon';

      return {
        id: `rem-${index}`,
        title: item.type,
        dueMileage: item.km > 0 ? nextDueKm : 0,
        dueDate: nextDueDate.toISOString().split('T')[0],
        status,
        percentage: Math.min(100, Math.max(0, progress)),
        icon: item.icon as any,
        isTimeBased: item.km === 0 || (timeProgress > kmProgress)
      };
    }).sort((a, b) => b.percentage - a.percentage); // Sort by urgency
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
          <span>Purchase Date: {vehicle.purchaseDate || `${vehicle.year}-01-01`}</span>
        </div>
      </div>

      {/* Reminders Grid */}
      <div>
        <h3 className="text-slate-800 font-bold text-lg mb-4 flex items-center gap-2">
          <AlertCircle size={18} className="text-orange-500" />
          Maintenance Schedule
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {reminders.map(reminder => (
            <ReminderCard 
              key={reminder.id} 
              reminder={reminder} 
              currentMileage={vehicle.mileage} 
              onMarkDone={() => setCompletingTask(reminder)}
            />
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

      {/* Complete Task Modal */}
      {completingTask && onAddService && (
        <AddServiceForm 
          onClose={() => setCompletingTask(null)}
          onSubmit={(log) => {
             onAddService(log);
             setCompletingTask(null);
          }}
          initialType={completingTask.title}
          initialMileage={vehicle.mileage}
        />
      )}
    </div>
  );
};

interface ReminderCardProps {
  reminder: Reminder;
  currentMileage: number;
  onMarkDone: () => void;
}

const ReminderCard: React.FC<ReminderCardProps> = ({ reminder, currentMileage, onMarkDone }) => {
  const isUrgent = reminder.status === 'soon' || reminder.status === 'overdue';
  
  const getIcon = () => {
    switch (reminder.icon) {
      case 'oil': return <Droplet size={20} />;
      case 'brake': return <Disc size={20} />;
      case 'battery': return <Battery size={20} />;
      case 'tire': return <CircleDot size={20} />;
      case 'filter': return <Wind size={20} />;
      case 'fluid': return <FlaskConical size={20} />;
      default: return <Settings size={20} />;
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

  // Format the due text
  let dueText = '';
  if (reminder.status === 'overdue') {
      dueText = 'Overdue!';
  } else if (reminder.isTimeBased && reminder.dueDate) {
      const date = new Date(reminder.dueDate);
      dueText = `Due ${date.toLocaleDateString()}`;
  } else {
      dueText = `${distRemaining.toLocaleString()} km left`;
  }

  return (
    <div className={`p-4 rounded-2xl border ${getColor()} shadow-sm transition-transform active:scale-99`}>
      <div className="flex items-center gap-4 mb-3">
        <div className={`p-3 rounded-full ${isUrgent ? 'bg-white' : 'bg-blue-50'}`}>
          {getIcon()}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <h4 className="font-semibold text-slate-800">{reminder.title}</h4>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isUrgent ? 'bg-white/50' : 'bg-slate-100 text-slate-500'}`}>
              {dueText}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full rounded-full ${getProgressColor()}`} 
              style={{ width: `${Math.min(100, reminder.percentage)}%` }}
            />
          </div>
        </div>
        <button 
           onClick={(e) => { e.stopPropagation(); onMarkDone(); }}
           className={`p-2 rounded-full hover:bg-black/5 transition-colors ${isUrgent ? 'text-red-600' : 'text-slate-400'}`}
           title="Mark as Done"
        >
          <Check size={20} />
        </button>
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