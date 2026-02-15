import { useState, FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Timer } from 'lucide-react';
import { getGitHubUrl } from '../config';

const Header: FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const scrollToSection = (id: string) => {
    // Only scroll if we're on the home page
    if (location.pathname === '/' || location.pathname === '') {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        setIsMenuOpen(false);
      }
    } else {
      // Navigate to home page with hash
      window.location.href = `/#${id}`;
      setIsMenuOpen(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-sm z-50">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Timer className="w-6 h-6 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">TimeTracker</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              Home
            </Link>
            <button
              onClick={() => scrollToSection('features')}
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              Features
            </button>
            <Link
              to="/marketplace"
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              Marketplace
            </Link>
            <button
              onClick={() => scrollToSection('screenshots')}
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              Screenshots
            </button>
            <button
              onClick={() => scrollToSection('download')}
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              Download
            </button>
            <button
              onClick={() => scrollToSection('docs')}
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              Docs
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              FAQ
            </button>
            <a
              href={getGitHubUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              View on GitHub
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-700"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 space-y-4 pb-4">
            <Link
              to="/"
              onClick={() => setIsMenuOpen(false)}
              className="block w-full text-left text-gray-700 hover:text-primary-600 transition-colors"
            >
              Home
            </Link>
            <button
              onClick={() => scrollToSection('features')}
              className="block w-full text-left text-gray-700 hover:text-primary-600 transition-colors"
            >
              Features
            </button>
            <Link
              to="/marketplace"
              onClick={() => setIsMenuOpen(false)}
              className="block w-full text-left text-gray-700 hover:text-primary-600 transition-colors"
            >
              Marketplace
            </Link>
            <button
              onClick={() => scrollToSection('screenshots')}
              className="block w-full text-left text-gray-700 hover:text-primary-600 transition-colors"
            >
              Screenshots
            </button>
            <button
              onClick={() => scrollToSection('download')}
              className="block w-full text-left text-gray-700 hover:text-primary-600 transition-colors"
            >
              Download
            </button>
            <button
              onClick={() => scrollToSection('docs')}
              className="block w-full text-left text-gray-700 hover:text-primary-600 transition-colors"
            >
              Docs
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="block w-full text-left text-gray-700 hover:text-primary-600 transition-colors"
            >
              FAQ
            </button>
            <a
              href={getGitHubUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-center"
            >
              View on GitHub
            </a>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
