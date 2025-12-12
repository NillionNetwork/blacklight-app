/**
 * Event type configurations for activity timeline
 * Maps event types to their display properties (icons, titles, etc.)
 */

export type EventType =
  | 'operator_registered'
  | 'operator_deactivated'
  | 'staked'
  | 'unstake_requested'
  | 'unstaked'
  | 'operator_jailed'
  | 'operator_unjailed'
  | 'operator_slashed'
  | 'htx_submitted'
  | 'htx_assigned'
  | 'htx_responded';

export interface EventConfig {
  icon: string;
  title: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
  /** Template for description - can include placeholders like {{address}}, {{amount}} */
  descriptionTemplate: string;
}

/**
 * Event type configurations
 * Add new event types here to automatically get proper styling
 */
export const EVENT_CONFIGS: Record<EventType, EventConfig> = {
  // Operator events
  operator_registered: {
    icon: '🎉',
    title: 'Node Registered',
    variant: 'success',
    descriptionTemplate: 'Operator registered on Nilav network',
  },
  operator_deactivated: {
    icon: '⏸️',
    title: 'Node Deactivated',
    variant: 'warning',
    descriptionTemplate: 'Operator deactivated',
  },
  operator_jailed: {
    icon: '🔒',
    title: 'Node Jailed',
    variant: 'error',
    descriptionTemplate: 'Operator jailed by governance',
  },
  operator_unjailed: {
    icon: '🔓',
    title: 'Node Unjailed',
    variant: 'success',
    descriptionTemplate: 'Operator unjailed and reactivated',
  },
  operator_slashed: {
    icon: '⚠️',
    title: 'Stake Slashed',
    variant: 'error',
    descriptionTemplate: 'Stake slashed by {{amount}} tokens',
  },

  // Staking events
  staked: {
    icon: '💰',
    title: 'Tokens Staked',
    variant: 'success',
    descriptionTemplate: 'Staked {{amount}} tokens to operator',
  },
  unstake_requested: {
    icon: '⏳',
    title: 'Unstake Requested',
    variant: 'default',
    descriptionTemplate: 'Requested to unstake {{amount}} tokens',
  },
  unstaked: {
    icon: '💸',
    title: 'Tokens Unstaked',
    variant: 'default',
    descriptionTemplate: 'Withdrew {{amount}} tokens',
  },

  // HTX verification events
  htx_submitted: {
    icon: '📤',
    title: 'HTX Submitted',
    variant: 'default',
    descriptionTemplate: 'HTX submitted for verification',
  },
  htx_assigned: {
    icon: '📋',
    title: 'HTX Assigned',
    variant: 'default',
    descriptionTemplate: 'Assigned to verify HTX {{htxId}}',
  },
  htx_responded: {
    icon: '✅',
    title: 'HTX Verified',
    variant: 'success',
    descriptionTemplate: 'Responded to HTX verification',
  },
};

/**
 * Get event configuration by type
 */
export function getEventConfig(eventType: EventType): EventConfig {
  return EVENT_CONFIGS[eventType];
}

/**
 * Format event description with dynamic data
 * Replaces placeholders like {{amount}}, {{address}}, etc.
 */
export function formatEventDescription(
  template: string,
  data: Record<string, string | number>
): string {
  let result = template;

  Object.entries(data).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  });

  return result;
}
