import React, { createContext, useState, useEffect, useContext } from 'react';

// Available themes
export const themes = {
  dark: {
    name: 'Dark',
    background: '#181818',
    surface: '#222',
    surfaceLight: '#2A2A2A',
    primary: '#4C566A',
    accent: '#616e87',
    success: '#4CAF50',
    error: '#ff6b6b',
    warning: '#FFD700',
    text: '#fff',
    textSecondary: '#aaa',
    border: '#444',
    borderLight: '#333',
  },
  light: {
    name: 'Light',
    background: '#ebebeb',
    surface: '#ffffff',
    surfaceLight: '#f9f9f9',
    primary: '#9dbbc9',
    accent: '#adcede',
    success: '#4CAF50',
    error: '#f44336',
    warning: '#FFC107',
    text: '#333',
    textSecondary: '#666',
    border: '#ddd',
    borderLight: '#eee',
  },
  nord: {
    name: 'Nord',
    background: '#2E3440',
    surface: '#3B4252',
    surfaceLight: '#434C5E',
    primary: '#73acbd',
    accent: '#88C0D0',  
    success: '#A3BE8C',
    error: '#BF616A',
    warning: '#EBCB8B',
    text: '#ECEFF4',
    textSecondary: '#D8DEE9',
    border: '#4C566A',
    borderLight: '#4C566A',
  },
  purple: {
    name: 'Purple Dream',
    background: '#170732',
    surface: '#2D1B45',
    surfaceLight: '#38245E',
    primary: '#7B2CBF',
    accent: '#C77DFF',
    success: '#65B891',
    error: '#E83A82',
    warning: '#F9C80E',
    text: '#F8F7FF',
    textSecondary: '#D2CAED',
    border: '#553772',
    borderLight: '#4A2963',
  },
  pink: {
    name: 'Euphoria',
    background: '#F8CDE0',
    surface: '#F4B6C8',
    surfaceLight: '#F0A2B6',
    primary: '#E65B86',
    accent: '#D94F78',
    success: '#81C784',
    error: '#E57373',
    warning: '#FFD54F',
    text: '#3A2420',
    textSecondary: '#704C41',
    border: '#EEAAC0',
    borderLight: '#F4B6C8',
  },
  mint: {
    name: 'Mint',
    background: '#D0EBEA',
    surface: '#A8D7D4',
    surfaceLight: '#BCE7E4',
    primary: '#48A99F',
    accent: '#24998D',
    success: '#A5D6A7',
    error: '#EF9A9A',
    warning: '#FFE082',
    text: '#242F33',
    textSecondary: '#506670',
    border: '#79C2BA',
    borderLight: '#A8D7D4',
  },
  crimson: {
    name: 'Crimson',
    background: '#300A0A',
    surface: '#4A0E0E',
    surfaceLight: '#5A1F1F',
    primary: '#9B1B1B',
    accent: '#CC2E2E',
    success: '#4CAF50',
    error: '#e8aa00',
    warning: '#FFA500',
    text: '#FADCDC',
    textSecondary: '#E8C6C6',
    border: '#6A2828',
    borderLight: '#7A3737',
  },
  orange: {
    name: 'Peach',
    background: '#FEEBD6',
    surface: '#FDDAB0',
    surfaceLight: '#FEE3C2',
    primary: '#FCAD45',
    accent: '#F79D20',
    success: '#A5D6A7',
    error: '#EF9A9A',
    warning: '#FFE082',
    text: '#4A302A',
    textSecondary: '#705045',
    border: '#FCC075',
    borderLight: '#FDDAB0',
  }
};

// Create theme context
const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Initialize theme from local storage or default to dark
  const [currentTheme, setCurrentTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme && themes[savedTheme] ? savedTheme : 'dark';
  });
  
  // Add transition to all CSS variables when the component first loads
  useEffect(() => {
    const root = document.documentElement;
    // Add smooth transition to all CSS variables
    root.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
  }, []);
  
  // Apply theme to document
  useEffect(() => {
    // Save theme choice to localStorage
    localStorage.setItem('theme', currentTheme);
    
    // Apply theme colors to root element
    const root = document.documentElement;
    const theme = themes[currentTheme];
    
    // Set CSS variables for the theme
    Object.entries(theme).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
    
    // Set body background color with transition
    document.body.style.backgroundColor = theme.background;
    document.body.style.color = theme.text;
    
  }, [currentTheme]);
  
  return (
    <ThemeContext.Provider value={{ 
      currentTheme, 
      setCurrentTheme, 
      themes 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for using theme
export const useTheme = () => useContext(ThemeContext);

export default ThemeContext; 