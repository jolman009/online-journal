import { lazy } from 'react';

const WidgetRegistry = {
  streak: {
    component: lazy(() => import('./StreakWidget')),
    label: 'Streak Counter',
    description: 'Animated current & longest streak with total entries',
    defaultSize: { w: 2, h: 2 },
  },
  mood_chart: {
    component: lazy(() => import('./MoodChartWidget')),
    label: 'Mood Chart',
    description: 'Line or bar chart of your mood trends over time',
    defaultSize: { w: 2, h: 2 },
  },
  daily_prompt: {
    component: lazy(() => import('./DailyPromptWidget')),
    label: 'Daily Prompt',
    description: 'Random journaling prompt to inspire your writing',
    defaultSize: { w: 2, h: 2 },
  },
  goal_tracker: {
    component: lazy(() => import('./GoalTrackerWidget')),
    label: 'Goal Tracker',
    description: 'Progress ring showing entries this week vs your goal',
    defaultSize: { w: 2, h: 2 },
  },
  quick_stats: {
    component: lazy(() => import('./QuickStatsWidget')),
    label: 'Quick Stats',
    description: 'Configurable stat cards: entries, todos, mood, and more',
    defaultSize: { w: 2, h: 2 },
  },
  todos: {
    component: lazy(() => import('./TodosMiniWidget')),
    label: 'Pending Todos',
    description: 'Your top pending todos with quick access',
    defaultSize: { w: 2, h: 2 },
  },
  recent_entries: {
    component: lazy(() => import('./RecentEntriesWidget')),
    label: 'Recent Entries',
    description: 'Your most recent journal entries at a glance',
    defaultSize: { w: 2, h: 2 },
  },
};

export default WidgetRegistry;
