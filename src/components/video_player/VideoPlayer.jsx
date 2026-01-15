import React from 'react';

const VideoPlayer = ({ magnet, subtitles = [] }) => {
  // Endereço do seu microsserviço Node.js
  const STREAM_ENGINE = "http://localhost:8080"; 
  
  // Codifica o magnet para passar na URL com segurança
  const streamUrl = `${STREAM_ENGINE}/stream?magnet=${encodeURIComponent(magnet)}`;

  return (
    <div style={{ marginTop: '20px', background: 'black', padding: '10px' }}>
      <video 
        controls 
        autoPlay 
        width="100%" 
        height="600px"
        crossOrigin="anonymous"
      >
        <source src={streamUrl} type="video/mp4" />
        
        {/* Renderiza as legendas se houver */}
        {subtitles.map((sub, index) => (
          <track
            key={index}
            kind="subtitles"
            label="Inglês (Auto)"
            srcLang={sub.lang}
            src={sub.url}
            default={index === 0} // Ativa a primeira legenda automaticamente
          />
        ))}
        Seu navegador não suporta a tag vídeo.
      </video>
    </div>
  );
};

export default VideoPlayer;