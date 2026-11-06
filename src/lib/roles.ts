// Roles and what each one may do. Checked on the server for every admin page, action and API call.
export type Role = 'super_admin' | 'editor' | 'viewer';

export type Permission =
  | 'view' // read the dashboard, content, submissions
  | 'content' // edit and publish website content, awardees, events, articles, categories
  | 'media' // upload, replace and delete media
  | 'submissions' // change nomination status, add notes, manage messages, export
  | 'delete' // delete awardees, events, articles, nominations, messages
  | 'users' // create, change and deactivate administrators
  | 'activity' // review the full activity log
  | 'backup'; // download a full backup

const GRANTS: Record<Role, Permission[]> = {
  super_admin: ['view', 'content', 'media', 'submissions', 'delete', 'users', 'activity', 'backup'],
  editor: ['view', 'content', 'media', 'submissions', 'delete'],
  viewer: ['view'],
};

export const can = (role: Role, p: Permission) => GRANTS[role]?.includes(p) ?? false;

export const ROLE_LABELS: Record<Role, string> = { super_admin: 'Super Admin', editor: 'Editor', viewer: 'Viewer' };
export const ROLE_HELP: Record<Role, string> = {
  super_admin: 'Everything, including administrators, the activity log and backups.',
  editor: 'Edits and publishes website content, awardees, events, articles and media; manages nominations and messages.',
  viewer: 'Read-only access to the dashboard, content and submissions.',
};
