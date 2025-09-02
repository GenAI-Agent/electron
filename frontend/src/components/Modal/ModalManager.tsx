import React from 'react';
import { useModal } from './ModalProvider';
import JourneyModal from './JourneyModal';
import ChristmasModal from './ChristmasModal';

const ModalManager: React.FC = () => {
  const { 
    isJourneyModalOpen, 
    closeJourneyModal,
    isChristmasModalOpen,
    closeChristmasModal 
  } = useModal();

  return (
    <>
      <JourneyModal 
        isOpen={isJourneyModalOpen} 
        onClose={closeJourneyModal} 
      />
      <ChristmasModal
        isOpen={isChristmasModalOpen}
        onClose={closeChristmasModal}
      />
    </>
  );
};

export default ModalManager;