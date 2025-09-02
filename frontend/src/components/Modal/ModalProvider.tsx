import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextType {
  isJourneyModalOpen: boolean;
  openJourneyModal: () => void;
  closeJourneyModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [isJourneyModalOpen, setIsJourneyModalOpen] = useState(false);

  const openJourneyModal = () => setIsJourneyModalOpen(true);
  const closeJourneyModal = () => setIsJourneyModalOpen(false);

  return (
    <ModalContext.Provider
      value={{
        isJourneyModalOpen,
        openJourneyModal,
        closeJourneyModal,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};