import React from 'react';
import { Plane } from 'lucide-react';
import { cn } from '../utils/cn';
import { useModal } from './Modal';

interface JourneyComponentProps {
  className?: string;
}

const JourneyComponent: React.FC<JourneyComponentProps> = ({ className }) => {
  const { openJourneyModal } = useModal();

  return (
    <button
      onClick={openJourneyModal}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors",
        className
      )}
    >
      <Plane className="w-4 h-4" />
      查看華航旅程詳情
    </button>
  );
};

export default JourneyComponent;