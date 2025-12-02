'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSwitchChain } from 'wagmi';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { ConnectWallet } from '@/components/auth';
import { Card, Badge, Button } from '@/components/ui';
import { nilavTestnet } from '@/config';
import { useNodes } from '@/lib/hooks';
import { toast } from 'sonner';

type Platform = 'linux' | 'mac' | 'windows' | null;

export default function SetupPage() {
  const router = useRouter();
  const { isConnected, address } = useAppKitAccount();
  const { chainId, caipNetwork } = useAppKitNetwork();
  const { switchChain } = useSwitchChain();
  const { registerNode } = useNodes();

  const [currentStep, setCurrentStep] = useState(1);
  const [platform, setPlatform] = useState<Platform>(null);
  const [publicKey, setPublicKey] = useState('');
  const [stakeAmount, setStakeAmount] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const presetAmounts = [1000, 5000, 10000];
  const minStake = 1000;

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const isCorrectNetwork = chainId === nilavTestnet.id;

  // Platform-specific configuration
  const platformConfig = {
    linux: {
      name: 'Linux',
      downloadUrl: '#',
      command: 'curl -sSL https://install.nillion.com/linux.sh | bash',
    },
    mac: {
      name: 'macOS',
      downloadUrl: '#',
      command: 'curl -sSL https://install.nillion.com/mac.sh | bash',
    },
    windows: {
      name: 'Windows',
      downloadUrl: '#',
      command:
        'powershell -c "iwr https://install.nillion.com/windows.ps1 | iex"',
    },
  };

  const handleCopy = () => {
    if (platform) {
      navigator.clipboard.writeText(platformConfig[platform].command);
      toast.success('Command copied to clipboard');
    }
  };

  const handlePreset = (amount: number) => {
    setStakeAmount(amount.toString());
  };

  const handleMax = () => {
    // TODO: Get actual wallet balance
    setStakeAmount('50000');
  };

  const handleComplete = async () => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!publicKey) {
      toast.error('Please enter your node public key');
      return;
    }

    const amount = Number.parseFloat(stakeAmount);
    if (!stakeAmount || amount < minStake) {
      toast.error(`Minimum stake is ${minStake.toLocaleString()} NIL`);
      return;
    }

    try {
      setIsRegistering(true);

      // TODO: Execute staking transaction here
      // await stakeToNode({ publicKey, amount });

      // Register the node with stake amount
      await registerNode({
        publicKey,
        platform: platform || undefined,
      });

      // Show success message
      toast.success(
        `Node registered with ${amount.toLocaleString()} NIL stake!`
      );

      // Redirect to nodes list
      router.push('/nodes');
    } catch (error) {
      toast.error((error as Error).message || 'Failed to register node');
    } finally {
      setIsRegistering(false);
    }
  };

  // Wrong network - show network switcher
  if (isConnected && !isCorrectNetwork) {
    return (
      <div className="setup-wrong-network">
        <Card>
          <div className="setup-wrong-network-content">
            <h1 className="setup-wrong-network-title">Wrong Network</h1>

            <div className="setup-wrong-network-box">
              <p className="setup-wrong-network-text">
                This app only supports <strong>Nilav Testnet</strong>.
              </p>
              <p className="setup-wrong-network-current">
                Current network: {caipNetwork?.name || 'Unknown'}
              </p>
            </div>

            <Button
              variant="primary"
              size="large"
              onClick={() => switchChain({ chainId: nilavTestnet.id })}
            >
              Switch to Nilav Testnet
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Step 0: Authentication required
  if (!isConnected) {
    return (
      <div className="setup-page">
        <div className="setup-page-gradient setup-page-gradient-top-right" />

        <div className="setup-page-content">
          <div className="container">
            <div className="setup-grid">
              {/* Left: Bold title section */}
              <div className="setup-left">
                <div className="setup-step-indicator">
                  <div className="setup-step-line" />
                  STEP 0
                </div>
                <h1 className="setup-heading">
                  Launch
                  <br />
                  your node
                </h1>
                <p className="setup-description">
                  Connect your wallet to get started
                </p>
              </div>

              {/* Right: Floating glass card with authentication */}
              <div className="setup-right">
                <label className="setup-label">Wallet Authentication</label>

                <p className="setup-help-text">
                  Click below to connect your wallet and sign the authentication
                  message
                </p>
                <ConnectWallet size="large" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated - show multi-step setup with prototype design
  return (
    <div className="setup-page">
      <div
        className={`setup-page-gradient ${
          currentStep <= 3
            ? 'setup-page-gradient-top-right'
            : 'setup-page-gradient-bottom-left'
        }`}
      />

      <div className="setup-page-content">
        <div className="container">
          <div className="setup-grid">
            {/* Left: Bold title section */}
            <div className="setup-left">
              <h1 className="setup-heading">
                {currentStep === 1 && (
                  <>
                    Select
                    <br />
                    Platform
                  </>
                )}
                {currentStep === 2 && (
                  <>
                    Download
                    <br />
                    Binary
                  </>
                )}
                {currentStep === 3 && (
                  <>
                    Start
                    <br />
                    Node
                  </>
                )}
                {currentStep === 4 && (
                  <>
                    Log Node's
                    <br />
                    Public Key
                  </>
                )}
                {currentStep === 5 && (
                  <>
                    Stake to
                    <br />
                    your node
                  </>
                )}
              </h1>
              <p className="setup-description">
                {currentStep === 1 &&
                  'Choose your operating system to download the correct binary'}
                {currentStep === 2 &&
                  'Download the Nillion verifier node binary for your platform'}
                {currentStep === 3 &&
                  'Execute the command in your terminal to start the verifier node'}
                {currentStep === 4 &&
                  'Enter the public key generated by your node'}
                {currentStep === 5 &&
                  'Your node will only be assigned work after you have staked to it'}
              </p>
            </div>

            {/* Right: Floating glass card with form */}
            <div className="setup-right">
              {/* Step 1: Select Platform */}
              {currentStep === 1 && (
                <div>
                  <div className="setup-step-indicator">
                    <div className="setup-step-line" />
                    STEP 1 OF 5
                  </div>
                  <label className="setup-label">Select Platform</label>
                  <div className="setup-platform-grid">
                    {(
                      Object.entries(platformConfig) as [
                        Platform,
                        typeof platformConfig.linux
                      ][]
                    ).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => setPlatform(key)}
                        className={`setup-platform-button ${
                          platform === key ? 'selected' : ''
                        }`}
                      >
                        {config.name}
                      </button>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="large"
                    onClick={() => setCurrentStep(2)}
                    disabled={!platform}
                    className="setup-button-full"
                  >
                    Continue
                  </Button>
                </div>
              )}

              {/* Step 2: Download Binary */}
              {currentStep === 2 && platform && (
                <div>
                  <div className="setup-step-indicator">
                    <div className="setup-step-line" />
                    STEP 2 OF 5
                  </div>
                  <label className="setup-label">Download Binary</label>

                  <div className="setup-download-card">
                    <div className="setup-download-info">
                      <h3 className="setup-download-filename">
                        nil-av-node-{platform}
                      </h3>
                      <p className="setup-download-description">
                        Nillion Verifier Node binary for{' '}
                        {platformConfig[platform].name}
                      </p>
                    </div>

                    <Button
                      variant="primary"
                      size="large"
                      className="setup-button-full"
                      onClick={() => {
                        // TODO: Trigger download
                        window.open(
                          platformConfig[platform].downloadUrl,
                          '_blank'
                        );
                      }}
                    >
                      Download Binary
                    </Button>
                  </div>

                  <p className="setup-note">
                    <strong>Important:</strong> After downloading, you'll need
                    to make the binary executable and run it to generate your
                    node's keys.
                  </p>

                  <div className="setup-button-group">
                    <Button variant="ghost" onClick={() => setCurrentStep(1)}>
                      Back
                    </Button>
                    <Button
                      variant="outline"
                      size="large"
                      onClick={() => setCurrentStep(3)}
                      className="setup-button-compact"
                    >
                      I've Downloaded It
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Run Command */}
              {currentStep === 3 && platform && (
                <div>
                  <div className="setup-step-indicator">
                    <div className="setup-step-line" />
                    STEP 3 OF 5
                  </div>
                  <label className="setup-label">Run this command</label>
                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        flex: 1,
                        background: 'rgba(0, 0, 0, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '0.75rem',
                        padding: '1.25rem',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        color: 'var(--nillion-primary-lighter)',
                        wordBreak: 'break-all',
                        minWidth: 0,
                      }}
                    >
                      {platformConfig[platform].command}
                    </div>
                    <button
                      onClick={handleCopy}
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.375rem',
                        color: 'rgba(255, 255, 255, 0.6)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      Copy
                    </button>
                  </div>

                  <p className="setup-note">
                    <strong>Note:</strong> After running this command, your node
                    will generate a public key. You'll need this key for the
                    next step.
                  </p>

                  <div className="setup-button-group">
                    <Button variant="ghost" onClick={() => setCurrentStep(2)}>
                      Back
                    </Button>
                    <Button
                      variant="outline"
                      size="large"
                      onClick={() => setCurrentStep(4)}
                      className="setup-button-compact"
                    >
                      I've run it
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Enter Public Key */}
              {currentStep === 4 && (
                <div>
                  <div className="setup-step-indicator">
                    <div className="setup-step-line" />
                    STEP 4 OF 5
                  </div>
                  <label className="setup-label">Enter Node's Public Key</label>
                  <input
                    type="text"
                    value={publicKey}
                    onChange={(e) => setPublicKey(e.target.value)}
                    placeholder="0x..."
                    className="setup-input"
                  />

                  <div className="setup-wallet-info">
                    <p className="setup-wallet-label">Connected Wallet</p>
                    <code className="setup-wallet-address">{address}</code>
                  </div>

                  <div className="setup-button-group">
                    <Button variant="ghost" onClick={() => setCurrentStep(3)}>
                      Back
                    </Button>
                    <Button
                      variant="outline"
                      size="large"
                      disabled={!publicKey || publicKey.length < 12}
                      onClick={() => setCurrentStep(5)}
                      className="setup-button-compact"
                    >
                      Continue to Staking
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 5: Stake to Node */}
              {currentStep === 5 && (
                <div>
                  <div className="setup-step-indicator">
                    <div className="setup-step-line" />
                    STEP 5 OF 5
                  </div>
                  <label className="setup-label">Public Key</label>
                  <div
                    style={{
                      background: 'rgba(0, 0, 0, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      color: 'rgba(255, 255, 255, 0.8)',
                      wordBreak: 'break-all',
                      marginBottom: '1.5rem',
                    }}
                  >
                    {publicKey}
                  </div>

                  <label className="setup-label">
                    Stake Amount{' '}
                    <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      (min {minStake.toLocaleString()} NIL)
                    </span>
                  </label>
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="0"
                    min={minStake}
                    className="setup-input"
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 600,
                    }}
                  />

                  <div
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                      marginBottom: '1.5rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    {presetAmounts.map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="small"
                        onClick={() => handlePreset(amount)}
                      >
                        {amount.toLocaleString()}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="small"
                      onClick={handleMax}
                      style={{
                        background: 'rgba(138, 137, 255, 0.1)',
                        borderColor: 'rgba(138, 137, 255, 0.3)',
                        color: 'var(--nillion-primary)',
                      }}
                    >
                      Max
                    </Button>
                  </div>

                  <div className="setup-button-group">
                    <Button variant="ghost" onClick={() => setCurrentStep(4)}>
                      Back
                    </Button>
                    <Button
                      variant="primary"
                      size="large"
                      disabled={
                        !stakeAmount ||
                        Number.parseFloat(stakeAmount) < minStake ||
                        isRegistering
                      }
                      onClick={handleComplete}
                    >
                      {isRegistering
                        ? 'Processing...'
                        : `Stake ${
                            stakeAmount &&
                            Number.parseFloat(stakeAmount) >= minStake
                              ? Number.parseFloat(
                                  stakeAmount
                                ).toLocaleString() + ' NIL'
                              : ''
                          }`}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
