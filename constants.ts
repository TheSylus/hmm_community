
import { GroceryCategory } from './types';

export const CATEGORY_COLORS: Record<GroceryCategory, { bg: string, text: string, border: string, icon: string }> = {
  produce: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-100',
    icon: 'text-emerald-600'
  },
  bakery: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-100',
    icon: 'text-amber-600'
  },
  meat_fish: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-100',
    icon: 'text-rose-600'
  },
  dairy_eggs: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-100',
    icon: 'text-blue-600'
  },
  pantry: {
    bg: 'bg-stone-50',
    text: 'text-stone-700',
    border: 'border-stone-100',
    icon: 'text-stone-600'
  },
  frozen: {
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    border: 'border-cyan-100',
    icon: 'text-cyan-600'
  },
  snacks: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-100',
    icon: 'text-purple-600'
  },
  beverages: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-100',
    icon: 'text-indigo-600'
  },
  household: {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-100',
    icon: 'text-slate-600'
  },
  personal_care: {
    bg: 'bg-pink-50',
    text: 'text-pink-700',
    border: 'border-pink-100',
    icon: 'text-pink-600'
  },
  restaurant_food: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-100',
    icon: 'text-orange-600'
  },
  other: {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-100',
    icon: 'text-gray-600'
  }
};

export const CATEGORY_COLORS_DARK: Record<GroceryCategory, { bg: string, text: string, border: string, icon: string }> = {
  produce: {
    bg: 'dark:bg-emerald-900/30',
    text: 'dark:text-emerald-300',
    border: 'dark:border-emerald-800/50',
    icon: 'dark:text-emerald-400'
  },
  bakery: {
    bg: 'dark:bg-amber-900/30',
    text: 'dark:text-amber-300',
    border: 'dark:border-amber-800/50',
    icon: 'dark:text-amber-400'
  },
  meat_fish: {
    bg: 'dark:bg-rose-900/30',
    text: 'dark:text-rose-300',
    border: 'dark:border-rose-800/50',
    icon: 'dark:text-rose-400'
  },
  dairy_eggs: {
    bg: 'dark:bg-blue-900/30',
    text: 'dark:text-blue-300',
    border: 'dark:border-blue-800/50',
    icon: 'dark:text-blue-400'
  },
  pantry: {
    bg: 'dark:bg-stone-800/50',
    text: 'dark:text-stone-300',
    border: 'dark:border-stone-700/50',
    icon: 'dark:text-stone-400'
  },
  frozen: {
    bg: 'dark:bg-cyan-900/30',
    text: 'dark:text-cyan-300',
    border: 'dark:border-cyan-800/50',
    icon: 'dark:text-cyan-400'
  },
  snacks: {
    bg: 'dark:bg-purple-900/30',
    text: 'dark:text-purple-300',
    border: 'dark:border-purple-800/50',
    icon: 'dark:text-purple-400'
  },
  beverages: {
    bg: 'dark:bg-indigo-900/30',
    text: 'dark:text-indigo-300',
    border: 'dark:border-indigo-800/50',
    icon: 'dark:text-indigo-400'
  },
  household: {
    bg: 'dark:bg-slate-800/50',
    text: 'dark:text-slate-300',
    border: 'dark:border-slate-700/50',
    icon: 'dark:text-slate-400'
  },
  personal_care: {
    bg: 'dark:bg-pink-900/30',
    text: 'dark:text-pink-300',
    border: 'dark:border-pink-800/50',
    icon: 'dark:text-pink-400'
  },
  restaurant_food: {
    bg: 'dark:bg-orange-900/30',
    text: 'dark:text-orange-300',
    border: 'dark:border-orange-800/50',
    icon: 'dark:text-orange-400'
  },
  other: {
    bg: 'dark:bg-gray-800/50',
    text: 'dark:text-gray-300',
    border: 'dark:border-gray-700/50',
    icon: 'dark:text-gray-400'
  }
};
