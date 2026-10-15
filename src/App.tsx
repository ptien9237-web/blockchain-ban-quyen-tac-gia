import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Discover } from './pages/Discover';
import { BookDetail } from './pages/BookDetail';
import { Verify } from './pages/Verify';
import { Login } from './pages/Login';
import { RegisterAccount } from './pages/RegisterAccount';
import { Profile } from './pages/Profile';
import { AdminDashboard } from './pages/AdminDashboard';
import { HowItWorks } from './pages/HowItWorks';
import { Authors } from './pages/Authors';
import { AuthorStudio } from './pages/AuthorStudio';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/discover" element={<Discover />} />
      <Route path="/book/:id" element={<BookDetail />} />
      <Route path="/authors" element={<Authors />} />
      <Route path="/author/:id" element={<Authors />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/copyright/verify" element={<Verify />} />
      <Route path="/copyright/verify/:query" element={<Verify />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="/verify/:query" element={<Verify />} />
      <Route path="/author/studio" element={<AuthorStudio />} />
      <Route path="/copyright/register" element={<AuthorStudio />} />
      <Route path="/copyright/record/:id" element={<Verify />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register-account" element={<RegisterAccount />} />
      <Route path="/register" element={<RegisterAccount />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <Layout>
        <AppRoutes />
      </Layout>
    </Router>
  );
}

export default App;
