/* Browser-local saves with validation, a last-good backup and stale-write detection.
   Inject storage and validation for deterministic Node tests; no network access. */
(function (root) {
  'use strict';
  const key = mode => `forest-child-mvp-v2-${mode}`;
  function create(storage, validate) {
    const decode = (raw, mode) => {
      if (!raw) return null;
      try { const state = JSON.parse(raw); return validate(state) && state.mode === mode ? state : null; }
      catch { return null; }
    };
    function read(mode) {
      try {
        const token = storage.getItem(key(mode)), state = decode(token, mode);
        if (state) return {state, token};
        const backup = decode(storage.getItem(`${key(mode)}-backup`), mode);
        return {state: backup, token, recovered: !!backup, unreadable: !!token && !backup};
      } catch { return {state: null, token: null, unavailable: true}; }
    }
    function commit(state, expected = null) {
      if (!validate(state)) return {ok: false, reason: 'invalid-state'};
      try {
        const primary = key(state.mode), current = storage.getItem(primary);
        // Conservative optimistic conflict detection. Never force stale state over another tab.
        if (current !== expected) return {ok: false, reason: 'conflict', ...read(state.mode)};
        const token = JSON.stringify(state);
        if (current !== token) {
          // A quota/security error while backing up must leave the original untouched.
          if (current !== null) storage.setItem(`${primary}-${decode(current, state.mode) ? 'backup' : 'unreadable'}`, current);
          storage.setItem(primary, token);
        }
        // The preferred mode is not the save. Failure here must not misreport a successful save.
        try { storage.setItem('forest-child-mvp-mode', state.mode); } catch { /* Optional preference. */ }
        return {ok: true, token};
      } catch { return {ok: false, reason: 'storage-unavailable'}; }
    }
    function clear(mode) {
      try {
        for (const suffix of ['-backup', '-unreadable', '']) storage.removeItem(key(mode) + suffix);
        return true;
      } catch { return false; }
    }
    return Object.freeze({read, commit, clear});
  }
  const api = Object.freeze({key, create});
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ForestPersistence = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
