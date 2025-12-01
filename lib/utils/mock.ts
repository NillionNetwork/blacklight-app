import type { Node, NodeMetrics, NodeActivity } from '@/lib/types/node'

// Generate realistic mock metrics based on node age
export function generateMockMetrics(node: Node): NodeMetrics {
  const now = Date.now()
  const ageInHours = (now - node.registeredAt) / (1000 * 60 * 60)

  // More realistic numbers based on how long node has been running
  const baseRequests = Math.floor(ageInHours * 100)
  const totalRequests = baseRequests + Math.floor(Math.random() * 50)
  const successfulRequests = Math.floor(totalRequests * (0.92 + Math.random() * 0.07))
  const failedRequests = totalRequests - successfulRequests

  // Uptime varies based on status
  let uptime = 0
  if (node.status === 'active') {
    uptime = 95 + Math.random() * 5 // 95-100%
  } else if (node.status === 'inactive') {
    uptime = 0
  } else {
    uptime = 60 + Math.random() * 30 // 60-90%
  }

  // Mock earnings (increases over time)
  const totalEarnings = (ageInHours * 0.001).toFixed(4)
  const claimedEarnings = (Number(totalEarnings) * 0.3).toFixed(4)
  const pendingEarnings = (Number(totalEarnings) - Number(claimedEarnings)).toFixed(4)

  return {
    uptime: Math.round(uptime * 100) / 100,
    totalRequests,
    successfulRequests,
    failedRequests,
    successRate: Math.round((successfulRequests / totalRequests) * 10000) / 100,
    earnings: {
      total: totalEarnings,
      pending: pendingEarnings,
      claimed: claimedEarnings,
    },
    performance: {
      avgResponseTime: Math.floor(50 + Math.random() * 150), // 50-200ms
      lastHourRequests: Math.floor(Math.random() * 100),
      last24HoursRequests: Math.floor(Math.random() * 2000),
    },
    lastUpdated: now,
  }
}

// Generate mock activity log
export function generateMockActivity(
  node: Node,
  limit: number = 50
): NodeActivity[] {
  const activities: NodeActivity[] = []
  const now = Date.now()
  const startTime = node.registeredAt

  // Add registration event
  activities.push({
    id: crypto.randomUUID(),
    nodeId: node.id,
    type: 'status_change',
    message: 'Node registered successfully',
    timestamp: startTime,
  })

  // Generate random events between registration and now
  const eventTypes = ['request', 'status_change', 'error', 'action'] as const
  const messages = {
    request: [
      'Processed verification request',
      'Completed proof generation',
      'Validated transaction',
      'Executed computation',
    ],
    status_change: [
      'Node status changed to active',
      'Node went offline',
      'Node reconnected',
      'Health check passed',
    ],
    error: [
      'Connection timeout',
      'Failed to process request',
      'Network error',
      'Rate limit exceeded',
    ],
    action: [
      'Node restarted',
      'Configuration updated',
      'Logs cleared',
      'Cache refreshed',
    ],
  }

  // Generate events
  const numEvents = Math.min(limit - 1, Math.floor((now - startTime) / (1000 * 60 * 30))) // Event every 30min

  for (let i = 0; i < numEvents; i++) {
    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)]
    const typeMessages = messages[type]
    const message = typeMessages[Math.floor(Math.random() * typeMessages.length)]

    // Don't generate too many errors
    if (type === 'error' && Math.random() > 0.1) continue

    activities.push({
      id: crypto.randomUUID(),
      nodeId: node.id,
      type,
      message,
      timestamp: startTime + Math.floor(Math.random() * (now - startTime)),
      metadata: type === 'request' ? {
        duration: Math.floor(Math.random() * 200) + 50,
        success: Math.random() > 0.05,
      } : undefined,
    })
  }

  // Sort by timestamp (newest first)
  return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit)
}

// Generate mock node for testing
export function generateMockNode(
  walletAddress: string,
  platform?: 'linux' | 'mac' | 'windows'
): Omit<Node, 'id'> {
  const statuses = ['active', 'inactive', 'error'] as const
  const status = statuses[Math.floor(Math.random() * statuses.length)]

  return {
    publicKey: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
    platform, // Optional - may be undefined
    walletAddress,
    status,
    registeredAt: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last week
    lastSeen: Date.now() - Math.floor(Math.random() * 60 * 60 * 1000), // Random time in last hour
    metadata: {
      version: '1.0.0',
      location: 'US-East',
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    },
  }
}

// Seed storage with mock nodes for development/testing
export async function seedMockNodes(
  walletAddress: string,
  count: number = 5
): Promise<void> {
  const { createNodeStorage } = await import('./storage')
  const storage = createNodeStorage()

  const platforms: Array<'linux' | 'mac' | 'windows' | undefined> = [
    'linux',
    'mac',
    'windows',
    undefined, // Some nodes without platform
  ]

  for (let i = 0; i < count; i++) {
    const platform = platforms[Math.floor(Math.random() * platforms.length)]
    const mockNode = generateMockNode(walletAddress, platform)
    await storage.createNode(mockNode)
  }
}
