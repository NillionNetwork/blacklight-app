'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TriangleAlert } from 'lucide-react';
import { useAppKitAccount } from '@reown/appkit/react';
import { Button } from '@/components/ui';
import { StakingForm } from '@/components/staking';
import { FundNodeForm } from '@/components/transfer';
import { toast } from 'sonner';
import { platforms } from '@/config';

type Platform = 'linux' | 'mac' | 'windows' | null;

// Step configuration - add/remove/reorder steps here
const SETUP_STEPS = [
  {
    id: 'select-platform',
    title: ['Select', 'Platform'],
    description:
      'Choose your operating system for platform-specific setup instructions',
  },
  {
    id: 'install-docker',
    title: ['Install', 'Docker'],
    description: 'Docker is required to run a Blacklight verifier node',
  },
  {
    id: 'setup-run-node',
    title: ['Setup & Run', 'node'],
    description:
      "Pull the Docker image, run it to generate your Blacklight node wallet, and enter the node's wallet address",
  },
  {
    id: 'stake-to-node',
    title: ['Stake to', 'your node'],
    description:
      'Stake NIL tokens to your Blacklight node so it can be assigned verification work',
  },
  {
    id: 'fund-node',
    title: ['Fund node', 'with ETH'],
    description: 'Fund your Blacklight node with ETH for gas transactions',
  },
  {
    id: 'start-node',
    title: ['Start node'],
    description: 'Run the Blacklight node binary to register and start your verifier node',
  },
] as const;

// Step IDs for easy reference (1–6; testnet adds step 0 "Get funds" as step 1)
const STEPS = {
  SELECT_PLATFORM: 1,
  INSTALL_DOCKER: 2,
  SETUP_RUN_NODE: 3,
  STAKE_TO_NODE: 4,
  FUND_NODE: 5,
  START_NODE: 6,
} as const;

const GET_FUNDS_STEP_CONFIG = {
  title: ['Get funds', 'for your node'],
  description:
    "Get the required testnet NIL and ETH on Nillion's L2 to fund your node.",
} as const;

