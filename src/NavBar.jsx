import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Navbar = () => {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState(null);
  const [loadingRandom, setLoadingRandom] = useState(false);

  // Gêneros para o submenu de Recomendação
  const genres = [
    { label: 'Ação', value: 'Action' }, { label: 'Aventura', value: 'Adventure' },
    { label: 'Animação', value: 'Animation' }, { label: 'Comédia', value: 'Comedy' },
    { label: 'Policial', value: 'Crime' }, { label: 'Drama', value: 'Drama' },
    { label: 'Fantasia', value: 'Fantasy' }, { label: 'Terror', value: 'Horror' },
    { label: 'Ficção', value: 'Sci-Fi' }, { label: 'Romance', value: 'Romance' }
  ];

  const handleRandomGenre = async (genre) => {
    if (loadingRandom) return;
    setLoadingRandom(true);
    try {
      const res = await axios.get('http://localhost:3000/random', { params: { genre } });
      const movie = res.data;
      if (movie && movie.imdb_id) {
        navigate(`/watch?imdbId=${movie.imdb_id}&type=movie&title_hint=${encodeURIComponent(movie.title)}`);
      }
    } catch {
      alert("Erro ao buscar recomendação.");
    } finally {
      setLoadingRandom(false);
      setActiveMenu(null);
    }
  };

  const menuItems = [
    { label: 'Filmes', action: () => navigate('/') },
    { label: 'Séries', action: () => navigate('/') },
    { label: 'Buscar', action: () => navigate('/search') },
    { label: 'Recomendação', id: 'recommendation' },
  ];

  return (
    <div 
      style={{ 
        position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 1000, 
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.95) 10%, rgba(0,0,0,0) 100%)',
        padding: '20px 4%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '70px'
      }}
      onMouseLeave={() => setActiveMenu(null)}
    >
      {/* ESQUERDA: LOGO */}
      <div 
        onClick={() => navigate('/')} 
        style={{ color: '#e50914', fontSize: '28px', fontWeight: 'bold', cursor: 'pointer', textShadow: '0 1px 2px black', zIndex: 1002 }}
      >
        Netflix do Ramon
      </div>

      {/* CENTRO: MENU (Posicionamento Absoluto para garantir centro exato) */}
      <div style={{ 
        position: 'absolute', left: '50%', transform: 'translateX(-50%)', 
        display: 'flex', gap: '30px', zIndex: 1002 
      }}>
        {menuItems.map((item, idx) => (
          <div 
            key={idx}
            onMouseEnter={() => setActiveMenu(item.id || null)}
            onClick={item.action}
            style={{ 
              color: activeMenu === item.id ? 'white' : '#e5e5e5', 
              fontSize: '15px', cursor: 'pointer', fontWeight: activeMenu === item.id ? 'bold' : 'normal',
              textShadow: '0 1px 2px black', transition: 'color 0.2s'
            }}
          >
            {item.label}
          </div>
        ))}
      </div>

      {/* DIREITA: USUÁRIO */}
      <div style={{ zIndex: 1002 }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '4px', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <span style={{ fontSize: '18px' }}>👤</span>
        </div>
      </div>

      {/* SUBMENU FLUTUANTE */}
      {activeMenu === 'recommendation' && (
        <div style={{
            position: 'absolute', top: '70px', left: 0, width: '100%', background: 'rgba(0, 0, 0, 0.95)',
            borderTop: '2px solid #e50914', padding: '30px 0', display: 'flex', justifyContent: 'center',
            gap: '15px', animation: 'slideDown 0.2s ease-out', zIndex: 1001, flexWrap: 'wrap'
          }}
          onMouseEnter={() => setActiveMenu('recommendation')}
        >
          {loadingRandom ? (
            <span style={{color: 'white'}}>Sorteando...</span>
          ) : (
            genres.map((g) => (
              <div key={g.value} onClick={() => handleRandomGenre(g.value)}
                style={{
                  color: '#aaa', fontSize: '16px', cursor: 'pointer', padding: '8px 16px',
                  border: '1px solid #333', borderRadius: '20px', transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.color='white'; e.currentTarget.style.borderColor='white'; }}
                onMouseOut={(e) => { e.currentTarget.style.color='#aaa'; e.currentTarget.style.borderColor='#333'; }}
              >
                {g.label}
              </div>
            ))
          )}
        </div>
      )}
      <style>{`@keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};

export default Navbar;