import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../Navbar_temp';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);
    try {
      const res = await axios.get(`${API_BASE_URL}/search`, { params: { q: query } });
      setResults(res.data.results || []);
    } catch {
      alert("Erro ao buscar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#141414', color: 'white' }}>
      <Navbar />

      <div style={{ paddingTop: '120px', paddingBottom: '40px', paddingLeft: '20px', paddingRight: '20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto 60px auto', textAlign: 'center' }}>
          <form onSubmit={handleSearch} style={{ position: 'relative' }}>
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Títulos, gente e gêneros"
              style={{
                width: '100%', padding: '20px 25px', fontSize: '20px', background: '#111',
                border: '1px solid #333', borderRadius: '4px', color: 'white', outline: 'none'
              }}
            />
            <button type="submit" style={{
                position: 'absolute', right: '10px', top: '10px', background: '#e50914', color: 'white',
                border: 'none', padding: '12px 30px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px'
              }}
            >
              {loading ? '...' : 'Buscar'}
            </button>
          </form>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px', maxWidth: '1200px', margin: '0 auto' }}>
          {results.map((item) => (
            <div 
              key={item.imdb_id} 
              onClick={() => navigate(`/watch?imdbId=${item.imdb_id}&type=${item.type}&title_hint=${encodeURIComponent(item.title)}`)}
              style={{ cursor: 'pointer', transition: 'transform 0.2s', position: 'relative' }}
              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ borderRadius: '4px', overflow: 'hidden', aspectRatio: '2/3', background: '#222' }}>
                {item.poster ? <img src={item.poster} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center'}}>Sem Imagem</div>}
              </div>
              <h3 style={{ marginTop: '10px', fontSize: '15px', color: '#ccc', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;