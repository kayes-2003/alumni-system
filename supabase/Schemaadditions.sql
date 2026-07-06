-- =====================================================================
-- SCHEMA ADDITIONS — Run after schema.sql
-- Adds new columns needed for full feature set
-- =====================================================================

-- Events: add event_type, meeting_link, tags, banner_url already in schema
-- Add extra columns safely
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type text DEFAULT 'Networking';
ALTER TABLE events ADD COLUMN IF NOT EXISTS meeting_link text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS tags text;

-- Jobs: add category, salary_range, experience_level, deadline
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS category text DEFAULT 'Engineering';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_range text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS experience_level text DEFAULT 'Not specified';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS deadline timestamptz;

-- News: add category, external_link, tags, read_time
ALTER TABLE news ADD COLUMN IF NOT EXISTS category text DEFAULT 'News';
ALTER TABLE news ADD COLUMN IF NOT EXISTS external_link text;
ALTER TABLE news ADD COLUMN IF NOT EXISTS tags text;
ALTER TABLE news ADD COLUMN IF NOT EXISTS read_time int DEFAULT 1;

-- Contact messages: add phone, admin_reply, replied_at
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS admin_reply text;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS replied_at timestamptz;

-- =====================================================================
-- SEED: Demo Events
-- =====================================================================
INSERT INTO events (title, description, location, is_virtual, start_time, end_time, capacity, event_type, tags, created_by)
SELECT
  e.title, e.description, e.location, e.is_virtual,
  e.start_time::timestamptz, e.end_time::timestamptz,
  e.capacity, e.event_type, e.tags,
  (SELECT id FROM profiles WHERE role='admin' LIMIT 1)
FROM (VALUES
  ('Annual Alumni Reunion 2025','Grand reunion for all batches. Networking dinner, cultural programs, and award ceremony.','BUET Campus, Dhaka',false,'2025-12-15 18:00','2025-12-15 23:00',500,'Reunion','reunion,networking,annual'),
  ('Tech Career Fair 2025','Meet top tech companies hiring fresh graduates and experienced professionals.','Dhaka International Trade Fair',false,'2025-11-20 10:00','2025-11-20 18:00',300,'Career Fair','career,jobs,tech'),
  ('Startup Ecosystem Webinar','Learn from successful alumni entrepreneurs about building startups in Bangladesh.',null,true,'2025-10-10 19:00','2025-10-10 21:00',1000,'Webinar','startup,entrepreneurship,online'),
  ('CSE Alumni Networking Night','Exclusive networking event for Computer Science alumni and students.','Hotel Intercontinental, Dhaka',false,'2025-11-05 19:00','2025-11-05 22:00',150,'Networking','CSE,networking,alumni'),
  ('Study Abroad Information Session','Learn about scholarships and study abroad opportunities from alumni who have done it.',null,true,'2025-10-25 18:00','2025-10-25 20:00',500,'Academic','scholarship,studyabroad,international'),
  ('Bangladesh Alumni Sports Day','Cricket, football, and badminton tournament for alumni and current students.','BUET Sports Complex',false,'2025-12-05 09:00','2025-12-05 17:00',200,'Sports','sports,cricket,fun'),
  ('Alumni Business Awards 2025','Celebrating outstanding alumni achievements in business and entrepreneurship.','Radisson Blu Dhaka',false,'2025-11-28 18:00','2025-11-28 23:00',250,'Award Ceremony','awards,business,achievement'),
  ('Data Science Workshop','Hands-on workshop on machine learning and data science with industry experts.',null,true,'2025-10-18 10:00','2025-10-18 16:00',100,'Workshop','datascience,ML,workshop')
) AS e(title, description, location, is_virtual, start_time, end_time, capacity, event_type, tags)
WHERE EXISTS (SELECT 1 FROM profiles WHERE role='admin')
ON CONFLICT DO NOTHING;

