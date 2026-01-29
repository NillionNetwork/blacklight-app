'use client';

import { useState } from 'react';
import type { WorkloadProvider } from '@/types/workload';
import { Button } from '@/components/ui/Button';

interface WorkloadFormProps {
  onSubmit: (data: {
    provider: WorkloadProvider;
    name: string;
    config: any;
    heartbeatInterval: number;
    isActive?: boolean;
  }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  initialValues?: {
    provider: WorkloadProvider;
    name: string;
    config: any;
    heartbeatInterval: number;
  };
  isEditing?: boolean;
}

const providers: {
  value: WorkloadProvider;
  label: string;
  disabled?: boolean;
}[] = [
  { value: 'nillion', label: 'Nillion (nilCC)' },
  { value: 'phala', label: 'Phala' },
  { value: 'azure', label: 'Azure (Coming Soon)', disabled: true },
  {
    value: 'google-cloud',
    label: 'Google Cloud (Coming Soon)',
    disabled: true,
  },
  { value: 'aws', label: 'AWS (Coming Soon)', disabled: true },
  {
    value: 'secret-network',
    label: 'Secret Network (Coming Soon)',
    disabled: true,
  },
];

export function WorkloadForm({
  onSubmit,
  onCancel,
  isSubmitting,
  initialValues,
  isEditing = false,
}: WorkloadFormProps) {
  const [provider, setProvider] = useState<WorkloadProvider>(
    initialValues?.provider || 'nillion'
  );
  const [name, setName] = useState(initialValues?.name || '');
  const [cvmUrl, setCvmUrl] = useState(initialValues?.config?.cvmUrl || '');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationDetails, setValidationDetails] = useState<{
    infoEndpoint?: { success: boolean; error?: string };
    attestationEndpoint?: { success: boolean; error?: string };
  } | null>(null);

  // Heartbeat interval is set server-side, this is just for the form interface
  const heartbeatInterval = initialValues?.heartbeatInterval || 60;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (provider === 'phala') {
      // Validate Phala endpoints before submitting
      setIsValidating(true);
      setValidationError(null);
      setValidationDetails(null);

      try {
        const response = await fetch('/api/phala/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cvmUrl }),
        });

        const validation = await response.json();
        setValidationDetails(validation.details || null);

        if (!validation.success) {
          setValidationError(validation.error || 'Validation failed');
          setIsValidating(false);
          return;
        }
      } catch (error) {
        setValidationError(
          error instanceof Error ? error.message : 'Unknown validation error'
        );
        setIsValidating(false);
        return;
      }

