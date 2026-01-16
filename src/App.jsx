import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import UserProfile from './pages/UserProfile';
import Planner from './pages/Planner';
import Admin from './pages/Admin';

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <AppLayout>
        <Toaster position="top-center" />
        <Routes>
          <Route path="/" element={<UserProfile />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;
