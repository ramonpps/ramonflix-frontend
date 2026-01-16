import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../Navbar';

// Configuração de ambiente
const STREAM_BASE_URL = import.meta.env.VITE_STREAM_URL || "http://localhost:8080";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

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

  // Player States
  const [selectedStream, setSelectedStream] = useState(null);
  const [activeList, setActiveList] = useState([]);
  const [sidebarHover, setSidebarHover] = useState(false);

  const [expandedSeason, setExpandedSeason] = useState(null);
  const [expandedEpisode, setExpandedEpisode] = useState(null);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        // Carrega dados iniciais do S1E1 para pegar metadados da série
        const res = await axios.get(`${API_BASE_URL}/streams`, {
          params: { imdb_id: imdbId, type: 'series', season: 1, episode: 1, title_hint: titleHint }
        });
        setMeta(res.data.meta);

        // Carrega lista de episodios via Cinemeta (Metadados Reais)
        const cinemetaRes = await axios.get(`https://v3-cinemeta.strem.io/meta/series/${imdbId}.json`);
        const allEpisodes = cinemetaRes.data.meta.videos;
        
        const seasonMap = {};
        allEpisodes.forEach(ep => {
          if (!seasonMap[ep.season]) seasonMap[ep.season] = [];
          seasonMap[ep.season].push(ep);
        });
        setSeasons(seasonMap);

        // Inicia Pré-load de informações de stream
        allEpisodes.forEach(ep => { if(ep.season > 0) queueRef.current.push(ep); });
        processQueue();

      } catch (err) { 
        console.error("Erro ao carregar série", err); 
      } finally { 
        setLoadingMeta(false); 
      }
    };
    if (imdbId) fetchMeta();
  }, [imdbId]);

  // Processa a fila para carregar se tem dub/leg disponível
  const processQueue = async () => {
    if (processingRef.current || queueRef.current.length === 0) return;
    processingRef.current = true;
    while (queueRef.current.length > 0) {
      const ep = queueRef.current.shift();
      const epId = `${ep.season}-${ep.episode}`;
      if (episodeData[epId]) continue;
      try {
        // Busca info "safe" do backend
        const res = await axios.get(`${API_BASE_URL}/streams`, {
          params: { imdb_id: imdbId, type: 'series', season: ep.season, episode: ep.episode }
        });
        const { dubbed, subtitled, meta } = res.data;
        setEpisodeData(prev => ({
          ...prev,
          [epId]: { loaded: true, dub: dubbed, sub: subtitled, title: meta.episode_title || ep.name, description: meta.episode_description }
        }));
        await new Promise(r => setTimeout(r, 200)); 
      } catch (err) {}
    }
    processingRef.current = false;
  };

  const handleExpandEpisode = async (season, episode) => {
    const epId = `${season}-${episode}`;
    if (expandedEpisode === epId) { setExpandedEpisode(null); return; }
    setExpandedEpisode(epId);
    if (episodeData[epId]?.loaded) return;

    try {
      const res = await axios.get(`${API_BASE_URL}/streams`, {
        params: { imdb_id: imdbId, type: 'series', season, episode, title_hint: titleHint }
      });
      const { dubbed, subtitled, meta } = res.data;
      setEpisodeData(prev => ({
        ...prev,
        [epId]: { loaded: true, dub: dubbed, sub: subtitled, title: meta.episode_title, description: meta.episode_description }
      }));
    } catch(e) {}
  };

  const handlePlay = (list, audioType, season, episode) => {
    if (!list || list.length === 0) return;
    setActiveList(list);
    setSelectedStream({ ...list[0], audioType, subtitles: [], season, episode });
  };

  const handleSwitchStream = (stream) => {
    setSelectedStream({ 
        ...stream, 
        audioType: selectedStream.audioType, 
        season: selectedStream.season, 
        episode: selectedStream.episode 
    });
  };

  // --- MODO PLAYER ---
  if (selectedStream && selectedStream.magnet) {
    const sidebarWidth = 300;
    return (
      <div style={{ width: '100vw', height: '100vh', background: 'black', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', padding: '20px', zIndex: 50, display: 'flex', justifyContent: 'space-between', background: 'linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)', pointerEvents: 'none' }}>
            <button onClick={() => setSelectedStream(null)} style={{ pointerEvents: 'auto', background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', backdropFilter: 'blur(5px)' }}>&larr; Voltar aos Episódios</button>
            <div style={{color:'white', fontWeight:'bold', textShadow:'0 2px 4px black'}}>
                S{selectedStream.season}:E{selectedStream.episode} - DEMO MODE
            </div>
        </div>

        <div style={{width:'100%', height:'100%', display:'flex', justifyContent:'center', alignItems:'center'}}>
            <video 
                key={selectedStream.infoHash} 
                controls 
                autoPlay 
                width="100%" 
                height="100%" 
                crossOrigin="anonymous"
            >
                {/* Usa Magnet Link Seguro */}
                <source src={`${STREAM_BASE_URL}/stream?magnet=${encodeURIComponent(selectedStream.magnet)}&season=${selectedStream.season}&episode=${selectedStream.episode}`} type="video/mp4" />
            </video>
        </div>

        {/* Sidebar */}
        <div onMouseEnter={() => setSidebarHover(true)} onMouseLeave={() => setSidebarHover(false)} style={{ position: 'fixed', top: 0, right: 0, height: '100vh', zIndex: 2000, display: 'flex', transition: 'transform 0.3s ease', transform: sidebarHover ? 'translateX(0)' : `translateX(${sidebarWidth}px)` }}>
            <div style={{ width: '40px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                 <div style={{ background: 'rgba(20,20,20,0.9)', padding: '15px 0', width: '30px', borderRadius: '8px 0 0 8px', color: '#ccc', textAlign: 'center' }}>‹</div>
            </div>
            <div style={{ width: `${sidebarWidth}px`, background: 'rgba(10,10,10,0.95)', borderLeft: '1px solid #333', overflowY: 'auto', padding: '10px' }}>
              <div style={{ padding: '15px', borderBottom: '1px solid #333', color: '#e50914', fontWeight: 'bold' }}>Fontes Disponíveis</div>
              {activeList.map((item, idx) => (
                <div key={idx} onClick={() => handleSwitchStream(item)} style={{ padding: '12px', marginBottom: '8px', background: selectedStream.infoHash === item.infoHash ? 'rgba(229,9,20,0.2)' : 'transparent', borderRadius: '4px', cursor: 'pointer', border: '1px solid #333' }}>
                  <div style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>{item.name || `Servidor ${idx + 1}`}</div>
                  <div style={{ color: '#888', fontSize: '11px', marginTop:'4px' }}>Demo Stream • Estável</div>
                </div>
              ))}
            </div>
        </div>
      </div>
    );
  }

  // --- MODO LISTA DE EPISÓDIOS ---
  if (loadingMeta) return <div style={{height:'100vh', background:'#141414', color:'white', display:'flex', justifyContent:'center', alignItems:'center'}}>Carregando Série...</div>;

  const directorName = meta?.director ? (Array.isArray(meta.director) ? meta.director.join(', ') : meta.director) : null;

  return (
    <div style={{ minHeight: '100vh', background: '#141414', color: 'white', fontFamily: 'Arial' }}>
      <Navbar />
      {meta?.background && <div style={{ position: 'fixed', top:0, left:0, width:'100%', height:'100%', backgroundImage: `url(${meta.background})`, backgroundSize:'cover', opacity: 0.2, filter:'blur(30px)', zIndex:0 }} />}

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
                
                {/* Aviso de Portfólio */}
                <div style={{ background: 'rgba(229, 9, 20, 0.1)', border: '1px solid #e50914', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', color: '#ffcccb' }}>
                  <strong>Demo Técnica:</strong> Streaming simulado via conteúdo Open Source para fins de demonstração técnica e conformidade legal.
                </div>

                {directorName && <div style={{marginBottom:'10px', color:'#ddd'}}><strong>Criado por:</strong> {directorName}</div>}
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

        {/* Lista de Temporadas e Episódios */}
        <div style={{ maxWidth: '900px' }}>
            {Object.keys(seasons).sort((a,b) => parseInt(a)-parseInt(b)).map(seasonNum => {
                if (seasonNum === '0') return null; 
                const isSeasonOpen = expandedSeason === seasonNum;
                return (
                    <div key={seasonNum} style={{ marginBottom: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid #333' }}>
                        <div onClick={() => setExpandedSeason(isSeasonOpen ? null : seasonNum)} style={{ padding: '20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '18px' }}>Temporada {seasonNum}</h3>
                            <span style={{ fontSize: '20px' }}>{isSeasonOpen ? '▲' : '▼'}</span>
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
                                            <div onClick={() => handleExpandEpisode(seasonNum, ep.episode)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px', padding: '10px', borderRadius: '4px' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                                <div style={{ color: '#888', fontWeight: 'bold', width: '30px' }}>{ep.episode}</div>
                                                <div style={{ flex: 1, fontWeight: '500' }}>{displayEpTitle}</div>
                                                <div style={{ fontSize: '12px', color: '#666' }}>{isEpOpen ? '▲' : '▼'}</div>
                                            </div>
                                            {isEpOpen && (
                                                <div style={{ padding: '15px', background: '#1a1a1a', borderRadius: '4px', marginTop: '5px' }}>
                                                    {isLoading ? (
                                                        <div style={{ color: '#999', textAlign: 'center' }}>Carregando opções...</div>
                                                    ) : (
                                                        <>
                                                            <p style={{ fontSize: '14px', color: '#aaa', margin: '0 0 15px 0' }}>{data?.description || ep.description}</p>
                                                            <div style={{ display: 'flex', gap: '15px' }}>
                                                                {data && data.dub.length > 0 ? (
                                                                  <button onClick={() => handlePlay(data.dub, 'dub', seasonNum, ep.episode)} style={{ flex: 1, padding: '12px', background: '#e50914', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>▶ Dublado</button>
                                                                ) : <button disabled style={{ flex: 1, padding: '12px', background: '#333', color: '#666', border: 'none', borderRadius: '4px', cursor: 'not-allowed' }}>Dublado Indisponível</button>}

                                                                {data && data.sub.length > 0 ? (
                                                                  <button onClick={() => handlePlay(data.sub, 'sub', seasonNum, ep.episode)} style={{ flex: 1, padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>▶ Legendado</button>
                                                                ) : <button disabled style={{ flex: 1, padding: '12px', background: '#222', color: '#666', border: 'none', borderRadius: '4px', cursor: 'not-allowed' }}>Leg. Indisponível</button>}
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