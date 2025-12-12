'use client';

import { ReactNode } from 'react';

export interface ActivityTimelineProps {
  children: ReactNode;
  /** Optional title for the timeline */
  title?: string;
}

/**
 * Container component for activity timeline
 * Provides consistent spacing and styling for event lists
 *
 * @example
 * <ActivityTimeline title="Recent Activity">
 *   <ActivityEvent {...event1} />
 *   <ActivityEvent {...event2} />
 * </ActivityTimeline>
 */
export function ActivityTimeline({ children, title }: ActivityTimelineProps) {
  return (
    <div style={{ padding: '1.5rem' }}>
      {title && (
        <h3
          style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            marginBottom: '1rem',
            opacity: 0.9,
          }}
        >
          {title}
        </h3>
      )}

      {/* Activity Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {children}
      </div>
    </div>
  );
}
