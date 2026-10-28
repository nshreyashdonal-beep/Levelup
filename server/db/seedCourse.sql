-- server/db/seedCourse.sql
-- Seed 6 Courses, Modules, and Free Trial Lectures across the 5 Seeded Instructors
-- Matches exact specifications from seedCourse.md

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. Insert Courses
-- ============================================================
INSERT INTO courses (
  title,
  description,
  price,
  instructor_id,
  category_id,
  level,
  delivery_mode,
  language,
  thumbnail_url,
  duration_weeks,
  capacity,
  curriculum,
  outcomes,
  status
)
SELECT
  demo.title,
  demo.description,
  demo.price,
  users.id,
  cat.id,
  demo.level,
  demo.delivery_mode,
  demo.language,
  demo.thumbnail_url,
  demo.duration_weeks,
  demo.capacity,
  demo.curriculum,
  demo.outcomes,
  'published'
FROM (
  VALUES
    -- Course 1.1 (Shreyash Donal)
    (
      'shreyash1instructor@gmail.com',
      'Full Stack Java Developer: Spring Boot, Microservices & React',
      'Master enterprise full-stack software development from the ground up. This intensive program bridges fundamental Object-Oriented Java with production-grade backend engineering using Spring Boot 3, Hibernate JPA, and PostgreSQL. You will design, build, and deploy decoupled microservices with Spring Cloud, integrate secure JWT authentication with Spring Security 6, and construct dynamic, reactive frontend client applications using React 18, Redux Toolkit, and Tailwind CSS. Ideal for developers aiming for high-impact software engineering roles.',
      4999.00,
      'Full Stack',
      'Web Development',
      'intermediate',
      'hybrid',
      'English',
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
      12,
      35,
      E'Week 1-3: Advanced Java, Streams API, and Multithreading Foundations\nWeek 4-6: Spring Boot 3 Core, Dependency Injection, REST APIs & PostgreSQL JPA\nWeek 7-8: Microservices Architecture, API Gateway & Eureka Service Discovery\nWeek 9-10: JWT Security, Role-Based Access Control & Unit Testing with JUnit 5\nWeek 11-12: Modern React 18 Frontend, State Management & Full-Stack Cloud Deployment',
      E'Architect scalable microservices using Spring Boot 3 and Spring Cloud\nImplement robust authentication and RBAC with Spring Security and JWT\nDesign, normalize, and query high-throughput relational databases with PostgreSQL and Hibernate\nDevelop interactive single-page dashboards using React 18 and Redux Toolkit\nContainerize full-stack services with Docker and setup CI/CD deployment pipelines'
    ),
    -- Course 1.2 (Shreyash Donal)
    (
      'shreyash1instructor@gmail.com',
      'MERN Stack Mastery: Production Node.js, Express & React',
      'A complete, hands-on journey into the modern JavaScript and TypeScript ecosystem. Build and deploy production-ready web applications leveraging MongoDB, Express.js, React, and Node.js. Dive deep into event-driven server architectures, RESTful and GraphQL API design, database indexing and aggregation pipelines, React state management, and real-time bi-directional communication with WebSockets (Socket.io).',
      3999.00,
      'Full Stack',
      'Web Development',
      'beginner',
      'online',
      'English',
      'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=80',
      10,
      50,
      E'Week 1-2: Modern JavaScript (ES6+), Node.js Runtime & NPM Ecosystem\nWeek 3-4: Express.js Server Architecture, Middleware & RESTful Routing\nWeek 5-6: MongoDB Schema Modeling, Validation & Mongoose Aggregation\nWeek 7-8: React 18 Component Architecture, Custom Hooks & Global Context\nWeek 9-10: Real-time Chat with Socket.io, Payment Gateway Integration & Deployment',
      E'Construct scalable RESTful backend servers using Node.js and Express\nModel and query non-relational document databases efficiently with MongoDB\nBuild performant, mobile-first responsive interfaces using React and modern CSS\nImplement real-time bidirectional messaging features with WebSockets\nDeploy complete full-stack applications with environment isolation and SSL security'
    ),
    -- Course 2.1 (Pooja Rathore)
    (
      'shreyash2instructor@gmail.com',
      'Introduction to Graphic Design: Photoshop, Illustrator & Visual Branding',
      'Unleash your visual creativity and turn ideas into commercially viable designs. This beginner-friendly course teaches you the fundamental principles of graphic design: color theory, layout grids, visual hierarchy, and typography. You will gain mastery over the industry standard creative toolkit—Adobe Illustrator for precision vector graphics and logos, and Adobe Photoshop for image compositing, retouching, and digital painting.',
      2499.00,
      'Graphic Design',
      'Design & Multimedia',
      'beginner',
      'online',
      'English',
      'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&auto=format&fit=crop&q=80',
      6,
      40,
      E'Week 1: Fundamentals of Visual Design, Color Harmony & Composition Grids\nWeek 2: Vector Illustration & Logo Design in Adobe Illustrator\nWeek 3: Advanced Typography, Font Pairing & Brand Guideline Creation\nWeek 4: Photo Manipulation, Retouching & Color Grading in Adobe Photoshop\nWeek 5: Marketing Creatives, Social Media Banners & Print Layouts\nWeek 6: Final Brand Identity Capstone Project & Freelance Portfolio Prep',
      E'Apply visual hierarchy, contrast, balance, and color theory to any design project\nDesign vector logos, brand marks, and scalable illustrations in Adobe Illustrator\nEdit, color-grade, and composite professional creative assets using Photoshop\nCreate comprehensive brand guidelines and print-ready marketing materials\nAssemble an industry-standard digital portfolio to attract freelance clients'
    ),
    -- Course 3.1 (Rohan Mehta)
    (
      'shreyash3instructor@gmail.com',
      'Core Java Programming & Object-Oriented Design Fundamentals',
      'Build a rock-solid programming foundation with one of the world''s most enduring and reliable programming languages. This course demystifies the Java programming language from basic syntax to advanced Object-Oriented Programming (OOP) paradigms. Learn memory management, JVM stack and heap mechanics, exception handling architectures, file I/O operations, and the powerful Java Collections Framework to write clean, reusable, and maintainable software.',
      1999.00,
      'Java',
      'Programming',
      'beginner',
      'offline',
      'English',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
      8,
      25,
      E'Week 1-2: Java Fundamentals, Data Types, Control Structures & JVM Architecture\nWeek 3-4: Classes, Objects, Constructors & The 4 Pillars of OOP\nWeek 5: Interfaces, Abstract Classes, Polymorphism & Package Management\nWeek 6: Exception Handling, Custom Exceptions & Robust Memory Management\nWeek 7: Java Collections Framework (ArrayList, HashMap, HashSet, Iterators)\nWeek 8: File I/O, Generics, Lambda Expressions & Capstone Console Application',
      E'Write clean, structured, and syntactically sound Java applications\nImplement the four core pillars of Object-Oriented Programming in real software\nUnderstand JVM internal architecture, memory allocation, and Garbage Collection\nUtilize the Java Collections Framework to store and manipulate structured data\nDebug complex exceptions and write robust error-resistant Java routines'
    ),
    -- Course 4.1 (Kavita Patel)
    (
      'shreyash4instructor@gmail.com',
      'Modern JavaScript from Scratch: ES6+, Async/Await & DOM Mastery',
      'Demystify modern JavaScript and gain true confidence as a frontend engineer. Skip obsolete legacy quirks and learn the language as it is written today in top engineering teams. This course explores modern ES6+ syntax, scopes, closures, hoisting, prototype chains, the JavaScript Event Loop, asynchronous programming with Promises and Async/Await, and direct manipulation of the Document Object Model (DOM) to build snappy, interactive browser applications.',
      1499.00,
      'JavaScript',
      'Programming',
      'beginner',
      'online',
      'English',
      'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800&auto=format&fit=crop&q=80',
      6,
      60,
      E'Week 1: Modern JS Syntax, Variables (let/const), Arrow Functions & Destructuring\nWeek 2: Scopes, Execution Context, Closures & Array Higher-Order Methods\nWeek 3: DOM Selection, Event Delegation, Form Validation & Dynamic Rendering\nWeek 4: Asynchronous JavaScript: Event Loop, Microtasks, Callbacks & Promises\nWeek 5: Async/Await, Fetch API, Error Handling & Consuming Public REST APIs\nWeek 6: Web Storage (localStorage/sessionStorage), ES Modules & Interactive Project',
      E'Write idiomatic modern JavaScript utilizing ES6 through ES2024 specifications\nDeeply understand closures, execution contexts, and the browser Event Loop\nManipulate the DOM dynamically and build responsive web interactions\nConsume external REST APIs seamlessly using Fetch, Promises, and Async/Await\nPersist client state using browser storage and organize code with ES Modules'
    ),
    -- Course 5.1 (Vikram Malhotra)
    (
      'shreyash5instructor@gmail.com',
      'Python Programming Essentials: Automation, Scripting & Backend Logic',
      'Unlock the versatility and simplicity of Python 3. Designed for beginners and professionals looking to automate repetitive workflows, this course covers core programming logic, data structures, list comprehensions, object-oriented concepts, and practical scripting. Learn to manipulate spreadsheets, scrape information from websites using BeautifulSoup, automate desktop tasks, and build lightweight backend scripts that save hours of manual work.',
      2199.00,
      'Python',
      'Programming',
      'beginner',
      'hybrid',
      'English',
      'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&auto=format&fit=crop&q=80',
      8,
      45,
      E'Week 1-2: Python 3 Fundamentals, Variables, Data Types & Control Flow\nWeek 3: Python Data Structures: Lists, Tuples, Dictionaries & Sets\nWeek 4: Functions, Lambda Expressions, List Comprehensions & Generator Basics\nWeek 5: File Operations, JSON/CSV Parsing & Excel Spreadsheet Automation\nWeek 6: Web Scraping with Requests and BeautifulSoup\nWeek 7: Object-Oriented Programming (OOP) in Python: Classes & Inheritance\nWeek 8: Automated Task Scheduler Project & Building Command Line Utilities',
      E'Write clean, PEP 8 compliant Python code for diverse automation tasks\nProcess, parse, and automate data operations across CSV, JSON, and Excel files\nScrape live information from web pages using BeautifulSoup and Requests\nStructure maintainable, modular Python programs using Object-Oriented patterns\nBuild end-to-end automation scripts that execute on recurring schedules'
    )
) AS demo(
  email,
  title,
  description,
  price,
  topic_name,
  subcat_name,
  level,
  delivery_mode,
  language,
  thumbnail_url,
  duration_weeks,
  capacity,
  curriculum,
  outcomes
)
JOIN users ON users.email = demo.email
JOIN categories cat ON cat.name = demo.topic_name
JOIN categories subcat ON cat.parent_id = subcat.id AND subcat.name = demo.subcat_name
WHERE NOT EXISTS (
  SELECT 1 FROM courses c WHERE c.title = demo.title
);

