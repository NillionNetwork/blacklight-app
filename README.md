# Blacklight UI

Web app that helps users for set up and manage nilUV nodes and interact with Blacklight contracts.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Visit [http://localhost:4269](http://localhost:4269)

## 🎨 Components

All components in `components/ui/`:

| Component       | Usage                                             |
| --------------- | ------------------------------------------------- |
| Button          | `<Button variant="outline">Click</Button>`        |
| Card            | `<Card>Content</Card>`                            |
| Input           | `<Input required validateEmail />`                |
| Label           | `<Label htmlFor="id">Label</Label>`               |
| Select          | `<Select options={[...]} />`                      |
| Modal           | `<Modal isOpen={open} onClose={...}>`             |
| Spinner         | `<Spinner size="large" />`                        |
| ErrorMessage    | `<ErrorMessage message="..." onRetry={...} />`    |
| Badge           | `<Badge variant="success">Active</Badge>`         |
| LoadingSkeleton | `<LoadingSkeleton width="300px" height="20px" />` |

**Toasts:** `toast.success('Message')` (uses [sonner](https://sonner.emilkowal.ski/))

**Component Showcase:** Visit `/components-test`

## 🛠️ Styling

**All styles go in `app/globals.css`**

✅ DO:

- Use Nillion CSS variables (`var(--nillion-primary)`)
- Use `.nillion-*` classes from brand kit
- Create reusable components

❌ DON'T:

- Use Tailwind, styled-jsx, or CSS-in-JS
- Add light mode styles (dark only)

## 📝 Adding Components

1. Create `components/ui/MyComponent.tsx`
2. Add styles to `app/globals.css`
3. Export in `components/ui/index.ts`
4. Test in `/components-test`

Example:

```typescript
// components/ui/MyComponent.tsx
export function MyComponent({ ...props }) {
  return <div className="my-component">Content</div>;
}
```

```css
/* app/globals.css */
.my-component {
  /* styles */
}
```

## 🔐 Authentication Pattern

Pages handle their own authentication using **authenticated views**, not route groups:

```typescript
'use client';

import { useAppKitAccount } from '@reown/appkit/react';
import { ConnectWallet } from '@/components/auth';

export default function NodesPage() {
  const { address, isConnected } = useAppKitAccount();

  // Show connect wallet view if not connected
  if (!isConnected) {
    return (
      <div>
        <h1>Node Dashboard</h1>
        <p>Connect your wallet to view your staked verifier nodes</p>
        <ConnectWallet />
      </div>
    );
  }

  // Show authenticated content
  return <div>Your nodes for {address}</div>;
}
```

**Pattern:**

- Check `isConnected` at the top of your page component
- Return early with `<ConnectWallet />` component if not connected
- User stays at the URL (no redirects)
- Can show partial content to non-authenticated users

**Why authenticated views over route groups?**

- Simpler - no `(authenticated)` folder structure needed
- More flexible - each page controls its own auth requirements
- Better UX - users see what's at the URL before connecting wallet

## 🔧 Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Global CSS + Nillion Brand Kit
- Sonner (toasts)
- Reown AppKit (wallet connection)
- wagmi + viem (Web3 integration)

## 🔍 Indexer

Query blockchain events using Server Actions (secure, no SQL injection).

**Complete docs:** **[lib/indexer/README.md](./lib/indexer/README.md)**

**Quick example:**

```typescript
import { getHTXAssignments } from '@/lib/indexer';

// Client component: use with useQuery
// Server component: call directly
const data = await getHTXAssignments(nodeAddress, undefined, 25);
```
