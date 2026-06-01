create extension if not exists pgcrypto;

create table if not exists profiles (
    id uuid primary key default gen_random_uuid(),
    clerk_user_id text not null unique,
    display_name text not null,
    email text not null,
    title text default '',
    department text default '',
    avatar_url text default '',
    status text not null default 'active',
    timezone text not null default 'Pacific/Auckland',
    notification_preferences jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists roles (
    id uuid primary key default gen_random_uuid(),
    key text not null unique,
    name text not null,
    description text default '',
    is_system boolean not null default true,
    created_at timestamptz not null default now()
);

create table if not exists permissions (
    key text primary key,
    description text not null
);

create table if not exists role_permissions (
    role_id uuid not null references roles(id) on delete cascade,
    permission_key text not null references permissions(key) on delete cascade,
    primary key (role_id, permission_key)
);

create table if not exists hierarchy_nodes (
    id text primary key,
    node_type text not null check (node_type in ('enterprise', 'portfolio', 'program', 'project')),
    name text not null,
    parent_id text references hierarchy_nodes(id) on delete cascade,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create table if not exists memberships (
    id uuid primary key default gen_random_uuid(),
    profile_id uuid not null references profiles(id) on delete cascade,
    role_id uuid not null references roles(id) on delete restrict,
    hierarchy_node_id text not null references hierarchy_nodes(id) on delete cascade,
    inherits_down boolean not null default true,
    status text not null default 'active',
    starts_at timestamptz not null default now(),
    ends_at timestamptz,
    granted_by_clerk_user_id text,
    created_at timestamptz not null default now()
);

create table if not exists access_requests (
    id uuid primary key default gen_random_uuid(),
    requester_clerk_user_id text not null,
    requested_role_key text not null,
    hierarchy_node_id text not null references hierarchy_nodes(id) on delete cascade,
    reason text not null,
    status text not null default 'pending',
    decided_by_clerk_user_id text,
    decided_at timestamptz,
    created_at timestamptz not null default now()
);

create table if not exists approval_workflows (
    id uuid primary key default gen_random_uuid(),
    subject_type text not null,
    subject_id uuid not null,
    status text not null default 'pending',
    required_permission_key text,
    approver_clerk_user_id text,
    decided_at timestamptz,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create table if not exists delegations (
    id uuid primary key default gen_random_uuid(),
    grantor_clerk_user_id text not null,
    delegate_clerk_user_id text not null,
    role_key text not null,
    hierarchy_node_id text not null references hierarchy_nodes(id) on delete cascade,
    starts_at timestamptz not null,
    ends_at timestamptz not null,
    reason text not null,
    status text not null default 'active',
    created_at timestamptz not null default now()
);

create table if not exists break_glass_events (
    id uuid primary key default gen_random_uuid(),
    actor_clerk_user_id text not null,
    hierarchy_node_id text not null references hierarchy_nodes(id) on delete cascade,
    permission_key text not null,
    reason text not null,
    expires_at timestamptz not null,
    status text not null default 'active',
    review_required boolean not null default true,
    reviewed_by_clerk_user_id text,
    reviewed_at timestamptz,
    created_at timestamptz not null default now()
);

create table if not exists audit_events (
    id uuid primary key default gen_random_uuid(),
    actor_clerk_user_id text,
    event_type text not null,
    permission_key text,
    hierarchy_node_id text references hierarchy_nodes(id) on delete set null,
    summary text not null,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create table if not exists portfolio_snapshots (
    id uuid primary key default gen_random_uuid(),
    hierarchy_node_id text references hierarchy_nodes(id) on delete set null,
    snapshot_type text not null,
    data jsonb not null,
    created_by_clerk_user_id text,
    created_at timestamptz not null default now()
);

create index if not exists idx_memberships_profile on memberships(profile_id);
create index if not exists idx_memberships_scope on memberships(hierarchy_node_id);
create index if not exists idx_audit_events_created_at on audit_events(created_at desc);
create index if not exists idx_access_requests_status on access_requests(status);
create index if not exists idx_delegations_delegate on delegations(delegate_clerk_user_id, status);
create index if not exists idx_break_glass_actor on break_glass_events(actor_clerk_user_id, status);
