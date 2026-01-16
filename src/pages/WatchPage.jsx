import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { API_BASE_URL, STREAM_ENGINE_URL } from '../config'; // Certifique-se de ter o config.js

const WatchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const imdbId = searchParams.get('imdbId');
  const titleHint = searchParams.get('title_hint');

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedStream, setSelectedStream] = useState(null);
  const [activeList, setActiveList] = useState([]);
  const [videoError, setVideoError] = useState(false);
  const [sidebarHover, setSidebarHover] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/streams`, {
          params: { imdb_id: imdbId, type: 'movie', title_hint: titleHint }
        });
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (imdbId) fetchData();
  }, [imdbId]);

  const { meta, dubbed, subtitled } = data || {};
  const displayTitle = meta?.name || decodeURIComponent(titleHint || "");

  const handlePlay = (list, audioType) => {
    if (!list || list.length === 0) return;
    setVideoError(false);
    setActiveList(list);
    setSelectedStream({ ...list[0], audioType, subtitles: [] });
  };

  const handleSwitchStream = (stream) => {
    setVideoError(false);
    setSelectedStream({ ...stream, audioType: selectedStream.audioType, subtitles: [] });
  };

  if (selectedStream) {
    const sidebarWidth = 300;
    return (
      <div style={{ width: '100vw', height: '100vh', background: 'black', position: 'relative', overflow: 'hidden' }}>
        {/* Header Player */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', padding: '20px', zIndex: 50, display: 'flex', justifyContent: 'space-between', background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)', pointerEvents: 'none' }}>
           <button onClick={() => setSelectedStream(null)} style={{ pointerEvents: 'auto', background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', backdropFilter: 'blur(5px)' }}>&larr; Voltar</button>
           
           {/* Disclaimer discreto no player */}
           <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', textAlign: 'right' }}>
             MODO DEMONSTRAÇÃO <br/> P2P STREAMING
           </div>
        </div>

        {/* Video */}
        <div style={{width:'100%', height:'100%', display:'flex', justifyContent:'center', alignItems:'center'}}>
            <video key={selectedStream.infoHash} controls autoPlay width="100%" height="100%" crossOrigin="anonymous" onError={() => setVideoError(true)}>
                <source src={`${STREAM_ENGINE_URL}/stream?magnet=${encodeURIComponent(selectedStream.magnet)}`} type="video/mp4" />
            </video>
        </div>

        {/* Sidebar */}
        <div onMouseEnter={() => setSidebarHover(true)} onMouseLeave={() => setSidebarHover(false)} style={{ position: 'fixed', top: 0, right: 0, height: '100vh', zIndex: 2000, display: 'flex', transition: 'transform 0.3s ease', transform: sidebarHover ? 'translateX(0)' : `translateX(${sidebarWidth}px)` }}>
            <div style={{ width: '40px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                 <div style={{ background: 'rgba(20,20,20,0.9)', padding: '15px 0', width: '30px', borderRadius: '8px 0 0 8px', color: '#ccc', textAlign: 'center' }}>‹</div>
            </div>
            <div style={{ width: `${sidebarWidth}px`, background: 'rgba(10,10,10,0.95)', borderLeft: '1px solid #333', overflowY: 'auto', padding: '10px' }}>
              <div style={{ padding: '15px', borderBottom: '1px solid #333', color: '#e50914', fontWeight: 'bold' }}>Fontes de Sinal</div>
              {activeList.map((item, idx) => (
                <div key={idx} onClick={() => handleSwitchStream(item)} style={{ padding: '12px', marginBottom: '8px', background: selectedStream.infoHash === item.infoHash ? 'rgba(229,9,20,0.2)' : 'transparent', borderRadius: '4px', cursor: 'pointer', border: '1px solid #333' }}>
                  <div style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>{item.name}</div>
                  <div style={{ color: '#888', fontSize: '11px' }}>Latência: Baixa • Seeds: Estável</div>
                </div>
              ))}
            </div>
        </div>
      </div>
    );
  }

  if (loading) return <div style={{height:'100vh', background:'#141414', display:'flex', justifyContent:'center', alignItems:'center', color:'white'}}>Carregando...</div>;

  const directorName = meta?.director ? (Array.isArray(meta.director) ? meta.director.join(', ') : meta.director) : null;

  return (
    <div style={{ minHeight: '100vh', background: '#141414', color: 'white', fontFamily: 'Arial' }}>
      <Navbar />
      {meta?.background && <div style={{ position: 'fixed', top:0, left:0, width:'100%', height:'100%', backgroundImage: `url(${meta.background})`, backgroundSize:'cover', opacity: 0.25, filter:'blur(30px)', zIndex:0 }} />}

      <div className="container" style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto', padding: '100px 40px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#ddd', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', marginBottom: '30px' }}>&larr; Voltar</button>

        <div style={{ display: 'flex', gap: '50px', flexWrap: 'wrap' }}>
          <div style={{ flex: '2 1 500px' }}>
            <h1 style={{ fontSize: '3.5rem', fontWeight: '800', margin: '0 0 15px 0', lineHeight: '1.1' }}>{displayTitle}</h1>
            <div style={{ display: 'flex', gap: '15px', color: '#ccc', marginBottom: '25px', alignItems: 'center' }}>
              <span style={{border:'1px solid #666', padding:'2px 6px', borderRadius:'3px'}}>{meta?.year?.split('-')[0]}</span>
              <span>Filme</span>
              <span style={{ color: '#46d369', fontWeight: 'bold' }}>{meta?.imdbRating} Match</span>
            </div>

            {directorName && <div style={{ marginBottom: '20px', color: '#ddd' }}><strong>Direção:</strong> {directorName}</div>}

            <div style={{ marginBottom: '35px' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#fff' }}>Sinopse</h3>
              <p style={{ lineHeight: '1.6', color: '#bbb', fontSize: '16px' }}>{meta?.description || "Descrição indisponível."}</p>
            </div>
            
            {/* Aviso de Portfólio */}
            <div style={{ background: 'rgba(229, 9, 20, 0.1)', border: '1px solid #e50914', padding: '15px', borderRadius: '8px', marginBottom: '30px', fontSize: '13px', color: '#ffcccb' }}>
              <strong>Nota Técnica:</strong> Este é um projeto de portfólio. Ao clicar em assistir, será carregado um conteúdo de demonstração (Open Source) para validar a tecnologia de streaming P2P sem infringir direitos autorais.
            </div>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
               <button onClick={() => handlePlay(dubbed, 'dub')} style={{ flex: 1, padding: '18px', background: '#e50914', color: 'white', border: 'none', borderRadius: '4px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>▶ Assistir Dublado</button>
               <button onClick={() => handlePlay(subtitled, 'sub')} style={{ flex: 1, padding: '18px', background: '#333', color: 'white', border: 'none', borderRadius: '4px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>▶ Assistir Legendado</button>
            </div>
          </div>
          <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center' }}>
             <img src={meta?.poster} style={{ width: '100%', maxWidth: '350px', borderRadius: '8px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchPage;