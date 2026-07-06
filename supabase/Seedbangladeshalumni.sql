-- =====================================================================
-- SEED: 300+ Demo Alumni from Bangladesh
-- Run AFTER schema.sql in Supabase SQL Editor
-- =====================================================================

-- Ensure departments exist
INSERT INTO departments (name, code) VALUES
  ('Computer Science & Engineering','CSE'),('Electrical & Electronic Engineering','EEE'),
  ('Business Administration','BBA'),('Civil Engineering','CE'),('Medicine','MBBS'),
  ('Law','LAW'),('Economics','ECO'),('Architecture','ARCH'),
  ('Pharmacy','PHM'),('English Literature','ENG')
ON CONFLICT DO NOTHING;

-- Ensure batches exist
INSERT INTO batches (name, start_year, end_year) VALUES
  ('Batch 2015-2019',2015,2019),('Batch 2016-2020',2016,2020),
  ('Batch 2017-2021',2017,2021),('Batch 2018-2022',2018,2022),
  ('Batch 2019-2023',2019,2023),('Batch 2020-2024',2020,2024)
ON CONFLICT DO NOTHING;

-- Helper function to pick random element
CREATE OR REPLACE FUNCTION rand_elem(arr text[]) RETURNS text AS $$
  SELECT arr[1 + floor(random() * array_length(arr,1))::int];
$$ LANGUAGE sql VOLATILE;

-- Insert 300 demo profiles
DO $$
DECLARE
  first_names text[] := ARRAY[
    'Arif','Biplob','Chandan','Delwar','Emran','Farhan','Golam','Habib','Imran','Jahir',
    'Kamrul','Liton','Mahbub','Nasir','Omar','Palash','Quamrul','Rafiq','Sabbir','Tariq',
    'Umar','Viqar','Wasim','Xander','Yusuf','Zakir','Alam','Badrul','Comilla','Dhruv',
    'Anisur','Belal','Chanchal','Delara','Farzana','Hasina','Ismat','Jannatul','Khadija',
    'Laila','Maliha','Nadia','Parisa','Rabeya','Sadia','Tahmina','Uma','Vibha','Yasmin',
    'Asma','Bilkis','Champa','Dilara','Fatema','Halima','Ishrat','Jasmine','Khurshida','Lopa',
    'Mahmud','Nazmul','Obidul','Parvin','Raihan','Shahriar','Touhid','Uddin','Wahid','Zahid',
    'Akash','Bristy','Chaiti','Deep','Emon','Faisal','Gias','Himu','Ivan','Jibon',
    'Koushik','Lucky','Maruf','Niloy','Opu','Pranto','Rafi','Shakil','Titu','Uttam'
  ];
  last_names text[] := ARRAY[
    'Ahmed','Hossain','Islam','Khan','Rahman','Begum','Chowdhury','Miah','Uddin','Ali',
    'Akter','Bhuiyan','Das','Dey','Ghosh','Haider','Jahan','Karim','Malik','Noor',
    'Parveen','Qureshi','Roy','Sarker','Siddiqui','Talukder','Ullah','Vhatt','Zaman',
    'Mondol','Sheikh','Biswas','Paul','Rana','Saha','Sultana','Tarafder','Wadud','Yousuf'
  ];
  cities text[] := ARRAY['Dhaka','Chittagong','Sylhet','Rajshahi','Khulna','Barisal','Comilla','Gazipur','Narayanganj','Mymensingh','Rangpur','Bogra','Jessore','Cox''s Bazar','Brahmanbaria'];
  companies text[] := ARRAY[
    'Grameenphone','BRAC','Dutch-Bangla Bank','bKash','Walton Group','Square Pharmaceuticals',
    'Robi Axiata','Pathao','ShopUp','Shajgoj','Augmedix Bangladesh','Brain Station 23',
    'Therap Services','Kona Software Lab','Nascenia','Reve Systems','Enosis Solutions',
    'Optimizely','Samsung R&D Bangladesh','Huawei Technologies Bangladesh','Unilever Bangladesh',
    'Nestle Bangladesh','British American Tobacco BD','Akij Group','Bashundhara Group',
    'Pran-RFL Group','Beximco Group','Meghna Group','City Bank','Eastern Bank','BRAC Bank',
    'Standard Chartered BD','Dhaka Bank','Mutual Trust Bank','AB Bank','Islami Bank Bangladesh',
    'BASIS','ICT Division BD','a2i','Bangladesh Army','Bangladesh Navy','Bangladesh Civil Service'
  ];
  job_titles text[] := ARRAY[
    'Software Engineer','Senior Developer','Full Stack Developer','Backend Engineer','Frontend Developer',
    'Data Scientist','ML Engineer','Product Manager','UX Designer','DevOps Engineer',
    'Business Analyst','Financial Analyst','Marketing Manager','HR Manager','Project Manager',
    'Lecturer','Assistant Professor','Research Fellow','Medical Officer','Advocate',
    'Civil Engineer','Electrical Engineer','Architect','Pharmacist','Economist',
    'CEO','CTO','Founder','Co-Founder','Entrepreneur','Consultant','Freelancer'
  ];
  skills_pool text[] := ARRAY[
    'Python','JavaScript','React','Node.js','SQL','Machine Learning','Data Analysis',
    'Project Management','Leadership','Communication','Excel','PowerPoint',
    'Java','C++','Django','FastAPI','Docker','AWS','Git','Figma',
    'Marketing','Sales','Finance','Accounting','Research','Writing',
    'Problem Solving','Team Management','Agile','Scrum'
  ];
  dept_ids uuid[];
  batch_ids uuid[];
  fname text; lname text; full_name text; email text;
  dept_id uuid; batch_id uuid; grad_year int;
  city text; company text; title text;
  skill1 text; skill2 text; skill3 text; skill4 text;
  i int;
  role_val user_role;
  ver_val verification_status;
  new_uid uuid;
