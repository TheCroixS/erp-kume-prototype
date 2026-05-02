import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { db } from '../services/database';
import { Resident } from '../types';

interface AppState {
  residents: Resident[];
  inactiveResidents: Resident[];
  loading: boolean;
  error: string | null;
  darkMode: boolean;
}

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_RESIDENTS'; payload: Resident[] }
  | { type: 'SET_INACTIVE_RESIDENTS'; payload: Resident[] }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'SET_DARK_MODE'; payload: boolean };

const initialState: AppState = {
  residents: [],
  inactiveResidents: [],
  loading: false,
  error: null,
  darkMode: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_RESIDENTS':
      return { ...state, residents: action.payload };
    case 'SET_INACTIVE_RESIDENTS':
      return { ...state, inactiveResidents: action.payload };
    case 'TOGGLE_DARK_MODE':
      return { ...state, darkMode: !state.darkMode };
    case 'SET_DARK_MODE':
      return { ...state, darkMode: action.payload };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  loadResidents: () => Promise<void>;
  checkInactiveResidents: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        await db.init();
        await loadResidents();
        await checkInactiveResidents();
      } catch (error) {
        console.error('Error initializing app:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Error al inicializar la aplicación' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    // Load dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      dispatch({ type: 'SET_DARK_MODE', payload: JSON.parse(savedDarkMode) });
    }

    initializeApp();
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(state.darkMode));
    
    if (state.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.darkMode]);

  const loadResidents = async () => {
    try {
      // Get all residents (including egressed)
      const allResidents = await db.getResidents(true);
      
      // For each resident, check if they have medical record and care plan
      const residentsWithStatus = await Promise.all(
        allResidents.map(async (resident) => {
          const [medicalRecord, carePlans] = await Promise.all([
            db.getMedicalRecord(resident.id),
            db.getCarePlansByResident(resident.id)
          ]);
          
          return {
            ...resident,
            medicalRecord: !!medicalRecord,
            carePlan: carePlans.length > 0
          };
        })
      );
      
      dispatch({ type: 'SET_RESIDENTS', payload: residentsWithStatus });
    } catch (error) {
      console.error('Error loading residents:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error al cargar residentes' });
    }
  };

  const checkInactiveResidents = async () => {
    try {
      // Ensure database is initialized before checking inactive residents
      await db.init();
      const inactiveResidents = await db.getResidentsWithoutRecentActivity(48);
      dispatch({ type: 'SET_INACTIVE_RESIDENTS', payload: inactiveResidents });
    } catch (error) {
      console.error('Error checking inactive residents:', error);
      // Don't show error to user for this background check
    }
  };

  const contextValue: AppContextType = {
    state,
    dispatch,
    loadResidents,
    checkInactiveResidents,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}