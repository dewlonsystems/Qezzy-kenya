// src/utils/categorySlug.ts
const CATEGORY_NAME_TO_SLUG: Record<string, string> = {
  'Rivers and water resources': 'rivers',
  'Health and wellness': 'health',
  'Transportation and commuting': 'transport',
  'Environment and climate awareness': 'environment',
  'Nutrition and eating habits': 'nutrition',
  'Mental health and wellbeing': 'mental-health',
  'Technology and mobile phone usage': 'tech',
  'Banking and mobile money usage': 'finance',
  'Education and learning experiences': 'education',
  // Add more as you create categories in admin
};

export const getCategorySlug = (name: string): string => {
  return CATEGORY_NAME_TO_SLUG[name] || 'other';
};