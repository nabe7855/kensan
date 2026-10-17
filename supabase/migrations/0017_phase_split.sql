-- User-chosen phase lengths in weeks ({"early": n, "mid": n, "peak": n}); late takes the rest.
-- Null keeps the default split.
alter table public.preps
  add column phase_split jsonb
    check (
      phase_split is null or (
        jsonb_typeof(phase_split) = 'object'
        and (phase_split ->> 'early')::int between 0 and 104
        and (phase_split ->> 'mid')::int between 0 and 104
        and (phase_split ->> 'peak')::int between 0 and 8
      )
    );
