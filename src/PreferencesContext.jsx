import React, { createContext, useState, useContext, useEffect } from 'react';

const PreferencesContext = createContext();

export const PreferencesProvider = ({ children }) => {
  // Lê do localStorage se existir, senão define 'sub' (Legendado) como padrão
  const [audioPref, setAudioPref] = useState(() => {
    return localStorage.getItem('user_audio_pref') || 'sub';
  });

  // Sempre que mudar, salva no localStorage para não perder ao recarregar
  useEffect(() => {
    localStorage.setItem('user_audio_pref', audioPref);
  }, [audioPref]);

  return (
    <PreferencesContext.Provider value={{ audioPref, setAudioPref }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => useContext(PreferencesContext);