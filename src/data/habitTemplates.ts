import type { HabitType, HabitScheduleKind, HabitTimeOfDay } from '@/hooks/useHabits';

export type HabitTemplate = {
  key: string;
  name_en: string;
  name_bn: string;
  icon: string;
  color: string;
  type: HabitType;
  target_unit?: string;
  target_value?: number;
  schedule_kind: HabitScheduleKind;
  schedule_days?: number[];
  weekly_count?: number;
  time_of_day: HabitTimeOfDay;
  why_en?: string;
  why_bn?: string;
};

export const HABIT_TEMPLATES: HabitTemplate[] = [
  {
    key: 'water',
    name_en: 'Drink water',
    name_bn: 'পানি পান',
    icon: 'GlassWater',
    color: 'sky',
    type: 'counter',
    target_unit: 'glasses',
    target_value: 8,
    schedule_kind: 'daily',
    time_of_day: 'anytime',
    why_en: 'Stay hydrated for energy and focus.',
    why_bn: 'শরীর হাইড্রেটেড রাখুন।',
  },
  {
    key: 'exercise',
    name_en: 'Exercise',
    name_bn: 'ব্যায়াম',
    icon: 'Dumbbell',
    color: 'rose',
    type: 'duration',
    target_unit: 'minutes',
    target_value: 30,
    schedule_kind: 'weekly_count',
    weekly_count: 5,
    time_of_day: 'morning',
  },
  {
    key: 'read',
    name_en: 'Read',
    name_bn: 'বই পড়া',
    icon: 'BookOpen',
    color: 'amber',
    type: 'duration',
    target_unit: 'minutes',
    target_value: 20,
    schedule_kind: 'daily',
    time_of_day: 'evening',
  },
  {
    key: 'sleep_early',
    name_en: 'Sleep before 11 pm',
    name_bn: 'রাত ১১টার আগে ঘুম',
    icon: 'Moon',
    color: 'indigo',
    type: 'boolean',
    schedule_kind: 'daily',
    time_of_day: 'evening',
  },
  {
    key: 'no_social',
    name_en: 'No social media after 10 pm',
    name_bn: '১০টার পর সোশ্যাল মিডিয়া বন্ধ',
    icon: 'PhoneOff',
    color: 'rose',
    type: 'boolean',
    schedule_kind: 'daily',
    time_of_day: 'evening',
  },
  {
    key: 'walk',
    name_en: 'Walk 8,000 steps',
    name_bn: '৮,০০০ কদম হাঁটা',
    icon: 'Footprints',
    color: 'emerald',
    type: 'counter',
    target_unit: 'steps',
    target_value: 8000,
    schedule_kind: 'daily',
    time_of_day: 'anytime',
  },
  {
    key: 'journal',
    name_en: 'Journal',
    name_bn: 'ডায়েরি লেখা',
    icon: 'NotebookPen',
    color: 'amber',
    type: 'boolean',
    schedule_kind: 'daily',
    time_of_day: 'evening',
  },
  {
    key: 'stretch',
    name_en: 'Stretch',
    name_bn: 'স্ট্রেচিং',
    icon: 'StretchHorizontal',
    color: 'teal',
    type: 'duration',
    target_unit: 'minutes',
    target_value: 10,
    schedule_kind: 'daily',
    time_of_day: 'morning',
  },
  {
    key: 'thesis',
    name_en: 'Thesis & research work',
    name_bn: 'থিসিস ও গবেষণা',
    icon: 'FlaskConical',
    color: 'indigo',
    type: 'duration',
    target_unit: 'minutes',
    target_value: 60,
    schedule_kind: 'weekdays',
    schedule_days: [1, 2, 3, 4, 5],
    time_of_day: 'morning',
  },
  {
    key: 'meditate',
    name_en: 'Meditate',
    name_bn: 'মেডিটেশন',
    icon: 'Brain',
    color: 'teal',
    type: 'duration',
    target_unit: 'minutes',
    target_value: 10,
    schedule_kind: 'daily',
    time_of_day: 'morning',
  },
  {
    key: 'no_sugar',
    name_en: 'No added sugar',
    name_bn: 'অতিরিক্ত চিনি বাদ',
    icon: 'CandyOff',
    color: 'rose',
    type: 'boolean',
    schedule_kind: 'daily',
    time_of_day: 'anytime',
  },
  {
    key: 'language',
    name_en: 'Language practice',
    name_bn: 'ভাষা চর্চা',
    icon: 'Languages',
    color: 'sky',
    type: 'duration',
    target_unit: 'minutes',
    target_value: 15,
    schedule_kind: 'daily',
    time_of_day: 'evening',
  },
];

export const TIME_OF_DAY: { id: HabitTimeOfDay; icon: string }[] = [
  { id: 'morning', icon: 'Sunrise' },
  { id: 'afternoon', icon: 'Sun' },
  { id: 'evening', icon: 'Sunset' },
  { id: 'anytime', icon: 'Clock' },
];