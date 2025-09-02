import React from 'react';
import { useModal } from './ModalProvider';
import JourneyModal from './JourneyModal';

const ModalManager: React.FC = () => {
  const { isJourneyModalOpen, closeJourneyModal } = useModal();

  return (
    <>
      <JourneyModal 
        isOpen={isJourneyModalOpen} 
        onClose={closeJourneyModal} 
      />
    </>
  );
};

export default ModalManager;