-- =====================================================================
-- SEED: Demo Jobs
-- =====================================================================
INSERT INTO jobs (posted_by, title, company, location, job_type, category, description, requirements, apply_url, salary_range, experience_level, is_active)
SELECT
  (SELECT id FROM profiles WHERE role='alumni' ORDER BY RANDOM() LIMIT 1),
  j.title, j.company, j.location, j.job_type, j.category,
  j.description, j.requirements, j.apply_url, j.salary_range, j.experience_level, true
FROM (VALUES
  ('Senior Software Engineer','Grameenphone','Dhaka, Bangladesh','full-time','Engineering','Design and build scalable backend systems. Work with a talented team of engineers on critical telecom infrastructure projects.','BSc in CSE or related field. 5+ years experience. Proficiency in Java, Python, or Go.','https://gp.com/careers','৳120,000 – ৳180,000/month','5-10 years'),
  ('Product Manager','bKash Limited','Dhaka, Bangladesh','full-time','Management','Lead product strategy for our mobile financial services platform serving 60M+ users.','MBA or BSc in relevant field. 3+ years PM experience. Strong analytical skills.','https://bkash.com/careers','৳150,000 – ৳200,000/month','3-5 years'),
  ('Software Engineer Intern','Brain Station 23','Dhaka, Bangladesh','internship','Engineering','6-month internship working on real projects with mentorship from senior engineers.','Currently enrolled in CSE/EEE program. Knowledge of React or Node.js.','https://brainstation-23.com','৳20,000/month','Entry Level'),
  ('Data Scientist','Samsung R&D Bangladesh','Dhaka, Bangladesh','full-time','Data Science','Research and develop ML models for Samsung''s global product teams.','MSc/PhD in CS, Statistics, or related. Experience with PyTorch or TensorFlow.','https://samsung.com/bd','৳200,000 – ৳280,000/month','3-5 years'),
  ('UX Designer','Pathao','Dhaka, Bangladesh','full-time','Design','Design intuitive user experiences for Pathao''s ride-sharing and food delivery apps.','Portfolio required. 2+ years UX experience. Proficiency in Figma.','https://pathao.com/careers','৳80,000 – ৳120,000/month','1-2 years'),
  ('Financial Analyst','Dutch-Bangla Bank','Dhaka, Bangladesh','full-time','Finance','Analyze financial data, prepare reports, and support strategic decision-making.','BBA/MBA in Finance or Accounting. CFA preferred. Strong Excel skills.','https://dutchbanglabank.com','৳90,000 – ৳130,000/month','3-5 years'),
  ('DevOps Engineer','ShopUp','Dhaka, Bangladesh','full-time','Engineering','Manage cloud infrastructure on AWS. Implement CI/CD pipelines and ensure system reliability.','3+ years DevOps experience. AWS certified preferred. Docker and Kubernetes knowledge.','https://shopup.com.bd','৳130,000 – ৳170,000/month','3-5 years'),
  ('Marketing Manager','Unilever Bangladesh','Dhaka, Bangladesh','full-time','Marketing','Lead brand marketing campaigns for multiple consumer goods brands across Bangladesh.','MBA in Marketing. 4+ years brand management experience.','https://unilever.com/bd','৳160,000 – ৳220,000/month','3-5 years'),
  ('Python Developer','Kona Software Lab','Remote','remote','Engineering','Build APIs and automation tools for international clients using Python/FastAPI.','3+ years Python experience. Knowledge of FastAPI, PostgreSQL, Docker.','https://konasl.com','৳100,000 – ৳150,000/month','3-5 years'),
  ('Research Associate','a2i Bangladesh','Dhaka, Bangladesh','contract','Research','Conduct policy research on digital innovation and prepare reports for government stakeholders.','MSc in Economics, Public Policy, or related. Research experience required.','https://a2i.gov.bd','৳60,000 – ৳80,000/month','1-2 years')
) AS j(title, company, location, job_type, category, description, requirements, apply_url, salary_range, experience_level)
WHERE EXISTS (SELECT 1 FROM profiles WHERE role='alumni')
ON CONFLICT DO NOTHING;

