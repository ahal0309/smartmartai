'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface ScrollContextType {
  scrollY: number;
  scrollProgress: number;
  activeScene: number;
}

const ScrollContext = createContext<ScrollContextType>({
  scrollY: 0,
  scrollProgress: 0,
  activeScene: 0,
});

export const useScroll = () => useContext(ScrollContext);

interface ScrollProviderProps {
  children: React.ReactNode;
  numScenes: number;
}

export const ScrollProvider: React.FC<ScrollProviderProps> = ({ children, numScenes }) => {
  const [scrollY, setScrollY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeScene, setActiveScene] = useState(0);

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    const viewportHeight = window.innerHeight;
    const totalScrollHeight = document.body.scrollHeight - viewportHeight;
    
    setScrollY(currentScrollY);

    if (totalScrollHeight > 0) {
      const progress = Math.min(currentScrollY / totalScrollHeight, 1);
      setScrollProgress(progress);
      
      const scene = Math.min(Math.floor((currentScrollY / viewportHeight)), numScenes - 1);
      setActiveScene(scene);
    } else {
      setScrollProgress(0);
      setActiveScene(0);
    }
  }, [numScenes]);

  useEffect(() => {
    // Set body height to enable scrolling
    document.body.style.height = `${numScenes * 100}vh`;

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.body.style.height = ''; // Clean up
    }
  }, [handleScroll, numScenes]);

  return (
    <ScrollContext.Provider value={{ scrollY, scrollProgress, activeScene }}>
      {children}
    </ScrollContext.Provider>
  );
};
