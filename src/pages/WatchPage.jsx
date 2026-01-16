import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../Navbar';

// Configuração de ambiente conforme solicitado
const STREAM_BASE_URL = import.meta.env.VITE_STREAM_URL || "http://localhost:8080";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const WatchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const imdbId = searchParams.get('imdbId');
  const titleHint = searchParams.get('title_hint');

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  
  // Estados do Player
  const [selectedStream, setSelectedStream] = useState(null);
  const [activeList, setActiveList] = useState([]); // Lista atual (Dublado ou Legendado)
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
        console.error("Erro ao carregar dados do filme:", err);
      } finally {
        setLoading(false);
      }
    };
    if (imdbId) fetchData();
  }, [imdbId, titleHint]);

  const { meta, dubbed, subtitled } = data || {};
  const displayTitle = meta?.name || decodeURIComponent(titleHint || "");
  const backgroundUrl = meta?.background;

  // Inicia o player com a lista escolhida
  const handlePlay = (list, audioType) => {
    if (!list || list.length === 0) return;
    setVideoError(false);
    setActiveList(list);
    setSelectedStream({ ...list[0], audioType, subtitles: [] });
  };

  // Troca de servidor na sidebar
  const handleSwitchStream = (stream) => {
    setVideoError(false);
    setSelectedStream({ ...stream, audioType: selectedStream.audioType, subtitles: [] });
  };

  // --- MODO PLAYER DE VÍDEO ---
  if (selectedStream) {
    const sidebarWidth = 300;
    return (
      <div style={{ width: '100vw', height: '100vh', background: 'black', position: 'relative', overflow: 'hidden' }}>
        {/* Header do Player */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', padding: '20px', zIndex: 50, display: 'flex', justifyContent: 'space-between', background: 'linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)', pointerEvents: 'none' }}>
           <button onClick={() => setSelectedStream(null)} style={{ pointerEvents: 'auto', background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', backdropFilter: 'blur(5px)' }}>&larr; Voltar</button>
           
           <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
             <strong>MODO DEMONSTRAÇÃO</strong><br/>
             STREAMING P2P SEGURO
           </div>
        </div>

        {/* Video Element */}
        <div style={{width:'100%', height:'100%', display:'flex', justifyContent:'center', alignItems:'center'}}>
            <video 
                key={selectedStream.infoHash} // Força recarregar se mudar o hash
                controls 
                autoPlay 
                width="100%" 
                height="100%" 
                crossOrigin="anonymous" 
                onError={() => setVideoError(true)}
            >
                {/* Usa o magnet link retornado pelo backend */}
                <source src={`${STREAM_BASE_URL}/stream?magnet=${encodeURIComponent(selectedStream.magnet)}`} type="video/mp4" />
            </video>
        </div>

        {/* Sidebar de Fontes (Servidores) */}
        <div onMouseEnter={() => setSidebarHover(true)} onMouseLeave={() => setSidebarHover(false)} style={{ position: 'fixed', top: 0, right: 0, height: '100vh', zIndex: 2000, display: 'flex', transition: 'transform 0.3s ease', transform: sidebarHover ? 'translateX(0)' : `translateX(${sidebarWidth}px)` }}>
            <div style={{ width: '40px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                 <div style={{ background: 'rgba(20,20,20,0.9)', padding: '15px 0', width: '30px', borderRadius: '8px 0 0 8px', color: '#ccc', textAlign: 'center' }}>‹</div>
            </div>
            <div style={{ width: `${sidebarWidth}px`, background: 'rgba(10,10,10,0.95)', borderLeft: '1px solid #333', overflowY: 'auto', padding: '10px' }}>
              <div style={{ padding: '15px', borderBottom: '1px solid #333', color: '#e50914', fontWeight: 'bold' }}>Fontes de Sinal</div>
              {activeList.map((item, idx) => (
                <div key={idx} onClick={() => handleSwitchStream(item)} style={{ padding: '12px', marginBottom: '8px', background: selectedStream.infoHash === item.infoHash ? 'rgba(229,9,20,0.2)' : 'transparent', borderRadius: '4px', cursor: 'pointer', border: '1px solid #333' }}>
                  <div style={{ color: 'white', fontSize: '13px', fontWeight: 'bold' }}>{item.name || `Servidor ${idx + 1}`}</div>
                  <div style={{ color: '#888', fontSize: '11px', marginTop:'4px' }}>Status: Online • Alta Velocidade</div>
                </div>
              ))}
            </div>
        </div>
      </div>
    );
  }

  // --- MODO DETALHES (LOADING) ---
  if (loading) return <div style={{height:'100vh', background:'#141414', display:'flex', justifyContent:'center', alignItems:'center', color:'white'}}>Carregando detalhes...</div>;

  const directorName = meta?.director ? (Array.isArray(meta.director) ? meta.director.join(', ') : meta.director) : null;
  const hasDubbed = dubbed && dubbed.length > 0;
  const hasSubtitled = subtitled && subtitled.length > 0;

  // --- MODO DETALHES (UI PRINCIPAL) ---
  return (
    <div style={{ minHeight: '100vh', background: '#141414', color: 'white', fontFamily: 'Arial' }}>
      <Navbar />
      
      {/* Background Blur */}
      {backgroundUrl && (
        <div style={{ position: 'fixed', top:0, left:0, width:'100%', height:'100%', backgroundImage: `url(${backgroundUrl})`, backgroundSize:'cover', opacity: 0.25, filter:'blur(30px)', zIndex:0 }} />
      )}

      <div className="container" style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto', padding: '100px 40px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#ddd', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', marginBottom: '30px' }}>&larr; Voltar</button>

        <div style={{ display: 'flex', gap: '50px', flexWrap: 'wrap' }}>
          {/* Coluna da Esquerda (Texto) */}
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
            
            {/* Aviso de Portfólio (Segurança) */}
            <div style={{ background: 'rgba(229, 9, 20, 0.1)', border: '1px solid #e50914', padding: '15px', borderRadius: '8px', marginBottom: '30px', fontSize: '13px', color: '#ffcccb' }}>
              <strong>Nota Técnica:</strong> Projeto de portfólio educacional. Ao clicar em assistir, o sistema carregará um <strong>conteúdo de demonstração (Open Source/Creative Commons)</strong> para validar a tecnologia de streaming P2P sem infringir direitos autorais.
            </div>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
               {hasDubbed ? (
                 <button onClick={() => handlePlay(dubbed, 'dub')} style={{ flex: 1, padding: '18px', background: '#e50914', color: 'white', border: 'none', borderRadius: '4px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>▶ Assistir Dublado</button>
               ) : (
                 <button disabled style={{ flex: 1, padding: '18px', background: '#333', color: '#666', border: 'none', borderRadius: '4px', fontSize: '18px', fontWeight: 'bold', cursor: 'not-allowed' }}>Dublado Indisponível</button>
               )}

               {hasSubtitled ? (
                 <button onClick={() => handlePlay(subtitled, 'sub')} style={{ flex: 1, padding: '18px', background: '#333', color: 'white', border: 'none', borderRadius: '4px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>▶ Assistir Legendado</button>
               ) : (
                 <button disabled style={{ flex: 1, padding: '18px', background: '#333', color: '#666', border: 'none', borderRadius: '4px', fontSize: '18px', fontWeight: 'bold', cursor: 'not-allowed' }}>Legendado Indisponível</button>
               )}
            </div>
          </div>

          {/* Coluna da Direita (Poster) */}
          <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center' }}>
             <img src={meta?.poster} style={{ width: '100%', maxWidth: '350px', borderRadius: '8px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchPage;