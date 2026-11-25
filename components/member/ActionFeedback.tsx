'use client';

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction
} from 'react';
import { createPortal } from 'react-dom';
import s from './ActionFeedback.module.css';

const layerOpeners = new WeakMap<Element, HTMLElement>();

export function rememberFeedbackOpener(layer: Element, opener: HTMLElement | null) {
  if (opener) layerOpeners.set(layer, opener);
}

export function feedbackAnchor(element: Element) {
  // Save the button position before async work can close its dialog or replace the form.
  const rect = element.getBoundingClientRect();
  const layer = element.closest('dialog, [popover][role="dialog"]');
  const opener = layer ? layerOpeners.get(layer) : undefined;
  return { element, opener, rect, scrollX: window.scrollX, scrollY: window.scrollY };
}

export type FeedbackAnchor = ReturnType<typeof feedbackAnchor>;

export function submitAnchor(event: FormEvent<HTMLFormElement>) {
  const submitter = (event.nativeEvent as SubmitEvent).submitter;
  return feedbackAnchor(
    submitter ?? event.currentTarget.querySelector('[type="submit"]') ?? event.currentTarget
  );
}

type ActionNotice = { text: string; error?: boolean; anchor: FeedbackAnchor };
type SetNotice = Dispatch<SetStateAction<ActionNotice | null>>;
const FeedbackContext = createContext<SetNotice | null>(null);

export function useActionFeedback() {
  const setNotice = useContext(FeedbackContext);
  if (!setNotice) throw new Error('Action feedback requires ActionFeedbackProvider');
  return setNotice;
}

// A modal makes the rest of the document inert. Keep its toast inside the active layer.
function feedbackHost() {
  const modal = document.querySelector('dialog[open]');
  const panel =
    'showPopover' in HTMLElement.prototype
      ? (modal ?? document).querySelector('[popover][role="dialog"]:popover-open')
      : null;
  return panel ?? modal ?? document.body;
}

function subscribeToLayers(update: () => void) {
  const changed = (event: Event) => {
    if (
      event.target instanceof Element &&
      event.target.matches('dialog, [popover][role="dialog"]')
    ) {
      update();
    }
  };
  document.addEventListener('toggle', changed, true);
  document.addEventListener('close', changed, true);
  return () => {
    document.removeEventListener('toggle', changed, true);
    document.removeEventListener('close', changed, true);
  };
}

function FloatingNotice({ notice, setNotice }: { notice: ActionNotice; setNotice: SetNotice }) {
  const host = useSyncExternalStore(subscribeToLayers, feedbackHost, () => null);
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const toast = ref.current;
    if (!toast?.isConnected) return;
    toast.showPopover?.();
    const anchor = notice.anchor;
    const viewport = window.visualViewport;
    const place = () => {
      const target = anchor.element.getClientRects().length ? anchor.element : anchor.opener;
      const liveRect = target?.getClientRects()[0];
      const rect = liveRect ?? anchor.rect;
      const left = rect.left + (liveRect ? 0 : anchor.scrollX - window.scrollX);
      const top = rect.top + (liveRect ? 0 : anchor.scrollY - window.scrollY);
      const viewLeft = viewport?.offsetLeft ?? 0;
      const viewTop = viewport?.offsetTop ?? 0;
      const viewWidth = viewport?.width ?? document.documentElement.clientWidth;
      const viewHeight = viewport?.height ?? document.documentElement.clientHeight;
      const gap = 8;
      toast.style.setProperty('--notice-viewport-width', Math.max(0, viewWidth - 2 * gap) + 'px');
      const { width, height } = toast.getBoundingClientRect();
      const x = Math.max(
        viewLeft + gap,
        Math.min(left + (rect.width - width) / 2, viewLeft + viewWidth - width - gap)
      );
      const above = top - gap - height;
      const y = above >= viewTop + gap ? above : top + rect.height + gap;
      toast.style.left = x + 'px';
      toast.style.top =
        Math.max(viewTop + gap, Math.min(y, viewTop + viewHeight - gap - height)) + 'px';
      toast.style.visibility =
        left + rect.width > viewLeft &&
        left < viewLeft + viewWidth &&
        top + rect.height > viewTop &&
        top < viewTop + viewHeight
          ? 'visible'
          : 'hidden';
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(toast);
    observer.observe(anchor.element);
    observer.observe(document.body);
    if (anchor.opener) observer.observe(anchor.opener);
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    viewport?.addEventListener('resize', place);
    viewport?.addEventListener('scroll', place);
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
      viewport?.removeEventListener('scroll', place);
      viewport?.removeEventListener('resize', place);
      if (toast.isConnected) toast.hidePopover?.();
    };
  }, [host, notice]);

  useEffect(() => {
    const dismiss = () => setNotice((current) => (current === notice ? null : current));
    const outside = (event: Event) => {
      if (ref.current && !event.composedPath().includes(ref.current)) dismiss();
    };
    const keyboardClick = (event: MouseEvent) => {
      if (event.detail === 0) outside(event);
    };
    const timer = window.setTimeout(dismiss, 5000);
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('click', keyboardClick, true);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('pointerdown', outside, true);
      document.removeEventListener('click', keyboardClick, true);
    };
  }, [notice, setNotice]);

  return (
    host &&
    createPortal(
      <div ref={ref} popover="manual" className={s.toast} role={notice.error ? 'alert' : 'status'}>
        {notice.text}
      </div>,
      host
    )
  );
}

export function ActionFeedbackProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<ActionNotice | null>(null);
  return (
    <FeedbackContext.Provider value={setNotice}>
      {children}
      {notice && <FloatingNotice notice={notice} setNotice={setNotice} />}
    </FeedbackContext.Provider>
  );
}
