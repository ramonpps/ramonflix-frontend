import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import HomePage from './pages/HomePage';
import SeriesPage from './pages/SeriesPage'; // Nova
import SearchPage from './pages/SearchPage';
import WatchPage from './pages/WatchPage';
import WatchSeriesPage from './pages/WatchSeriesPage'; // Nova

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/series" element={<SeriesPage />} />
        <Route path="/search" element={<SearchPage />} />
        
        {/* Filmes usam WatchPage, Séries usam WatchSeriesPage */}
        <Route path="/watch" element={<WatchPage />} />
        <Route path="/watch-series" element={<WatchSeriesPage />} />
      </Routes>
    </Router>
  );
};

export default App;