import React,{ createContext,useCallback,useContext,useEffect,useMemo,useRef,useState } from 'react';

interface UIContextType {
  isUIDormant: boolean;
  wakeUI: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider = ({ children }: { children: React.ReactNode }) => {
  const [isUIDormant, setIsUIDormantState] = useState(false);
  const isDormantRef = useRef(false);
  const sleepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setIsUIDormant = useCallback((value: boolean) => {
    isDormantRef.current = value;
    setIsUIDormantState(value);
  }, []);

  const wakeUI = useCallback(() => {
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    
    // Synchronous Ref check prevents the 'Maximum update depth' loop
    // by bailing out BEFORE any React state update can be scheduled
    if (isDormantRef.current) {
        setIsUIDormant(false);
    }

    sleepTimerRef.current = setTimeout(() => {
      setIsUIDormant(true);
    }, 8000); 
  }, [setIsUIDormant]);

  useEffect(() => {
    // Initial setup
    wakeUI();
    return () => {
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    };
  }, [wakeUI]);

  const value = useMemo(() => ({ isUIDormant, wakeUI }), [isUIDormant, wakeUI]);

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