      setIsValidating(false);
    }

    const config: any = {};
    if (provider === 'phala') {
      config.cvmUrl = cvmUrl;
    }

    onSubmit({
      provider,
      name,
      config,
      heartbeatInterval,
      isActive: true,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Provider Selection */}
      <div style={{ marginBottom: '0.5rem' }}>
        <label htmlFor="provider" className="setup-label" style={{ marginBottom: '0.375rem' }}>
          TEE Provider
        </label>
        <div className="provider-select-wrapper">
          <select
            id="provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value as WorkloadProvider)}
            className="setup-input"
            style={{ fontSize: '0.875rem' }}
            required
            disabled={isEditing}
          >
            {providers.map((p) => (
              <option
                key={p.value}
                value={p.value}
                disabled={p.disabled}
                style={{
                  background: '#12125a',
                  color: p.disabled ? 'rgba(255, 255, 255, 0.4)' : 'white',
                }}
              >
                {p.label}
              </option>
            ))}
          </select>
          {/* Dropdown Arrow */}
          <div className="provider-select-arrow">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      </div>

      {/* Phala-specific fields */}
      {provider === 'phala' && (
        <>
          <p className="setup-note" style={{ marginBottom: '1rem' }}>
            For Phala workload requirements and setup, see the {' '}
            <a
              href="https://docs.nillion.com/blacklight/tools/register-apps?platform=phala"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--nillion-primary)',
                textDecoration: 'underline',
              }}
            >
              Docs
            </a>
            .
          </p>
          <div style={{ marginBottom: '0.5rem' }}>
            <label htmlFor="name" className="setup-label" style={{ marginBottom: '0.375rem' }}>
              Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="My Phala Workload"
              className="setup-input"
            />
          </div>

          <div style={{ marginBottom: '0.5rem' }}>
            <label htmlFor="cvmUrl" className="setup-label" style={{ marginBottom: '0.375rem' }}>
              CVM URL *
            </label>
            <input
              id="cvmUrl"
              type="url"
              value={cvmUrl}
              onChange={(e) => {
                setCvmUrl(e.target.value);
                setValidationError(null);
                setValidationDetails(null);
              }}
              required
              placeholder="https://cvm.example.com"
              className="setup-input"
            />
            <p className="setup-help-text" style={{ marginTop: '0.25rem' }}>
              The CVM URL will be used to extract HTX data from /info and
              /attestation endpoints.
            </p>
          </div>

          {/* Validation Status */}
          {isValidating && (
            <div
              style={{
                background: 'rgba(138, 137, 255, 0.1)',
                border: '1px solid rgba(138, 137, 255, 0.3)',
                borderRadius: '0.375rem',
                padding: '0.5rem 0.625rem',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <div className="spinner spinner-small"></div>
              <p
                style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}
              >
                Validating endpoints...
              </p>
            </div>
          )}

          {validationError && !isValidating && (
            <div
              style={{
                background: 'rgba(255, 100, 100, 0.1)',
                border: '1px solid rgba(255, 100, 100, 0.3)',
                borderRadius: '0.375rem',
                padding: '0.5rem 0.625rem',
                marginBottom: '0.5rem',
              }}
            >
              <p
                style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: '#ff6b6b',
                }}
              >
                Validation Failed
              </p>
              <p
                style={{
                  fontSize: '0.875rem',
                  marginBottom: '0.5rem',
                  opacity: 0.8,
                }}
              >
                {validationError}
              </p>
              {validationDetails && (
                <div
                  style={{
                    marginTop: '0.5rem',
                    fontSize: '0.75rem',
                    opacity: 0.8,
                  }}
                >
                  {validationDetails.infoEndpoint && (
                    <div>
                      <span style={{ fontWeight: '500' }}>/info:</span>{' '}
                      {validationDetails.infoEndpoint.success ? (
                        <span style={{ color: '#86efac' }}>✓ Valid</span>
                      ) : (
                        <span>{validationDetails.infoEndpoint.error}</span>
                      )}
                    </div>
                  )}
                  {validationDetails.attestationEndpoint && (
                    <div>
                      <span style={{ fontWeight: '500' }}>/attestation:</span>{' '}
                      {validationDetails.attestationEndpoint.success ? (
                        <span style={{ color: '#86efac' }}>✓ Valid</span>
                      ) : (
                        <span>
                          {validationDetails.attestationEndpoint.error}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!isValidating && !validationError && validationDetails && (
            <div
              style={{
                background: 'rgba(74, 222, 128, 0.1)',
                border: '1px solid rgba(74, 222, 128, 0.3)',
                borderRadius: '0.375rem',
                padding: '0.5rem 0.625rem',
                marginBottom: '0.5rem',
              }}
            >
              <p
                style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: '#4ade80',
                }}
              >
                ✓ Validation Successful
              </p>
              <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                {validationDetails.infoEndpoint?.success && (
                  <div>✓ /info endpoint: Valid</div>
                )}
                {validationDetails.attestationEndpoint?.success && (
                  <div>✓ /attestation endpoint: Valid</div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Nillion message */}
      {provider === 'nillion' && (
        <div
          style={{
            background: 'rgba(138, 137, 255, 0.1)',
            border: '1px solid rgba(138, 137, 255, 0.3)',
            borderRadius: '0.375rem',
            padding: '0.5rem 0.625rem',
            marginBottom: '0.5rem',
          }}
        >
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
            To setup your nilCC workloads for Blacklight verification, check out the{' '}
            <a
              href="https://docs.nillion.com/blacklight/tools/register-apps?platform=nilcc"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#8a89ff', textDecoration: 'underline' }}
            >
              Docs
            </a>
            .
          </p>
        </div>
      )}

      {/* Coming soon for other providers */}
      {provider !== 'phala' && provider !== 'nillion' && (
        <div
          style={{
            background: 'rgba(138, 137, 255, 0.1)',
            border: '1px solid rgba(138, 137, 255, 0.3)',
            borderRadius: '0.375rem',
            padding: '0.5rem 0.625rem',
            marginBottom: '0.5rem',
          }}
        >
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
            {providers.find((p) => p.value === provider)?.label || provider}{' '}
            support is coming soon.
          </p>
        </div>
      )}

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          paddingTop: '0.5rem',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          marginTop: '0.5rem',
        }}
      >
        <Button
          type="button"
          variant="outline"
          size="large"
          onClick={onCancel}
          disabled={isSubmitting}
          style={{ flex: 1 }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="large"
          disabled={
            isSubmitting ||
            isValidating ||
            provider !== 'phala' ||
            !!validationError
          }
          style={{ flex: 1 }}
        >
          {isValidating
            ? 'Validating...'
            : isSubmitting
            ? isEditing
              ? 'Saving...'
              : 'Creating...'
            : isEditing
            ? 'Save Changes'
            : 'Create Workload'}
        </Button>
      </div>
    </form>
  );
}
