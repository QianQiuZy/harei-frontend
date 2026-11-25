'use client';

import DocumentLink from '@/components/DocumentLink';
import { personalQuery } from '@/lib/member';
import { Panel, s } from '@/components/member/MemberUI';
import PersonalShell from '@/components/member/PersonalShell';

export default function SecurityPage() {
  return (
    <PersonalShell title="账号安全" loginQuery={personalQuery(undefined, 'security')}>
      {() => (
        <Panel title="登录与账号管理">
          <nav className={s.securityMenu} aria-label="账号安全操作">
            {[
              ['/account/change-password', '修改密码'],
              ['/account/change-email', '换绑邮箱'],
              ['/account/delete-account', '注销账号'],
              ['/account/appeal?section=security', '账号申诉']
            ].map(([href, label]) => (
              <DocumentLink key={href} href={href}>
                {label}
                <span aria-hidden="true">›</span>
              </DocumentLink>
            ))}
          </nav>
        </Panel>
      )}
    </PersonalShell>
  );
}
