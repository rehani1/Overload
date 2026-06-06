create extension if not exists pgcrypto;

create table if not exists nutrition_targets (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    daily_calories integer not null check (daily_calories >= 0 and daily_calories <= 20000),
    protein_grams numeric(7, 2) not null default 0 check (protein_grams >= 0),
    carbs_grams numeric(7, 2) not null default 0 check (carbs_grams >= 0),
    fat_grams numeric(7, 2) not null default 0 check (fat_grams >= 0),
    effective_from date not null default current_date,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists ux_nutrition_targets_user_effective_from
    on nutrition_targets (user_id, effective_from);

create table if not exists nutrition_entries (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    client_id uuid,
    log_date date not null,
    meal_type varchar(24) not null check (
        meal_type in ('breakfast', 'lunch', 'dinner', 'snack')
    ),
    food_name varchar(160) not null,
    serving_quantity numeric(7, 2) not null default 1 check (serving_quantity > 0),
    calories integer not null default 0 check (calories >= 0 and calories <= 20000),
    protein_grams numeric(7, 2) not null default 0 check (protein_grams >= 0),
    carbs_grams numeric(7, 2) not null default 0 check (carbs_grams >= 0),
    fat_grams numeric(7, 2) not null default 0 check (fat_grams >= 0),
    notes text,
    source varchar(24) not null default 'manual' check (
        source in ('manual', 'barcode', 'imported')
    ),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists ux_nutrition_entries_user_client_id
    on nutrition_entries (user_id, client_id)
    where client_id is not null;

create index if not exists ix_nutrition_entries_user_log_date
    on nutrition_entries (user_id, log_date desc);

create index if not exists ix_nutrition_entries_user_meal_type
    on nutrition_entries (user_id, meal_type);

create or replace view nutrition_daily_summaries as
select
    user_id,
    log_date,
    count(*) as entry_count,
    sum(calories)::integer as calories,
    sum(protein_grams) as protein_grams,
    sum(carbs_grams) as carbs_grams,
    sum(fat_grams) as fat_grams
from nutrition_entries
group by user_id, log_date;
