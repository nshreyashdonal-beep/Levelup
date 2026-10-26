# LevelUp Course Seed Specification Guide (`seedCourse.md`)

This document outlines the exact values that will be populated for all fields across **Section 01 (Course Basics)** and **Section 02 (Course Details)** for each of the 6 courses taught by our 5 seeded instructors.

---

## Field Overview

Every course record maps 1:1 with the instructor course creation form (`/create-course` and `/manage-courses/:id/details`):

```
+----------------------------------------------------------------------------------------------------+
| SECTION 01: COURSE BASICS                                                                          |
| • Course title *      • Description Narrative                                                      |
| • Category            • Subcategory               • Topic                                          |
| • Language            • Level (beginner / intermediate / advanced)                                 |
| • Delivery mode (online / offline / hybrid)                                                        |
+----------------------------------------------------------------------------------------------------+
| SECTION 02: COURSE DETAILS                                                                         |
| • Price (₹)           • Duration (weeks)          • Student capacity                               |
| • Thumbnail URL       • Curriculum (Roadmap text) • Learning outcomes (Checklist: 1 per line)      |
+----------------------------------------------------------------------------------------------------+
```

---

## 1. Instructor 1: Shreyash Donal (`shreyash1instructor@gmail.com`)
*Location: Indore (~1.62 km) • Specialization: Enterprise Full-Stack Systems*

### Course 1.1: Full Stack Java Developer: Spring Boot, Microservices & React

#### 01. Course Basics
- **Course title \***: `Full Stack Java Developer: Spring Boot, Microservices & React`
- **Description**:  
  `Master enterprise full-stack software development from the ground up. This intensive program bridges fundamental Object-Oriented Java with production-grade backend engineering using Spring Boot 3, Hibernate JPA, and PostgreSQL. You will design, build, and deploy decoupled microservices with Spring Cloud, integrate secure JWT authentication with Spring Security 6, and construct dynamic, reactive frontend client applications using React 18, Redux Toolkit, and Tailwind CSS. Ideal for developers aiming for high-impact software engineering roles.`
- **Category**: `Technology`
- **Subcategory**: `Web Development`
- **Topic**: `Full Stack`
- **Language**: `English`
- **Level**: `intermediate`
- **Delivery mode**: `hybrid` *(Indore Live Campus + Online Recordings)*

#### 02. Course Details
- **Price (₹)**: `4999`
- **Duration (weeks)**: `12`
- **Student capacity**: `35`
- **Thumbnail URL**: `https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80`
- **Curriculum**:  
  `Week 1-3: Advanced Java, Streams API, and Multithreading Foundations`  
  `Week 4-6: Spring Boot 3 Core, Dependency Injection, REST APIs & PostgreSQL JPA`  
  `Week 7-8: Microservices Architecture, API Gateway & Eureka Service Discovery`  
  `Week 9-10: JWT Security, Role-Based Access Control & Unit Testing with JUnit 5`  
  `Week 11-12: Modern React 18 Frontend, State Management & Full-Stack Cloud Deployment`
- **Learning outcomes**:  
  `Architect scalable microservices using Spring Boot 3 and Spring Cloud`  
  `Implement robust authentication and RBAC with Spring Security and JWT`  
  `Design, normalize, and query high-throughput relational databases with PostgreSQL and Hibernate`  
  `Develop interactive single-page dashboards using React 18 and Redux Toolkit`  
  `Containerize full-stack services with Docker and setup CI/CD deployment pipelines`

---

### Course 1.2: MERN Stack Mastery: Production Node.js, Express & React

#### 01. Course Basics
- **Course title \***: `MERN Stack Mastery: Production Node.js, Express & React`
- **Description**:  
  `A complete, hands-on journey into the modern JavaScript and TypeScript ecosystem. Build and deploy production-ready web applications leveraging MongoDB, Express.js, React, and Node.js. Dive deep into event-driven server architectures, RESTful and GraphQL API design, database indexing and aggregation pipelines, React state management, and real-time bi-directional communication with WebSockets (Socket.io).`
- **Category**: `Technology`
- **Subcategory**: `Web Development`
- **Topic**: `Full Stack`
- **Language**: `English`
- **Level**: `beginner`
- **Delivery mode**: `online`

#### 02. Course Details
- **Price (₹)**: `3999`
- **Duration (weeks)**: `10`
- **Student capacity**: `50`
- **Thumbnail URL**: `https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=80`
- **Curriculum**:  
  `Week 1-2: Modern JavaScript (ES6+), Node.js Runtime & NPM Ecosystem`  
  `Week 3-4: Express.js Server Architecture, Middleware & RESTful Routing`  
  `Week 5-6: MongoDB Schema Modeling, Validation & Mongoose Aggregation`  
  `Week 7-8: React 18 Component Architecture, Custom Hooks & Global Context`  
  `Week 9-10: Real-time Chat with Socket.io, Payment Gateway Integration & Deployment`
