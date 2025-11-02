import { UUID } from '../../types';
import { DashboardSummaryDto, RecentReportDto } from '../../types';

/**
 * View model for category card display with formatted and computed data
 */
export interface CategoryCardViewModel {
  // Identity
  id: UUID;
  name: string;

  // Display data
  icon: string;
  color: string;
  colorClass: string;

  // Activity metrics
  noteCount: number;
  dailyGoal: number;
  progressPercent: number;

  // Metadata
  isActive: boolean;
  lastNote?: {
    date: string;
    title?: string;
  };
}

/**
 * Streak information for display
 */
export interface StreakData {
  days: number;
  lastNoteDate?: string;
  isCurrentDay?: boolean;
  bestStreak?: number;
}

/**
 * Pagination and infinite scroll state for report history
 */
export interface ReportPaginationState {
  items: RecentReportDto[];
  total: number;
  pageSize: number;
  currentPage: number;
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Report data formatted for display
 */
export interface FormattedReportItem extends RecentReportDto {
  formattedDate: string;
  relativeTime: string;
  generatedByLabel: string;
  generatedByBadgeColor: string;
}

/**
 * Dashboard loading states
 */
export enum DashboardLoadingState {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}

/**
 * Category color and icon mapping
 */
export const CATEGORY_COLOR_MAP: Record<
  string,
  { color: string; colorHex: string; icon: string }
> = {
  family: { color: 'bg-red-500', colorHex: '#FF6B6B', icon: 'home' },
  friends: { color: 'bg-cyan-500', colorHex: '#4ECDC4', icon: 'team' },
  pets: { color: 'bg-yellow-500', colorHex: '#FFD93D', icon: 'appstore' },
  body: { color: 'bg-green-500', colorHex: '#6BCB77', icon: 'heart' },
  mind: { color: 'bg-blue-500', colorHex: '#4D96FF', icon: 'brain' },
  passions: { color: 'bg-pink-500', colorHex: '#FF6BCB', icon: 'fire' },
};

/**
 * Utility function to get color mapping for a category name
 */
export function getCategoryColorMapping(categoryName: string): {
  color: string;
  colorHex: string;
  icon: string;
} {
  const name = categoryName.toLowerCase();
  return CATEGORY_COLOR_MAP[name] || CATEGORY_COLOR_MAP['family'];
}

/**
 * Utility function to validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Utility function to format ISO date string for display
 */
export function formatReportDate(isoDateString: string): {
  formatted: string;
  relative: string;
} {
  try {
    const date = new Date(isoDateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Format absolute date
    const formatted = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);

    // Calculate relative time
    let relative = formatted;
    if (diffDays === 0) {
      relative = 'Today';
    } else if (diffDays === 1) {
      relative = 'Yesterday';
    } else if (diffDays < 7) {
      relative = `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      relative = `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    }

    return { formatted, relative };
  } catch (error) {
    console.error('Error formatting date:', isoDateString, error);
    return { formatted: isoDateString, relative: isoDateString };
  }
}

/**
 * Utility function to validate ISO 8601 datetime string
 */
export function isValidISO8601(dateString: string): boolean {
  try {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  } catch {
    return false;
  }
}

/**
 * Utility function to validate IANA timezone
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Utility function to validate past or today date in YYYY-MM-DD format
 */
export function isValidPastDate(dateString: string): boolean {
  // Check format YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  const today = new Date();

  // Set both to midnight for comparison
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  // Date must be in the past or today
  return !isNaN(date.getTime()) && date <= today;
}
