-- Bodyweight exercises: the body weight used for a set (weight_kg stays the total load,
-- so added load = weight_kg - bodyweight_kg). Null for ordinary weighted sets.
alter table public.workout_sets
  add column bodyweight_kg numeric(5, 2) check (bodyweight_kg > 0);
