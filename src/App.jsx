import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Importando as páginas
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import WatchPage from './pages/WatchPage';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Rota Raiz (Home estilo Netflix) */}
        <Route path="/" element={<HomePage />} />
        
        {/* Rota de Busca (Página dedicada) */}
        <Route path="/search" element={<SearchPage />} />
        
        {/* Rota do Player (Onde assiste o filme) */}
        <Route path="/watch" element={<WatchPage />} />
      </Routes>
    </Router>
  );
};

export default App;