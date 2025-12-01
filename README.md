# NILAV UI - Nillion Verifier Node Manager

Web app that helps users for set up and manage nilAV nodes

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

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

## 🔧 Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Global CSS + Nillion Brand Kit
- Sonner (toasts)