- **Learning outcomes**:  
  `Construct scalable RESTful backend servers using Node.js and Express`  
  `Model and query non-relational document databases efficiently with MongoDB`  
  `Build performant, mobile-first responsive interfaces using React and modern CSS`  
  `Implement real-time bidirectional messaging features with WebSockets`  
  `Deploy complete full-stack applications with environment isolation and SSL security`

---

## 2. Instructor 2: Pooja Rathore (`shreyash2instructor@gmail.com`)
*Location: Indore (~3.26 km) • Specialization: Creative Direction & Brand Identity*

### Course 2.1: Introduction to Graphic Design: Photoshop, Illustrator & Visual Branding

#### 01. Course Basics
- **Course title \***: `Introduction to Graphic Design: Photoshop, Illustrator & Visual Branding`
- **Description**:  
  `Unleash your visual creativity and turn ideas into commercially viable designs. This beginner-friendly course teaches you the fundamental principles of graphic design: color theory, layout grids, visual hierarchy, and typography. You will gain mastery over the industry standard creative toolkit—Adobe Illustrator for precision vector graphics and logos, and Adobe Photoshop for image compositing, retouching, and digital painting.`
- **Category**: `Technology`
- **Subcategory**: `Design & Multimedia`
- **Topic**: `Graphic Design`
- **Language**: `English`
- **Level**: `beginner`
- **Delivery mode**: `online`

#### 02. Course Details
- **Price (₹)**: `2499`
- **Duration (weeks)**: `6`
- **Student capacity**: `40`
- **Thumbnail URL**: `https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&auto=format&fit=crop&q=80`
- **Curriculum**:  
  `Week 1: Fundamentals of Visual Design, Color Harmony & Composition Grids`  
  `Week 2: Vector Illustration & Logo Design in Adobe Illustrator`  
  `Week 3: Advanced Typography, Font Pairing & Brand Guideline Creation`  
  `Week 4: Photo Manipulation, Retouching & Color Grading in Adobe Photoshop`  
  `Week 5: Marketing Creatives, Social Media Banners & Print Layouts`  
  `Week 6: Final Brand Identity Capstone Project & Freelance Portfolio Prep`
- **Learning outcomes**:  
  `Apply visual hierarchy, contrast, balance, and color theory to any design project`  
  `Design vector logos, brand marks, and scalable illustrations in Adobe Illustrator`  
  `Edit, color-grade, and composite professional creative assets using Photoshop`  
  `Create comprehensive brand guidelines and print-ready marketing materials`  
  `Assemble an industry-standard digital portfolio to attract freelance clients`

---

## 3. Instructor 3: Rohan Mehta (`shreyash3instructor@gmail.com`)
*Location: Indore (~3.63 km) • Specialization: Core Systems & Algorithmic Problem Solving*

### Course 3.1: Core Java Programming & Object-Oriented Design Fundamentals

#### 01. Course Basics
- **Course title \***: `Core Java Programming & Object-Oriented Design Fundamentals`
- **Description**:  
  `Build a rock-solid programming foundation with one of the world's most enduring and reliable programming languages. This course demystifies the Java programming language from basic syntax to advanced Object-Oriented Programming (OOP) paradigms. Learn memory management, JVM stack and heap mechanics, exception handling architectures, file I/O operations, and the powerful Java Collections Framework to write clean, reusable, and maintainable software.`
- **Category**: `Technology`
- **Subcategory**: `Programming`
- **Topic**: `Java`
- **Language**: `English`
- **Level**: `beginner`
- **Delivery mode**: `offline` *(Indore Campus Classroom)*

#### 02. Course Details
- **Price (₹)**: `1999`
- **Duration (weeks)**: `8`
- **Student capacity**: `25`
- **Thumbnail URL**: `https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80`
- **Curriculum**:  
  `Week 1-2: Java Fundamentals, Data Types, Control Structures & JVM Architecture`  
  `Week 3-4: Classes, Objects, Constructors & The 4 Pillars of OOP`  
  `Week 5: Interfaces, Abstract Classes, Polymorphism & Package Management`  
  `Week 6: Exception Handling, Custom Exceptions & Robust Memory Management`  
  `Week 7: Java Collections Framework (ArrayList, HashMap, HashSet, Iterators)`  
  `Week 8: File I/O, Generics, Lambda Expressions & Capstone Console Application`
- **Learning outcomes**:  
  `Write clean, structured, and syntactically sound Java applications`  
  `Implement the four core pillars of Object-Oriented Programming in real software`  
  `Understand JVM internal architecture, memory allocation, and Garbage Collection`  
  `Utilize the Java Collections Framework to store and manipulate structured data`  
  `Debug complex exceptions and write robust error-resistant Java routines`

---

## 4. Instructor 4: Kavita Patel (`shreyash4instructor@gmail.com`)
*Location: Indore (~6.60 km) • Specialization: Modern Frontend Engineering*

### Course 4.1: Modern JavaScript from Scratch: ES6+, Async/Await & DOM Mastery

