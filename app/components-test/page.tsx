"use client";

import { useState } from 'react';
import { toast } from 'sonner';
import { useAppKitAccount } from '@reown/appkit/react';
import {
  Button,
  Card,
  Input,
  Label,
  Modal,
  Select,
  Spinner,
  ErrorMessage,
  Badge,
  LoadingSkeleton,
} from '@/components/ui';
import { TokenBalance } from '@/components/wallet';

export default function ComponentsTest() {
  const { address, isConnected } = useAppKitAccount();
  const [modalOpen, setModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState('option1');

  // Demo address for testing when not connected
  const demoAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' as `0x${string}`;

  return (
    <div className="components-test-page">
      <div className="container" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
        <h1>UI Components Showcase</h1>
        <p style={{ marginBottom: '3rem', color: 'rgba(255,255,255,0.7)' }}>
          Testing all Nillion-styled components
        </p>

      {/* Buttons */}
      <Card style={{ marginBottom: '2rem' }}>
        <h2>Buttons</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <Button>Default Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button disabled>Disabled Button</Button>
        </div>
      </Card>

      {/* Inputs & Labels */}
      <Card style={{ marginBottom: '2rem' }}>
        <h2>Inputs & Labels</h2>
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
          <div>
            <Label htmlFor="test-input">Test Input</Label>
            <Input
              id="test-input"
              placeholder="Enter some text..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="test-input-disabled">Disabled Input</Label>
            <Input
              id="test-input-disabled"
              placeholder="Disabled"
              disabled
            />
          </div>
          <div>
            <Label htmlFor="test-input-error">Required Field Validation</Label>
            <Input
              id="test-input-error"
              placeholder="Required field - click away to trigger validation"
              required
            />
          </div>
          <div>
            <Label htmlFor="test-input-error-2">Email Validation</Label>
            <Input
              id="test-input-error-2"
              placeholder="email@example.com - click away to trigger validation"
              defaultValue="invalid-email"
              validateEmail
            />
          </div>
          <div>
            <Label htmlFor="test-input-error-3">Custom Error Message</Label>
            <Input
              id="test-input-error-3"
              placeholder="This field has a custom error"
              required
              error="Username must be at least 3 characters"
            />
          </div>
        </div>
      </Card>

      {/* Select */}
      <Card style={{ marginBottom: '2rem' }}>
        <h2>Select</h2>
        <div style={{ marginTop: '1rem', maxWidth: '400px' }}>
          <Label htmlFor="test-select">Choose an option</Label>
          <Select
            id="test-select"
            value={selectValue}
            onChange={(e) => setSelectValue(e.target.value)}
            options={[
              { value: 'option1', label: 'Option 1' },
              { value: 'option2', label: 'Option 2' },
              { value: 'option3', label: 'Option 3' },
            ]}
          />
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
            Selected: {selectValue}
          </p>
        </div>
      </Card>

      {/* Spinners */}
      <Card style={{ marginBottom: '2rem' }}>
        <h2>Spinners</h2>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginTop: '1rem' }}>
          <div>
            <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Small</p>
            <Spinner size="small" />
          </div>
          <div>
            <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Medium</p>
            <Spinner size="medium" />
          </div>
          <div>
            <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Large</p>
            <Spinner size="large" />
          </div>
        </div>
      </Card>

      {/* Error Message */}
      <Card style={{ marginBottom: '2rem' }}>
        <h2>Error Message</h2>
        <div style={{ marginTop: '1rem' }}>
          <ErrorMessage
            title="Transaction Failed"
            message="Unable to complete transaction. The user rejected the request."
            onRetry={() => alert('Retry clicked!')}
            onDismiss={() => alert('Dismiss clicked!')}
          />
        </div>
      </Card>

      {/* Badges */}
      <Card style={{ marginBottom: '2rem' }}>
        <h2>Badges</h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem', alignItems: 'center' }}>
          <Badge>Default</Badge>
          <Badge variant="success">Active</Badge>
          <Badge variant="warning">Pending</Badge>
          <Badge variant="error">Failed</Badge>
          <Badge variant="info">Info</Badge>
        </div>
      </Card>

      {/* Token Balance */}
      <Card style={{ marginBottom: '2rem' }}>
        <h2>Token Balance</h2>
        <p style={{ marginBottom: '1rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
          {isConnected ? `Showing balance for: ${address}` : `Showing balance for demo address`}
        </p>

        {/* ETH Balances */}
        <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>
          ETH (Native Token)
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
          <div>
            <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Badge Variant (with label)</p>
            <TokenBalance
              address={(address || demoAddress) as `0x${string}`}
              variant="badge"
              showLabel={true}
              tokenType="ETH"
            />
          </div>
          <div>
            <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Inline Variant</p>
            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '0.5rem' }}>
              <p>
                You have{' '}
                <TokenBalance
                  address={(address || demoAddress) as `0x${string}`}
                  variant="inline"
                  showLabel={true}
                  tokenType="ETH"
                />{' '}
                available for gas fees.
              </p>
            </div>
          </div>
        </div>

        {/* TEST Token Balances */}
        <h3 style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>
          TEST Token (ERC-20)
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
          <div>
            <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Badge Variant (with label)</p>
            <TokenBalance
              address={(address || demoAddress) as `0x${string}`}
              variant="badge"
              showLabel={true}
              tokenType="TEST"
            />
          </div>
          <div>
            <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Badge Variant (without label)</p>
            <TokenBalance
              address={(address || demoAddress) as `0x${string}`}
              variant="badge"
              showLabel={false}
              tokenType="TEST"
            />
          </div>
          <div>
            <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Inline Variant</p>
            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '0.5rem' }}>
              <p>
                Your current{' '}
                <TokenBalance
                  address={(address || demoAddress) as `0x${string}`}
                  variant="inline"
                  showLabel={true}
                  tokenType="TEST"
                />{' '}
                will be staked to your node.
              </p>
            </div>
          </div>
          <div>
            <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Compact Variant (Table)</p>
            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '0.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ textAlign: 'left', padding: '0.5rem', fontSize: '0.875rem' }}>Token</th>
                    <th style={{ textAlign: 'right', padding: '0.5rem', fontSize: '0.875rem' }}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.5rem', fontSize: '0.875rem' }}>ETH</td>
                    <td style={{ textAlign: 'right', padding: '0.5rem' }}>
                      <TokenBalance
                        address={(address || demoAddress) as `0x${string}`}
                        variant="compact"
                        showLabel={false}
                        tokenType="ETH"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.5rem', fontSize: '0.875rem' }}>TEST</td>
                    <td style={{ textAlign: 'right', padding: '0.5rem' }}>
                      <TokenBalance
                        address={(address || demoAddress) as `0x${string}`}
                        variant="compact"
                        showLabel={false}
                        tokenType="TEST"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>

      {/* Loading Skeletons */}
      <Card style={{ marginBottom: '2rem' }}>
        <h2>Loading Skeletons</h2>
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Text Loading</p>
            <LoadingSkeleton width="300px" height="20px" />
          </div>
          <div>
            <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Card Loading</p>
            <LoadingSkeleton width="100%" height="120px" borderRadius="0.5rem" />
          </div>
          <div>
            <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Multiple Lines</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <LoadingSkeleton width="100%" height="16px" />
              <LoadingSkeleton width="90%" height="16px" />
              <LoadingSkeleton width="95%" height="16px" />
            </div>
          </div>
        </div>
      </Card>

      {/* Toast Notifications */}
      <Card style={{ marginBottom: '2rem' }}>
        <h2>Toast Notifications</h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <Button onClick={() => toast.success('Transaction confirmed!')}>
            Success Toast
          </Button>
          <Button variant="secondary" onClick={() => toast.error('Transaction failed')}>
            Error Toast
          </Button>
          <Button variant="outline" onClick={() => toast.info('Processing transaction...')}>
            Info Toast
          </Button>
          <Button variant="ghost" onClick={() => toast('Simple message')}>
            Default Toast
          </Button>
        </div>
      </Card>

      {/* Modal */}
      <Card style={{ marginBottom: '2rem' }}>
        <h2>Modal</h2>
        <div style={{ marginTop: '1rem' }}>
          <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
        </div>
      </Card>

        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Example Modal"
        >
          <p style={{ marginBottom: '1rem' }}>
            This is a modal dialog with Nillion styling. It has a backdrop,
            can be closed with ESC or by clicking outside.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button onClick={() => setModalOpen(false)}>Confirm</Button>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
