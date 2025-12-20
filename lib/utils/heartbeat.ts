/**
 * HeartbeatManager Utility Functions
 *
 * Helper functions for working with HeartbeatManager events and data.
 * These utilities help display verdicts, statuses, and outcomes in the UI.
 */

// =============================================================================
// Verdict Utilities (Valid/Invalid/Error)
// =============================================================================

/**
 * Get human-readable label for verdict code
 *
 * @param verdict - Verdict code from OperatorVoted event
 * @returns Verdict label (Valid/Invalid/Error/Unknown)
 */
export function getVerdictLabel(verdict: number): string {
  switch (verdict) {
    case 1: return 'Valid';
    case 2: return 'Invalid';
    case 3: return 'Error';
    default: return 'Unknown';
  }
}

/**
 * Get icon/emoji for verdict code
 *
 * @param verdict - Verdict code from OperatorVoted event
 * @returns Icon representing the verdict
 */
export function getVerdictIcon(verdict: number): string {
  switch (verdict) {
    case 1: return '✓';
    case 2: return '✗';
    case 3: return '⚠';
    default: return '?';
  }
}

/**
 * Get color variant for verdict code
 *
 * @param verdict - Verdict code from OperatorVoted event
 * @returns Color variant (success/danger/warning/default)
 */
export function getVerdictColor(verdict: number): string {
  switch (verdict) {
    case 1: return 'success';
    case 2: return 'danger';
    case 3: return 'warning';
    default: return 'default';
  }
}

// =============================================================================
// Heartbeat Status Utilities
// =============================================================================

/**
 * Get human-readable label for heartbeat status code
 *
 * @param status - Status code from HeartbeatStatusChanged event
 * @returns Status label (None/Pending/Verified/Invalid/Expired/Unknown)
 */
export function getHeartbeatStatusLabel(status: number): string {
  switch (status) {
    case 0: return 'None';
    case 1: return 'Pending';
    case 2: return 'Verified';
    case 3: return 'Invalid';
    case 4: return 'Expired';
    default: return 'Unknown';
  }
}

/**
 * Get color variant for heartbeat status code
 *
 * @param status - Status code from HeartbeatStatusChanged event
 * @returns Color variant (default/warning/success/danger/muted/unknown)
 */
export function getHeartbeatStatusColor(status: number): string {
  switch (status) {
    case 0: return 'default';
    case 1: return 'warning';
    case 2: return 'success';
    case 3: return 'danger';
    case 4: return 'muted';
    default: return 'unknown';
  }
}

// =============================================================================
// Round Outcome Utilities
// =============================================================================

/**
 * Get human-readable label for round outcome code
 *
 * @param outcome - Outcome code from RoundFinalized event
 * @returns Outcome label (Inconclusive/Valid Threshold Reached/Invalid Threshold Reached/Unknown)
 */
export function getOutcomeLabel(outcome: number): string {
  switch (outcome) {
    case 0: return 'Inconclusive';
    case 1: return 'Valid Threshold Reached';
    case 2: return 'Invalid Threshold Reached';
    default: return 'Unknown';
  }
}

/**
 * Get short outcome label for compact UI display
 *
 * @param outcome - Outcome code from RoundFinalized event
 * @returns Short outcome label (Inconclusive/Valid/Invalid/Unknown)
 */
export function getOutcomeLabelShort(outcome: number): string {
  switch (outcome) {
    case 0: return 'Inconclusive';
    case 1: return 'Valid';
    case 2: return 'Invalid';
    default: return 'Unknown';
  }
}

/**
 * Get color variant for round outcome code
 *
 * @param outcome - Outcome code from RoundFinalized event
 * @returns Color variant (warning/success/danger/default)
 */
export function getOutcomeColor(outcome: number): string {
  switch (outcome) {
    case 0: return 'warning';
    case 1: return 'success';
    case 2: return 'danger';
    default: return 'default';
  }
}

// =============================================================================
// Formatting Utilities
// =============================================================================

/**
 * Format stake weight for display
 *
 * @param weight - Weight as string (raw token amount with decimals)
 * @param tokenDecimals - Token decimals (default: 6 for NIL token)
 * @param displayDecimals - Number of decimals to display (default: 2)
 * @returns Formatted weight string
 */
export function formatStakeWeight(
  weight: string,
  tokenDecimals: number = 6,
  displayDecimals: number = 2
): string {
  try {
    const weightBigInt = BigInt(weight);
    const divisor = BigInt(10 ** tokenDecimals);
    const integerPart = weightBigInt / divisor;
    const fractionalPart = weightBigInt % divisor;

    const fractionalStr = fractionalPart.toString().padStart(tokenDecimals, '0');
    const truncatedFractional = fractionalStr.slice(0, displayDecimals);

    if (truncatedFractional === '0'.repeat(displayDecimals)) {
      return integerPart.toString();
    }

    return `${integerPart}.${truncatedFractional}`;
  } catch (error) {
    console.error('[formatStakeWeight] Error formatting weight:', error);
    return weight;
  }
}

/**
 * Truncate heartbeat key for display
 *
 * @param heartbeatKey - Full heartbeat key (bytes32)
 * @param startChars - Number of characters to show at start (default: 8)
 * @param endChars - Number of characters to show at end (default: 6)
 * @returns Truncated heartbeat key (e.g., "0x1234...5678")
 */
export function truncateHeartbeatKey(
  heartbeatKey: string,
  startChars: number = 8,
  endChars: number = 6
): string {
  if (!heartbeatKey || heartbeatKey.length <= startChars + endChars) {
    return heartbeatKey;
  }

  return `${heartbeatKey.slice(0, startChars)}...${heartbeatKey.slice(-endChars)}`;
}
