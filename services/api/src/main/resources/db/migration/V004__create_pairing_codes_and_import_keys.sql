create table if not exists auth_pairing_codes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references app_users (id) on delete cascade,
    code_hash varchar(64) not null unique,
    expires_at timestamptz not null,
    claimed_at timestamptz,
    created_at timestamptz not null default now()
);

create index if not exists ix_auth_pairing_codes_user_id
    on auth_pairing_codes (user_id, created_at desc);

create index if not exists ix_auth_pairing_codes_expires_at
    on auth_pairing_codes (expires_at);

alter table workouts
    add column if not exists client_import_id varchar(160);

create unique index if not exists ux_workouts_user_client_import_id
    on workouts (user_id, client_import_id)
    where client_import_id is not null;

alter table workout_presets
    add column if not exists client_import_id varchar(160);

create unique index if not exists ux_workout_presets_user_client_import_id
    on workout_presets (user_id, client_import_id)
    where client_import_id is not null;

alter table meal_presets
    add column if not exists client_import_id varchar(160);

create unique index if not exists ux_meal_presets_user_client_import_id
    on meal_presets (user_id, client_import_id)
    where client_import_id is not null;