-- ============================================================
-- 2. Insert Course Modules
-- ============================================================
INSERT INTO course_modules (course_id, title, position, status)
SELECT
  courses.id,
  demo.module_title,
  demo.position,
  'available'
FROM courses
JOIN (
  VALUES
    ('Full Stack Java Developer: Spring Boot, Microservices & React', 'Module 1: Architecture & Java Foundations', 0),
    ('Full Stack Java Developer: Spring Boot, Microservices & React', 'Module 2: Spring Boot 3 & REST Microservices', 1),
    ('MERN Stack Mastery: Production Node.js, Express & React', 'Module 1: Node.js & Express API Engineering', 0),
    ('MERN Stack Mastery: Production Node.js, Express & React', 'Module 2: React 18 UI & State Management', 1),
    ('Introduction to Graphic Design: Photoshop, Illustrator & Visual Branding', 'Module 1: Visual Design Theory & Layout Grids', 0),
    ('Introduction to Graphic Design: Photoshop, Illustrator & Visual Branding', 'Module 2: Vector Illustration in Adobe Illustrator', 1),
    ('Core Java Programming & Object-Oriented Design Fundamentals', 'Module 1: Java Basics & JVM Mechanics', 0),
    ('Core Java Programming & Object-Oriented Design Fundamentals', 'Module 2: Object-Oriented Design & Collections', 1),
    ('Modern JavaScript from Scratch: ES6+, Async/Await & DOM Mastery', 'Module 1: Modern ES6+ & Execution Context', 0),
    ('Modern JavaScript from Scratch: ES6+, Async/Await & DOM Mastery', 'Module 2: Asynchronous JS & Web APIs', 1),
    ('Python Programming Essentials: Automation, Scripting & Backend Logic', 'Module 1: Python Fundamentals & Data Structures', 0),
    ('Python Programming Essentials: Automation, Scripting & Backend Logic', 'Module 2: Automation, Web Scraping & Scripting', 1)
) AS demo(course_title, module_title, position)
  ON courses.title = demo.course_title
