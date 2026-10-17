-- Everyday search words for foods whose official names are hard to search
-- (e.g. 「にわとり ［若どり・主品目］ むね」 → 鶏むね 鶏胸 チキン).

alter table public.foods add column aliases text;
