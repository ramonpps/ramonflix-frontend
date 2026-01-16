import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../Navbar_temp';

const STREAM_BASE_URL = import.meta.env.VITE_STREAM_URL || "http://localhost:8080";

const WatchSeriesPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const imdbId = searchParams.get('imdbId');
  const titleHint = searchParams.get('title_hint');

  const [meta, setMeta] = useState(null);
  const [seasons, setSeasons] = useState({});
  const [loadingMeta, setLoadingMeta] = useState(true);
  
  // Cache de Episódios
  const [episodeData, setEpisodeData] = useState({}); 
  const queueRef = useRef([]); 
  const processingRef = useRef(false); 

  const [selectedStream, setSelectedStream] = useState(null);
  const [activeList, setActiveList] = useState([]);
  const [videoError, setVideoError] = useState(false);
  const [sidebarHover, setSidebarHover] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const [expandedSeason, setExpandedSeason] = useState(null);
  const [expandedEpisode, setExpandedEpisode] = useState(null);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/streams`, {
          params: { imdb_id: imdbId, type: 'series', season: 1, episode: 1, title_hint: titleHint }
        });
        setMeta(res.data.meta);

        const cinemetaRes = await axios.get(`https://v3-cinemeta.strem.io/meta/series/${imdbId}.json`);
        const allEpisodes = cinemetaRes.data.meta.videos;
        
        const seasonMap = {};
        allEpisodes.forEach(ep => {
          if (!seasonMap[ep.season]) seasonMap[ep.season] = [];
          seasonMap[ep.season].push(ep);
        });
        setSeasons(seasonMap);

        // Inicia Pré-load
        allEpisodes.forEach(ep => {
           if(ep.season > 0) queueRef.current.push(ep);
        });
        processQueue();

      } catch (err) {
        console.error("Erro ao carregar série", err);
      } finally {
        setLoadingMeta(false);
      }
    };
    if (imdbId) fetchMeta();
  }, [imdbId]);

  const processQueue = async () => {
    if (processingRef.current || queueRef.current.length === 0) return;
    processingRef.current = true;

    while (queueRef.current.length > 0) {
      const ep = queueRef.current.shift();
      const epId = `${ep.season}-${ep.episode}`;

      if (episodeData[epId]) continue;

      try {
        const res = await axios.get(`${API_BASE_URL}/streams`, {
          params: { imdb_id: imdbId, type: 'series', season: ep.season, episode: ep.episode, title_hint: titleHint }
        });
        
        const { dubbed, subtitled, meta } = res.data;
        
        setEpisodeData(prev => ({
          ...prev,
          [epId]: {
            loaded: true,
            dub: dubbed || [],
            sub: subtitled || [],
            title: meta.episode_title || ep.name, 
            description: meta.episode_description
          }
        }));
        
        await new Promise(r => setTimeout(r, 200)); 
      } catch (err) {}
    }
    processingRef.current = false;
  };

  const handleExpandEpisode = async (season, episode) => {
    const epId = `${season}-${episode}`;
    if (expandedEpisode === epId) {
      setExpandedEpisode(null);
      return;
    }
    setExpandedEpisode(epId);

    if (episodeData[epId]?.loaded) return;

    try {
      const res = await axios.get(`${API_BASE_URL}/streams`, {
        params: { imdb_id: imdbId, type: 'series', season, episode, title_hint: titleHint }
      });
      const { dubbed, subtitled, meta } = res.data;
      
      setEpisodeData(prev => ({
        ...prev,
        [epId]: {
          loaded: true,
          dub: dubbed || [],
          sub: subtitled || [],
          title: meta.episode_title,
          description: meta.episode_description
        }
      }));
    } catch(e) {}
  };

  const handlePlay = (list, audioType, season, episode) => {
    if (!list || list.length === 0) return;
    setVideoError(false);
    setActiveList(list);
    setSelectedStream({ ...list[0], audioType, subtitles: [], season, episode });
  };

  const handleSwitchStream = (stream) => {
    setVideoError(false);
    setSelectedStream({ ...stream, audioType: selectedStream.audioType, subtitles: [], season: selectedStream.season, episode: selectedStream.episode });
  };

  const handleTryNext = () => {
    if (!selectedStream || activeList.length === 0) return;
    const idx = activeList.findIndex(s => s.infoHash === selectedStream.infoHash);
    if (idx + 1 < activeList.length) {
      setVideoError(false);
      handleSwitchStream(activeList[idx + 1]);
    } else {
      alert("Fim da lista.");
    }
  };

  if (selectedStream && selectedStream.magnet) {
    const sidebarContentWidth = 300; 
    const sidebarTipWidth = 40;     
    const currentIdx = activeList.findIndex(s => s.infoHash === selectedStream.infoHash);
    const hasNextOption = currentIdx !== -1 && currentIdx + 1 < activeList.length;

    return (
      <div style={{ width: '100vw', height: '100vh', background: 'black', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', padding: '20px', zIndex: 50, display: 'flex', justifyContent: 'space-between', background: 'linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)', pointerEvents: 'none' }}>
            <button onClick={() => setSelectedStream(null)} style={{ pointerEvents: 'auto', background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', backdropFilter: 'blur(5px)' }}>&larr; Voltar</button>
            <div style={{ color: 'white', fontWeight: 'bold', textShadow: '0 2px 4px black' }}>S{selectedStream.season}:E{selectedStream.episode} - {selectedStream.audioType === 'dub' ? 'Dublado' : 'Legendado'}</div>
            {hasNextOption && <button onClick={handleTryNext} style={{ pointerEvents: 'auto', background: '#e50914', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>↻ Próxima Opção</button>}
        </div>

        {videoError && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
            <div style={{ background: '#222', padding: '40px', borderRadius: '16px', textAlign: 'center', border: '1px solid #444', maxWidth: '500px', width: '90%', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
              <div style={{ fontSize: '60px', marginBottom: '20px' }}>⚠️</div>
              <h2 style={{ color: '#fff', marginBottom: '15px' }}>Fonte Indisponível</h2>
              <p style={{ color: '#ccc', marginBottom: '30px' }}>O servidor demorou muito para responder ou o arquivo está sem seeds.<br/>Tentaremos o próximo automaticamente.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {hasNextOption && <button onClick={handleTryNext} style={{ background: '#e50914', color: 'white', border: 'none', padding: '15px 30px', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>Tentar Próxima Opção Automaticamente</button>}
                <button onClick={() => setSelectedStream(null)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', textDecoration: 'underline' }}>Voltar para a lista</button>
              </div>
            </div>
          </div>
        )}

        <div style={{width:'100%', height:'100%', display:'flex', justifyContent:'center', alignItems:'center'}}>
            <video 
              key={selectedStream.infoHash} 
              controls 
              autoPlay 
              width="100%" 
              height="100%" 
              crossOrigin="anonymous" 
              onError={() => setVideoError(true)}
            >
                <source 
                   src={`${STREAM_ENGINE_URL}/stream?magnet=${encodeURIComponent(selectedStream.magnet)}&season=${selectedStream.season}&episode=${selectedStream.episode}`} 
                   type="video/mp4" 
                />
            </video>
        </div>

        <div onMouseEnter={() => setSidebarHover(true)} onMouseLeave={() => setSidebarHover(false)} style={{ position: 'fixed', top: 0, right: 0, height: '100vh', zIndex: 2000, display: 'flex', transition: 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)', transform: sidebarHover ? 'translateX(0)' : `translateX(${sidebarContentWidth}px)` }}>
            <div style={{ width: `${sidebarTipWidth}px`, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'transparent' }}>
                 <div style={{ background: 'rgba(20, 20, 20, 0.9)', backdropFilter: 'blur(10px)', padding: '15px 0', width: '30px', borderRadius: '8px 0 0 8px', border: '1px solid rgba(255,255,255,0.1)', borderRight: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', boxShadow: '-4px 0 15px rgba(0,0,0,0.5)', color: '#ccc' }}><span style={{ fontSize: '14px' }}>‹</span></div>
            </div>
            <div style={{ width: `${sidebarContentWidth}px`, background: 'rgba(10, 10, 10, 0.96)', backdropFilter: 'blur(15px)', borderLeft: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid #333' }}><h3 style={{ margin: 0, color: '#e50914', fontSize: '14px' }}>Fontes</h3></div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                {activeList.map((item, idx) => {
                  const isActive = selectedStream.infoHash === item.infoHash;
                  return (
                    <div key={idx} onClick={() => handleSwitchStream(item)} style={{ padding: '12px', marginBottom: '8px', background: isActive ? 'rgba(229, 9, 20, 0.15)' : 'transparent', borderRadius: '4px', cursor: 'pointer', border: isActive ? '1px solid rgba(229, 9, 20, 0.4)' : '1px solid transparent' }}>
                      <div style={{ color: isActive ? '#e50914' : '#ddd', fontSize: '13px' }}>{idx + 1}. {item.title}</div>
                      <div style={{ fontSize: '11px', color: '#666' }}>Seed: {Math.floor(item.score / 100)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
        </div>
      </div>
    );
  }

  if (loadingMeta) return <div style={{height:'100vh', background:'#141414', color:'white', display:'flex', justifyContent:'center', alignItems:'center'}}>Carregando Série...</div>;

  const directorName = meta?.director ? (Array.isArray(meta.director) ? meta.director.join(', ') : meta.director) : null;

  return (
    <div style={{ minHeight: '100vh', background: '#141414', color: 'white', fontFamily: 'Arial' }}>
      <Navbar />
      
      {meta?.background && (
         <div style={{ position: 'fixed', top:0, left:0, width:'100%', height:'100%', backgroundImage: `url(${meta.background})`, backgroundSize:'cover', opacity: 0.2, filter:'blur(30px)', zIndex:0 }} />
      )}

      <div className="container" style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto', padding: '100px 20px 40px 20px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#ddd', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', marginBottom: '30px' }}>&larr; Voltar</button>

        <div style={{ display: 'flex', gap: '40px', marginBottom: '50px', flexWrap: 'wrap' }}>
            <div style={{ flex: '0 0 250px' }}>
                <img src={meta?.poster} style={{ width: '100%', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} />
            </div>
            <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: '3rem', margin: '0 0 10px 0' }}>{meta?.name}</h1>
                <div style={{ display: 'flex', gap: '15px', color: '#ccc', marginBottom: '20px' }}>
                    <span>{meta?.year?.split('–')[0]}</span>
                    <span style={{ color: '#46d369', fontWeight: 'bold' }}>{meta?.imdbRating} Match</span>
                    <span>{Object.keys(seasons).length} Temporadas</span>
                </div>
                {directorName && <div style={{marginBottom:'15px', color:'#ddd'}}><strong>Criado por:</strong> {directorName}</div>}
                <p style={{ lineHeight: '1.6', color: '#bbb', maxWidth: '800px', marginBottom: '20px' }}>{meta?.description}</p>
                
                {meta?.cast && meta.cast.length > 0 && (
                  <div>
                     <strong style={{color:'#ddd', display:'block', marginBottom:'10px'}}>Elenco:</strong>
                     <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {meta.cast.slice(0, 5).map((actor, i) => (
                            <span key={i} style={{background:'rgba(255,255,255,0.1)', padding:'4px 10px', borderRadius:'15px', fontSize:'13px'}}>{actor}</span>
                        ))}
                     </div>
                  </div>
                )}
            </div>
        </div>

        <div style={{ maxWidth: '900px' }}>
            {Object.keys(seasons).sort((a,b) => parseInt(a)-parseInt(b)).map(seasonNum => {
                if (seasonNum === '0') return null; 
                const isSeasonOpen = expandedSeason === seasonNum;

                return (
                    <div key={seasonNum} style={{ marginBottom: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid #333' }}>
                        <div 
                            onClick={() => setExpandedSeason(isSeasonOpen ? null : seasonNum)}
                            style={{ 
                                padding: '20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                background: isSeasonOpen ? 'rgba(255,255,255,0.05)' : 'transparent', borderRadius: '8px'
                            }}
                        >
                            <h3 style={{ margin: 0, fontSize: '18px' }}>Temporada {seasonNum}</h3>
                            <span style={{ fontSize: '20px', transform: isSeasonOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                        </div>

                        {isSeasonOpen && (
                            <div style={{ padding: '0 20px 20px 20px' }}>
                                {seasons[seasonNum].map(ep => {
                                    const epId = `${seasonNum}-${ep.episode}`;
                                    const isEpOpen = expandedEpisode === epId;
                                    const data = episodeData[epId]; 
                                    const isLoading = !data && expandedEpisode === epId; 

                                    const displayEpTitle = data?.title || ep.name || `Episódio ${ep.episode}`;

                                    return (
                                        <div key={ep.episode} style={{ marginTop: '10px', borderTop: '1px solid #222', paddingTop: '10px' }}>
                                            <div 
                                                onClick={() => handleExpandEpisode(seasonNum, ep.episode)}
                                                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px', padding: '10px', borderRadius: '4px', transition: 'background 0.2s' }}
                                                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <div style={{ color: '#888', fontWeight: 'bold', width: '30px' }}>{ep.episode}</div>
                                                <div style={{ flex: 1, fontWeight: '500' }}>{displayEpTitle}</div>
                                                <div style={{ fontSize: '12px', color: '#666' }}>{isEpOpen ? '▲' : '▼'}</div>
                                            </div>

                                            {isEpOpen && (
                                                <div style={{ padding: '15px', background: '#1a1a1a', borderRadius: '4px', marginTop: '5px', border: '1px solid #333' }}>
                                                    
                                                    {isLoading ? (
                                                        <div style={{ color: '#999', textAlign: 'center', padding: '20px' }}>Carregando info...</div>
                                                    ) : (
                                                        <>
                                                            <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                                                                {ep.thumbnail && <img src={ep.thumbnail} style={{ width: '150px', borderRadius: '4px' }} />}
                                                                <p style={{ fontSize: '14px', color: '#aaa', lineHeight: '1.5', margin: 0 }}>
                                                                    {data?.description || ep.description || "Descrição indisponível."}
                                                                </p>
                                                            </div>
                                                            
                                                            <div style={{ display: 'flex', gap: '15px' }}>
                                                                {data && data.dub.length > 0 && (
                                                                    <button onClick={() => handlePlay(data.dub, 'dub', seasonNum, ep.episode)} style={{ flex: 1, padding: '12px', background: '#e50914', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                                        ▶ Assistir Dublado ({data.dub.length})
                                                                    </button>
                                                                )}

                                                                {data && data.sub.length > 0 && (
                                                                    <button onClick={() => handlePlay(data.sub, 'sub', seasonNum, ep.episode)} style={{ flex: 1, padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                                        ▶ Assistir Legendado ({data.sub.length})
                                                                    </button>
                                                                )}

                                                                {data && data.dub.length === 0 && data.sub.length === 0 && (
                                                                    <div style={{ color: '#e50914', fontWeight: 'bold', width: '100%', textAlign: 'center', padding: '10px', border:'1px solid #555', borderRadius:'4px' }}>
                                                                        🚫 Nenhuma opção encontrada para este episódio.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default WatchSeriesPage;