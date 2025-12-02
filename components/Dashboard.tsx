import React, { useEffect, useState } from 'react';
import { Vehicle, Reminder, ServiceLog } from '../types';
import { Droplet, Battery, Disc, CircleDot, Wind, AlertCircle, CheckCircle2, FlaskConical, Settings, Check, Clock, CalendarDays, Gauge } from 'lucide-react';
import { getCareTips } from '../services/geminiService';
import { AddServiceForm } from './AddServiceForm';

interface DashboardProps {
  vehicle: Vehicle;
  onAddService?: (log: ServiceLog) => void;
}

// Maintenance Rules (Months, KM, Priority: 3=High, 2=Med, 1=Low)
const MAINTENANCE_SCHEDULE = [
  { type: 'Oil Change', months: 6, km: 10000, icon: 'oil', priority: 3 },
  { type: 'Tire Rotation', months: 6, km: 10000, icon: 'tire', priority: 3 },
  { type: 'Brake Pads', months: 0, km: 30000, icon: 'brake', priority: 3 },
  { type: 'Battery Replacement', months: 36, km: 0, icon: 'battery', priority: 2 },
  { type: 'Timing Belt', months: 0, km: 100000, icon: 'other', priority: 3 },
  { type: 'Brake Fluid', months: 24, km: 40000, icon: 'fluid', priority: 2 },
  { type: 'Coolant Flush', months: 60, km: 100000, icon: 'fluid', priority: 2 },
  { type: 'Transmission Fluid', months: 48, km: 96000, icon: 'fluid', priority: 2 },
  { type: 'Spark Plugs', months: 60, km: 100000, icon: 'other', priority: 2 },
  { type: 'Cabin Air Filter', months: 12, km: 24000, icon: 'filter', priority: 1 },
  { type: 'Engine Air Filter', months: 36, km: 48000, icon: 'filter', priority: 1 },
];

