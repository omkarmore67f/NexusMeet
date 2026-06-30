import React from 'react';
import { AppRoutes } from './routes/AppRoutes';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-950 text-dark-50 antialiased">
      <AppRoutes />
    </div>
  );
};

export default App;
