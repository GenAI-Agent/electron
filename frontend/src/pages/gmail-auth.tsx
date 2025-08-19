import React from 'react';
import GoogleAuth from '../components/GoogleAuth';
import TitleBar from '../components/TitleBar';

const GmailAuthPage: React.FC = () => {
  return (
    <div className="h-screen w-screen flex flex-col bg-[#f0f4f8] m-0 p-0">
      {/* Title Bar */}
      <TitleBar
        title="Google OAuth 登入"
        showHomeButton={true}
      />

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-2">
        <GoogleAuth />
      </div>
    </div>
  );
};

export default GmailAuthPage;
