# LevelUp Seed Reference Guide (`seed.md`)

This guide explains how each field from the **"Become an Instructor"** signup form (`/become-instructor`) is mapped and populated in [`seed.sql`](file:///D:/Coding/Project/Major/Levelup/server/db/seed.sql).

---

## 1. Reference Center Point (User's Current Location)
- **Latitude:** `22.730812`
- **Longitude:** `75.872910`
- **Area:** Indore, Madhya Pradesh

All instructor coordinates are geometrically calculated using the **PostgreSQL Haversine Spherical Formula** to ensure they fall strictly into the requested distance bands (**Under 5 km** and **Under 10 km**).

---

## 2. "Become an Instructor" Form Fields Mapping

When an instructor registers through `/become-instructor`, the UI collects the following fields, which are stored across the `users` and `instructor_profiles` tables:

| Form Field Label | Database Column & Table | Purpose on LevelUp |
|---|---|---|
| **Full Name** | `users.name` | Instructor's display name on cards, profile pages, and classroom. |
| **Work Email** | `users.email` | Unique login identifier. |
| **Password** | `users.password_hash` | Encrypted with `bcryptjs` (10 rounds). Plaintext: `64006400`. |
| **Short Bio** | `instructor_profiles.bio` | Professional teaching narrative shown in the **About Instructor** tab and public profile. |
| **Phone Number** | `instructor_profiles.phone` | Contact number for course inquiries. |
| **City** | `instructor_profiles.city` | Human-readable city badge (e.g. `📍 Indore, India`). |
| **Map Location** | `instructor_profiles.latitude` & `longitude` | Exact GPS coordinates plotted on the **Nearby Instructors Leaflet Map** and used for proximity searches. |
| *Avatar Profile Photo* | `instructor_profiles.avatar_url` | High-resolution educator portrait shown in the Hero, Map popups, and Instructor Profile. |

---

## 3. Instructor Details & Field breakdown

### 1. Instructor 1 — Full-Stack Specialist (Under 5 km)
- **Target Distance:** **Under 5 km** (Actual: **1.62 km**)
- **Full Name:** `Shreyash Donal`
- **Work Email:** `shreyash1instructor@gmail.com`
- **Password:** `64006400`
- **City:** `Indore`
- **Map Coordinates:** `22.721500, 75.885000` (Near Old Palasia / Anand Bazar)
- **Phone Number:** `9826011001`
- **Short Bio:**  
  *"Senior Full-Stack Architect with 7+ years of experience building enterprise systems in Java Spring Boot and modern MERN ecosystems. Passionate about teaching practical backend microservices, RESTful APIs, and scalable React applications."*
- **Upcoming Courses (to be seeded separately):**
  - Course 1 → Java Full Stack
  - Course 2 → MERN Stack

---

### 2. Instructor 2 — Graphic Design Specialist (Under 5 km)
- **Target Distance:** **Under 5 km** (Actual: **3.26 km**)
- **Full Name:** `Pooja Rathore`
- **Work Email:** `shreyash2instructor@gmail.com`
- **Password:** `64006400`
- **City:** `Indore`
- **Map Coordinates:** `22.753500, 75.893000` (Near Vijay Nagar / Scheme 54)
- **Phone Number:** `9826011002`
- **Short Bio:**  
  *"Creative Visual Designer & Brand Strategist with 6+ years in digital aesthetics. Specializes in Adobe Creative Suite (Photoshop, Illustrator), Figma UI design, and visual storytelling to help students master commercial graphic design."*
- **Upcoming Courses (to be seeded separately):**
  - Course 1 → Introduction to Graphic Design (Design & Multimedia)

---

### 3. Instructor 3 — Core Java & Algorithms Specialist (Under 5 km)
- **Target Distance:** **Under 5 km** (Actual: **3.63 km**)
- **Full Name:** `Rohan Mehta`
- **Work Email:** `shreyash3instructor@gmail.com`
- **Password:** `64006400`
- **City:** `Indore`
- **Map Coordinates:** `22.699000, 75.865000` (Near Bhawarkua / Tower Square)
- **Phone Number:** `9826011003`
- **Short Bio:**  
  *"Java Developer and Competitive Programming mentor. Dedicated to demystifying Object-Oriented Programming, memory management, Java Collections Framework, and algorithmic problem-solving for aspiring software engineers."*
- **Upcoming Courses (to be seeded separately):**
  - Course 1 → Java Course (Programming)

---

### 4. Instructor 4 — JavaScript Specialist (Under 10 km)
- **Target Distance:** **Under 10 km** (Actual: **6.60 km**)
- **Full Name:** `Kavita Patel`
- **Work Email:** `shreyash4instructor@gmail.com`
- **Password:** `64006400`
- **City:** `Indore`
- **Map Coordinates:** `22.685000, 75.832000` (Near Annapurna / Rajendra Nagar)
- **Phone Number:** `9826011004`
- **Short Bio:**  
  *"Frontend Engineer and JavaScript enthusiast. Focused on teaching deep JavaScript fundamentals—from closures and promises to the event loop, modern ES6+ tooling, and browser APIs—through hands-on interactive coding."*
- **Upcoming Courses (to be seeded separately):**
  - Course 1 → JavaScript Course (Programming)

---

### 5. Instructor 5 — Python Specialist (Under 10 km)
- **Target Distance:** **Under 10 km** (Actual: **8.04 km**)
- **Full Name:** `Vikram Malhotra`
- **Work Email:** `shreyash5instructor@gmail.com`
- **Password:** `64006400`
- **City:** `Indore`
- **Map Coordinates:** `22.775000, 75.935000` (Near Nipania / Bypass East)
- **Phone Number:** `9826011005`
- **Short Bio:**  
  *"Software Engineer & Python Specialist with extensive background in Python automation, scripting, and backend development. Committed to taking beginners from writing their first Python script to building robust modular systems."*
- **Upcoming Courses (to be seeded separately):**
  - Course 1 → Python Course (Programming)

---

## 4. Quick Verification Summary Table

| Instructor | Email | Plain Password | Category Expertise | Distance from You (`22.730812, 75.872910`) | Target Band |
|---|---|---|---|:---:|:---:|
| **Instructor 1** | `shreyash1instructor@gmail.com` | `64006400` | Java Full Stack & MERN | **1.62 km** | Under 5 km |
| **Instructor 2** | `shreyash2instructor@gmail.com` | `64006400` | Graphic Design & Multimedia | **3.26 km** | Under 5 km |
| **Instructor 3** | `shreyash3instructor@gmail.com` | `64006400` | Core Java & Algorithms | **3.63 km** | Under 5 km |
| **Instructor 4** | `shreyash4instructor@gmail.com` | `64006400` | Modern JavaScript (ES6+) | **6.60 km** | Under 10 km |
| **Instructor 5** | `shreyash5instructor@gmail.com` | `64006400` | Python & Automation | **8.04 km** | Under 10 km |

> [!NOTE]
> Per your instructions, this seed script inserts **only the 5 instructors and their profile credentials**. It does **not** insert any courses. A separate course seed file will be created next.
