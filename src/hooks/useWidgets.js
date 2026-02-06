import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { addToSyncQueue } from '../lib/syncQueue';

const CACHE_KEY = 'jotflow_widgets_cache';

const DEFAULT_WIDGETS = [
  { type: 'streak', config: {}, layout: { x: 0, y: 0, w: 2, h: 2 }, enabled: true },
  { type: 'quick_stats', config: { stats: ['total_entries', 'total_todos', 'completion_rate', 'avg_mood'] }, layout: { x: 2, y: 0, w: 2, h: 2 }, enabled: true },
  { type: 'todos', config: { limit: 5 }, layout: { x: 0, y: 2, w: 2, h: 2 }, enabled: true },
  { type: 'recent_entries', config: { limit: 5 }, layout: { x: 2, y: 2, w: 2, h: 2 }, enabled: true },
];

function getCachedWidgets() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
  } catch {
    return null;
  }
}

function setCachedWidgets(widgets) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(widgets));
  } catch { /* quota exceeded */ }
}

async function createDefaultWidgets() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const payloads = DEFAULT_WIDGETS.map(w => ({
    user_id: user.id,
    type: w.type,
    config: w.config,
    layout: w.layout,
    enabled: w.enabled,
  }));

  const { data, error } = await supabase
    .from('widgets')
    .insert(payloads)
    .select();

  if (error) {
    console.error('Failed to create default widgets:', error.message);
    return null;
  }
  return data;
}

export function useWidgets() {
  const [widgets, setWidgets] = useState(() => getCachedWidgets() || []);
  const [loading, setLoading] = useState(false);

  const fetchWidgets = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('widgets')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Failed to fetch widgets:', error.message);
      } else if (data && data.length > 0) {
        setWidgets(data);
        setCachedWidgets(data);
      } else if (data && data.length === 0) {
        // First time user — create defaults
        const created = await createDefaultWidgets();
        if (created) {
          setWidgets(created);
          setCachedWidgets(created);
        }
      }
    } catch (err) {
      console.error('Network error fetching widgets:', err);
    }
    setLoading(false);
  }, []);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('widgets-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'widgets' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setWidgets(prev => {
              if (prev.some(w => w.id === payload.new.id)) {
                return prev.map(w => w.id === payload.new.id ? payload.new : w);
              }
              const updated = [...prev, payload.new];
              setCachedWidgets(updated);
              return updated;
            });
          } else if (payload.eventType === 'UPDATE') {
            setWidgets(prev => {
              const updated = prev.map(w => w.id === payload.new.id ? payload.new : w);
              setCachedWidgets(updated);
              return updated;
            });
          } else if (payload.eventType === 'DELETE') {
            setWidgets(prev => {
              const updated = prev.filter(w => w.id !== payload.old.id);
              setCachedWidgets(updated);
              return updated;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addWidget = async (type, config = {}, layout = {}) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Calculate next position
    const maxY = widgets.reduce((max, w) => Math.max(max, (w.layout?.y || 0) + (w.layout?.h || 2)), 0);
    const defaultLayout = { x: 0, y: maxY, w: 2, h: 2, ...layout };

    const payload = {
      user_id: user.id,
      type,
      config,
      layout: defaultLayout,
      enabled: true,
    };

    if (!navigator.onLine) {
      const tempId = crypto.randomUUID();
      const optimistic = { ...payload, id: tempId, created_at: new Date().toISOString(), _pending: true };
      setWidgets(prev => {
        const updated = [...prev, optimistic];
        setCachedWidgets(updated);
        return updated;
      });
      addToSyncQueue({ type: 'INSERT', table: 'widgets', payload });
      return optimistic;
    }

    const { data, error } = await supabase
      .from('widgets')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Failed to add widget:', error.message);
      return null;
    }
    return data;
  };

  const updateWidget = async (id, fields) => {
    if (!navigator.onLine) {
      setWidgets(prev => {
        const updated = prev.map(w => w.id === id ? { ...w, ...fields, _pending: true } : w);
        setCachedWidgets(updated);
        return updated;
      });
      addToSyncQueue({ type: 'UPDATE', table: 'widgets', payload: fields, id });
      return true;
    }

    const { error } = await supabase
      .from('widgets')
      .update(fields)
      .eq('id', id);

    if (error) {
      console.error('Failed to update widget:', error.message);
      return false;
    }
    return true;
  };

  const removeWidget = async (id) => {
    if (!navigator.onLine) {
      setWidgets(prev => {
        const updated = prev.filter(w => w.id !== id);
        setCachedWidgets(updated);
        return updated;
      });
      addToSyncQueue({ type: 'DELETE', table: 'widgets', id });
      return true;
    }

    const { error } = await supabase
      .from('widgets')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to remove widget:', error.message);
      return false;
    }
    return true;
  };

  const updateLayouts = useCallback(async (layouts) => {
    // layouts is an array of { i, x, y, w, h } from react-grid-layout
    const updates = layouts.map(l => {
      const widget = widgets.find(w => w.id === l.i);
      if (!widget) return null;
      return { id: widget.id, layout: { x: l.x, y: l.y, w: l.w, h: l.h } };
    }).filter(Boolean);

    // Optimistic update
    setWidgets(prev => {
      const updated = prev.map(w => {
        const u = updates.find(u => u.id === w.id);
        return u ? { ...w, layout: u.layout } : w;
      });
      setCachedWidgets(updated);
      return updated;
    });

    if (!navigator.onLine) {
      updates.forEach(u => {
        addToSyncQueue({ type: 'UPDATE', table: 'widgets', payload: { layout: u.layout }, id: u.id });
      });
      return;
    }

    // Batch update
    await Promise.all(
      updates.map(u =>
        supabase
          .from('widgets')
          .update({ layout: u.layout })
          .eq('id', u.id)
      )
    );
  }, [widgets]);

  return {
    widgets,
    loading,
    fetchWidgets,
    addWidget,
    updateWidget,
    removeWidget,
    updateLayouts,
  };
}
