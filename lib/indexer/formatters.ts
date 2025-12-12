/**
 * Utility functions for formatting indexer data
 */

/**
 * Normalize Conduit timestamp format to JavaScript-parseable ISO 8601
 *
 * Conduit returns timestamps like: "2025-12-12 16:33:18.0 +00:00:00"
 * JavaScript expects: "2025-12-12T16:33:18.0+00:00"
 *
 * @param timestamp - Raw timestamp from Conduit
 * @returns Normalized ISO 8601 timestamp
 */
export function normalizeConduitTimestamp(timestamp: string): string {
  if (!timestamp || typeof timestamp !== 'string') {
    return '';
  }

  let normalized = timestamp.trim();

  // Conduit format: "2025-12-12 16:33:18.0 +00:00:00"
  // Target format: "2025-12-12T16:33:18.0+00:00" (ISO 8601)

  // Extract date, time, and timezone parts
  const match = normalized.match(
    /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2}(?:\.\d+)?)\s+([+-]\d{2}):(\d{2}):(\d{2})$/
  );

  if (match) {
    const [, datePart, timePart, tzHour, tzMin] = match;
    // Reconstruct in ISO 8601 format (drop seconds from timezone)
    normalized = `${datePart}T${timePart}${tzHour}:${tzMin}`;
  } else {
    // Fallback: simple replacements
    normalized = normalized.replace(/\s+([+-]\d{2}):(\d{2}):\d{2}$/, '$1:$2');
    normalized = normalized.replace(' ', 'T');
  }

  return normalized;
}

/**
 * Format a Conduit timestamp to relative time (e.g., "2 hours ago")
 *
 * @param timestamp - Timestamp from Conduit indexer
 * @returns Human-readable relative time string
 *
 * @example
 * formatTimeAgo("2025-12-12 16:33:18.0 +00:00:00")
 * // Returns: "2 hours ago" or "3 days ago" or "Jan 15"
 */
export function formatTimeAgo(timestamp: string): string {
  const normalized = normalizeConduitTimestamp(timestamp);
  const date = new Date(normalized);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Unknown time';
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60)
    return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

  // For older dates, show the actual date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Format a Conduit timestamp to full date string
 *
 * @param timestamp - Timestamp from Conduit indexer
 * @returns Formatted date string
 *
 * @example
 * formatFullDate("2025-12-12 16:33:18.0 +00:00:00")
 * // Returns: "December 12, 2025 at 4:33 PM"
 */
export function formatFullDate(timestamp: string): string {
  const normalized = normalizeConduitTimestamp(timestamp);
  const date = new Date(normalized);

  if (isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return date.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format a Conduit timestamp to short date (e.g., "Jan 15, 2025")
 *
 * @param timestamp - Timestamp from Conduit indexer
 * @returns Short date string
 */
export function formatShortDate(timestamp: string): string {
  const normalized = normalizeConduitTimestamp(timestamp);
  const date = new Date(normalized);

  if (isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