export default function SetupPage() {
  const router = useRouter();
  const { isConnected } = useAppKitAccount();

  const isTestnet = process.env.NEXT_PUBLIC_NETWORK !== 'nilavMainnet';
  const totalSteps = isTestnet ? 7 : 6;
  const stepNum = (s: number) => (isTestnet ? s + 1 : s);

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [platform, setPlatform] = useState<Platform>(null);
  const [publicKey, setPublicKey] = useState('');
  const [hasExistingStake, setHasExistingStake] = useState(false);
  const [hasExistingBalance, setHasExistingBalance] = useState(false);

  // Get current step configuration (title/description for left panel)
  const currentStepConfig =
    isTestnet && currentStep === 1
      ? GET_FUNDS_STEP_CONFIG
      : SETUP_STEPS[isTestnet ? currentStep - 2 : currentStep - 1];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Command copied to clipboard');
  };

  const handleStakingSuccess = async (
    operatorAddress: string,
    amount: string
  ) => {
    setCurrentStep(stepNum(STEPS.FUND_NODE));
  };

  const handleFundingSuccess = async (nodeAddress: string, amount: string) => {
    setCurrentStep(stepNum(STEPS.START_NODE));
  };

  // Show multi-step setup with prototype design
  return (
    <div className="setup-page">
      <div
        className={`setup-page-gradient ${
          currentStep <= stepNum(STEPS.SETUP_RUN_NODE)
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
                {currentStepConfig.title[0]}
                <br />
                {currentStepConfig.title[1]}
              </h1>
              <p className="setup-description">
                {currentStepConfig.description}
              </p>
            </div>

            {/* Right: Floating glass card with form */}
            <div className="setup-right">
              {/* Step 1 (testnet only): Get funds for your node */}
              {isTestnet && currentStep === 1 && (
                <div>
                  <div className="setup-step-indicator">
                    <div className="setup-step-line" />
                    STEP 1 OF {totalSteps}
                  </div>
                  <p className="setup-note" style={{ marginBottom: '1.5rem' }}>
                    You can get the required testnet NIL and ETH on Nillion&apos;s L2 at the faucet linked below. <strong>Make sure to use the same wallet.</strong>
                  </p>
                  <Button
                    variant="outline"
                    size="large"
                    className="setup-button-full"
                    onClick={() => window.open('https://faucet.testnet.nillion.network/?chain=L2', '_blank')}
                  >
                    Open Nillion L2 Faucet
                  </Button>
                  <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="outline"
                      size="large"
                      onClick={() => setCurrentStep(2)}
                      className="setup-button-compact"
                    >
                      I&apos;ve got the funds
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2 (testnet) / Step 1 (mainnet): Select Platform */}
              {currentStep === stepNum(STEPS.SELECT_PLATFORM) && (
                <div>
                  <div className="setup-step-indicator">
                    <div className="setup-step-line" />
                    STEP {currentStep} OF {totalSteps}
                  </div>
                  {!isTestnet && (
                    <p className="setup-note" style={{ marginTop: '0.75rem' }}>
                      <strong>Before you start:</strong> Get funds for your node, prerequisites{' '}
                      <a
                        href="https://docs.nillion.com/blacklight/run-node/prerequisites"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: 'var(--nillion-primary)',
                          textDecoration: 'underline',
                        }}
                      >
                        here
                      </a>
                      .
                    </p>
                  )}
                  <label className="setup-label">Select Platform</label>
                  <div className="setup-platform-grid">
                    {(
                      Object.keys(platforms) as Array<keyof typeof platforms>
                    ).map((key) => (
                      <button
                        key={key}
                        onClick={() => {
                          setPlatform(key);
                          setCurrentStep(stepNum(STEPS.INSTALL_DOCKER));
                        }}
                        className={`setup-platform-button ${
                          platform === key ? 'selected' : ''
                        }`}
                      >
                        {platforms[key].displayName}
                      </button>
                    ))}
                  </div>
                  <p className="setup-note" style={{ marginTop: '1.5rem' }}>
                    <strong>
                      <TriangleAlert
                        size={16}
                        style={{
                          display: 'inline-block',
                          verticalAlign: 'middle',
                          marginRight: '0.35rem',
                          color: 'var(--nillion-primary)',
                          flexShrink: 0,
                        }}
                        aria-hidden
                      />
                      Important:
                    </strong>{' '}
                    Your Blacklight node must be online 24/7 to handle verification tasks. We recommend running it on a VPS.{' '}
                    <Link
                      href="/#faq"
                      style={{
                        color: 'var(--nillion-primary)',
                        textDecoration: 'underline',
                      }}
                    >
                      See FAQs for suggested minimum requirements
                    </Link>
                    .
                  </p>
                  {isTestnet && (
                    <div
                      className="setup-button-group"
                      style={{ marginTop: '1.5rem', width: '50%', justifyContent: 'flex-start' }}
                    >
                      <Button variant="ghost" onClick={() => setCurrentStep(1)}>
                        Back
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3 (testnet) / Step 2 (mainnet): Install Docker */}
              {currentStep === stepNum(STEPS.INSTALL_DOCKER) && platform && (
                <div>
                  <div className="setup-step-indicator">
                    <div className="setup-step-line" />
                    STEP {currentStep} OF {totalSteps}
                  </div>
                  <label className="setup-label">Install Docker</label>

                  {platform === 'windows' ? (
                    <div className="setup-download-card">
                      <div className="setup-download-info">
                        <h3 className="setup-download-filename">
                          Docker Desktop
                        </h3>
                        <p className="setup-download-description">
                          Download and install Docker Desktop for Windows
                        </p>
                      </div>

                      <Button
                        variant="primary"
                        size="large"
                        className="setup-button-full"
                        onClick={() => {
                          window.open(
                            platforms[platform].dockerInstallUrl,
                            '_blank'
                          );
                        }}
                      >
                        Download Docker Desktop
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <div
                        className="setup-command-row"
                        style={{
                          marginBottom: '1rem',
                        }}
                      >
                        <div
                          className="command-block"
                          style={{
                            background: 'rgba(0, 0, 0, 0.5)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '0.75rem',
                            padding: '1.25rem',
                            fontFamily: 'monospace',
                            fontSize: '0.875rem',
                            color: 'var(--nillion-primary-lighter)',
                            overflowX: 'auto',
                            minWidth: 0,
                          }}
                        >
                          {platforms[platform].dockerInstallCommand}
                        </div>
                        <button
                          className="setup-inline-copy-button"
                          onClick={() =>
                            handleCopy(
                              platforms[platform].dockerInstallCommand!
                            )
                          }
                          style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: 'none',
                            padding: '0 1rem',
                            borderRadius: '0.375rem',
                            color: 'rgba(255, 255, 255, 0.6)',
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                        >
                          Copy
                        </button>
                      </div>
                      {platform === 'mac' && (
                        <p
                          className="setup-note"
                          style={{ marginTop: '0.5rem' }}
                        >
                          Alternatively, you can{' '}
                          <a
                            href={platforms[platform].dockerInstallUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--nillion-primary)' }}
                          >
                            download Docker Desktop
                          </a>{' '}
                          instead.
                        </p>
                      )}
                    </div>
                  )}

                  <p className="setup-note">
                    <strong>Note:</strong> Docker is required to run a Blacklight
                    verifier node. After installation, you may need to restart
                    your terminal.
                  </p>

                  <div className="setup-button-group">
                    <Button
                      variant="ghost"
                      onClick={() => setCurrentStep(stepNum(STEPS.SELECT_PLATFORM))}
                    >
                      Back
                    </Button>
                    <Button
                      variant="outline"
                      size="large"
                      onClick={() => setCurrentStep(stepNum(STEPS.SETUP_RUN_NODE))}
                      className="setup-button-compact"
                    >
                      I've Installed Docker
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4 (testnet) / Step 3 (mainnet): Pull & Run Docker Image + Enter nodeAddress */}
              {currentStep === stepNum(STEPS.SETUP_RUN_NODE) && platform && (
                <div>
                  <div className="setup-step-indicator">
                    <div className="setup-step-line" />
                    STEP {currentStep} OF {totalSteps}
                  </div>
                  <label className="setup-label">Pull Docker Image</label>
                  <div
                    className="setup-command-row"
                    style={{
                      marginBottom: '1.5rem',
                    }}
                  >
                    <div
                      className="command-block"
                      style={{
                        background: 'rgba(0, 0, 0, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '0.75rem',
                        padding: '1.25rem',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        color: 'var(--nillion-primary-lighter)',
                        overflowX: 'auto',
                        minWidth: 0,
                      }}
                    >
                      {platforms[platform].dockerPullCommand}
                    </div>
                    <button
                      className="setup-inline-copy-button"
                      onClick={() =>
                        handleCopy(platforms[platform].dockerPullCommand)
                      }
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        padding: '0 1rem',
                        borderRadius: '0.375rem',
                        color: 'rgba(255, 255, 255, 0.6)',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      Copy
                    </button>
                  </div>

                  <label className="setup-label">Run Blacklight Node Setup</label>
                  <div
                    className="setup-command-row"
                    style={{
                      marginBottom: '1rem',
                    }}
                  >
                    <div
                      className="command-block"
                      style={{
                        background: 'rgba(0, 0, 0, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '0.75rem',
                        padding: '1.25rem',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        color: 'var(--nillion-primary-lighter)',
                        overflowX: 'auto',
                        minWidth: 0,
                      }}
                    >
                      {platforms[platform].dockerRunCommand}
                    </div>
                    <button
                      className="setup-inline-copy-button"
                      onClick={() =>
                        handleCopy(platforms[platform].dockerRunCommand)
                      }
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        padding: '0 1rem',
                        borderRadius: '0.375rem',
                        color: 'rgba(255, 255, 255, 0.6)',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      Copy
                    </button>
                  </div>

                  <p className="setup-note" style={{ marginBottom: '1.5rem' }}>
                    <strong>Note:</strong> Your node will generate
                    a new wallet and save the keys to{' '}
                    <code>./blacklight-node/blacklight_node.env</code>. Ensure you keep a copy, it contains the keys for your Blacklight node.

                  </p>
                  <p className="setup-note" style={{ marginBottom: '1.5rem' }}>
                  Your Blacklight node public key (address) will be displayed in your terminal - paste it below.
                  </p>

                  <label className="setup-label">Enter Blacklight Node Public Key</label>
                  <input
                    type="text"
                    value={publicKey}
                    onChange={(e) => {
                      // Trim whitespace immediately on paste/input
                      const trimmedValue = e.target.value.trim();
                      setPublicKey(trimmedValue);
                    }}
                    placeholder="0x..."
                    className="setup-input"
                  />

                  {/*<p className="setup-note">*/}
                  {/*  <strong>Note:</strong> This corresponds to the wallet that*/}
                  {/*  your node generated. You'll stake to this node address in*/}
                  {/*  the next step.*/}
                  {/*</p>*/}

                  <div className="setup-button-group">
                    <Button
                      variant="ghost"
                      onClick={() => setCurrentStep(stepNum(STEPS.INSTALL_DOCKER))}
                    >
                      Back
                    </Button>
                    <Button
                      variant="primary"
                      size="large"
                      disabled={!publicKey || publicKey.length < 12}
                      onClick={() => {
                        // Validate address format on Continue
                        const trimmedAddress = publicKey.trim();
                        if (!trimmedAddress.startsWith('0x') || trimmedAddress.length !== 42) {
                          toast.error('Invalid node address format');
                          return;
                        }
                        // Update state with trimmed address if needed
                        if (trimmedAddress !== publicKey) {
                          setPublicKey(trimmedAddress);
                        }
                        setCurrentStep(stepNum(STEPS.STAKE_TO_NODE));
                      }}
                      className="setup-button-compact"
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 5 (testnet) / Step 4 (mainnet): Stake to Node */}
              {currentStep === stepNum(STEPS.STAKE_TO_NODE) && (
                <div>
                  <div className="setup-step-indicator">
                    <div className="setup-step-line" />
                    STEP {currentStep} OF {totalSteps}
                  </div>

                  <StakingForm
                    nodeAddress={publicKey}
                    onSuccess={handleStakingSuccess}
                    onError={(error) => {
                      console.error('Staking failed:', error);
                    }}
                    onStakeDataChange={(data) => {
                      setHasExistingStake(data.currentStake > 0);
                    }}
                  />

                  <div
                    className="setup-button-group"
                    style={{ marginTop: '1.5rem' }}
                  >
                    <Button
                      variant="ghost"
                      onClick={() => setCurrentStep(stepNum(STEPS.SETUP_RUN_NODE))}
                    >
                      Back
                    </Button>
                    {isConnected && hasExistingStake && (
                      <Button
                        variant="outline"
                        size="large"
                        onClick={() => setCurrentStep(stepNum(STEPS.FUND_NODE))}
                        className="setup-button-compact"
                      >
                        Continue
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Step 6 (testnet) / Step 5 (mainnet): Fund Node with ETH */}
              {currentStep === stepNum(STEPS.FUND_NODE) && (
                <div>
                  <div className="setup-step-indicator">
                    <div className="setup-step-line" />
                    STEP {currentStep} OF {totalSteps}
                  </div>

                  <FundNodeForm
                    nodeAddress={publicKey}
                    onSuccess={handleFundingSuccess}
                    onError={(error) => {
                      console.error('Funding failed:', error);
                    }}
                    onBalanceDataChange={(data) => {
                      setHasExistingBalance(data.nodeBalance > 0);
                    }}
                  />

                  <div
                    className="setup-button-group"
                    style={{ marginTop: '1.5rem' }}
                  >
                    <Button
                      variant="ghost"
                      onClick={() => setCurrentStep(stepNum(STEPS.STAKE_TO_NODE))}
                    >
                      Back
                    </Button>
                    {isConnected && hasExistingBalance && (
                      <Button
                        variant="outline"
                        size="large"
                        onClick={() => setCurrentStep(stepNum(STEPS.START_NODE))}
                        className="setup-button-compact"
                      >
                        Continue
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Step 7 (testnet) / Step 6 (mainnet): Start Node */}
              {currentStep === stepNum(STEPS.START_NODE) && platform && (
                <div>
                  <div className="setup-step-indicator">
                    <div className="setup-step-line" />
                    STEP {currentStep} OF {totalSteps}
                  </div>
                  <label className="setup-label">Run this command</label>
                  <div
                    className="setup-command-row"
                    style={{
                      marginBottom: '1rem',
                    }}
                  >
                    <div
                      className="command-block"
                      style={{
                        background: 'rgba(0, 0, 0, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '0.75rem',
                        padding: '1.25rem',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        color: 'var(--nillion-primary-lighter)',
                        overflowX: 'auto',
                        minWidth: 0,
                      }}
                    >
                      {platforms[platform].dockerRunCommand}
                    </div>
                    <button
                      className="setup-inline-copy-button"
                      onClick={() => {
                        handleCopy(platforms[platform].dockerRunCommand);
                      }}
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        padding: '0 1rem',
                        borderRadius: '0.375rem',
                        color: 'rgba(255, 255, 255, 0.6)',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      Copy
                    </button>
                  </div>

                  <p className="setup-note">
                    After running this command, you should see "✅ Ready to operate"
                    followed by "Node registered
                    successfully" in your terminal. This means your Blacklight node is
                    successfully running correctly.
                  </p>

                  <div className="setup-button-group">
                    <Button
                      variant="ghost"
                      onClick={() => setCurrentStep(stepNum(STEPS.FUND_NODE))}
                    >
                      Back
                    </Button>
                    <Button
                      variant="ghost"
                      size="large"
                      onClick={() => {
                        window.open('https://discord.gg/nillion', '_blank');
                      }}
                      className="setup-button-compact"
                    >
                      Help
                    </Button>
                    <Button
                      variant="primary"
                      size="large"
                      onClick={() => {
                        // Show success message
                        toast.success(
                          `Node setup complete! Your node is now running.`
                        );

                        // Redirect to node detail page
                        router.push(`/nodes/${publicKey}`);
                      }}
                      className="setup-button-compact"
                    >
                      I see it
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
