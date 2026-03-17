// Okrarides\driver\lib\contexts\ScreenshotContext.jsx
'use client';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ScreenshotCtx = createContext(null);

const KEYS = {
  ticketId:  'draft_support_ticket_id',
  count:     'draft_screenshot_count',
  subject:   'draft_subject',
  category:  'draft_category',
};

export function ScreenshotProvider({ children }) {
  const [takingScreenshot, setTakingScreenshot] = useState(false);
  const [draftTicketId,    setDraftTicketId]    = useState(null);
  const [screenshotCount,  setScreenshotCount]  = useState(0);
  const [draftSubject,     setDraftSubject]     = useState('');
  const [draftCategory,    setDraftCategory]    = useState(null);

  // Rehydrate on mount
  useEffect(() => {
    const id       = localStorage.getItem(KEYS.ticketId);
    const count    = parseInt(localStorage.getItem(KEYS.count) || '0', 10);
    const subject  = localStorage.getItem(KEYS.subject)  || '';
    const category = localStorage.getItem(KEYS.category) || null;
    if (id) {
      setDraftTicketId(id);
      setScreenshotCount(count);
      setDraftSubject(subject);
      setDraftCategory(category);
      setTakingScreenshot(true); // restore floating button
    }
  }, []);

  const startScreenshotMode = useCallback((ticketId, subject, category) => {
    localStorage.setItem(KEYS.ticketId,  String(ticketId));
    localStorage.setItem(KEYS.count,     '0');
    localStorage.setItem(KEYS.subject,   subject  || '');
    localStorage.setItem(KEYS.category,  category || '');
    setDraftTicketId(ticketId);
    setScreenshotCount(0);
    setDraftSubject(subject  || '');
    setDraftCategory(category || null);
    setTakingScreenshot(true);
  }, []);

  const stopScreenshotMode = useCallback(() => {
    setTakingScreenshot(false);
  }, []);

  const onCaptured = useCallback(() => {
    setScreenshotCount(prev => {
      const next = prev + 1;
      localStorage.setItem(KEYS.count, String(next));
      return next;
    });
  }, []);

  const clearDraft = useCallback(() => {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    setDraftTicketId(null);
    setScreenshotCount(0);
    setDraftSubject('');
    setDraftCategory(null);
    setTakingScreenshot(false);
  }, []);

  return (
    <ScreenshotCtx.Provider value={{
      takingScreenshot,
      draftTicketId,
      screenshotCount,
      draftSubject,
      draftCategory,
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