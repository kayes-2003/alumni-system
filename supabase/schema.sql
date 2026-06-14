-- =====================================================================
-- ALUMNI MANAGEMENT SYSTEM — SUPABASE SQL SCHEMA
-- Run this in the Supabase SQL Editor (or via `supabase db push`)
-- =====================================================================

-- ---------------------------------------------------------------------
-- EXTENSIONS
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- ENUM TYPES
-- ---------------------------------------------------------------------
create type user_role as enum ('admin', 'alumni', 'student');
create type membership_plan as enum ('monthly', 'yearly', 'lifetime');
create type membership_status as enum ('active', 'expired', 'cancelled', 'pending');
create type verification_status as enum ('pending', 'verified', 'rejected');
create type job_type as enum ('full-time', 'part-time', 'internship', 'contract');
create type mentorship_status as enum ('pending', 'accepted', 'rejected', 'completed');

-- ---------------------------------------------------------------------
-- DEPARTMENTS
-- ---------------------------------------------------------------------
create table departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text not null unique,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- BATCHES
-- ---------------------------------------------------------------------
create table batches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_year int not null,
  end_year int not null,
  created_at timestamptz not null default now(),
  unique (name, start_year, end_year)
);

-- ---------------------------------------------------------------------
-- PROFILES  (1:1 with auth.users)
-- ---------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role user_role not null default 'student',
  avatar_url text,
  phone text,
  bio text,
  department_id uuid references departments(id) on delete set null,
  batch_id uuid references batches(id) on delete set null,
  graduation_year int,
  current_job_title text,
  current_company text,
  location text,
  skills text[] default '{}',
  linkedin_url text,
  github_url text,
  website_url text,
  is_profile_public boolean not null default true,
  verification_status verification_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_role on profiles(role);
create index idx_profiles_department on profiles(department_id);
create index idx_profiles_batch on profiles(batch_id);
create index idx_profiles_graduation_year on profiles(graduation_year);
create index idx_profiles_full_name on profiles using gin (full_name gin_trgm_ops);

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------
-- MEMBERSHIPS
-- ---------------------------------------------------------------------
create table memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  plan membership_plan not null,
  status membership_status not null default 'pending',
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  stripe_subscription_id text,
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

create index idx_memberships_user on memberships(user_id);
create index idx_memberships_status on memberships(status);

-- ---------------------------------------------------------------------
-- PAYMENTS
-- ---------------------------------------------------------------------
create table payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  membership_id uuid references memberships(id) on delete set null,
  amount numeric(10,2) not null,
  currency text not null default 'usd',
  status text not null default 'pending',
  stripe_payment_intent_id text,
  stripe_invoice_id text,
  created_at timestamptz not null default now()
);

create index idx_payments_user on payments(user_id);

-- ---------------------------------------------------------------------
-- EVENTS
-- ---------------------------------------------------------------------
create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  banner_url text,
  location text,
  is_virtual boolean not null default false,
  start_time timestamptz not null,
  end_time timestamptz not null,
  capacity int,
  created_by uuid not null references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_events_start_time on events(start_time);

-- ---------------------------------------------------------------------
-- EVENT REGISTRATIONS
-- ---------------------------------------------------------------------
create table event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  checked_in boolean not null default false,
  qr_code text not null default encode(gen_random_bytes(16), 'hex'),
  registered_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index idx_event_registrations_event on event_registrations(event_id);
create index idx_event_registrations_user on event_registrations(user_id);

-- ---------------------------------------------------------------------
-- JOBS
-- ---------------------------------------------------------------------
create table jobs (
  id uuid primary key default gen_random_uuid(),
  posted_by uuid not null references profiles(id) on delete cascade,
  title text not null,
  company text not null,
  location text,
  job_type job_type not null,
  description text not null,
  requirements text,
  apply_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_jobs_active on jobs(is_active);
create index idx_jobs_posted_by on jobs(posted_by);

-- ---------------------------------------------------------------------
-- JOB APPLICATIONS
-- ---------------------------------------------------------------------
create table job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  applicant_id uuid not null references profiles(id) on delete cascade,
  cover_letter text,
  resume_url text,
  status text not null default 'submitted',
  applied_at timestamptz not null default now(),
  unique (job_id, applicant_id)
);

