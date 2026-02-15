import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Home from './pages/Home';
import Marketplace from './pages/Marketplace';
import DocsPage from './pages/Docs';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/docs" element={<DocsPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
