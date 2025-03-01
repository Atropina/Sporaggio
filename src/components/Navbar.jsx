import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaHome } from 'react-icons/fa';
import DarkModeToggle from './DarkModeToggle';

const Navbar = ({ showBackButton = false, onBackClick, pageTitle }) => {
  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md py-4 px-6">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          {/* Logo e nome da aplicação */}
          <Link to="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center">
            Sporaggio
          </Link>
          
          {/* Separador e título da página (se houver) */}
          {pageTitle && (
            <div className="flex items-center">
              <span className="mx-3 text-gray-400">|</span>
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {pageTitle}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center">
          {/* Botão voltar */}
          {showBackButton && (
            <button 
              onClick={onBackClick}
              className="mr-4 px-3 py-1 text-sm flex items-center bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
            >
              <FaArrowLeft className="mr-1" /> Voltar
            </button>
          )}
          
          {/* Toggle de modo escuro */}
          <DarkModeToggle />
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 