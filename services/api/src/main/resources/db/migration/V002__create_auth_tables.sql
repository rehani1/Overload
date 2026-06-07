create table if not exists app_users (
    id uuid primary key default gen_random_uuid(),
    email varchar(254) not null,
    password_hash varchar(120) not null,
    first_name varchar(80) not null,
    last_name varchar(80) not null,
    goal varchar(200) not null,
    height_inches integer not null check (height_inches >= 24 and height_inches <= 108),
    sex varchar(16) not null check (sex in ('female', 'male')),
    unit_preference varchar(4) not null default 'lb' check (unit_preference in ('lb', 'kg')),
    weight_pounds numeric(7, 2) not null check (weight_pounds > 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists ux_app_users_email_lower
    on app_users (lower(email));

create table if not exists refresh_tokens (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references app_users (id) on delete cascade,
    token_hash varchar(64) not null unique,
    expires_at timestamptz not null,
    revoked_at timestamptz,
    created_at timestamptz not null default now()
);

create index if not exists ix_refresh_tokens_user_id
    on refresh_tokens (user_id);

create index if not exists ix_refresh_tokens_expires_at
    on refresh_tokens (expires_at);

alter table nutrition_targets
    add constraint fk_nutrition_targets_user
    foreign key (user_id) references app_users (id) on delete cascade;

alter table nutrition_entries
    add constraint fk_nutrition_entries_user
    foreign key (user_id) references app_users (id) on delete cascade;
