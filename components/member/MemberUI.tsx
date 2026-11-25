'use client';

import { useState, type ReactNode, type InputHTMLAttributes, type Ref } from 'react';
import type { Address } from '@/lib/member';
import { submitAnchor, useActionFeedback } from './ActionFeedback';
import s from './member.module.css';

export { s };
export const value = (form: FormData, name: string) => String(form.get(name) ?? '');
export const errorText = (err: unknown) =>
  err instanceof Error ? err.message : '请求未完成，请重试';

export function Panel({
  title,
  children,
  aside
}: {
  title: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className={s.panel}>
      <header className={s.panelHeading}>
        <h2>{title}</h2>
        {aside}
      </header>
      {children}
    </section>
  );
}

export function Field({
  label,
  ...props
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={s.field}>
      <span>{label}</span>
      <input required {...props} />
    </label>
  );
}

export function CurrentPasswordField() {
  return <Field label="当前密码" name="password" type="password" autoComplete="current-password" />;
}

export function ActionForm({
  children,
  submit,
  action,
  disabled,
  submitRef,
  inline = false
}: {
  children?: ReactNode;
  submit: string;
  disabled?: boolean;
  submitRef?: Ref<HTMLButtonElement>;
  inline?: boolean;
  action: (data: FormData) => Promise<string | void>;
}) {
  const [busy, setBusy] = useState(false);
  const setNote = useActionFeedback();
  return (
    <form
      method="post"
      className={inline ? `${s.form} ${s.inlineForm}` : s.form}
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy || disabled) return;
        const data = new FormData(event.currentTarget);
        const anchor = submitAnchor(event);
        setBusy(true);
        setNote(null);
        try {
          setNote({ text: (await action(data)) || '已保存', anchor });
        } catch (error) {
          setNote({ text: errorText(error), error: true, anchor });
        } finally {
          setBusy(false);
        }
      }}
    >
      {children}
      <button ref={submitRef} type="submit" disabled={busy || disabled}>
        {busy ? '处理中…' : submit}
      </button>
    </form>
  );
}

export function AddressFields({ address }: { address?: Address | null }) {
  return (
    <>
      <Field
        name="name"
        label="收件人"
        maxLength={60}
        defaultValue={address?.name}
        autoComplete="name"
      />
      <Field
        name="phone"
        label="中国大陆手机号"
        type="tel"
        pattern="1[0-9]{10}"
        maxLength={11}
        defaultValue={address?.phone}
        autoComplete="tel"
      />
      <Field
        name="address"
        label="详细地址（含省市区）"
        minLength={3}
        maxLength={300}
        defaultValue={address?.address}
        autoComplete="street-address"
      />
    </>
  );
}
export const readAddress = (data: FormData): Address => ({
  name: value(data, 'name'),
  phone: value(data, 'phone'),
  address: value(data, 'address')
});
