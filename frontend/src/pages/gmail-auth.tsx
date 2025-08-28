import React, { useState } from 'react';
import GoogleAuth from '../components/GoogleAuth';
import Header, { ViewMode } from '../components/ui/header';

const GmailAuthPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('with-agent');
  return (
    <div className="h-screen w-screen flex flex-col bg-background m-0 p-0">
      {/* Header */}
      <Header
        title="Sign in to Lens OS"
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-background via-muted/30 to-background">
        <GoogleAuth />
      </div>
    </div>
  );
};

export default GmailAuthPage;
