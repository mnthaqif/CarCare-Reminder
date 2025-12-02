export interface ServiceLog {
  id: string;
  date: string;
  type: string;
  cost: number;
  mileage: number;
  notes?: string;
}

export interface Vehicle {
  id: string;
  name: string;
  year: number;
  mileage: number;
  purchaseDate?: string; // ISO date string YYYY-MM-DD
  history: ServiceLog[];
}

export interface Reminder {
  id: string;
  title: string;
  dueMileage: number;
  dueDate?: string; // ISO date string
  status: 'ok' | 'soon' | 'overdue';
  percentage: number; // 0-100 for progress bar
  icon: 'oil' | 'battery' | 'brake' | 'tire' | 'filter' | 'fluid' | 'other';
  isTimeBased?: boolean;
}

export interface Workshop {
  name: string;
  address: string;
  rating?: number;
  isOpen?: boolean;
  distance?: string;
  link?: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
    placeAnswerSources?: {
      reviewSnippets?: {
        reviewText: string;
        authorAttribution: {
          displayName: string;
        }
      }[]
    }
  }
}