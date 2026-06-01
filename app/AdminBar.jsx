'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';

const LS_KEY = 'dp-admin-bar-collapsed';

export default function AdminBar({ roleSummary, source, hasClerk }) {
    const [collapsed, setCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setCollapsed(localStorage.getItem(LS_KEY) === '1');
    }, []);

    function toggle() {
        const next = !collapsed;
        setCollapsed(next);
        localStorage.setItem(LS_KEY, next ? '1' : '0');
    }

    // Avoid layout shift on SSR; render expanded until client hydrates.
    const isCollapsed = mounted && collapsed;

    return (
        <header className={`security-topbar${isCollapsed ? ' security-topbar--collapsed' : ''}`}>
            <div className="security-topbar-inner">
                <Link href="/workspace" className="security-brand">
                    <strong>DeliveryPro.AI</strong>
                    <span>{roleSummary || 'Secured workspace'}</span>
                </Link>
                <nav className="security-nav" aria-label="Security navigation">
                    <Link className="security-link" href="/workspace">Workspace</Link>
                    <Link className="security-link" href="/profile">Profile</Link>
                    <Link className="security-link" href="/admin/users">Users</Link>
                    <Link className="security-link" href="/admin/access">Access</Link>
                    <Link className="security-link" href="/admin/governance">Governance</Link>
                    <Link className="security-link" href="/admin/audit">Audit</Link>
                </nav>
                <div className="security-actions">
                    <span className="security-badge">{source}</span>
                    {hasClerk
                        ? <UserButton afterSignOutUrl="/sign-in" />
                        : <span className="security-badge">Local admin</span>}
                </div>
            </div>

            <button
                className="admin-bar-toggle"
                onClick={toggle}
                title={isCollapsed ? 'Expand admin bar' : 'Minimise admin bar'}
                aria-expanded={!isCollapsed}
            >
                {isCollapsed ? 'Show Admin' : 'Hide'}
            </button>
        </header>
    );
}
