# 📘 Database Schema – ENGLISH HUB

**Database**: PostgreSQL  
**ORM**: Sequelize  
**Total Tables**: 29

---

## 🔐 GROUP 1: ACCOUNTS & USERS (4 tables)

### 1. accounts
**Purpose**: Authentication & authorization

| Column | Type | Null | Default | Description |
|------|------|------|---------|-------------|
| id | UUID | NO | UUIDV4 | Primary Key |
| email | VARCHAR(150) | NO | – | Unique login email |
| password_hash | VARCHAR(255) | NO | – | BCrypt password |
| role | ENUM | NO | – | admin, teacher, learner |
| is_active | BOOLEAN | YES | true | Active status |
| created_at | TIMESTAMP | YES | NOW | Created time |

**Relations**
- 1:1 → admins.account_id  
- 1:1 → teachers.account_id  
- 1:1 → learners.account_id  

---

### 2. admins
**Purpose**: Admin profile

| Column | Type | Null | Default | Description |
|------|------|------|---------|-------------|
| id | UUID | NO | UUIDV4 | PK |
| account_id | UUID | NO | – | FK → accounts.id |
| full_name | VARCHAR(100) | NO | – | Full name |
| avatar_url | VARCHAR(2048) | YES | null | Avatar |

---

### 3. teachers
**Purpose**: Teacher profile

| Column | Type | Null | Default | Description |
|------|------|------|---------|-------------|
| id | UUID | NO | UUIDV4 | PK |
| account_id | UUID | NO | – | FK → accounts.id |
| full_name | VARCHAR(100) | NO | – | Name |
| avatar_url | VARCHAR(2048) | YES | null | Avatar |
| bio | TEXT | YES | null | Biography |
| specialization | VARCHAR(255) | YES | null | IELTS, TOEIC… |
| phone | VARCHAR(20) | YES | null | Phone |

**Relations**
- 1:N → courses.teacher_id

---

### 4. learners
**Purpose**: Learner profile

| Column | Type | Null | Default | Description |
|------|------|------|---------|-------------|
| id | UUID | NO | UUIDV4 | PK |
| account_id | UUID | NO | – | FK → accounts.id |
| full_name | VARCHAR(100) | NO | – | Name |
| avatar_url | VARCHAR(2048) | YES | null | Avatar |
| current_xp | INTEGER | YES | 0 | XP |
| current_streak | INTEGER | YES | 0 | Learning streak |
| english_level | ENUM | YES | A2 | A1–C2 |
| gender | ENUM | YES | null | male/female/other |
| date_of_birth | DATE | YES | null | DOB |
| address | VARCHAR(255) | YES | null | Address |
| phone_number | VARCHAR(15) | YES | null | Phone |

**Relations**
- 1:N → enrollments  
- 1:N → orders  
- 1:N → reviews  

---

## 📚 GROUP 2: COURSES (3 tables)

### 5. courses
**Purpose**: Course information

| Column | Type | Null | Default |
|------|------|------|---------|
| id | UUID | NO | UUIDV4 |
| teacher_id | UUID | YES | null |
| created_by | UUID | YES | null |
| title | VARCHAR(255) | NO | – |
| description | TEXT | YES | null |
| thumbnail_url | VARCHAR(2048) | YES | null |
| price | DECIMAL(10,2) | YES | 0 |
| level | ENUM | YES | B1 |
| category | VARCHAR(100) | YES | null |
| is_published | BOOLEAN | YES | false |
| total_lessons | INTEGER | YES | 0 |
| total_duration_minutes | INTEGER | YES | 0 |
| course_type | ENUM | YES | standard |
| approval_status | ENUM | YES | draft |
| created_at | TIMESTAMP | YES | NOW |
| updated_at | TIMESTAMP | YES | NOW |

**Relations**
- 1:N → modules  
- 1:N → lessons  
- 1:N → enrollments  
- 1:N → reviews  

---

### 6. modules
**Purpose**: Course modules

| Column | Type | Null | Default |
|------|------|------|---------|
| id | UUID | NO | UUIDV4 |
| course_id | UUID | NO | – |
| title | VARCHAR(255) | NO | – |
| description | TEXT | YES | null |
| order_index | INTEGER | YES | 0 |

---

### 7. lessons
**Purpose**: Course lessons

| Column | Type | Null | Default |
|------|------|------|---------|
| id | UUID | NO | UUIDV4 |
| course_id | UUID | NO | – |
| module_id | UUID | YES | null |
| title | VARCHAR(255) | NO | – |
| content_type | ENUM | YES | video |
| content_url | VARCHAR(2048) | YES | null |
| duration_minutes | INTEGER | YES | 0 |
| is_free | BOOLEAN | YES | false |

---

## 📝 GROUP 3: ENROLLMENT & PROGRESS (2 tables)

### 8. enrollments
| Column | Type | Null | Default |
|------|------|------|---------|
| id | UUID | NO | UUIDV4 |
| learner_id | UUID | NO | – |
| course_id | UUID | NO | – |
| progress_percent | INTEGER | YES | 0 |
| status | ENUM | YES | active |

---

### 9. learning_progress
| Column | Type | Null | Default |
|------|------|------|---------|
| id | UUID | NO | UUIDV4 |
| enrollment_id | UUID | NO | – |
| lesson_id | UUID | NO | – |
| is_completed | BOOLEAN | YES | false |
| completed_at | TIMESTAMP | YES | null |

---

## 📋 GROUP 4: EXAMS & QUESTIONS (5 tables)

- exams  
- questions  
- rubrics  
- exam_submissions  
- submission_answers  

Supports **auto grading, manual grading, AI analysis, speaking & writing**.

---

## 🛒 GROUP 5: COMMERCE (4 tables)

- cart_items  
- orders  
- order_items  
- reviews  

---

## 🏫 GROUP 6: OFFLINE CLASSES (4 tables)

- offline_classes  
- offline_schedules  
- class_enrollments  
- attendances  

---

## 💬 GROUP 7: MESSAGING (3 tables)

- conversations  
- conversation_participants  
- messages  

---

## 🏆 GROUP 8: GAMIFICATION & TRACKING (4 tables)

- achievements  
- user_activities  
- test_sessions  
- speaking_results  

---

## 🔗 RELATIONSHIP OVERVIEW

```text
ACCOUNTS
 ├─ ADMINS
 ├─ TEACHERS ──► COURSES ──► MODULES ──► LESSONS
 │                               └─► LEARNING_PROGRESS
 └─ LEARNERS ──► ENROLLMENTS ──► COURSES

EXAMS ──► EXAM_SUBMISSIONS ──► SUBMISSION_ANSWERS ◄── QUESTIONS ◄── RUBRICS

ORDERS ──► ORDER_ITEMS ──► COURSES
CART_ITEMS ──► COURSES

OFFLINE_CLASSES ──► CLASS_ENROLLMENTS / ATTENDANCES

CONVERSATIONS ──► MESSAGES / PARTICIPANTS

ACHIEVEMENTS / USER_ACTIVITIES / TEST_SESSIONS / SPEAKING_RESULTS