#### 01. Course Basics
- **Course title \***: `Modern JavaScript from Scratch: ES6+, Async/Await & DOM Mastery`
- **Description**:  
  `Demystify modern JavaScript and gain true confidence as a frontend engineer. Skip obsolete legacy quirks and learn the language as it is written today in top engineering teams. This course explores modern ES6+ syntax, scopes, closures, hoisting, prototype chains, the JavaScript Event Loop, asynchronous programming with Promises and Async/Await, and direct manipulation of the Document Object Model (DOM) to build snappy, interactive browser applications.`
- **Category**: `Technology`
- **Subcategory**: `Programming`
- **Topic**: `JavaScript`
- **Language**: `English`
- **Level**: `beginner`
- **Delivery mode**: `online`

#### 02. Course Details
- **Price (₹)**: `1499`
- **Duration (weeks)**: `6`
- **Student capacity**: `60`
- **Thumbnail URL**: `https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800&auto=format&fit=crop&q=80`
- **Curriculum**:  
  `Week 1: Modern JS Syntax, Variables (let/const), Arrow Functions & Destructuring`  
  `Week 2: Scopes, Execution Context, Closures & Array Higher-Order Methods`  
  `Week 3: DOM Selection, Event Delegation, Form Validation & Dynamic Rendering`  
  `Week 4: Asynchronous JavaScript: Event Loop, Microtasks, Callbacks & Promises`  
  `Week 5: Async/Await, Fetch API, Error Handling & Consuming Public REST APIs`  
  `Week 6: Web Storage (localStorage/sessionStorage), ES Modules & Interactive Project`
- **Learning outcomes**:  
  `Write idiomatic modern JavaScript utilizing ES6 through ES2024 specifications`  
  `Deeply understand closures, execution contexts, and the browser Event Loop`  
  `Manipulate the DOM dynamically and build responsive web interactions`  
  `Consume external REST APIs seamlessly using Fetch, Promises, and Async/Await`  
  `Persist client state using browser storage and organize code with ES Modules`

---

## 5. Instructor 5: Vikram Malhotra (`shreyash5instructor@gmail.com`)
*Location: Indore (~8.04 km) • Specialization: Python Automation & Backend Logic*

### Course 5.1: Python Programming Essentials: Automation, Scripting & Backend Logic

#### 01. Course Basics
- **Course title \***: `Python Programming Essentials: Automation, Scripting & Backend Logic`
- **Description**:  
  `Unlock the versatility and simplicity of Python 3. Designed for beginners and professionals looking to automate repetitive workflows, this course covers core programming logic, data structures, list comprehensions, object-oriented concepts, and practical scripting. Learn to manipulate spreadsheets, scrape information from websites using BeautifulSoup, automate desktop tasks, and build lightweight backend scripts that save hours of manual work.`
- **Category**: `Technology`
- **Subcategory**: `Programming`
- **Topic**: `Python`
- **Language**: `English`
- **Level**: `beginner`
- **Delivery mode**: `hybrid` *(Indore Weekend Workshop + Online Labs)*

#### 02. Course Details
- **Price (₹)**: `2199`
- **Duration (weeks)**: `8`
- **Student capacity**: `45`
- **Thumbnail URL**: `https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&auto=format&fit=crop&q=80`
- **Curriculum**:  
  `Week 1-2: Python 3 Fundamentals, Variables, Data Types & Control Flow`  
  `Week 3: Python Data Structures: Lists, Tuples, Dictionaries & Sets`  
  `Week 4: Functions, Lambda Expressions, List Comprehensions & Generator Basics`  
  `Week 5: File Operations, JSON/CSV Parsing & Excel Spreadsheet Automation`  
  `Week 6: Web Scraping with Requests and BeautifulSoup`  
  `Week 7: Object-Oriented Programming (OOP) in Python: Classes & Inheritance`  
  `Week 8: Automated Task Scheduler Project & Building Command Line Utilities`
- **Learning outcomes**:  
  `Write clean, PEP 8 compliant Python code for diverse automation tasks`  
  `Process, parse, and automate data operations across CSV, JSON, and Excel files`  
  `Scrape live information from web pages using BeautifulSoup and Requests`  
  `Structure maintainable, modular Python programs using Object-Oriented patterns`  
  `Build end-to-end automation scripts that execute on recurring schedules`

---

## 6. Quick Field Comparison Matrix

| Course | Instructor | Topic | Mode | Level | Price | Weeks | Capacity |
|---|---|---|:---:|:---:|:---:|:---:|:---:|
| **Java Full Stack** | Shreyash Donal | Full Stack | Hybrid | Intermediate | ₹4,999 | 12 | 35 |
| **MERN Stack Mastery** | Shreyash Donal | Full Stack | Online | Beginner | ₹3,999 | 10 | 50 |
| **Intro to Graphic Design** | Pooja Rathore | Graphic Design | Online | Beginner | ₹2,499 | 6 | 40 |
| **Core Java Fundamentals** | Rohan Mehta | Java | Offline | Beginner | ₹1,999 | 8 | 25 |
| **Modern JavaScript** | Kavita Patel | JavaScript | Online | Beginner | ₹1,499 | 6 | 60 |
| **Python Essentials** | Vikram Malhotra | Python | Hybrid | Beginner | ₹2,199 | 8 | 45 |
