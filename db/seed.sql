insert into permissions (key, description) values
('portfolio.read', 'Read authorized portfolio data'),
('project.update', 'Update authorized project and task data'),
('finance.read', 'Read financial data'),
('finance.update', 'Update financial data'),
('audit.read', 'Read audit and security logs'),
('audit.rollback', 'Rollback audited transactions'),
('ai.propose', 'Use Copilot to generate analysis and proposals'),
('ai.apply', 'Apply approved Copilot proposals'),
('access.manage', 'Manage users, roles, memberships, and access requests'),
('governance.manage', 'Manage delegation, approvals, reviews, and break-glass')
on conflict (key) do update set description = excluded.description;

insert into roles (key, name, description) values
('system-admin', 'System Admin', 'Full platform and access administration'),
('portfolio-executive', 'Portfolio Executive', 'Executive read access across portfolio value and audit summaries'),
('portfolio-manager', 'Portfolio Manager', 'Manage portfolio/project execution within assigned hierarchy'),
('project-manager', 'Project Manager', 'Manage assigned project delivery'),
('contributor', 'Contributor', 'Update assigned execution work'),
('viewer', 'Viewer', 'Read-only workspace access'),
('auditor', 'Auditor', 'Read-only audit and governance access')
on conflict (key) do update set name = excluded.name, description = excluded.description;

insert into role_permissions (role_id, permission_key)
select r.id, p.key
from roles r
cross join permissions p
where r.key = 'system-admin'
on conflict do nothing;

insert into role_permissions (role_id, permission_key)
select r.id, p.key
from roles r
join permissions p on p.key in ('portfolio.read', 'finance.read', 'audit.read', 'ai.propose')
where r.key = 'portfolio-executive'
on conflict do nothing;

insert into role_permissions (role_id, permission_key)
select r.id, p.key
from roles r
join permissions p on p.key in ('portfolio.read', 'project.update', 'finance.read', 'ai.propose', 'ai.apply')
where r.key = 'portfolio-manager'
on conflict do nothing;

insert into role_permissions (role_id, permission_key)
select r.id, p.key
from roles r
join permissions p on p.key in ('portfolio.read', 'project.update', 'ai.propose')
where r.key in ('project-manager', 'contributor')
on conflict do nothing;

insert into role_permissions (role_id, permission_key)
select r.id, p.key
from roles r
join permissions p on p.key = 'portfolio.read'
where r.key = 'viewer'
on conflict do nothing;

insert into role_permissions (role_id, permission_key)
select r.id, p.key
from roles r
join permissions p on p.key in ('portfolio.read', 'audit.read')
where r.key = 'auditor'
on conflict do nothing;

insert into hierarchy_nodes (id, node_type, name, parent_id, metadata) values
('enterprise-global', 'enterprise', 'Enterprise (Global Corp)', null, '{}'),
('portfolio-sustainable-agriculture', 'portfolio', 'Sustainable Agriculture', 'enterprise-global', '{}'),
('prog-logistics-fleet', 'program', 'Logistics & Fleet', 'portfolio-sustainable-agriculture', '{"icon":"account_tree"}'),
('scope-route-optimization', 'project', 'Route-Optimization AI Engine Integration', 'prog-logistics-fleet', '{}'),
('scope-transport-fleet', 'project', 'Procure fleet of 10 Hybrid/Electric Commercial Vehicles', 'prog-logistics-fleet', '{}'),
('scope-safety-module', 'project', 'Warehouse Compliance & Safety Automation Module', 'portfolio-sustainable-agriculture', '{}')
on conflict (id) do update set
    node_type = excluded.node_type,
    name = excluded.name,
    parent_id = excluded.parent_id,
    metadata = excluded.metadata;
