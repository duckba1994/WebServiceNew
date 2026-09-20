import React, { createContext, Dispatch, SetStateAction, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { discardDraftScope, draftGeneration, readDraft, registerDraft, releaseDraft, writeDraft } from '../utils/sessionDrafts';

const Scope = createContext('');
export function DraftScope({ name, children }: { name: string; children: React.ReactNode }) {
  const parent = useContext(Scope);
  return <Scope.Provider value={`${parent}/${encodeURIComponent(name)}`}>{children}</Scope.Provider>;
}

export function useDiscardSessionDraft() {
  const scope = useContext(Scope);
  return useCallback((name: string) => discardDraftScope(`${scope}/${encodeURIComponent(name)}`), [scope]);
}

type DraftSetter<T> = Dispatch<SetStateAction<T>> & {
  readonly restored: boolean;
  /** API defaults may fill untouched state, but must never overwrite a user's draft. */
  hydrate: Dispatch<SetStateAction<T>>;
  /** Explicit save/cancel/reset: replace the value and mark it as clean. */
  reset: Dispatch<SetStateAction<T>>;
};

// Keys are explicit and stable. Add this hook + a DraftScope to future forms.
// Do not register permissions, tokens, pending flags, confirmation state or files.
export function useSessionDraft<T>(name: string, initial: T | (() => T)): [T, DraftSetter<T>] {
  const scope = useContext(Scope);
  const key = `${scope}/${name}`;
  const version = useRef(draftGeneration()).current;
  const saved = useRef(scope ? readDraft(key) : undefined).current;
  const dirty = useRef(saved?.dirty ?? false);
  const [value, setValue] = useState<T>(() => saved ? saved.value as T : typeof initial === 'function' ? (initial as () => T)() : initial);
  const latest = useRef(value);
  latest.current = value;

  const setter = useMemo(() => {
    const update = (next: SetStateAction<T>, isDirty: boolean) => {
      const resolved = typeof next === 'function' ? (next as (previous: T) => T)(latest.current) : next;
      latest.current = resolved;
      dirty.current = isDirty;
      // Synchronous write: a 401 in the same event cannot lose the last keystroke.
      if (scope) writeDraft(key, resolved, isDirty, version);
      setValue(resolved);
    };
    const set = ((next: SetStateAction<T>) => update(next, true)) as DraftSetter<T>;
    Object.defineProperty(set, 'restored', { value: !!saved });
    set.hydrate = next => { if (!dirty.current) update(next, false); };
    set.reset = next => update(next, false);
    return set;
  }, [key, scope, version, saved]);

  useLayoutEffect(() => {
    if (!scope) return;
    const lease = Symbol(key);
    registerDraft(key, lease);
    writeDraft(key, latest.current, dirty.current, version);
    return () => releaseDraft(key, lease, version);
  }, [key, scope, version]);
  return [value, setter];
}
