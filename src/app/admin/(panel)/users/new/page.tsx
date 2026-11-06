import { requirePage } from '@/lib/server/auth';
import { emailEnabled } from '@/lib/server/email';
import { ROLE_HELP, ROLE_LABELS, type Role } from '@/lib/roles';
import { ActionForm, Submit } from '@/components/admin/forms';
import { Card, Field, PageHead } from '@/components/admin/ui';
import { inviteUser } from '../../../actions/users';

export const metadata = { title: 'Invite administrator' };

export default async function InviteUserPage() {
  await requirePage('users');
  return (
    <>
      <PageHead
        title="Invite administrator"
        description={emailEnabled() ? 'They receive an email with a link to choose their own password. You also get the link here.' : 'You get a one-time link to send them. They use it to choose their own password.'}
        back={{ href: '/admin/users/', label: 'Administrators' }}
      />
      <Card>
        <ActionForm action={inviteUser} className="stack" reset>
          <Field name="name" label="Name" required maxLength={100} />
          <Field name="email" label="Email" type="email" required maxLength={200} />
          <fieldset className="f">
            <legend className="f-label">Role</legend>
            <div className="radio-list">
              {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                <label key={r}>
                  <input type="radio" name="role" value={r} defaultChecked={r === 'editor'} required /> <b>{ROLE_LABELS[r]}</b>
                  <span className="f-hint">{ROLE_HELP[r]}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div><Submit>Create invitation</Submit></div>
        </ActionForm>
      </Card>
    </>
  );
}

