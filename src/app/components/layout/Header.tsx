import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { FC } from 'react';
import WebpageIcon from '../ui/WebpageIcon';

interface HeaderProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
}

const Header: FC<HeaderProps> = ({ isDarkMode, setIsDarkMode }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className={`${isDarkMode ? 'bg-[#0f1729]/80' : 'bg-white/90'} backdrop-blur-sm border-b ${isDarkMode ? 'border-blue-500/20' : 'border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <a href="#home" className="flex items-center">
              <WebpageIcon 
                className="w-10 h-10 mr-3"
                isDarkMode={isDarkMode}
              />
              <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
                Code TREAT
              </span>
            </a>
          </div>
          <div className="flex items-center space-x-8">
            <nav className="flex items-center space-x-8">
              <a href="#home" className={`text-lg ${isDarkMode ? 'text-blue-200 hover:text-blue-400' : 'text-slate-600 hover:text-slate-900'} transition-colors`}>Home</a>
              <a href="#about" className={`text-lg ${isDarkMode ? 'text-blue-200 hover:text-blue-400' : 'text-slate-600 hover:text-slate-900'} transition-colors`}>About</a>
              <a href="#evaluation" className={`text-lg ${isDarkMode ? 'text-blue-200 hover:text-blue-400' : 'text-slate-600 hover:text-slate-900'} transition-colors`}>Evaluation</a>
              <a 
                href="mailto:lyu@cse.cuhk.edu.hk,ejli@cse.cuhk.edu.hk"
                className={`text-lg ${isDarkMode ? 'text-blue-200 hover:text-blue-400' : 'text-slate-600 hover:text-slate-900'} transition-colors`}
              >
                Contact
              </a>
            </nav>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-lg ${isDarkMode ? 'bg-[#1a2234]/80 text-blue-200 hover:bg-blue-900/30' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} transition-colors`}
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <SunIcon className="w-5 h-5" />
              ) : (
                <MoonIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 