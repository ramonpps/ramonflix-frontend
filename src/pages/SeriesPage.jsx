import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../Navbar_temp';

const SeriesPage = () => {
  const [data, setData] = useState({ hero: null, catalogs: {} });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/series`);
        setData(res.data);
      } catch (err) {
        console.error("Erro Series", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const MovieRow = ({ title, movies }) => {
    if (!movies || movies.length === 0) return null;
    return (
      <div style={{ marginBottom: '40px', paddingLeft: '4%', position: 'relative', zIndex: 10 }}>
        <h2 style={{ color: '#e5e5e5', margin: '0 0 15px 0', fontSize: '1.4rem', fontWeight: 'bold' }}>{title}</h2>
        <div style={{ display: 'flex', overflowX: 'auto', gap: '15px', paddingBottom: '20px', scrollBehavior: 'smooth' }} className="hide-scrollbar">
          {movies.map((m) => (
            <div 
              key={m.imdb_id} 
              onClick={() => navigate(`/watch-series?imdbId=${m.imdb_id}&title_hint=${encodeURIComponent(m.title)}`)}
              style={{ flex: '0 0 auto', width: '200px', cursor: 'pointer', transition: 'transform 0.3s' }}
              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ borderRadius: '4px', overflow: 'hidden', height: '300px', marginBottom: '8px', background: '#222' }}>
                <img src={m.poster} alt={m.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
              </div>
              <div style={{ padding: '0 2px' }}>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  {m.rating && <span style={{ color: '#46d369', fontWeight: 'bold', fontSize: '12px' }}>{parseFloat(m.rating).toFixed(1)} ★</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) return (
    <div style={{ height: '100vh', background: '#141414', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="spinner" style={{ border: '4px solid #333', borderTop: '4px solid #e50914', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const { hero, catalogs } = data;

  return (
    <div style={{ minHeight: '100vh', background: '#141414', paddingBottom: '50px', overflowX: 'hidden' }}>
      <Navbar />
      {hero && (
        <div style={{ height: '90vh', position: 'relative', marginBottom: '-60px' }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            backgroundImage: `url(${hero.poster?.replace('w200','original') || ''})`,
            backgroundSize: 'cover', backgroundPosition: 'center 20%',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(20,20,20,0) 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(20,20,20,0) 100%)', zIndex: 1
          }}></div>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to right, #141414 0%, transparent 50%)', zIndex: 2 }}></div>
          <div style={{ position: 'absolute', bottom: '35%', left: '4%', maxWidth: '700px', zIndex: 20 }}>
            <h1 style={{ color: 'white', fontSize: '4.5rem', textShadow: '2px 2px 10px rgba(0,0,0,0.8)', margin: 0, lineHeight: '1', fontFamily: 'Impact, sans-serif', textTransform: 'uppercase' }}>{hero.title}</h1>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 0', color: '#ccc', fontWeight: 'bold' }}>
                <span style={{ color: '#46d369' }}>Destaque ({hero.rating})</span><span>•</span><span>Série</span>
             </div>
            <div style={{ display: 'flex', gap: '15px' }}>
               <button onClick={() => navigate(`/watch-series?imdbId=${hero.imdb_id}&title_hint=${encodeURIComponent(hero.title)}`)} style={{ padding: '15px 40px', fontSize: '1.4rem', background: 'white', color: 'black', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                 ▶ Assistir
               </button>
            </div>
          </div>
        </div>
      )}
      <div style={{ position: 'relative', zIndex: 10 }}>
        {catalogs['Melhores Avaliadas'] && <MovieRow title="Melhores Avaliadas" movies={catalogs['Melhores Avaliadas']} />}
        {Object.keys(catalogs).map(key => {
          if (key === 'Melhores Avaliadas') return null;
          return <MovieRow key={key} title={key} movies={catalogs[key]} />;
        })}
      </div>
      <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
};

export default SeriesPage;