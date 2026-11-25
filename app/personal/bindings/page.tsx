'use client';

import DocumentLink from '@/components/DocumentLink';
import { useCallback, useRef, useState } from 'react';
import { personalQuery, request, type Profile } from '@/lib/member';
import { ActionForm, CurrentPasswordField, Panel, s, value } from '@/components/member/MemberUI';
import PersonalShell from '@/components/member/PersonalShell';
import UIDProof from '@/components/member/UIDProof';
import { MemberDialog } from '@/components/member/MemberDialog';
import { useActionFeedback, type FeedbackAnchor } from '@/components/member/ActionFeedback';

function BindUID({ email, reload }: { email: string; reload: () => Promise<void> }) {
  const storageKey = 'harei-binding-flow:' + email;
  const [flow, setFlow] = useState(() => sessionStorage.getItem(storageKey) || '');
  const setFeedback = useActionFeedback();
  const clear = useCallback(() => {
    sessionStorage.removeItem(storageKey);
    setFlow('');
  }, [storageKey]);
  const onExpired = useCallback(
    (anchor: FeedbackAnchor) => {
      clear();
      setFeedback({ text: '本次验证已过期，请重新开始。', error: true, anchor });
    },
    [clear, setFeedback]
  );
  return (
    <Panel title="绑定新的 UID">
      {flow ? (
        <UIDProof
          key={flow}
          flow={flow}
          onExpired={onExpired}
          done={() => {
            clear();
            void reload();
          }}
        />
      ) : (
        <ActionForm
          submit="获取弹幕验证码"
          action={async () => {
            const { flow: next } = await request<{ flow: string }>('/me/binding-flow', {});
            sessionStorage.setItem(storageKey, next);
            setFlow(next);
          }}
        />
      )}
    </Panel>
  );
}

function BoundUID({
  binding,
  multiple,
  reload
}: {
  binding: Profile['bindings'][number];
  multiple: boolean;
  reload: () => Promise<void>;
}) {
  const [removing, setRemoving] = useState(false);
  const unbindButton = useRef<HTMLButtonElement>(null);
  return (
    <div className={s.card}>
      <div className={s.giftCardHeading}>
        <strong>
          UID {binding.uid}
          {binding.username && ' · ' + binding.username}
        </strong>
        <button
          type="button"
          ref={unbindButton}
          className={s.secondary}
          onClick={() => setRemoving(true)}
        >
          解除绑定
        </button>
      </div>
      {multiple && (
        <DocumentLink
          className={s.uidAddressLink}
          href={'/personal' + personalQuery(binding.uid, 'address') + '#address-' + binding.uid}
        >
          管理此 UID 的地址
        </DocumentLink>
      )}
      {removing && (
        <MemberDialog
          opener={unbindButton}
          title={'解除绑定 UID ' + binding.uid}
          onDismiss={() => setRemoving(false)}
        >
          <ActionForm
            submit="确认解绑"
            action={async (data) => {
              await request('/me/unbind/' + binding.uid, { password: value(data, 'password') });
              await reload();
              setRemoving(false);
            }}
          >
            <CurrentPasswordField />
          </ActionForm>
        </MemberDialog>
      )}
    </div>
  );
}

export default function BindingsPage() {
  return (
    <PersonalShell title="UID绑定" loginQuery={personalQuery(undefined, 'bindings')}>
      {(profile, reload) => (
        <>
          <Panel title="已绑定的 UID">
            {!profile.bindings.length && <p className={s.empty}>尚未绑定 B 站 UID。</p>}
            {profile.bindings.map((b) => (
              <BoundUID
                key={b.uid}
                binding={b}
                multiple={profile.bindings.length > 1}
                reload={reload}
              />
            ))}
          </Panel>
          <BindUID key={profile.email} email={profile.email} reload={reload} />
        </>
      )}
    </PersonalShell>
  );
}