create index idx_job_applications_job on job_applications(job_id);
create index idx_job_applications_applicant on job_applications(applicant_id);

-- ---------------------------------------------------------------------
-- MENTORSHIP REQUESTS
-- ---------------------------------------------------------------------
create table mentorship_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  alumni_id uuid not null references profiles(id) on delete cascade,
  message text not null,
  status mentorship_status not null default 'pending',
  scheduled_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_mentorship_student on mentorship_requests(student_id);
create index idx_mentorship_alumni on mentorship_requests(alumni_id);

-- ---------------------------------------------------------------------
-- POSTS (Community Feed)
-- ---------------------------------------------------------------------
create table posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  image_url text,
  department_id uuid references departments(id) on delete set null,
  batch_id uuid references batches(id) on delete set null,
  likes_count int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_posts_author on posts(author_id);
create index idx_posts_created_at on posts(created_at desc);

-- ---------------------------------------------------------------------
-- POST LIKES (join table to enforce one-like-per-user)
-- ---------------------------------------------------------------------
create table post_likes (
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- ---------------------------------------------------------------------
-- COMMENTS
-- ---------------------------------------------------------------------
create table comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index idx_comments_post on comments(post_id);

-- ---------------------------------------------------------------------
-- NOTIFICATIONS
-- ---------------------------------------------------------------------
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  message text not null,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on notifications(user_id, is_read);

-- ---------------------------------------------------------------------
-- DIRECT MESSAGES
-- ---------------------------------------------------------------------
create table messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references profiles(id) on delete cascade,
  receiver_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_messages_sender on messages(sender_id);
create index idx_messages_receiver on messages(receiver_id);
create index idx_messages_conversation on messages(sender_id, receiver_id, created_at);

-- ---------------------------------------------------------------------
-- GALLERY
-- ---------------------------------------------------------------------
create table gallery (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  image_url text not null,
  caption text,
  uploaded_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index idx_gallery_event on gallery(event_id);

-- ---------------------------------------------------------------------
-- NEWS / BLOG POSTS (admin-managed announcements)
-- ---------------------------------------------------------------------
create table news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  content text not null,
  cover_image_url text,
  author_id uuid not null references profiles(id) on delete set null,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_news_published on news(is_published, published_at desc);

-- ---------------------------------------------------------------------
-- CONTACT MESSAGES
-- ---------------------------------------------------------------------
create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  is_resolved boolean not null default false,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- TRIGGERS & FUNCTIONS
-- =====================================================================

-- Auto-create a profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'student'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Generic updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on profiles
  for each row execute procedure public.set_updated_at();

-- Keep posts.likes_count in sync with post_likes
create or replace function public.handle_post_like()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'INSERT') then
    update posts set likes_count = likes_count + 1 where id = new.post_id;
  elsif (tg_op = 'DELETE') then
    update posts set likes_count = greatest(likes_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

create trigger on_post_like_change
  after insert or delete on post_likes
  for each row execute procedure public.handle_post_like();

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================

alter table profiles enable row level security;
alter table departments enable row level security;
alter table batches enable row level security;
alter table memberships enable row level security;
alter table payments enable row level security;
alter table events enable row level security;
alter table event_registrations enable row level security;
alter table jobs enable row level security;
alter table job_applications enable row level security;
alter table mentorship_requests enable row level security;
alter table posts enable row level security;
alter table post_likes enable row level security;
alter table comments enable row level security;
alter table notifications enable row level security;
alter table messages enable row level security;
alter table gallery enable row level security;
alter table news enable row level security;
alter table contact_messages enable row level security;

-- ---------------------------------------------------------------------
-- Helper: is_admin()
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------
-- PROFILES POLICIES
-- ---------------------------------------------------------------------
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using (is_profile_public = true or auth.uid() = id or is_admin());

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admins can update any profile"
  on profiles for update
  using (is_admin());

create policy "Admins can view all profiles"
  on profiles for select
  using (is_admin());

-- ---------------------------------------------------------------------
-- DEPARTMENTS / BATCHES — readable by everyone, writable by admins
-- ---------------------------------------------------------------------
create policy "Departments are viewable by everyone"
  on departments for select using (true);

create policy "Admins manage departments"
  on departments for all using (is_admin()) with check (is_admin());

create policy "Batches are viewable by everyone"
  on batches for select using (true);

create policy "Admins manage batches"
  on batches for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------
-- MEMBERSHIPS
-- ---------------------------------------------------------------------
create policy "Users view own memberships"
  on memberships for select using (auth.uid() = user_id or is_admin());

create policy "Users insert own memberships"
  on memberships for insert with check (auth.uid() = user_id);

create policy "Admins manage memberships"
  on memberships for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------
-- PAYMENTS
-- ---------------------------------------------------------------------
create policy "Users view own payments"
  on payments for select using (auth.uid() = user_id or is_admin());

create policy "Admins manage payments"
  on payments for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------
-- EVENTS
-- ---------------------------------------------------------------------
create policy "Events are viewable by everyone"
  on events for select using (true);

create policy "Admins manage events"
  on events for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------
-- EVENT REGISTRATIONS
-- ---------------------------------------------------------------------
create policy "Users view own registrations"
  on event_registrations for select using (auth.uid() = user_id or is_admin());

create policy "Users register themselves"
  on event_registrations for insert with check (auth.uid() = user_id);

create policy "Users cancel own registration"
  on event_registrations for delete using (auth.uid() = user_id or is_admin());

create policy "Admins manage registrations"
  on event_registrations for update using (is_admin());

-- ---------------------------------------------------------------------
-- JOBS
-- ---------------------------------------------------------------------
create policy "Active jobs are viewable by everyone"
  on jobs for select using (is_active = true or auth.uid() = posted_by or is_admin());

create policy "Alumni and admins can post jobs"
  on jobs for insert
  with check (
    auth.uid() = posted_by
    and exists (select 1 from profiles where id = auth.uid() and role in ('alumni','admin'))
  );

create policy "Owners and admins update jobs"
  on jobs for update using (auth.uid() = posted_by or is_admin());

create policy "Owners and admins delete jobs"
  on jobs for delete using (auth.uid() = posted_by or is_admin());

-- ---------------------------------------------------------------------
-- JOB APPLICATIONS
-- ---------------------------------------------------------------------
create policy "Applicants and job owners view applications"
  on job_applications for select
  using (
    auth.uid() = applicant_id
    or is_admin()
    or exists (select 1 from jobs where jobs.id = job_id and jobs.posted_by = auth.uid())
  );

create policy "Users apply to jobs"
  on job_applications for insert with check (auth.uid() = applicant_id);

create policy "Applicants update own application"
  on job_applications for update using (auth.uid() = applicant_id);

create policy "Job owners update application status"
  on job_applications for update
  using (exists (select 1 from jobs where jobs.id = job_id and jobs.posted_by = auth.uid()));

-- ---------------------------------------------------------------------
-- MENTORSHIP REQUESTS
-- ---------------------------------------------------------------------
create policy "Participants view mentorship requests"
  on mentorship_requests for select
  using (auth.uid() = student_id or auth.uid() = alumni_id or is_admin());

create policy "Students create mentorship requests"
  on mentorship_requests for insert with check (auth.uid() = student_id);

create policy "Participants update mentorship requests"
  on mentorship_requests for update
  using (auth.uid() = student_id or auth.uid() = alumni_id or is_admin());

-- ---------------------------------------------------------------------
-- POSTS / COMMENTS / LIKES (community feed)
-- ---------------------------------------------------------------------
create policy "Posts are viewable by authenticated users"
  on posts for select using (auth.uid() is not null);

create policy "Users create own posts"
  on posts for insert with check (auth.uid() = author_id);

create policy "Users update own posts"
  on posts for update using (auth.uid() = author_id or is_admin());

create policy "Users delete own posts"
  on posts for delete using (auth.uid() = author_id or is_admin());

create policy "Likes are viewable by authenticated users"
  on post_likes for select using (auth.uid() is not null);

create policy "Users manage own likes"
  on post_likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Comments are viewable by authenticated users"
  on comments for select using (auth.uid() is not null);

create policy "Users create own comments"
  on comments for insert with check (auth.uid() = author_id);

create policy "Users update or delete own comments"
  on comments for update using (auth.uid() = author_id or is_admin());

create policy "Users delete own comments"
  on comments for delete using (auth.uid() = author_id or is_admin());

-- ---------------------------------------------------------------------
-- NOTIFICATIONS
-- ---------------------------------------------------------------------
create policy "Users view own notifications"
  on notifications for select using (auth.uid() = user_id);

create policy "Users update own notifications"
  on notifications for update using (auth.uid() = user_id);

create policy "System/admins insert notifications"
  on notifications for insert with check (is_admin() or auth.uid() is not null);

-- ---------------------------------------------------------------------
-- MESSAGES (direct messaging)
-- ---------------------------------------------------------------------
create policy "Users view own conversations"
  on messages for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users send messages"
  on messages for insert with check (auth.uid() = sender_id);

create policy "Receivers mark messages read"
  on messages for update using (auth.uid() = receiver_id);

-- ---------------------------------------------------------------------
-- GALLERY
-- ---------------------------------------------------------------------
create policy "Gallery viewable by everyone"
  on gallery for select using (true);

create policy "Authenticated users upload gallery images"
  on gallery for insert with check (auth.uid() = uploaded_by);

create policy "Owners and admins manage gallery"
  on gallery for all using (auth.uid() = uploaded_by or is_admin());

-- ---------------------------------------------------------------------
-- NEWS
-- ---------------------------------------------------------------------
create policy "Published news viewable by everyone"
  on news for select using (is_published = true or is_admin());

create policy "Admins manage news"
  on news for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------
-- CONTACT MESSAGES
-- ---------------------------------------------------------------------
create policy "Anyone can submit contact messages"
  on contact_messages for insert with check (true);

create policy "Admins view contact messages"
  on contact_messages for select using (is_admin());

create policy "Admins manage contact messages"
  on contact_messages for update using (is_admin());

-- =====================================================================
-- STORAGE BUCKETS (run separately if using Storage UI, or via API)
-- =====================================================================
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('event-banners', 'event-banners', true),
  ('gallery', 'gallery', true),
  ('news-images', 'news-images', true),
  ('resumes', 'resumes', false)
on conflict (id) do nothing;

-- Storage policies: avatars (public read, owner write)
create policy "Avatar images are publicly accessible"
  on storage.objects for select using (bucket_id = 'avatars');

create policy "Users upload own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users update own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- Resumes: private, owner + admin access
create policy "Users manage own resumes"
  on storage.objects for all
  using (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);

-- =====================================================================
-- SEED DATA (optional — sample departments & batches)
-- =====================================================================
insert into departments (name, code) values
  ('Computer Science', 'CS'),
  ('Electrical Engineering', 'EE'),
  ('Mechanical Engineering', 'ME'),
  ('Business Administration', 'BBA'),
  ('Civil Engineering', 'CE')
on conflict do nothing;

insert into batches (name, start_year, end_year) values
  ('Batch 2018-2022', 2018, 2022),
  ('Batch 2019-2023', 2019, 2023),
  ('Batch 2020-2024', 2020, 2024),
  ('Batch 2021-2025', 2021, 2025)
on conflict do nothing;

