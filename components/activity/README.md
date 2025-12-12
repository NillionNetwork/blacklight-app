# Activity Timeline Components

Reusable components for displaying blockchain event timelines in the NilAV UI.

## Quick Start

Display events in a timeline with just a few lines of code:

```typescript
import { ActivityTimeline, ActivityEvent, getEventConfig } from '@/components/activity';
import { formatTimeAgo } from '@/lib/indexer';

function MyActivityFeed() {
  const events = []; // From your indexer query

  return (
    <ActivityTimeline title="Recent Activity">
      {events.map((event) => {
        const config = getEventConfig('operator_registered');

        return (
          <ActivityEvent
            key={event.tx_hash}
            icon={config.icon}
            title={config.title}
            description={config.descriptionTemplate}
            timeAgo={formatTimeAgo(event.block_timestamp)}
            txHash={event.tx_hash}
            variant={config.variant}
          />
        );
      })}
    </ActivityTimeline>
  );
}
```

## Components

### `<ActivityTimeline>`

Container for activity events. Provides consistent spacing and optional title.

```typescript
<ActivityTimeline title="Recent Activity">
  {/* Event cards go here */}
</ActivityTimeline>
```

### `<ActivityEvent>`

Individual event card with icon, title, description, timestamp, and transaction link.

```typescript
<ActivityEvent
  icon="🎉"                           // Emoji or React component
  title="Node Registered"             // Event type/name
  description="Operator registered"   // Event details
  timeAgo="2 hours ago"              // Formatted timestamp
  txHash="0x..."                     // Transaction hash
  variant="success"                  // Optional: default | success | warning | error
  metadata={[                        // Optional: additional info
    { label: 'Block', value: '1036389' },
    { label: 'Amount', value: '1000 NIL' }
  ]}
/>
```

## Adding New Event Types

### Step 1: Add to Event Config

Edit `eventConfig.ts` and add your event type:

```typescript
export const EVENT_CONFIGS: Record<EventType, EventConfig> = {
  // ... existing events

  my_new_event: {
    icon: '🚀',
    title: 'My Custom Event',
    variant: 'success', // or 'default', 'warning', 'error'
    descriptionTemplate: 'User staked {{amount}} tokens', // Use {{}} for placeholders
  },
};
```

### Step 2: Create Indexer Query (if needed)

Add query function in `lib/indexer/queries.ts`:

```typescript
export interface MyEventData {
  param1: string;
  block_num: number;
  block_timestamp: string;
  tx_hash: string;
}

export async function getMyEvents(
  address: string
): Promise<IndexerResponse<MyEventData>> {
  const query = buildContractEventQuery(
    STAKING_CONTRACT,
    'MyEvent(address,uint256)',
    {
      selectFields: ['topics[2] as param1', 'block_num', 'block_timestamp', 'tx_hash'],
      indexedParams: { address },
      limit: 50,
    }
  );

  return queryIndexer<MyEventData>(query, []);
}
```

### Step 3: Use in Component

```typescript
function MyActivityFeed() {
  const { data } = useQuery({
    queryKey: ['my-events', address],
    queryFn: () => getMyEvents(address),
  });

  const config = getEventConfig('my_new_event');

  return (
    <ActivityTimeline>
      {data?.data?.map((event) => (
        <ActivityEvent
          key={event.tx_hash}
          icon={config.icon}
          title={config.title}
          description={formatEventDescription(config.descriptionTemplate, {
            amount: event.param1, // Replace placeholders
          })}
          timeAgo={formatTimeAgo(event.block_timestamp)}
          txHash={event.tx_hash}
          variant={config.variant}
        />
      ))}
    </ActivityTimeline>
  );
}
```

## Variants

Event cards support 4 visual variants:

- **`default`** - Standard blue/white theme
- **`success`** - Green border (registrations, successful operations)
- **`warning`** - Orange border (deactivations, pending actions)
- **`error`** - Red border (slashing, jailing, failures)

## Available Event Types

Pre-configured event types in `eventConfig.ts`:

### Operator Events
- `operator_registered` 🎉
- `operator_deactivated` ⏸️
- `operator_jailed` 🔒
- `operator_unjailed` 🔓
- `operator_slashed` ⚠️

### Staking Events
- `staked` 💰
- `unstake_requested` ⏳
- `unstaked` 💸

### HTX Verification Events
- `htx_submitted` 📤
- `htx_assigned` 📋
- `htx_responded` ✅

## File Structure

```
components/activity/
├── ActivityFeed.tsx       - Example implementation (operator registration)
├── ActivityEvent.tsx      - Reusable event card component
├── ActivityTimeline.tsx   - Timeline container component
├── eventConfig.ts         - Event type configurations
├── index.ts               - Public exports
└── README.md              - This file
```

## Helper Functions

### `getEventConfig(eventType)`

Get pre-configured icon, title, variant, and description template for an event type.

```typescript
const config = getEventConfig('operator_registered');
// { icon: '🎉', title: 'Node Registered', ... }
```

### `formatEventDescription(template, data)`

Replace placeholders in description templates with actual data.

```typescript
const description = formatEventDescription(
  'Staked {{amount}} tokens to {{operator}}',
  { amount: '1000', operator: '0x...' }
);
// Returns: "Staked 1000 tokens to 0x..."
```

## Examples

See `ActivityFeed.tsx` for a working example of:
- Fetching events with React Query
- Using event configs
- Formatting timestamps
- Displaying events in a timeline

## Best Practices

1. **Always use `formatTimeAgo()`** for timestamps - it handles Conduit's non-standard format
2. **Define event types in `eventConfig.ts`** - centralized configuration
3. **Use variants consistently** - success for positive events, error for negative
4. **Include metadata** for important details (block numbers, amounts, addresses)
5. **Keep descriptions concise** - 1-2 lines maximum
6. **Use emoji icons** - they're simple and work everywhere

## Related Documentation

- `lib/indexer/INTEGRATION_GUIDE.md` - Full indexer integration guide
- `lib/indexer/formatters.ts` - Timestamp formatting utilities
- `lib/indexer/queries.ts` - Example query functions
