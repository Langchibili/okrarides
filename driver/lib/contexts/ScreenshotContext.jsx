'use client';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ScreenshotCtx = createContext(null);

const STORAGE_KEY        = 'draft_support_ticket_id';
const STORAGE_COUNT_KEY  = 'draft_screenshot_count';

export function ScreenshotProvider({ children }) {
  const [takingScreenshot, setTakingScreenshot] = useState(false);
  const [draftTicketId,    setDraftTicketId]    = useState(null);
  const [screenshotCount,  setScreenshotCount]  = useState(0);
  const [captureCallback,  setCaptureCallback]  = useState(null);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const id    = localStorage.getItem(STORAGE_KEY);
    const count = parseInt(localStorage.getItem(STORAGE_COUNT_KEY) || '0', 10);
    if (id) {
      setDraftTicketId(id);
      setScreenshotCount(count);
    }
  }, []);

  const startScreenshotMode = useCallback((ticketId, onCaptureDone) => {
    localStorage.setItem(STORAGE_KEY, ticketId);
    localStorage.setItem(STORAGE_COUNT_KEY, '0');
    setDraftTicketId(ticketId);
    setScreenshotCount(0);
    setCaptureCallback(() => onCaptureDone ?? null);
    setTakingScreenshot(true);
  }, []);

  const stopScreenshotMode = useCallback(() => {
    setTakingScreenshot(false);
    setCaptureCallback(null);
  }, []);

  const onCaptured = useCallback(() => {
    setScreenshotCount(prev => {
      const next = prev + 1;
      localStorage.setItem(STORAGE_COUNT_KEY, String(next));
      return next;
    });
    captureCallback?.();
  }, [captureCallback]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_COUNT_KEY);
    setDraftTicketId(null);
    setScreenshotCount(0);
    setTakingScreenshot(false);
    setCaptureCallback(null);
  }, []);

  return (
    <ScreenshotCtx.Provider value={{
      takingScreenshot,
      draftTicketId,
      screenshotCount,
      startScreenshotMode,
      stopScreenshotMode,
      onCaptured,
      clearDraft,
      MAX_SCREENSHOTS: 5,
    }}>
      {children}
    </ScreenshotCtx.Provider>
  );
}

export const useScreenshot = () => {
  const ctx = useContext(ScreenshotCtx);
  if (!ctx) throw new Error('useScreenshot must be used within ScreenshotProvider');
  return ctx;
};