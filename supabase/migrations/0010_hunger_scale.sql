-- Hunger is now rated like every other item: 1 = bad (very hungry), 5 = good (not bothered).
-- Flip existing answers so their meaning is unchanged.

update public.daily_checkins set hunger = 6 - hunger where hunger is not null;
