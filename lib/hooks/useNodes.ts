import { useState, useEffect, useCallback } from 'react'
import { useAppKitAccount } from '@reown/appkit/react'
import { apiClient } from '@/lib/api/client'
import type { Node } from '@/lib/types/node'

export function useNodes() {
  const { address, isConnected } = useAppKitAccount()
  const [nodes, setNodes] = useState<Node[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadNodes = useCallback(async () => {
    if (!address || !isConnected) {
      setNodes([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await apiClient.getNodes(address)
      setNodes(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [address, isConnected])

  useEffect(() => {
    loadNodes()
  }, [loadNodes])

  const registerNode = async (data: {
    publicKey: string
    platform?: 'linux' | 'mac' | 'windows'
  }) => {
    if (!address) throw new Error('Wallet not connected')

    const node = await apiClient.registerNode({
      ...data,
      walletAddress: address,
    })

    setNodes((prev) => [...prev, node])
    return node
  }

  const deleteNode = async (nodeId: string) => {
    await apiClient.deleteNode(nodeId)
    setNodes((prev) => prev.filter((n) => n.id !== nodeId))
  }

  return {
    nodes,
    loading,
    error,
    registerNode,
    deleteNode,
    refresh: loadNodes,
  }
}
