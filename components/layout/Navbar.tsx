'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppKitAccount } from '@reown/appkit/react';
import { ConnectWallet, AccountButton } from '@/components/auth';

export function Navbar() {
  const { isConnected } = useAppKitAccount();
  const pathname = usePathname();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link
            href="/"
            style={{
              fontWeight: 600,
              fontSize: '1.25rem',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            nilAV
          </Link>
        </div>

        <div
          className="navbar-links"
          style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}
        >
          {isConnected && (
            <Link
              href="/nodes"
              style={{
                color:
                  pathname === '/nodes' ? 'var(--nillion-primary)' : 'inherit',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              My Nodes
            </Link>
          )}
          <Link
            href="/setup"
            style={{
              color:
                pathname === '/setup' ? 'var(--nillion-primary)' : 'inherit',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Set up Node
          </Link>
        </div>

        <div className="navbar-wallet">
          {isConnected ? (
            <AccountButton size="small" variant="outline" />
          ) : (
            <ConnectWallet size="small" />
          )}
        </div>
      </div>
    </nav>
  );
}