BEGIN
  -- Load department and batch IDs
  SELECT ARRAY(SELECT id FROM departments LIMIT 10) INTO dept_ids;
  SELECT ARRAY(SELECT id FROM batches LIMIT 6) INTO batch_ids;

  FOR i IN 1..300 LOOP
    fname := rand_elem(first_names);
    lname := rand_elem(last_names);
    full_name := fname || ' ' || lname;
    email := lower(fname) || '.' || lower(lname) || i || '@alumni.example.com';
    dept_id := dept_ids[1 + (i % array_length(dept_ids,1))];
    batch_id := batch_ids[1 + (i % array_length(batch_ids,1))];
    grad_year := 2015 + (i % 10);
    city := rand_elem(cities);
    company := rand_elem(companies);
    title := rand_elem(job_titles);
    skill1 := rand_elem(skills_pool);
    skill2 := rand_elem(skills_pool);
    skill3 := rand_elem(skills_pool);
    skill4 := rand_elem(skills_pool);

    -- Role distribution: 70% alumni, 25% student, 5% admin-like alumni
    IF i % 4 = 0 THEN role_val := 'student'; ELSE role_val := 'alumni'; END IF;

    -- Verification: 70% verified, 20% pending, 10% rejected
    IF i % 10 < 7 THEN ver_val := 'verified';
    ELSIF i % 10 < 9 THEN ver_val := 'pending';
    ELSE ver_val := 'rejected'; END IF;

    new_uid := gen_random_uuid();

    -- Insert into profiles directly (demo users don't need auth.users for directory browsing)
    INSERT INTO profiles (
      id, email, full_name, role, verification_status,
      department_id, batch_id, graduation_year,
      current_job_title, current_company, location,
      bio, skills, is_profile_public,
      linkedin_url, created_at, updated_at
    ) VALUES (
      new_uid, email, full_name, role_val, ver_val,
      dept_id, batch_id, grad_year,
      title, company, city || ', Bangladesh',
      'Alumni of the class of ' || grad_year || '. Currently working as ' || title || ' at ' || company || ' in ' || city || ', Bangladesh. Passionate about making a difference through technology and innovation.',
      ARRAY[skill1, skill2, skill3, skill4],
      true,
      'https://linkedin.com/in/' || lower(fname) || lower(lname) || i,
      NOW() - (random() * INTERVAL '3 years'),
      NOW() - (random() * INTERVAL '1 year')
    ) ON CONFLICT (email) DO NOTHING;
  END LOOP;
END $$;

-- Clean up helper function
DROP FUNCTION IF EXISTS rand_elem(text[]);

-- Verify
SELECT COUNT(*) as total_profiles, COUNT(*) FILTER (WHERE role='alumni') as alumni_count,
  COUNT(*) FILTER (WHERE role='student') as student_count FROM profiles;