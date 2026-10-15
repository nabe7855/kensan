-- Meal planning: a meal (date × slot) can be planned or eaten, carries the set it came from,
-- and sets (meal templates) can be grouped into variants (e.g. 鯖 / 鶏むね / 鶏もも).

alter table public.meal_logs
  add column eaten_at timestamptz,
  add column title text,
  add column template_id uuid;

-- Everything logged before planning existed was eaten.
update public.meal_logs set eaten_at = created_at where eaten_at is null;

alter table public.meal_logs
  add constraint meal_logs_template_fkey
    foreign key (template_id, user_id) references public.meal_templates (id, user_id)
    on delete set null (template_id);

alter table public.meal_templates add column group_name text;

create index meal_templates_group_idx on public.meal_templates (user_id, group_name);
