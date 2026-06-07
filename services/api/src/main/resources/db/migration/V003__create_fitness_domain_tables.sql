create table if not exists exercises (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references app_users (id) on delete cascade,
    name varchar(160) not null,
    muscle_group varchar(80) not null,
    equipment varchar(80) not null,
    is_custom boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists ix_exercises_user_id
    on exercises (user_id);

create index if not exists ix_exercises_name_lower
    on exercises (lower(name));

insert into exercises (id, name, muscle_group, equipment, is_custom)
values
    ('10000000-0000-4000-8000-000000000001', 'Barbell Bench Press', 'Chest', 'Barbell', false),
    ('10000000-0000-4000-8000-000000000002', 'Back Squat', 'Legs', 'Barbell', false),
    ('10000000-0000-4000-8000-000000000003', 'Deadlift', 'Back', 'Barbell', false),
    ('10000000-0000-4000-8000-000000000004', 'Pull-Up', 'Back', 'Bodyweight', false),
    ('10000000-0000-4000-8000-000000000005', 'Overhead Press', 'Shoulders', 'Barbell', false),
    ('10000000-0000-4000-8000-000000000006', 'Dumbbell Row', 'Back', 'Dumbbell', false),
    ('10000000-0000-4000-8000-000000000007', 'Romanian Deadlift', 'Hamstrings', 'Barbell', false),
    ('10000000-0000-4000-8000-000000000008', 'Leg Press', 'Legs', 'Machine', false)
on conflict (id) do nothing;

create table if not exists workouts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references app_users (id) on delete cascade,
    title varchar(160) not null,
    workout_date date not null,
    notes text,
    status varchar(16) not null default 'completed' check (status in ('active', 'completed')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists ix_workouts_user_date
    on workouts (user_id, workout_date desc);

create table if not exists workout_exercises (
    id uuid primary key default gen_random_uuid(),
    workout_id uuid not null references workouts (id) on delete cascade,
    exercise_id uuid references exercises (id) on delete set null,
    exercise_external_id varchar(120) not null,
    exercise_name varchar(160) not null,
    muscle_group varchar(80) not null,
    equipment varchar(80) not null,
    exercise_is_custom boolean not null default true,
    notes text,
    position integer not null check (position >= 0)
);

create index if not exists ix_workout_exercises_workout_id
    on workout_exercises (workout_id, position);

create table if not exists workout_sets (
    id uuid primary key default gen_random_uuid(),
    workout_exercise_id uuid not null references workout_exercises (id) on delete cascade,
    set_number integer not null check (set_number > 0),
    reps integer not null default 0 check (reps >= 0),
    weight numeric(8, 2) not null default 0 check (weight >= 0),
    weight_unit varchar(4) not null default 'lb' check (weight_unit in ('lb', 'kg')),
    rpe numeric(4, 1) check (rpe is null or (rpe >= 0 and rpe <= 10)),
    is_warmup boolean not null default false
);

create index if not exists ix_workout_sets_workout_exercise_id
    on workout_sets (workout_exercise_id, set_number);

create table if not exists workout_presets (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references app_users (id) on delete cascade,
    title varchar(160) not null,
    workout_json jsonb not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists ix_workout_presets_user_id
    on workout_presets (user_id, created_at desc);

create table if not exists meal_presets (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references app_users (id) on delete cascade,
    food_name varchar(160) not null,
    entry_json jsonb not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists ix_meal_presets_user_id
    on meal_presets (user_id, created_at desc);

create table if not exists programs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references app_users (id) on delete cascade,
    name varchar(160) not null,
    goal varchar(200) not null,
    notes text,
    days_json jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists ix_programs_user_id
    on programs (user_id, created_at desc);