-- =====================================================================
-- SEED: Demo News Articles
-- =====================================================================
INSERT INTO news (title, slug, content, is_published, published_at, author_id, category, tags, read_time)
SELECT
  n.title,
  lower(replace(n.title,' ','-')) || '-' || floor(random()*9000+1000)::text,
  n.content, true, NOW() - (random() * INTERVAL '180 days'),
  (SELECT id FROM profiles WHERE role='admin' LIMIT 1),
  n.category, n.tags, n.read_time
FROM (VALUES
  ('AlumniConnect Launches New Mentorship Program','We are thrilled to announce the launch of our expanded mentorship program connecting over 500 students with experienced alumni mentors across 30+ industries. The program offers structured 3-month mentorship cycles with clear goals and milestones. Alumni mentors bring expertise from companies like Grameenphone, bKash, Pathao, and many international organizations. Students benefit from personalized career guidance, industry insights, and professional network expansion. Applications for the next cohort are now open.','Announcement','mentorship,program,launch',3),
  ('Class of 2024 Achieves Record Placement Rate','The graduating class of 2024 has achieved our highest ever placement rate of 94% within 3 months of graduation. Key highlights include 45 students placed in top tech companies, 30 in banking and finance, 15 pursuing higher studies abroad, and 12 launching their own startups. The career portal played a significant role with 200+ job postings from alumni employers. We congratulate all graduates and thank the alumni community for their continued support and job postings.','Achievement','placement,graduation,2024',4),
  ('Annual Alumni Reunion 2025: Registration Now Open','Registrations are now open for our most anticipated event of the year — the Annual Alumni Reunion 2025! Join us on December 15th at the BUET campus for an unforgettable evening of networking, cultural performances, and the prestigious Alumni Achievement Awards. This year we expect over 500 alumni from various batch years. Special sessions include a tech startup showcase, career fair, and batch-wise reunions. Early bird registration closes November 30th.','Event Recap','reunion,2025,registration',3),
  ('Bangladesh Alumni Startup Ecosystem: 2024 Report','Our annual startup ecosystem report reveals exciting growth among alumni entrepreneurs. 47 alumni-founded startups raised a combined $28 million in funding in 2024. Notable highlights include 3 startups reaching Series A, 8 receiving seed funding from international investors, and 15 new companies crossing the profitability milestone. The tech sector leads with 52% of startups, followed by fintech (23%), health tech (15%), and edtech (10%). Download the full report from our website.','Research','startup,entrepreneurship,report,2024',5),
  ('New Partnership with 50 Top Bangladeshi Companies','AlumniConnect is proud to announce exclusive hiring partnerships with 50 leading Bangladeshi companies including Grameenphone, BRAC, Dutch-Bangla Bank, Square Pharmaceuticals, and Walton Group. These partnerships mean alumni and students get first access to job openings before public posting, dedicated application fast-tracks, and exclusive networking events with company leadership. Partners also offer mentorship programs, internship opportunities, and company visit programs.','News','partnership,jobs,hiring',4),
  ('Dr. Rahman Wins International Research Award','We are proud to congratulate Dr. Aminur Rahman (Class of 2005, CSE) for winning the prestigious IEEE International Research Excellence Award for his groundbreaking work on 5G network optimization algorithms. Dr. Rahman is currently a Principal Research Scientist at Ericsson Sweden and has published over 80 peer-reviewed papers. He credits his foundation at our institution and the alumni mentor who guided his PhD journey. Read our exclusive interview with Dr. Rahman in this issue.','Alumni Spotlight','award,research,achievement,CSE',4)
) AS n(title, content, category, tags, read_time)
WHERE EXISTS (SELECT 1 FROM profiles WHERE role='admin')
ON CONFLICT DO NOTHING;

SELECT 'Schema additions and seed data applied successfully' as status;