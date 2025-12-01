# NILAV UI Development Plan

## ✅ Completed (Phase 1-3)
- Multi-step setup wizard (Steps 0-4)
- SIWX authentication integration
- Nillion brand design implementation
- Responsive navbar with AppKit components

---

## 🚧 Current Sprint: Pre-Contract Development (Week of Dec 1)

**Goal**: Build complete UI/UX with mock data layer, ready to connect real contracts later

### 1. Mock Data Layer
**Priority: HIGH** - Foundation for everything else

- [ ] Create mock API using Next.js API routes
  - `POST /api/nodes/register` - Mock node registration (save to localStorage)
  - `GET /api/nodes` - Get user's registered nodes
  - `GET /api/nodes/:id` - Get single node details
  - `GET /api/nodes/:id/metrics` - Get node metrics (uptime, requests, etc)
  - `POST /api/nodes/:id/action` - Mock start/stop/restart actions

- [ ] Define TypeScript types/interfaces
  ```typescript
  interface Node {
    id: string
    publicKey: string
    platform: 'linux' | 'mac' | 'windows'
    walletAddress: string
    status: 'active' | 'inactive' | 'error'
    registeredAt: number
    lastSeen?: number
    metrics?: NodeMetrics
  }

  interface NodeMetrics {
    uptime: number // percentage
    totalRequests: number
    successRate: number
    earnings: string // mock ETH amount
  }
  ```

- [ ] localStorage management utilities
  - Store nodes by wallet address
  - Persist across sessions
  - Clear on disconnect

### 2. Dashboard Page (`/dashboard`)
**Priority: HIGH** - Main post-setup experience

- [ ] Create `/app/dashboard/page.tsx`
- [ ] Node cards grid layout
  - Show all registered nodes
  - Status indicators (green dot = active, red = inactive, yellow = error)
  - Platform icon
  - Public key (truncated)
  - Quick actions: View Details, Restart, Delete

- [ ] Empty state
  - Show when no nodes registered
  - CTA to go to /setup

- [ ] Header with stats
  - Total nodes
  - Active nodes
  - Total earnings (mock)

- [ ] Filter/sort options
  - By status
  - By platform
  - By registration date

### 3. Node Details Page (`/dashboard/[nodeId]`)
**Priority: MEDIUM** - Detailed node view

- [ ] Create `/app/dashboard/[nodeId]/page.tsx`
- [ ] Node information card
  - Full public key (with copy button)
  - Platform
  - Status with live indicator
  - Registration timestamp
  - Last seen timestamp

- [ ] Metrics visualization
  - Uptime percentage (circular progress)
  - Total requests processed
  - Success rate
  - Mock earnings graph (line chart using simple CSS)

- [ ] Action buttons
  - Start/Stop/Restart (with confirmation modals)
  - Delete node (with warning)
  - Export logs (mock CSV download)

- [ ] Activity log (mock data)
  - Recent requests/events
  - Status changes
  - Errors

### 4. Complete Setup Flow Integration
**Priority: HIGH** - Connect setup to dashboard

- [ ] Update `handleComplete` in `/app/setup/page.tsx`
  - Call mock API to register node
  - Show success toast
  - Redirect to dashboard
  - Show success modal with next steps

- [ ] Add success state/page
  - Celebration UI
  - "View Dashboard" button
  - "Setup Another Node" option

- [ ] Error handling
  - If registration fails
  - Network errors
  - Validation errors

### 5. Navigation & Layout
**Priority: MEDIUM** - Better app structure

- [ ] Update navbar
  - Add "Dashboard" link (only show when connected)
  - Add "Setup" link
  - Active route highlighting

- [ ] Breadcrumbs on dashboard pages
  - Dashboard > Node Details
  - Dashboard > Settings

- [ ] Side navigation (optional)
  - Dashboard
  - Setup New Node
  - Settings
  - Help

### 6. Settings Page (`/settings`)
**Priority: LOW** - User preferences

- [ ] Create `/app/settings/page.tsx`
- [ ] User preferences
  - Notifications (toggle)
  - Default platform
  - Theme preferences (just dark for now)

- [ ] Connected wallet info
  - Address
  - Network
  - Disconnect button

- [ ] Danger zone
  - Clear all data
  - Export data

### 7. Polish & UX Improvements
**Priority: MEDIUM** - Make it feel production-ready

- [ ] Loading states
  - Skeleton loaders for dashboard cards
  - Spinner during API calls
  - Optimistic UI updates

- [ ] Error states
  - Network errors
  - Empty states
  - 404 page
  - Error boundary

- [ ] Animations
  - Page transitions
  - Card hover effects
  - Button interactions
  - Toast animations

- [ ] Accessibility
  - Keyboard navigation
  - Focus indicators
  - ARIA labels
  - Screen reader testing

### 8. Mobile Optimization
**Priority: MEDIUM** - Ensure mobile works great

- [ ] Test all pages on mobile
- [ ] Responsive dashboard grid
- [ ] Mobile-friendly modals
- [ ] Touch-friendly buttons
- [ ] Hamburger menu for nav

### 9. Documentation
**Priority: LOW** - Help users understand the app

- [ ] Create `/app/help/page.tsx`
- [ ] FAQ section
- [ ] Setup guide
- [ ] Troubleshooting
- [ ] Link to Nillion docs

---

## 📦 Future: Contract Integration (Week of Dec 8+)

Once smart contracts are ready:

1. Replace mock API with real contract calls
2. Use wagmi hooks for contract interactions
3. Transaction signing & confirmation flows
4. Real metrics from verifier registry
5. Actual on-chain node status
6. Real earnings tracking

---

## 🎯 This Week's Focus (Recommended Order)

**Day 1-2: Foundation**
1. Mock data layer & API routes
2. TypeScript types
3. localStorage utilities

**Day 3-4: Dashboard**
4. Dashboard page with node cards
5. Empty state
6. Basic filtering

**Day 5: Integration**
7. Connect setup to mock API
8. Success flow
9. Error handling

**Day 6-7: Polish**
10. Node details page
11. Loading states
12. Mobile optimization

---

## 💡 Questions to Clarify

1. **Node Metrics**: What metrics should we display? (uptime, requests, earnings, etc.)
2. **Multiple Nodes**: Can users run multiple nodes? If so, how many max?
3. **Node Actions**: Should users be able to stop/restart from UI, or is that handled by the binary?
4. **Earnings**: Will there be a rewards/earnings system? Should we mock this?
5. **Platform Differences**: Do Linux/Mac/Windows nodes behave differently in the UI?

---

## 🚀 Ready to Start?

**Next immediate task**: Set up mock data layer with API routes and TypeScript types. This will unblock all dashboard development.

Shall we start with creating the mock API and data structures?
