import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api/client'
import type { Node, NodeMetrics, NodeActivity } from '@/lib/types/node'

export function useNodeDetails(nodeId: string) {
  const [node, setNode] = useState<Node | null>(null)
  const [metrics, setMetrics] = useState<NodeMetrics | null>(null)
  const [activity, setActivity] = useState<NodeActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadNodeData = useCallback(async () => {
    if (!nodeId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Load node details, metrics, and activity in parallel
      const [nodeData, metricsData, activityData] = await Promise.all([
        apiClient.getNode(nodeId),
        apiClient.getNodeMetrics(nodeId),
        apiClient.getNodeActivity(nodeId, 50),
      ])

      setNode(nodeData)
      setMetrics(metricsData)
      setActivity(activityData)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [nodeId])

  useEffect(() => {
    loadNodeData()
  }, [loadNodeData])

  const performAction = async (action: 'start' | 'stop' | 'restart') => {
    if (!nodeId) return

    await apiClient.performNodeAction(nodeId, action)

    // Reload node data after action
    await loadNodeData()
  }

  const deleteNode = async () => {
    if (!nodeId) return
    await apiClient.deleteNode(nodeId)
  }

  return {
    node,
    metrics,
    activity,
    loading,
    error,
    performAction,
    deleteNode,
    refresh: loadNodeData,
  }
}
