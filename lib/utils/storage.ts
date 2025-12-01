import type { Node } from '@/lib/types/node'
import mockNodesData from '@/lib/data/mock-nodes.json'

// Storage interface - both mock and real will implement this
export interface INodeStorage {
  getAllNodes(walletAddress: string): Promise<Node[]>
  getNode(nodeId: string): Promise<Node | null>
  createNode(node: Omit<Node, 'id'>): Promise<Node>
  updateNode(nodeId: string, updates: Partial<Node>): Promise<Node>
  deleteNode(nodeId: string): Promise<boolean>
}

// In-memory storage implementation (no localStorage)
// Data resets on page refresh - seeded from mock JSON
export class InMemoryNodeStorage implements INodeStorage {
  private static instance: InMemoryNodeStorage
  private data: Record<string, Node[]> = {}
  private mockData = mockNodesData as Record<string, Node[]>
  private initialized = false

  constructor() {
    // Singleton pattern to maintain state across multiple instances
    if (InMemoryNodeStorage.instance) {
      return InMemoryNodeStorage.instance
    }
    InMemoryNodeStorage.instance = this
  }

  private initializeData(): void {
    if (!this.initialized) {
      // Deep copy mock data to prevent mutations
      this.data = JSON.parse(JSON.stringify(this.mockData))
      this.initialized = true
    }
  }

  async getAllNodes(walletAddress: string): Promise<Node[]> {
    this.initializeData()
    const walletKey = walletAddress.toLowerCase()

    // Check for case-insensitive match in data
    const dataKey = Object.keys(this.data).find(
      key => key.toLowerCase() === walletKey
    )

    // If wallet has data, return it
    if (dataKey) {
      return this.data[dataKey]
    }

    // Otherwise, return mock data for any wallet (for demo purposes)
    // Use the first available mock data key
    const firstMockKey = Object.keys(this.data)[0]
    if (firstMockKey) {
      // Clone the nodes and update wallet addresses to match current wallet
      return this.data[firstMockKey].map(node => ({
        ...node,
        walletAddress: walletAddress,
      }))
    }

    return []
  }

  async getNode(nodeId: string): Promise<Node | null> {
    this.initializeData()
    for (const nodes of Object.values(this.data)) {
      const node = nodes.find((n) => n.id === nodeId)
      if (node) return node
    }
    return null
  }

  async createNode(node: Omit<Node, 'id'>): Promise<Node> {
    this.initializeData()
    const walletKey = node.walletAddress.toLowerCase()

    const newNode: Node = {
      ...node,
      id: crypto.randomUUID(),
      registeredAt: Date.now(),
      lastSeen: Date.now(),
    }

    if (!this.data[walletKey]) {
      this.data[walletKey] = []
    }
    this.data[walletKey].push(newNode)

    return newNode
  }

  async updateNode(nodeId: string, updates: Partial<Node>): Promise<Node> {
    this.initializeData()

    for (const walletKey in this.data) {
      const nodeIndex = this.data[walletKey].findIndex((n) => n.id === nodeId)
      if (nodeIndex !== -1) {
        this.data[walletKey][nodeIndex] = {
          ...this.data[walletKey][nodeIndex],
          ...updates,
        }
        return this.data[walletKey][nodeIndex]
      }
    }

    throw new Error('Node not found')
  }

  async deleteNode(nodeId: string): Promise<boolean> {
    this.initializeData()

    for (const walletKey in this.data) {
      const nodeIndex = this.data[walletKey].findIndex((n) => n.id === nodeId)
      if (nodeIndex !== -1) {
        this.data[walletKey].splice(nodeIndex, 1)
        return true
      }
    }

    return false
  }
}

// Factory function - swap this later to use contract storage
export function createNodeStorage(): INodeStorage {
  // NOW: In-memory storage (no localStorage)
  // LATER: return new ContractNodeStorage(contractAddress)
  return new InMemoryNodeStorage()
}
