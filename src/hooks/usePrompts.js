import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

const CACHE_KEY = 'jotflow_prompts_cache';

const FALLBACK_PROMPTS = [
  { id: 'f1', text: 'What are you grateful for today?', category: 'general' },
  { id: 'f2', text: 'Describe a challenge you overcame recently.', category: 'reflection' },
  { id: 'f3', text: 'What would your ideal day look like?', category: 'general' },
  { id: 'f4', text: 'Write about something that made you smile this week.', category: 'general' },
  { id: 'f5', text: 'What is one thing you want to learn this month?', category: 'growth' },
  { id: 'f6', text: 'Describe your current mood in detail. What led to it?', category: 'reflection' },
  { id: 'f7', text: 'What advice would you give your past self from a year ago?', category: 'reflection' },
  { id: 'f8', text: 'List three small wins from today.', category: 'general' },
  { id: 'f9', text: 'What is something you have been avoiding? Why?', category: 'reflection' },
  { id: 'f10', text: 'Write a letter to your future self.', category: 'creative' },
  { id: 'f11', text: 'What does success mean to you right now?', category: 'growth' },
  { id: 'f12', text: 'Describe a moment of peace you experienced recently.', category: 'general' },
];

function getCachedPrompts() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
  } catch {
    return null;
  }
}

function setCachedPrompts(prompts) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(prompts));
  } catch { /* quota exceeded */ }
}

export function usePrompts() {
  const [prompts, setPrompts] = useState(() => getCachedPrompts() || FALLBACK_PROMPTS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPrompts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('journaling_prompts')
          .select('*');

        if (!error && data && data.length > 0) {
          setPrompts(data);
          setCachedPrompts(data);
        }
      } catch (err) {
        console.error('Failed to fetch prompts:', err);
      }
      setLoading(false);
    };

    fetchPrompts();
  }, []);

  const getRandomPrompt = useCallback((category = null) => {
    const filtered = category
      ? prompts.filter(p => p.category === category)
      : prompts;
    if (filtered.length === 0) return prompts[0] || FALLBACK_PROMPTS[0];
    return filtered[Math.floor(Math.random() * filtered.length)];
  }, [prompts]);

  return { prompts, loading, getRandomPrompt };
}