WHERE NOT EXISTS (
  SELECT 1 FROM course_modules m WHERE m.course_id = courses.id AND m.title = demo.module_title
);

-- ============================================================
-- 3. Insert Course Lectures (with Free Trial Preview Unlocked)
-- ============================================================
INSERT INTO course_lectures (
  module_id,
  title,
  content,
  video_url,
  duration_minutes,
  position,
  status,
  is_trial
)
SELECT
  modules.id,
  demo.lecture_title,
  demo.content,
  demo.video_url,
  demo.duration_minutes,
  demo.position,
  'available',
  demo.is_trial
FROM course_modules modules
JOIN courses ON courses.id = modules.course_id
JOIN (
  VALUES
    -- Full Stack Java Developer
    (
      'Full Stack Java Developer: Spring Boot, Microservices & React',
      'Module 1: Architecture & Java Foundations',
      'Enterprise Microservices Architecture & Spring Boot Setup',
      'Understand decoupled microservices architecture, Maven project initialization, and Spring Boot 3 core concepts.',
      'https://www.youtube.com/watch?v=9SGDpanrc8U',
      24,
      0,
      true -- 🎓 Free Trial Preview
    ),
    (
      'Full Stack Java Developer: Spring Boot, Microservices & React',
      'Module 1: Architecture & Java Foundations',
      'Deep Dive into Java Streams & Lambda Pipelines',
      'Hands-on refactoring of traditional collections using Java 17 Streams and Functional Interfaces.',
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      18,
      1,
      false
    ),

    -- MERN Stack Mastery
    (
      'MERN Stack Mastery: Production Node.js, Express & React',
      'Module 1: Node.js & Express API Engineering',
      'MERN Architecture Blueprint & Express Server Setup',
      'Tour of the MERN architecture, asynchronous event loop, and configuring Express middleware with CORS.',
      'https://www.youtube.com/watch?v=7CqJlxBYj-M',
      22,
      0,
      true -- 🎓 Free Trial Preview
    ),
    (
      'MERN Stack Mastery: Production Node.js, Express & React',
      'Module 1: Node.js & Express API Engineering',
      'MongoDB Atlas Connection & Schema Modeling',
      'Connecting to MongoDB Atlas using Mongoose ODM, creating schemas, and building validation rules.',
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      20,
      1,
      false
    ),

    -- Intro to Graphic Design
    (
      'Introduction to Graphic Design: Photoshop, Illustrator & Visual Branding',
      'Module 1: Visual Design Theory & Layout Grids',
      'Visual Hierarchy & Modern Typography Rules',
      'Learn the golden ratio of graphic design: font pairing, whitespace management, and visual balance.',
      'https://www.youtube.com/watch?v=WONZVnlam6w',
      16,
      0,
      true -- 🎓 Free Trial Preview
    ),
    (
      'Introduction to Graphic Design: Photoshop, Illustrator & Visual Branding',
      'Module 1: Visual Design Theory & Layout Grids',
      'Color Harmonies & Psychological Palette Selection',
      'Master complementary, analogous, and triadic color harmonies to influence consumer perception.',
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      15,
      1,
      false
    ),

    -- Core Java Fundamentals
    (
      'Core Java Programming & Object-Oriented Design Fundamentals',
      'Module 1: Java Basics & JVM Mechanics',
      'JVM Internals, Compilation Pipeline & First Java Application',
      'Understand byte-code execution, classloaders, JVM stack and heap memory, and compiling your first app.',
      'https://www.youtube.com/watch?v=eIrMbAQSU34',
      28,
      0,
      true -- 🎓 Free Trial Preview
    ),
    (
      'Core Java Programming & Object-Oriented Design Fundamentals',
      'Module 1: Java Basics & JVM Mechanics',
      'Object-Oriented Design in Action: Encapsulation & Classes',
      'Creating robust custom classes, access modifiers, constructors, and getters/setters.',
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      19,
      1,
      false
    ),

    -- Modern JavaScript
    (
      'Modern JavaScript from Scratch: ES6+, Async/Await & DOM Mastery',
      'Module 1: Modern ES6+ & Execution Context',
      'JavaScript Execution Context, Scopes & ES6 Essentials',
      'Demystifying hoisting, let vs const, arrow functions, destructuring, and template literals.',
      'https://www.youtube.com/watch?v=W6NZfCO5SIk',
      25,
      0,
      true -- 🎓 Free Trial Preview
    ),
    (
      'Modern JavaScript from Scratch: ES6+, Async/Await & DOM Mastery',
      'Module 1: Modern ES6+ & Execution Context',
      'Deep Dive into Closures and Practical Functional Helpers',
      'How closures retain outer scope memory and implementing practical memoization patterns.',
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      17,
      1,
      false
    ),

    -- Python Programming Essentials
    (
      'Python Programming Essentials: Automation, Scripting & Backend Logic',
      'Module 1: Python Fundamentals & Data Structures',
      'Python 3 Environment, Interactive REPL & Automated Scripting',
      'Installing Python 3, navigating the REPL, and building an automated bulk file renamer script.',
      'https://www.youtube.com/watch?v=rfscVS0vtbw',
      30,
      0,
      true -- 🎓 Free Trial Preview
    ),
    (
      'Python Programming Essentials: Automation, Scripting & Backend Logic',
      'Module 1: Python Fundamentals & Data Structures',
      'Working with Lists, Tuples & Dictionary Comprehensions',
      'Write clean, readable, and pythonic list and dictionary comprehensions for data filtering.',
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      21,
      1,
      false
    )
) AS demo(
  course_title,
  module_title,
  lecture_title,
  content,
  video_url,
  duration_minutes,
  position,
  is_trial
)
  ON courses.title = demo.course_title
 AND modules.title = demo.module_title
WHERE NOT EXISTS (
  SELECT 1 FROM course_lectures l WHERE l.module_id = modules.id AND l.title = demo.lecture_title
);