export const Dashboard: React.FC<DashboardProps> = ({ vehicle, onAddService }) => {
  const [tips, setTips] = useState<string>('');
  const [loadingTips, setLoadingTips] = useState(false);
  const [completingTask, setCompletingTask] = useState<Reminder | null>(null);

  // Helper to estimate daily usage based on history or fallback
  const getEstimatedDailyKm = (v: Vehicle): number => {
    if (v.history.length >= 2) {
      const sorted = [...v.history].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const first = sorted[0];
      const last = sorted[sorted.length-1];
      const days = (new Date(last.date).getTime() - new Date(first.date).getTime()) / (1000 * 3600 * 24);
      const dist = last.mileage - first.mileage;
      
      if (days > 30 && dist > 0) return dist / days;
    }
    // Fallback: ~16,500 km/year = ~45km/day
    return 45;
  };

  const generateReminders = (v: Vehicle): Reminder[] => {
    const today = new Date();
    const purchaseDate = v.purchaseDate ? new Date(v.purchaseDate) : new Date(v.year, 0, 1);
    const avgDailyKm = getEstimatedDailyKm(v);

    const generated = MAINTENANCE_SCHEDULE.map((item, index) => {
      // Find last service of this type
      const lastService = v.history.find(h => h.type.includes(item.type));
      
      // 1. Time Calculation
      const lastDate = lastService ? new Date(lastService.date) : purchaseDate;
      const nextTimeDueDate = new Date(lastDate);
      
      if (item.months > 0) {
        nextTimeDueDate.setMonth(nextTimeDueDate.getMonth() + item.months);
      } else {
        nextTimeDueDate.setFullYear(nextTimeDueDate.getFullYear() + 50); // Effectively never
      }

      // 2. Mileage Calculation
      let lastKm = 0;
      if (lastService) {
        lastKm = lastService.mileage;
      } else {
        // Smart Alignment: If no history, align to next factory interval
        const currentIntervalCount = Math.floor(v.mileage / (item.km || 10000));
        lastKm = currentIntervalCount * (item.km || 10000);
      }

      const nextDueKm = item.km > 0 ? lastKm + item.km : 0;
      const kmRemaining = item.km > 0 ? nextDueKm - v.mileage : 999999;
      
      // 3. Predictive Date from Mileage
      // If we have a mileage limit, estimate when we will hit it in TIME
      let predictedDateFromMileage: Date | undefined;
      if (item.km > 0 && kmRemaining > 0) {
        const daysLeft = kmRemaining / avgDailyKm;
        predictedDateFromMileage = new Date();
        predictedDateFromMileage.setDate(predictedDateFromMileage.getDate() + daysLeft);
      } else if (item.km > 0 && kmRemaining <= 0) {
        // Already passed
        predictedDateFromMileage = new Date(); // Due now/past
      }

      // 4. Determine Effective Due Date (Earliest of Time or Mileage-Prediction)
      let effectiveDueDate = nextTimeDueDate;
      let isTimeTrigger = true;

      if (item.km > 0 && predictedDateFromMileage) {
        if (item.months === 0 || predictedDateFromMileage < nextTimeDueDate) {
          effectiveDueDate = predictedDateFromMileage;
          isTimeTrigger = false;
        }
      }

      // 5. Calculate Progress & Status
      const daysRemaining = Math.ceil((effectiveDueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
      
      // Calculate Percentage
      let percentage = 0;
      if (isTimeTrigger && item.months > 0) {
          const totalDays = item.months * 30.44;
          percentage = Math.min(100, Math.max(0, ((totalDays - daysRemaining) / totalDays) * 100));
      } else if (item.km > 0) {
          percentage = Math.min(100, Math.max(0, ((item.km - kmRemaining) / item.km) * 100));
      }

      // Status Logic
      let status: 'ok' | 'soon' | 'overdue' = 'ok';
      
      if (daysRemaining < 0 || (item.km > 0 && kmRemaining < 0)) {
        status = 'overdue';
      } else if (
        percentage > 90 || // 90% used up
        daysRemaining < 30 || // Less than a month
        (item.km > 0 && kmRemaining < 1000) // Less than 1000km
      ) {
        status = 'soon';
      }

      return {
        data: {
          id: `rem-${index}`,
          title: item.type,
          dueMileage: nextDueKm,
          dueDate: effectiveDueDate.toISOString().split('T')[0],
          status,
          percentage,
          icon: item.icon as any,
          isTimeBased: isTimeTrigger
        },
        priority: item.priority
      };
    });

    // Sort by: Status Severity > Priority > Percentage
    return generated.sort((a, b) => {
      const getStatusScore = (s: string) => s === 'overdue' ? 300 : s === 'soon' ? 200 : 0;
      
      const scoreA = getStatusScore(a.data.status) + (a.priority * 10) + (a.data.percentage / 100);
      const scoreB = getStatusScore(b.data.status) + (b.priority * 10) + (b.data.percentage / 100);
      
      return scoreB - scoreA;
    }).map(g => g.data);
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
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-6 text-white shadow-lg shadow-blue-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
        <div className="flex justify-between items-start mb-4 relative z-10">
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
        <div className="flex items-center gap-2 text-sm text-blue-100 bg-blue-900/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm relative z-10">
          <CheckCircle2 size={14} />
          <span>Purchase: {vehicle.purchaseDate || `${vehicle.year}-01-01`}</span>
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
      case 'overdue': return 'bg-red-50 text-red-600 border-red-100 ring-1 ring-red-100';
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

  const distRemaining = reminder.dueMileage > 0 ? reminder.dueMileage - currentMileage : 0;
  
  // Format the due text intelligently
  let dueText = '';
  const now = new Date();
  
  if (reminder.status === 'overdue') {
      if (reminder.isTimeBased && reminder.dueDate) {
          const due = new Date(reminder.dueDate);
          const diffDays = Math.ceil((now.getTime() - due.getTime()) / (1000 * 3600 * 24));
          dueText = `Overdue by ${diffDays}d`;
      } else {
          dueText = `Overdue by ${Math.abs(distRemaining).toLocaleString()} km`;
      }
  } else {
      // Not overdue
      if (reminder.dueDate) {
          const due = new Date(reminder.dueDate);
          const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));
          
          if (diffDays <= 30) dueText = `Due in ${diffDays} days`;
          else dueText = `Due ${due.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
          
          if (!reminder.isTimeBased) dueText += " (est)";
      } else {
          dueText = `${distRemaining.toLocaleString()} km left`;
      }
  }

  return (
    <div className={`p-4 rounded-2xl border ${getColor()} shadow-sm transition-all active:scale-99 hover:shadow-md`}>
      <div className="flex items-center gap-4 mb-3">
        <div className={`p-3 rounded-full ${isUrgent ? 'bg-white shadow-sm' : 'bg-blue-50'}`}>
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <h4 className="font-semibold text-slate-800 truncate pr-2">{reminder.title}</h4>
            <div className="flex items-center gap-1.5 shrink-0">
              {reminder.isTimeBased ? (
                 <CalendarDays size={12} className={isUrgent ? "text-red-400" : "text-slate-400"} />
              ) : (
                 <Gauge size={12} className={isUrgent ? "text-red-400" : "text-slate-400"} />
              )}
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isUrgent ? 'bg-white/60' : 'bg-slate-100 text-slate-500'}`}>
                {dueText}
              </span>
            </div>
          </div>
          <div className="w-full bg-black/5 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full rounded-full ${getProgressColor()} transition-all duration-1000`} 
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