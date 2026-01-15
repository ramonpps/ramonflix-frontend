import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../Navbar';

const STREAM_BASE_URL = import.meta.env.VITE_STREAM_URL || "http://localhost:8080";

const WatchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  
  // Player States
  const [selectedStream, setSelectedStream] = useState(null);
  const [activeList, setActiveList] = useState([]);
  const [sidebarHover, setSidebarHover] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const imdbId = searchParams.get('imdbId');
  const type = searchParams.get('type');
  const titleHint = searchParams.get('title_hint'); 

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/streams`, {
          params: { imdb_id: imdbId, type, season: '1', episode: '1', title_hint: titleHint }
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
    setSelectedStream({ ...list[0], audioType: audioType, subtitles: [] });
  };

  const handleSwitchStream = (stream) => {
    setVideoError(false);
    setSelectedStream({ ...stream, audioType: selectedStream.audioType, subtitles: [] });
  };

  const handleTryNext = () => {
    if (!selectedStream || activeList.length === 0) return;
    const idx = activeList.findIndex(s => s.infoHash === selectedStream.infoHash);
    if (idx + 1 < activeList.length) {
      setVideoError(false); 
      handleSwitchStream(activeList[idx + 1]);
    } else {
      alert("Não há mais opções para testar nesta lista.");
    }
  };

  const CastMember = ({ name }) => {
    const initials = name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '80px', textAlign: 'center' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', color: '#777', marginBottom: '8px', border: '2px solid #444' }}>{initials}</div>
        <span style={{ fontSize: '12px', color: '#ccc', lineHeight: '1.2' }}>{name}</span>
      </div>
    );
  };

  // --- MODO PLAYER ---
  if (selectedStream && selectedStream.magnet) {
    const sidebarContentWidth = 300; 
    const sidebarTipWidth = 40;     
    const currentIdx = activeList.findIndex(s => s.infoHash === selectedStream.infoHash);
    const hasNextOption = currentIdx !== -1 && currentIdx + 1 < activeList.length;

    return (
      <div style={{ width: '100vw', height: '100vh', background: 'black', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', padding: '20px', zIndex: 50, display: 'flex', justifyContent: 'space-between', background: 'linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)', pointerEvents: 'none' }}>
            <button onClick={() => setSelectedStream(null)} style={{ pointerEvents: 'auto', background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', backdropFilter: 'blur(5px)' }}>&larr; Voltar</button>
            {hasNextOption && (
              <button onClick={handleTryNext} style={{ pointerEvents: 'auto', background: '#e50914', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginRight: '60px' }}>↻ Tentar Próxima Opção</button>
            )}
        </div>

        {videoError && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
            <div style={{ background: '#222', padding: '40px', borderRadius: '16px', textAlign: 'center', border: '1px solid #444', maxWidth: '500px', width: '90%', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
              <div style={{ fontSize: '60px', marginBottom: '20px' }}>⚠️</div>
              <h2 style={{ color: '#fff', marginBottom: '15px', fontSize: '24px' }}>Não foi possível carregar</h2>
              <p style={{ color: '#ccc', marginBottom: '30px', fontSize: '16px', lineHeight: '1.5' }}>Essa opção de vídeo está indisponível ou demorando muito.<br/>O que você gostaria de fazer?</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {hasNextOption && (
                  <button onClick={handleTryNext} style={{ background: '#e50914', color: 'white', border: 'none', padding: '18px', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}><span>↻</span> Tentar Outra Opção</button>
                )}
                <button onClick={() => setSelectedStream(null)} style={{ background: '#444', color: 'white', border: '1px solid #666', padding: '18px', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }} onMouseOver={(e) => e.currentTarget.style.background = '#555'} onMouseOut={(e) => e.currentTarget.style.background = '#444'}><span>&larr;</span> Voltar para a Lista</button>
              </div>
            </div>
          </div>
        )}

        <div style={{width:'100%', height:'100%', display:'flex', justifyContent:'center', alignItems:'center'}}>
            <video key={selectedStream.infoHash} controls autoPlay width="100%" height="100%" crossOrigin="anonymous" onError={() => setVideoError(true)}>
                <source src={`${STREAM_BASE_URL}/stream?magnet=${encodeURIComponent(selectedStream.magnet)}`} type="video/mp4" />
            </video>
        </div>

        <div onMouseEnter={() => setSidebarHover(true)} onMouseLeave={() => setSidebarHover(false)} style={{ position: 'fixed', top: 0, right: 0, height: '100vh', zIndex: 2000, display: 'flex', transition: 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)', transform: sidebarHover ? 'translateX(0)' : `translateX(${sidebarContentWidth}px)` }}>
            <div style={{ width: `${sidebarTipWidth}px`, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'transparent' }}>
                 <div style={{ background: 'rgba(20, 20, 20, 0.9)', backdropFilter: 'blur(10px)', padding: '15px 0', width: '30px', borderRadius: '8px 0 0 8px', border: '1px solid rgba(255,255,255,0.1)', borderRight: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', boxShadow: '-4px 0 15px rgba(0,0,0,0.5)', color: '#ccc' }}>
                    <span style={{ fontSize: '14px' }}>‹</span>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: activeList.length > 0 ? '#e50914' : '#666' }}>{activeList.length}</span>
                 </div>
            </div>
            <div style={{ width: `${sidebarContentWidth}px`, background: 'rgba(10, 10, 10, 0.96)', backdropFilter: 'blur(15px)', borderLeft: '1px solid #333', display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 50px rgba(0,0,0,1)' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid #333' }}>
                <h3 style={{ margin: 0, color: '#e50914', fontSize: '14px', textTransform: 'uppercase' }}>Fontes Disponíveis</h3>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                {activeList.map((item, idx) => {
                  const isActive = selectedStream.infoHash === item.infoHash;
                  return (
                    <div key={idx} onClick={() => handleSwitchStream(item)} style={{ padding: '12px', marginBottom: '8px', background: isActive ? 'rgba(229, 9, 20, 0.15)' : 'transparent', borderRadius: '4px', cursor: 'pointer', border: isActive ? '1px solid rgba(229, 9, 20, 0.4)' : '1px solid transparent', transition: 'all 0.2s' }} onMouseOver={(e) => !isActive && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')} onMouseOut={(e) => !isActive && (e.currentTarget.style.background = 'transparent')}>
                      <div style={{ color: isActive ? '#e50914' : '#ddd', fontWeight: isActive ? 'bold' : 'normal', fontSize: '13px', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{idx + 1}. {item.title}</div>
                      <div style={{ fontSize: '11px', color: '#666', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{item.name ? item.name.substring(0, 15) : 'Torrent'}...</span>
                        <span style={{color: '#4caf50'}}>Seed: {Math.floor(item.score / 100)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
        </div>
      </div>
    );
  }

  // --- MODO INFO ---
  if (loading) return <div style={{height:'100vh', background:'#141414', color:'white', display:'flex', justifyContent:'center', alignItems:'center'}}>Carregando...</div>;

  const hasDubbed = dubbed && dubbed.length > 0;
  const hasSubtitled = subtitled && subtitled.length > 0;
  const hasAnyOption = hasDubbed || hasSubtitled;

  // Formata o diretor (pode vir array ou string)
  const directorName = meta?.director ? (Array.isArray(meta.director) ? meta.director.join(', ') : meta.director) : null;

  return (
    <div style={{ minHeight: '100vh', background: '#141414', color: 'white', fontFamily: 'Arial' }}>
      <Navbar /> 
      
      {meta?.background && (
         <div style={{ position: 'fixed', top:0, left:0, width:'100%', height:'100%', backgroundImage: `url(${meta.background})`, backgroundSize:'cover', opacity: 0.25, filter:'blur(30px)', zIndex:0 }} />
      )}

      <div className="container" style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto', padding: '100px 40px 40px 40px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#ddd', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', marginBottom: '30px' }}>&larr; Voltar</button>

        <div style={{ display: 'flex', gap: '50px', flexWrap: 'wrap' }}>
          <div style={{ flex: '2 1 500px' }}>
            <h1 style={{ fontSize: '3.5rem', fontWeight: '800', margin: '0 0 15px 0', lineHeight: '1.1', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{displayTitle}</h1>
            
            <div style={{ display: 'flex', gap: '15px', color: '#ccc', fontSize: '14px', marginBottom: '25px', alignItems: 'center' }}>
              <span style={{border:'1px solid #666', padding:'2px 6px', borderRadius:'3px'}}>{meta?.year?.split('-')[0]}</span>
              <span>{type === 'movie' ? 'Filme' : 'Série'}</span>
              <span style={{ color: '#46d369', fontWeight: 'bold' }}>{meta?.imdbRating} Match</span>
            </div>

            {/* EXIBIÇÃO DO DIRETOR */}
            {directorName && (
              <div style={{ marginBottom: '20px', fontSize: '16px', color: '#ddd' }}>
                 <strong style={{ color: 'white' }}>Direção:</strong> {directorName}
              </div>
            )}

            <div style={{ marginBottom: '35px' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#fff' }}>Sinopse</h3>
              <p style={{ lineHeight: '1.6', color: '#bbb', fontSize: '16px' }}>{meta?.description || "Descrição indisponível."}</p>
            </div>
            
            {meta?.cast && meta.cast.length > 0 && (
              <div style={{ marginBottom: '40px' }}>
                 <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#fff' }}>Elenco</h3>
                 <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    {meta.cast.slice(0, 6).map((actor, i) => <CastMember key={i} name={actor} />)}
                 </div>
              </div>
            )}

            {/* BOTÕES DE ASSISTIR CONDICIONAIS */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
               {!hasAnyOption && (
                 <div style={{ padding: '20px', background: '#333', borderRadius: '8px', color: '#ff6b6b', fontWeight: 'bold', width: '100%', textAlign: 'center', fontSize: '18px', border: '1px solid #555' }}>
                   🚫 Nenhuma opção disponível no momento.
                 </div>
               )}

               {hasDubbed && (
                 <button onClick={() => handlePlay(dubbed, 'dub')} style={{ flex: '1 1 200px', padding: '18px', background: '#e50914', color: 'white', border: 'none', borderRadius: '4px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                   ▶ Assistir Dublado ({dubbed.length})
                 </button>
               )}
               
               {hasSubtitled && (
                 <button onClick={() => handlePlay(subtitled, 'sub')} style={{ flex: '1 1 200px', padding: '18px', background: '#333', color: 'white', border: 'none', borderRadius: '4px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                   ▶ Assistir Legendado ({subtitled.length})
                 </button>
               )}
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