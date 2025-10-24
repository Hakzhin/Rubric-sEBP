import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center p-4 md:p-6">
      <h1 className="text-3xl md:text-4xl font-bold text-white">
        Rubric@s<span className="text-red-500">E</span><span className="text-blue-400">B</span><span className="text-yellow-400">P</span>
      </h1>
      <p className="text-md md:text-lg text-blue-200 mt-2">
        Tu asistente inteligente para crear rúbricas de evaluación
      </p>
    </header>
  );
};

export default Header;
