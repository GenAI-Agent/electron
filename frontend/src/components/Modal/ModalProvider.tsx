import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextType {
  isJourneyModalOpen: boolean;
  openJourneyModal: () => void;
  closeJourneyModal: () => void;
  isChristmasModalOpen: boolean;
  openChristmasModal: () => void;
  closeChristmasModal: () => void;
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
  const [isChristmasModalOpen, setIsChristmasModalOpen] = useState(false);

  const openJourneyModal = () => setIsJourneyModalOpen(true);
  const closeJourneyModal = () => setIsJourneyModalOpen(false);
  const openChristmasModal = () => setIsChristmasModalOpen(true);
  const closeChristmasModal = () => setIsChristmasModalOpen(false);

  return (
    <ModalContext.Provider
      value={{
        isJourneyModalOpen,
        openJourneyModal,
        closeJourneyModal,
        isChristmasModalOpen,
        openChristmasModal,
        closeChristmasModal,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};