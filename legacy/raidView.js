/* ==========================================================================
   DELIVERYPRO.AI – RAID + CHANGE REQUEST LOG VIEW
   Risks · Issues · Assumptions · Decisions · Change Requests
   ========================================================================== */

import { store, escapeHtml } from './store.js';

// ─── Per-type configuration ─────────────────────────────────────────────────

const TABS = [
    { key: 'risks',       label: 'Risks',           icon: 'warning',       color: 'var(--color-warning)' },
    { key: 'issues',      label: 'Issues',           icon: 'bug_report',    color: 'var(--color-danger)'  },
    { key: 'assumptions', label: 'Assumptions',      icon: 'lightbulb',     color: 'var(--accent-indigo)' },
    { key: 'decisions',   label: 'Decisions',        icon: 'gavel',         color: 'var(--color-success)' },
    { key: 'changes',     label: 'Change Requests',  icon: 'change_circle', color: '#a78bfa'              }
];

const STATUSES = {
    risks:       ['Open', 'Mitigating', 'Accepted', 'Closed'],
    issues:      ['Open', 'In Progress', 'Resolved', 'Closed'],
    assumptions: ['Active', 'Validated', 'Invalid', 'Closed'],
    decisions:   ['Pending', 'Approved', 'Rejected', 'Deferred'],
    changes:     ['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'On Hold']
};

const LEVELS = {
    risks:       ['High', 'Medium', 'Low'],
    issues:      ['Critical', 'High', 'Medium', 'Low'],
    assumptions: ['High', 'Medium', 'Low'],
    decisions:   ['High', 'Medium', 'Low'],
    changes:     ['Critical', 'High', 'Medium', 'Low']
};

const CATS = {
    risks:       ['Technical', 'Financial', 'Operational', 'External', 'Resource', 'Schedule'],
    issues:      ['Technical', 'Financial', 'Operational', 'Stakeholder', 'Resource', 'Process'],
    assumptions: ['Technical', 'Business', 'Resource', 'Regulatory', 'Market'],
    decisions:   ['Technical', 'Commercial', 'Operational', 'Strategic', 'Resource'],
    changes:     ['Scope', 'Schedule', 'Cost', 'Combined']
};

const STATUS_COLOR = {
    Open: 'var(--color-warning)', 'In Progress': 'var(--accent-indigo)', Mitigating: 'var(--accent-indigo)',
    Resolved: 'var(--color-success)', Closed: 'var(--color-text-muted)', Approved: 'var(--color-success)',
    Rejected: 'var(--color-danger)', Pending: 'var(--color-warning)', Deferred: 'var(--color-text-muted)',
    Active: 'var(--accent-indigo)', Validated: 'var(--color-success)', Invalid: 'var(--color-danger)',
    Accepted: 'var(--color-text-muted)', Draft: 'var(--color-text-muted)', Submitted: 'var(--accent-indigo)',
    'Under Review': 'var(--color-warning)', 'On Hold': 'var(--color-text-muted)'
};

const LEVEL_COLOR = {
    Critical: 'var(--color-danger)', High: 'var(--color-warning)',
    Medium: 'var(--accent-indigo)', Low: 'var(--color-success)'
};

const LEVEL_SCORE = { High: 3, Medium: 2, Low: 1 };

// ─── View class ──────────────────────────────────────────────────────────────

class RaidView {
    constructor() {
        this.containerId = 'view-content';
        this._tab        = 'risks';
        this._scopeId    = null;
        this._sort       = { col: null, dir: 'asc' };
        this._filters    = { status: '', level: '', text: '' };
        this._showModal  = false;
        this._editId     = null;
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    _entries(state) {
        if (!this._scopeId) return [];
        return ((state.raidLogs?.[this._scopeId])?.[this._tab] || []).filter(e => !e.isArchived);
    }

    _ensureScope(state, scopeId) {
        if (!state.raidLogs) state.raidLogs = {};
        if (!state.raidLogs[scopeId]) {
            state.raidLogs[scopeId] = { risks: [], issues: [], assumptions: [], decisions: [], changes: [] };
        }
    }

    _riskScore(e) {
        return (LEVEL_SCORE[e.probability] || 0) * (LEVEL_SCORE[e.impact] || 0);
    }

    _levelField(tabKey) {
        if (tabKey === 'risks')       return null; // two separate fields: probability + impact
        if (tabKey === 'assumptions') return 'impactIfWrong';
        if (tabKey === 'decisions')   return 'impact';
        return 'priority'; // issues + changes
    }

    _applyFilters(entries) {
        let r = entries;
        if (this._filters.status) r = r.filter(e => e.status === this._filters.status);
        if (this._filters.level) {
            const lf = this._levelField(this._tab);
            if (this._tab === 'risks') {
                r = r.filter(e => e.probability === this._filters.level || e.impact === this._filters.level);
            } else if (lf) {
                r = r.filter(e => e[lf] === this._filters.level);
            }
        }
        if (this._filters.text) {
            const t = this._filters.text.toLowerCase();
            r = r.filter(e => (e.title || '').toLowerCase().includes(t) || (e.description || '').toLowerCase().includes(t));
        }
        return r;
    }

    _applySort(entries) {
        if (!this._sort.col) return entries;
        return [...entries].sort((a, b) => {
            let va = a[this._sort.col] ?? '';
            let vb = b[this._sort.col] ?? '';
            if (this._sort.col === 'riskScore') { va = this._riskScore(a); vb = this._riskScore(b); }
            const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
            return this._sort.dir === 'asc' ? cmp : -cmp;
        });
    }

    // ── Main render ──────────────────────────────────────────────────────────

    render(state) {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const scopes = state.scopes.filter(s => !s.isArchived);

        if (scopes.length === 0) {
            document.getElementById('raid-modal-overlay')?.remove();
            container.innerHTML = `
                <div class="audit-workspace" style="text-align:center;padding:60px 20px;">
                    <span class="material-symbols-outlined" style="font-size:48px;height:80px;width:80px;color:var(--color-text-muted);margin-bottom:20px;display:block;">shield_with_heart</span>
                    <h3>No Active Projects</h3>
                    <p class="help-text" style="max-width:420px;margin:8px auto 0;">Promote a proposal from the <strong>Intake Funnel</strong> or add a project scope to start tracking Risks, Issues, Assumptions, Decisions, and Change Requests.</p>
                </div>
            `;
            return;
        }

        if (!this._scopeId || !scopes.find(s => s.id === this._scopeId)) {
            this._scopeId = scopes[0]?.id ?? null;
        }

        const allEntries = this._entries(state);
        const filtered   = this._applyFilters(allEntries);
        const sorted     = this._applySort(filtered);
        const tab        = TABS.find(t => t.key === this._tab);

        // Remove any lingering RAID modal from a previous render
        document.getElementById('raid-modal-overlay')?.remove();

        container.innerHTML = `
            <div class="raid-workspace">
                ${this._renderProjectTabs(scopes)}
                ${this._renderLogTabsBar(state)}
                ${this._renderStats(allEntries, tab)}
                ${this._renderTable(sorted, tab)}
            </div>
        `;

        if (this._showModal) {
            document.body.appendChild(this._buildModal(state));
        }

        this._bindEvents(state);
    }

    // ── Toolbar ──────────────────────────────────────────────────────────────

    _renderProjectTabs(scopes) {
        if (scopes.length === 0) return '';
        return `
            <div class="raid-project-tabs">
                ${scopes.map(s => `
                    <button class="raid-proj-btn${s.id === this._scopeId ? ' active' : ''}" data-scope="${s.id}" title="${escapeHtml(s.name)}">
                        <span class="material-symbols-outlined" style="font-size:13px;vertical-align:middle;margin-right:4px;">article</span>${escapeHtml(s.name)}
                    </button>
                `).join('')}
            </div>
        `;
    }

    _renderLogTabsBar(state) {
        const tab = TABS.find(t => t.key === this._tab);
        const counts = {};
        TABS.forEach(t => {
            const ents = this._scopeId
                ? ((state.raidLogs?.[this._scopeId]?.[t.key]) || []).filter(e => !e.isArchived)
                : [];
            counts[t.key] = ents.filter(e => !['Closed', 'Accepted', 'Resolved', 'Approved', 'Rejected'].includes(e.status)).length;
        });
        const addLabel = tab.key === 'changes' ? 'Change Request' : tab.label.replace(/s$/, '');
        return `
            <div class="raid-tabs-bar">
                <div class="raid-log-tabs">
                    ${TABS.map(t => `
                        <button class="raid-tab-btn${t.key === this._tab ? ' active' : ''}" data-tab="${t.key}" ${t.key === this._tab ? `style="--tab-color:${t.color}"` : ''}>
                            <span class="material-symbols-outlined">${t.icon}</span>
                            <span>${t.label}</span>
                            ${counts[t.key] > 0 ? `<span class="raid-tab-badge">${counts[t.key]}</span>` : ''}
                        </button>
                    `).join('')}
                </div>
                <button class="btn btn-primary raid-add-btn" id="raid-add-btn" ${!this._scopeId ? 'disabled' : ''}>
                    <span class="material-symbols-outlined">add</span> Add ${addLabel}
                </button>
            </div>
        `;
    }

    // ── Stats tiles ──────────────────────────────────────────────────────────

    _renderStats(entries, tab) {
        const tiles = this._calcStats(entries, tab.key);
        return `
            <div class="raid-stats-row">
                ${tiles.map(s => `
                    <div class="raid-stat-tile">
                        <div class="raid-stat-label">${s.label}</div>
                        <div class="raid-stat-value" style="color:${s.color || 'var(--color-text-primary)'}">${s.value}</div>
                        ${s.sub ? `<div class="raid-stat-sub">${s.sub}</div>` : ''}
                    </div>
                `).join('')}
                <div class="raid-stat-tile raid-stat-chart">
                    <div class="raid-stat-label">Status Distribution</div>
                    ${this._renderStatusBar(entries, tab.key)}
                </div>
            </div>
        `;
    }

    _calcStats(entries, tabKey) {
        if (tabKey === 'risks') {
            const open      = entries.filter(e => e.status === 'Open').length;
            const highRisk  = entries.filter(e => e.probability === 'High' && e.impact === 'High').length;
            const avgScore  = entries.length ? Math.round(entries.reduce((s, e) => s + this._riskScore(e), 0) / entries.length * 10) / 10 : 0;
            return [
                { label: 'Total Risks',    value: entries.length },
                { label: 'Open',           value: open,      color: open > 0 ? 'var(--color-warning)' : 'var(--color-success)' },
                { label: 'High Severity',  value: highRisk,  color: highRisk > 0 ? 'var(--color-danger)' : 'var(--color-success)', sub: 'H×H matrix' },
                { label: 'Avg Risk Score', value: avgScore,  color: 'var(--color-text-secondary)', sub: 'out of 9' }
            ];
        }
        if (tabKey === 'issues') {
            const open     = entries.filter(e => e.status === 'Open').length;
            const highPri  = entries.filter(e => ['Critical', 'High'].includes(e.priority)).length;
            const resolved = entries.filter(e => ['Resolved', 'Closed'].includes(e.status)).length;
            return [
                { label: 'Total Issues',    value: entries.length },
                { label: 'Open',            value: open,     color: open > 0 ? 'var(--color-warning)' : 'var(--color-success)' },
                { label: 'Critical / High', value: highPri,  color: highPri > 0 ? 'var(--color-danger)' : 'var(--color-success)' },
                { label: 'Resolved',        value: resolved, color: 'var(--color-success)' }
            ];
        }
        if (tabKey === 'assumptions') {
            const active    = entries.filter(e => e.status === 'Active').length;
            const invalid   = entries.filter(e => e.status === 'Invalid').length;
            const validated = entries.filter(e => e.status === 'Validated').length;
            return [
                { label: 'Total',      value: entries.length },
                { label: 'Active',     value: active,    color: 'var(--accent-indigo)' },
                { label: 'Invalid',    value: invalid,   color: invalid > 0 ? 'var(--color-danger)' : 'var(--color-success)' },
                { label: 'Validated',  value: validated, color: 'var(--color-success)' }
            ];
        }
        if (tabKey === 'decisions') {
            const pending  = entries.filter(e => e.status === 'Pending').length;
            const approved = entries.filter(e => e.status === 'Approved').length;
            const deferred = entries.filter(e => ['Rejected', 'Deferred'].includes(e.status)).length;
            return [
                { label: 'Total',              value: entries.length },
                { label: 'Pending',            value: pending,  color: pending > 0 ? 'var(--color-warning)' : 'var(--color-text-muted)' },
                { label: 'Approved',           value: approved, color: 'var(--color-success)' },
                { label: 'Rejected / Deferred',value: deferred, color: 'var(--color-text-muted)' }
            ];
        }
        if (tabKey === 'changes') {
            const pending  = entries.filter(e => ['Submitted', 'Under Review', 'Draft'].includes(e.status)).length;
            const approved = entries.filter(e => e.status === 'Approved').length;
            const netCost  = entries.filter(e => e.status === 'Approved').reduce((s, e) => s + (Number(e.costDelta) || 0), 0);
            const fmtCost  = netCost === 0 ? '$0' : `${netCost >= 0 ? '+' : '-'}$${Math.abs(netCost).toLocaleString()}`;
            return [
                { label: 'Total CRs',       value: entries.length },
                { label: 'Pending Review',  value: pending,  color: pending > 0 ? 'var(--color-warning)' : 'var(--color-text-muted)' },
                { label: 'Approved',        value: approved, color: 'var(--color-success)' },
                { label: 'Approved Cost Δ', value: fmtCost,  color: netCost > 0 ? 'var(--color-danger)' : netCost < 0 ? 'var(--color-success)' : 'var(--color-text-muted)', sub: 'net impact' }
            ];
        }
        return [];
    }

    _renderStatusBar(entries, tabKey) {
        if (entries.length === 0) return `<div style="color:var(--color-text-muted);font-size:11px;margin-top:8px;">No entries yet</div>`;
        const statuses = STATUSES[tabKey];
        const counts   = {};
        statuses.forEach(s => counts[s] = 0);
        entries.forEach(e => { if (counts[e.status] !== undefined) counts[e.status]++; });
        return `
            <div class="raid-status-bar">
                ${statuses.map(s => {
                    const pct = Math.round((counts[s] / entries.length) * 100);
                    if (pct === 0) return '';
                    return `<div class="raid-bar-seg" style="width:${pct}%;background:${STATUS_COLOR[s] || '#888'}" title="${s}: ${counts[s]} (${pct}%)"></div>`;
                }).join('')}
            </div>
            <div class="raid-bar-legend">
                ${statuses.filter(s => counts[s] > 0).map(s => `
                    <span><i style="background:${STATUS_COLOR[s] || '#888'}"></i>${s} (${counts[s]})</span>
                `).join('')}
            </div>
        `;
    }

    // ── Table ────────────────────────────────────────────────────────────────

    _renderTable(entries, tab) {
        const cols = this._getCols(tab.key);
        const _s   = key => this._sort.col === key
            ? `<span style="color:var(--accent-indigo);font-size:9px;margin-left:2px;">${this._sort.dir === 'asc' ? '▲' : '▼'}</span>`
            : `<span style="opacity:0.25;font-size:9px;margin-left:2px;">▲</span>`;

        const levelLabel = { risks: 'Prob / Impact', issues: 'Priority', assumptions: 'Impact if Wrong', decisions: 'Impact', changes: 'Priority' }[tab.key];

        return `
            <div class="raid-table-wrap">
                <table class="raid-table">
                    <colgroup>
                        ${cols.map(c => `<col style="width:${c.width || 'auto'}">`).join('')}
                        <col style="width:64px">
                    </colgroup>
                    <thead>
                        <tr>
                            ${cols.map(c => `
                                <th class="${c.sortKey ? 'raid-sort-th' : ''}" ${c.sortKey ? `data-sort="${c.sortKey}"` : ''}>
                                    ${c.label}${c.sortKey ? _s(c.sortKey) : ''}
                                </th>
                            `).join('')}
                            <th></th>
                        </tr>
                        <tr class="raid-filter-row">
                            ${cols.map(c => {
                                if (c.filterType === 'status') return `<th><select class="raid-filter" data-filter="status"><option value="">All Status</option>${STATUSES[tab.key].map(s => `<option value="${s}" ${this._filters.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></th>`;
                                if (c.filterType === 'level')  return `<th><select class="raid-filter" data-filter="level"><option value="">All ${levelLabel}</option>${LEVELS[tab.key].map(l => `<option value="${l}" ${this._filters.level === l ? 'selected' : ''}>${l}</option>`).join('')}</select></th>`;
                                if (c.filterType === 'text')   return `<th><input type="text" class="raid-filter" data-filter="text" placeholder="Search…" value="${escapeHtml(this._filters.text)}"></th>`;
                                return '<th></th>';
                            }).join('')}
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${entries.length === 0
                            ? `<tr><td colspan="${cols.length + 1}" class="raid-empty-row">No ${tab.label.toLowerCase()} logged yet — click "Add" to create the first entry.</td></tr>`
                            : entries.map((e, i) => this._renderRow(e, i, tab.key)).join('')
                        }
                    </tbody>
                </table>
            </div>
        `;
    }

    _getCols(tabKey) {
        if (tabKey === 'risks') return [
            { label: 'ID',          sortKey: null,           width: '58px'  },
            { label: 'Title',       sortKey: 'title',        filterType: 'text'   },
            { label: 'Category',    sortKey: 'category',     width: '110px' },
            { label: 'Probability', sortKey: 'probability',  width: '95px',  filterType: 'level'  },
            { label: 'Impact',      sortKey: 'impact',       width: '75px'  },
            { label: 'Score',       sortKey: 'riskScore',    width: '60px'  },
            { label: 'Owner',       sortKey: 'owner',        width: '120px' },
            { label: 'Status',      sortKey: 'status',       width: '105px', filterType: 'status' },
            { label: 'Review',      sortKey: 'reviewDate',   width: '92px'  }
        ];
        if (tabKey === 'issues') return [
            { label: 'ID',          sortKey: null,           width: '58px'  },
            { label: 'Title',       sortKey: 'title',        filterType: 'text'   },
            { label: 'Category',    sortKey: 'category',     width: '110px' },
            { label: 'Priority',    sortKey: 'priority',     width: '80px',  filterType: 'level'  },
            { label: 'Owner',       sortKey: 'owner',        width: '120px' },
            { label: 'Status',      sortKey: 'status',       width: '105px', filterType: 'status' },
            { label: 'Raised',      sortKey: 'dateRaised',   width: '92px'  },
            { label: 'Target',      sortKey: 'dateResolved', width: '92px'  }
        ];
        if (tabKey === 'assumptions') return [
            { label: 'ID',             sortKey: null,           width: '58px'  },
            { label: 'Title',          sortKey: 'title',        filterType: 'text'   },
            { label: 'Category',       sortKey: 'category',     width: '110px' },
            { label: 'Owner',          sortKey: 'owner',        width: '120px' },
            { label: 'Impact if Wrong',sortKey: 'impactIfWrong',width: '115px', filterType: 'level'  },
            { label: 'Status',         sortKey: 'status',       width: '105px', filterType: 'status' },
            { label: 'Logged',         sortKey: 'dateLogged',   width: '92px'  },
            { label: 'Review',         sortKey: 'reviewDate',   width: '92px'  }
        ];
        if (tabKey === 'decisions') return [
            { label: 'ID',            sortKey: null,           width: '58px'  },
            { label: 'Title',         sortKey: 'title',        filterType: 'text'   },
            { label: 'Decision Maker',sortKey: 'decisionMaker',width: '135px' },
            { label: 'Impact',        sortKey: 'impact',       width: '80px',  filterType: 'level'  },
            { label: 'Status',        sortKey: 'status',       width: '105px', filterType: 'status' },
            { label: 'Raised',        sortKey: 'dateRaised',   width: '92px'  },
            { label: 'Decided',       sortKey: 'dateDecided',  width: '92px'  }
        ];
        if (tabKey === 'changes') return [
            { label: 'ID',           sortKey: null,            width: '58px'  },
            { label: 'Title',        sortKey: 'title',         filterType: 'text'   },
            { label: 'Type',         sortKey: 'changeType',    width: '90px'  },
            { label: 'Priority',     sortKey: 'priority',      width: '80px',  filterType: 'level'  },
            { label: 'Requested By', sortKey: 'requestedBy',   width: '125px' },
            { label: 'Sched Δ',      sortKey: 'scheduleDelta', width: '72px'  },
            { label: 'Cost Δ',       sortKey: 'costDelta',     width: '85px'  },
            { label: 'Status',       sortKey: 'status',        width: '115px', filterType: 'status' },
            { label: 'Submitted',    sortKey: 'dateSubmitted', width: '92px'  }
        ];
        return [];
    }

    _renderRow(e, idx, tabKey) {
        const prefixes = { risks: 'R', issues: 'I', assumptions: 'A', decisions: 'D', changes: 'CR' };
        const seqId    = `${prefixes[tabKey]}-${String(idx + 1).padStart(3, '0')}`;

        const titleCell = `
            <td class="raid-title-cell">
                <span class="raid-title-text" title="${escapeHtml(e.title)}">${escapeHtml(e.title)}</span>
                ${e.description ? `<div class="raid-desc-preview">${escapeHtml(e.description.slice(0, 90))}${e.description.length > 90 ? '…' : ''}</div>` : ''}
            </td>`;

        const lvlBadge = lvl => `<span class="raid-level-badge" style="color:${LEVEL_COLOR[lvl] || 'inherit'}">${lvl || ''}</span>`;
        const stsBadge = sts => `<span class="raid-status-badge" style="color:${STATUS_COLOR[sts] || 'inherit'};border-color:${STATUS_COLOR[sts] || 'var(--glass-border)'}">${sts || ''}</span>`;

        let cells = '';

        if (tabKey === 'risks') {
            const score      = this._riskScore(e);
            const scoreColor = score >= 6 ? 'var(--color-danger)' : score >= 3 ? 'var(--color-warning)' : 'var(--color-success)';
            cells = `
                <td class="raid-id-cell">${seqId}</td>
                ${titleCell}
                <td>${escapeHtml(e.category || '')}</td>
                <td>${lvlBadge(e.probability)}</td>
                <td>${lvlBadge(e.impact)}</td>
                <td><span class="raid-score-badge" style="background:${scoreColor}">${score}</span></td>
                <td>${escapeHtml(e.owner || '')}</td>
                <td>${stsBadge(e.status)}</td>
                <td>${e.reviewDate || '—'}</td>`;
        } else if (tabKey === 'issues') {
            cells = `
                <td class="raid-id-cell">${seqId}</td>
                ${titleCell}
                <td>${escapeHtml(e.category || '')}</td>
                <td>${lvlBadge(e.priority)}</td>
                <td>${escapeHtml(e.owner || '')}</td>
                <td>${stsBadge(e.status)}</td>
                <td>${e.dateRaised || '—'}</td>
                <td>${e.dateResolved || '—'}</td>`;
        } else if (tabKey === 'assumptions') {
            cells = `
                <td class="raid-id-cell">${seqId}</td>
                ${titleCell}
                <td>${escapeHtml(e.category || '')}</td>
                <td>${escapeHtml(e.owner || '')}</td>
                <td>${lvlBadge(e.impactIfWrong)}</td>
                <td>${stsBadge(e.status)}</td>
                <td>${e.dateLogged || '—'}</td>
                <td>${e.reviewDate || '—'}</td>`;
        } else if (tabKey === 'decisions') {
            cells = `
                <td class="raid-id-cell">${seqId}</td>
                ${titleCell}
                <td>${escapeHtml(e.decisionMaker || '')}</td>
                <td>${lvlBadge(e.impact)}</td>
                <td>${stsBadge(e.status)}</td>
                <td>${e.dateRaised || '—'}</td>
                <td>${e.dateDecided || '—'}</td>`;
        } else if (tabKey === 'changes') {
            const cd = Number(e.costDelta) || 0;
            const sd = Number(e.scheduleDelta) || 0;
            cells = `
                <td class="raid-id-cell">${seqId}</td>
                ${titleCell}
                <td>${escapeHtml(e.changeType || '')}</td>
                <td>${lvlBadge(e.priority)}</td>
                <td>${escapeHtml(e.requestedBy || '')}</td>
                <td style="color:${sd > 0 ? 'var(--color-warning)' : sd < 0 ? 'var(--color-success)' : 'var(--color-text-muted)'}">${sd === 0 ? '—' : `${sd >= 0 ? '+' : ''}${sd}d`}</td>
                <td style="color:${cd > 0 ? 'var(--color-danger)' : cd < 0 ? 'var(--color-success)' : 'var(--color-text-muted)'}">${cd === 0 ? '—' : `${cd >= 0 ? '+' : '-'}$${Math.abs(cd).toLocaleString()}`}</td>
                <td>${stsBadge(e.status)}</td>
                <td>${e.dateSubmitted || '—'}</td>`;
        }

        return `<tr class="raid-table-row" data-id="${e.id}">${cells}
            <td class="raid-row-actions">
                ${tabKey === 'risks' ? `<button class="raid-promote-btn" data-id="${e.id}" title="Promote to Issue"><span class="material-symbols-outlined">arrow_upward</span></button>` : ''}
                <button class="raid-edit-btn" data-id="${e.id}" title="Edit"><span class="material-symbols-outlined">edit</span></button>
                <button class="raid-delete-btn" data-id="${e.id}" title="Archive"><span class="material-symbols-outlined">delete</span></button>
            </td>
        </tr>`;
    }

    // ── Modal ────────────────────────────────────────────────────────────────

    _buildModal(state) {
        const tabMeta   = TABS.find(t => t.key === this._tab);
        const editEntry = this._editId ? this._entries(state).find(e => e.id === this._editId) : null;
        const isEdit    = !!editEntry;
        const today     = new Date().toISOString().split('T')[0];
        const v         = (field, def = '') => isEdit ? (editEntry[field] ?? def) : def;
        const sel       = (options, field, def = options[0]) => options.map(o => `<option value="${o}" ${v(field, def) === o ? 'selected' : ''}>${o}</option>`).join('');

        const overlay       = document.createElement('div');
        overlay.id          = 'raid-modal-overlay';
        overlay.className   = 'modal-overlay';
        const addLabel      = tabMeta.key === 'changes' ? 'Change Request' : tabMeta.label.replace(/s$/, '');
        overlay.innerHTML   = `
            <div class="modal-card" style="max-width:660px;">
                <div class="modal-header">
                    <h3 class="modal-title">
                        <span class="material-symbols-outlined" style="color:${tabMeta.color};vertical-align:middle;margin-right:6px;">${tabMeta.icon}</span>
                        ${isEdit ? 'Edit' : 'New'} ${addLabel}
                    </h3>
                    <button class="icon-btn" id="raid-modal-close"><span class="material-symbols-outlined">close</span></button>
                </div>
                <div class="modal-body" style="overflow-y:auto;flex:1 1 auto;padding:20px 24px;">
                    <form id="raid-entry-form" class="raid-form">
                        ${this._buildFormFields(this._tab, v, sel, today)}
                    </form>
                </div>
                <div class="modal-footer" style="display:flex;justify-content:flex-end;gap:10px;padding:14px 24px;border-top:1px solid var(--glass-border);">
                    ${isEdit && tabMeta.key === 'risks' ? `<button class="btn" id="raid-modal-promote" style="margin-right:auto;border-color:var(--color-warning);color:var(--color-warning);"><span class="material-symbols-outlined" style="font-size:15px;vertical-align:middle;margin-right:4px;">arrow_upward</span>Promote to Issue</button>` : ''}
                    <button class="btn btn-secondary" id="raid-modal-cancel">Cancel</button>
                    <button class="btn btn-primary" id="raid-modal-save">${isEdit ? 'Save Changes' : 'Add Entry'}</button>
                </div>
            </div>
        `;
        return overlay;
    }

    _buildFormFields(tabKey, v, sel, today) {
        const row      = (label, input, span2 = false) => `<div class="raid-form-row${span2 ? ' span-2' : ''}"><label class="raid-form-label">${label}</label>${input}</div>`;
        const txt      = (field, ph = '')         => `<input  type="text"   class="raid-form-input" name="${field}" value="${escapeHtml(v(field))}" placeholder="${ph}">`;
        const area     = (field, ph = '', rows=2)  => `<textarea class="raid-form-input raid-form-textarea" name="${field}" placeholder="${ph}" rows="${rows}">${escapeHtml(v(field))}</textarea>`;
        const slt      = (field, opts, def)        => `<select class="raid-form-input" name="${field}">${sel(opts, field, def || opts[0])}</select>`;
        const dt       = (field, def = today)      => `<input  type="date"   class="raid-form-input" name="${field}" value="${v(field, def)}">`;
        const num      = (field, ph = '0')         => `<input  type="number" class="raid-form-input" name="${field}" value="${v(field, 0)}" placeholder="${ph}">`;

        const base     = (row('Title *', txt('title', 'Brief descriptive title…'), false))
                       + (row('Description', area('description', 'Detailed description…', 2), true));

        if (tabKey === 'risks') return `<div class="raid-form-grid">
            ${base}
            ${row('Category',            slt('category',          CATS.risks))}
            ${row('Probability',         slt('probability',       ['High', 'Medium', 'Low'], 'Medium'))}
            ${row('Impact',              slt('impact',            ['High', 'Medium', 'Low'], 'Medium'))}
            ${row('Status',              slt('status',            STATUSES.risks, 'Open'))}
            ${row('Owner',               txt('owner', 'Name / role…'))}
            ${row('Review Date',         dt('reviewDate'))}
            ${row('Mitigation Strategy', area('mitigationStrategy', 'How will this risk be mitigated?', 2), true)}
            ${row('Contingency Plan',    area('contingencyPlan',   'If the risk materialises, what happens?', 2), true)}
        </div>`;

        if (tabKey === 'issues') return `<div class="raid-form-grid">
            ${base}
            ${row('Category',         slt('category',    CATS.issues))}
            ${row('Priority',         slt('priority',    ['Critical', 'High', 'Medium', 'Low'], 'High'))}
            ${row('Status',           slt('status',      STATUSES.issues, 'Open'))}
            ${row('Owner',            txt('owner', 'Name / role…'))}
            ${row('Date Raised',      dt('dateRaised'))}
            ${row('Target Resolution',dt('dateResolved'))}
            ${row('Impact',           area('impact',     'What is the business impact?', 2), true)}
            ${row('Resolution',       area('resolution', 'How was / will this be resolved?', 2), true)}
        </div>`;

        if (tabKey === 'assumptions') return `<div class="raid-form-grid">
            ${base}
            ${row('Category',            slt('category',          CATS.assumptions))}
            ${row('Impact if Wrong',     slt('impactIfWrong',     ['High', 'Medium', 'Low'], 'Medium'))}
            ${row('Status',              slt('status',            STATUSES.assumptions, 'Active'))}
            ${row('Owner',               txt('owner', 'Name / role…'))}
            ${row('Date Logged',         dt('dateLogged'))}
            ${row('Review Date',         dt('reviewDate'))}
            ${row('Mitigation if Invalid', area('mitigationIfInvalid', 'Action to take if this assumption proves wrong…', 2), true)}
        </div>`;

        if (tabKey === 'decisions') return `<div class="raid-form-grid">
            ${base}
            ${row('Decision Made',        area('decisionMade',  'What was decided?', 2), true)}
            ${row('Rationale',            area('rationale',     'Why was this decision made?', 2), true)}
            ${row('Decision Maker',       txt('decisionMaker',  'Name / role…'))}
            ${row('Impact',               slt('impact',         ['High', 'Medium', 'Low'], 'Medium'))}
            ${row('Status',               slt('status',         STATUSES.decisions, 'Pending'))}
            ${row('Date Raised',          dt('dateRaised'))}
            ${row('Date Decided',         dt('dateDecided'))}
            ${row('Alternatives Considered', area('alternatives', 'What other options were evaluated?', 2), true)}
        </div>`;

        if (tabKey === 'changes') return `<div class="raid-form-grid">
            ${base}
            ${row('Change Type',       slt('changeType',    CATS.changes, 'Scope'))}
            ${row('Priority',          slt('priority',      ['Critical', 'High', 'Medium', 'Low'], 'Medium'))}
            ${row('Requested By',      txt('requestedBy',   'Name / role…'))}
            ${row('Status',            slt('status',        STATUSES.changes, 'Submitted'))}
            ${row('Date Submitted',    dt('dateSubmitted'))}
            ${row('Target Resolution', dt('dateResolved'))}
            ${row('Schedule Δ (days)', num('scheduleDelta', '0 = no change'))}
            ${row('Cost Δ ($)',        num('costDelta',     '0 = no change'))}
            ${row('Scope Impact',      area('scopeImpact',  'What scope changes are proposed?', 2), true)}
            ${row('Justification',     area('justification','Business case for this change…', 2), true)}
        </div>`;

        return '';
    }

    // ── Events ───────────────────────────────────────────────────────────────

    _bindEvents(state) {
        // Project tabs
        document.querySelectorAll('.raid-proj-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this._scopeId = btn.dataset.scope;
                this._filters = { status: '', level: '', text: '' };
                this._sort    = { col: null, dir: 'asc' };
                this.render(store.state);
            });
        });

        // Log type tabs
        document.querySelectorAll('.raid-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this._tab     = btn.dataset.tab;
                this._filters = { status: '', level: '', text: '' };
                this._sort    = { col: null, dir: 'asc' };
                this.render(store.state);
            });
        });

        // Sort headers
        document.querySelectorAll('.raid-sort-th').forEach(th => {
            th.addEventListener('click', () => {
                const col  = th.dataset.sort;
                this._sort = this._sort.col === col
                    ? { col, dir: this._sort.dir === 'asc' ? 'desc' : 'asc' }
                    : { col, dir: 'asc' };
                this.render(store.state);
            });
        });

        // Filters
        document.querySelectorAll('.raid-filter').forEach(el => {
            el.addEventListener('click', e => e.stopPropagation());
            el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', () => {
                this._filters[el.dataset.filter] = el.value;
                this.render(store.state);
            });
        });

        // Add button
        document.getElementById('raid-add-btn')?.addEventListener('click', () => {
            this._editId    = null;
            this._showModal = true;
            this.render(store.state);
        });

        // Promote-to-issue buttons (row)
        document.querySelectorAll('.raid-promote-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                this._promoteRiskToIssue(btn.dataset.id);
            });
        });

        // Edit buttons
        document.querySelectorAll('.raid-edit-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                this._editId    = btn.dataset.id;
                this._showModal = true;
                this.render(store.state);
            });
        });

        // Delete (archive) buttons
        document.querySelectorAll('.raid-delete-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const id = btn.dataset.id;
                store.commitTransaction(`Archive ${this._tab} entry`, 'User', s => {
                    this._ensureScope(s, this._scopeId);
                    const arr = s.raidLogs[this._scopeId][this._tab];
                    const idx = arr.findIndex(e => e.id === id);
                    if (idx > -1) arr[idx].isArchived = true;
                });
                this.render(store.state);
            });
        });

        // Modal close helpers
        const closeModal = () => {
            this._showModal = false;
            this._editId    = null;
            document.getElementById('raid-modal-overlay')?.remove();
        };
        document.getElementById('raid-modal-close')?.addEventListener('click',  closeModal);
        document.getElementById('raid-modal-cancel')?.addEventListener('click', closeModal);
        document.getElementById('raid-modal-overlay')?.addEventListener('click', e => {
            if (e.target.id === 'raid-modal-overlay') closeModal();
        });

        // Promote-to-issue from modal footer
        document.getElementById('raid-modal-promote')?.addEventListener('click', () => {
            if (this._editId) {
                closeModal();
                this._promoteRiskToIssue(this._editId);
            }
        });

        // Modal save
        document.getElementById('raid-modal-save')?.addEventListener('click', () => {
            const form = document.getElementById('raid-entry-form');
            if (!form) return;
            const data = Object.fromEntries(new FormData(form).entries());
            if (!data.title?.trim()) { alert('Title is required.'); return; }

            // Coerce numeric fields
            if (data.scheduleDelta !== undefined) data.scheduleDelta = Number(data.scheduleDelta) || 0;
            if (data.costDelta     !== undefined) data.costDelta     = Number(data.costDelta)     || 0;

            store.commitTransaction(
                `${this._editId ? 'Update' : 'Add'} ${this._tab} entry: "${data.title}"`,
                'User',
                s => {
                    this._ensureScope(s, this._scopeId);
                    const arr = s.raidLogs[this._scopeId][this._tab];
                    if (this._editId) {
                        const idx = arr.findIndex(e => e.id === this._editId);
                        if (idx > -1) Object.assign(arr[idx], data);
                    } else {
                        arr.push({ id: 'raid-' + Date.now(), isArchived: false, ...data });
                    }
                }
            );
            this._showModal = false;
            this._editId    = null;
            this.render(store.state);
        });
    }
}

export default RaidView;
