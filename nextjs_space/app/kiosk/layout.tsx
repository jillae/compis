
'use client';

import { Inter } from "next/font/google";
import "../globals.css";
import { useEffect } from 'react';

const inter = Inter({ subsets: ["latin"] });

export default function KioskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Mark as kiosk mode
    localStorage.setItem('kioskMode', 'true');
    
    // Prevent context menu (right-click)
    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Prevent keyboard shortcuts
    const preventShortcuts = (e: KeyboardEvent) => {
      // Prevent F11 (fullscreen toggle)
      if (e.key === 'F11') {
        e.preventDefault();
        return false;
      }
      
      // Prevent Ctrl+W (close tab)
      if (e.ctrlKey && e.key === 'w') {
        e.preventDefault();
        return false;
      }
      
      // Prevent Alt+F4 (close window)
      if (e.altKey && e.key === 'F4') {
        e.preventDefault();
        return false;
      }
      
      // Prevent Ctrl+Shift+I (DevTools)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return false;
      }
      
      // Prevent F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }
      
      // Prevent Ctrl+R (Refresh)
      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        return false;
      }
      
      // Prevent Alt+Tab (Switch apps)
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        return false;
      }
    };

    // Request fullscreen
    const requestFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (err) {
        console.error('Fullscreen request failed:', err);
      }
    };

    // Add event listeners
    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('keydown', preventShortcuts);
    
    // Request fullscreen after a short delay (browser security requirement)
    const timer = setTimeout(() => {
      requestFullscreen();
    }, 1000);

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('keydown', preventShortcuts);
      localStorage.removeItem('kioskMode');
      clearTimeout(timer);
    };
  }, []);

  return (
    <html lang="sv" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="relative min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
