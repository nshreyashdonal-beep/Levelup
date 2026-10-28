-- server/db/seed_more_courses.sql
-- Seed 7 additional courses, modules, and trial lectures
-- Brings total published courses to 21 across the 5 seeded instructors.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO courses (
  title, description, price, instructor_id, category_id,
  level, delivery_mode, language, thumbnail_url, duration_weeks,
  capacity, curriculum, outcomes, status
)
SELECT
  demo.title, demo.description, demo.price, users.id, cat.id,
  demo.level, demo.delivery_mode, demo.language, demo.thumbnail_url, demo.duration_weeks,
  demo.capacity, demo.curriculum, demo.outcomes, 'published'
FROM (
  VALUES
    (
      'shreyash1instructor@gmail.com',
      'Production Backend Engineering with Go & Distributed Microservices',
      'Master modern backend systems engineering using Golang, gRPC, and distributed microservices architecture. Designed for developers transitioning from monolithic architectures to high-concurrency cloud-native services. Learn concurrency primitives with goroutines and channels, high-performance HTTP/REST and gRPC API design, PostgreSQL connection pooling, Redis caching patterns, and distributed tracing with OpenTelemetry.',
      3499.00,
      'Backend',
      'intermediate',
      'hybrid',
      'English',
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
      10,
      30,
      E'Week 1-2: Go Syntax, Type System, Pointers & Memory Allocation\nWeek 3-4: Concurrency Primitives: Goroutines, Channels, Select & Mutexes\nWeek 5-6: High-Throughput REST & gRPC API Design with Protocol Buffers\nWeek 7-8: Database Engineering with PostgreSQL, Connection Pools & Redis Caching\nWeek 9-10: Distributed Tracing with OpenTelemetry, Docker Deployment & CI/CD',
      E'Write idiomatic, high-concurrency Go applications using goroutines and channels\nDesign lightning-fast internal RPC services utilizing gRPC and Protocol Buffers\nImplement multi-tier caching architectures with Redis and PostgreSQL\nInstrument distributed microservices with structured logging and OpenTelemetry\nPackage and deploy cloud-native Go binary services using Docker containers'
    ),
    (
      'shreyash2instructor@gmail.com',
      'Data Analysis & Business Intelligence with SQL, Power BI & Tableau',
      'Transform raw organizational data into compelling executive dashboards and actionable business insights. Learn enterprise SQL for complex queries, window functions, and CTEs, followed by end-to-end data modeling in Microsoft Power BI and Tableau. Master DAX measures, automated ETL pipelines, and storytelling with visual analytics to drive data-informed decision making.',
      2999.00,
      'Data Analysis',
      'beginner',
      'online',
      'English',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
      8,
      45,
      E'Week 1-2: Advanced Relational SQL, Window Functions & Common Table Expressions\nWeek 3-4: Data Cleaning, Reshaping & Automated ETL Data Pipelines\nWeek 5-6: Microsoft Power BI: Star Schema Modeling, Power Query & DAX Measures\nWeek 7: Tableau Desktop: Calculated Fields, Level of Detail (LOD) & Parameters\nWeek 8: Executive Storytelling, Interactive Dashboard Capstone & Portfolio Delivery',
      E'Write complex multi-table SQL queries utilizing analytic window functions\nConstruct performant dimensional data models following star schema principles\nFormulate sophisticated DAX calculations and KPIs in Microsoft Power BI\nDesign publication-ready interactive visual dashboards in Tableau\nTranslate ambiguous business questions into clear metric-driven data visualizations'
    ),
    (
      'shreyash3instructor@gmail.com',
      'Modern C++20 Systems Programming & High-Performance Computing',
      'Delve into bare-metal systems programming, memory management, and modern C++20 features. This rigorous course covers RAII, smart pointers, move semantics, template metaprogramming, multithreading with std::jthread, and low-latency cache-friendly algorithms. Build real-world high-throughput networking clients and benchmark memory performance.',
      2799.00,
      'C / C++',
      'intermediate',
      'offline',
      'English',
      'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&auto=format&fit=crop&q=80',
      10,
      20,
      E'Week 1-2: Memory Architecture, Stack vs Heap & RAII Resource Management\nWeek 3-4: Modern C++ Features: Move Semantics, Rvalue References & Smart Pointers\nWeek 5-6: Template Metaprogramming, Concepts, Constraints & Ranges in C++20\nWeek 7-8: Low-Latency Multithreading: Atomics, Memory Orders & std::jthread\nWeek 9-10: Systems Benchmarking, Cache Alignment & High-Speed Socket Networking',
      E'Master manual and deterministic memory management with RAII and smart pointers\nLeverage move semantics to eliminate redundant deep object copies\nWrite type-safe, generic meta-programs using C++20 Concepts and Ranges\nImplement thread-safe, low-lock data structures with atomic primitives\nProfile, benchmark, and optimize CPU cache locality and hardware bottlenecks'
    ),
    (
      'shreyash4instructor@gmail.com',
      'Motion Graphics, Visual Storytelling & VFX with Premiere Pro & After Effects',
      'Create cinematic video content, visual effects, and dynamic motion graphics. Learn non-linear video editing workflows in Adobe Premiere Pro, color grading with Lumetri, audio mastering, and 2D/3D title animation and VFX compositing in Adobe After Effects. Perfect for content creators, marketing animators, and indie filmmakers.',
      3299.00,
      'Video & Animation',
      'beginner',
      'online',
      'English',
      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80',
      8,
      35,
      E'Week 1-2: Non-Linear Video Editing Foundations & Pacing in Adobe Premiere Pro\nWeek 3: Lumetri Color Wheels, Curves, LUTs & Audio Waveform Mastering\nWeek 4-5: Adobe After Effects: Keyframing, Graph Editor & Speed Curves\nWeek 6: Kinetic Typography, Vector Shape Layer Animation & Lower Thirds\nWeek 7: Chroma Keying, Rotoscoping, Camera Tracking & Visual Effects Compositing\nWeek 8: Export Presets, Multi-Platform Delivery & Portfolio Reel Assembly',
      E'Edit commercial and narrative video footage with narrative flow and precision\nGrade cinematic footage and correct lighting imbalances using Lumetri Color\nAnimate custom kinetic typography, brand logos, and commercial lower thirds\nComposite visual effects scenes using rotoscoping, green-screen, and tracking\nDeliver optimized high-resolution exports across YouTube, broadcast, and social media'
    ),
    (
      'shreyash5instructor@gmail.com',
      'AWS Cloud Security Architecture, DevSecOps & Threat Hunting',
      'Secure modern cloud environments and automate defensive infrastructure security on Amazon Web Services (AWS). Learn IAM least-privilege architecture, VPC network segmentation, KMS cryptographic key management, automated container security scanning with Trivy, CI/CD pipeline guardrails, and real-time SIEM log analysis using AWS GuardDuty and Security Hub.',
      4499.00,
      'Cloud Security',
      'advanced',
      'hybrid',
      'English',
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
      10,
      25,
      E'Week 1-2: AWS Identity & Access Management (IAM), Least-Privilege & SCPs\nWeek 3-4: Secure Cloud Networking: Transit Gateways, WAF & VPC Flow Logs\nWeek 5-6: Data Protection at Rest & in Transit: AWS KMS & Secrets Manager\nWeek 7-8: DevSecOps CI/CD: Static Analysis, Trivy Container Scanning & OPA Policies\nWeek 9-10: Automated Incident Response with GuardDuty, CloudTrail & EventBridge',
      E'Design bulletproof IAM policies, role delegations, and permission boundaries\nArchitect multi-VPC segmented cloud networks guarded by AWS WAF and Security Groups\nImplement envelope encryption and centralized secret rotation via AWS KMS\nEmbed automated container vulnerability scanning into GitHub Actions pipelines\nInvestigate security events and orchestrate automated remediations with EventBridge'
    ),
    (
      'shreyash2instructor@gmail.com',
      'Generative AI, LLM Engineering & Applied Prompt Architecture',
      'Harness the power of Large Language Models (LLMs), LangChain, and vector embeddings to construct intelligent AI applications. Master retrieval-augmented generation (RAG) with ChromaDB and Pinecone, prompt engineering strategies, fine-tuning lightweight models, and deploying conversational AI agents with streaming responses.',
      4199.00,
      'Artificial Intelligence',
      'intermediate',
      'online',
      'English',
      'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=800&auto=format&fit=crop&q=80',
      8,
      40,
      E'Week 1-2: Foundations of Transformer Architecture, Tokenization & Temperature\nWeek 3: Advanced Prompt Engineering: Few-Shot, Chain-of-Thought & Self-Consistency\nWeek 4-5: Embeddings & Vector Databases: ChromaDB, Pinecone & Semantic Search\nWeek 6: Production Retrieval-Augmented Generation (RAG) Pipelines with LangChain\nWeek 7: Autonomous Multi-Step AI Agents, Tool Calling & Function Execution\nWeek 8: Evaluation Frameworks (Ragas), Rate Limiting & Streaming Cloud Deployment',
      E'Understand core Transformer mechanics, attention heads, and sampling parameters\nConstruct production-ready Retrieval-Augmented Generation (RAG) pipelines\nQuery, index, and store dense vector embeddings with Pinecone and ChromaDB\nDevelop autonomous agent workflows capable of invoking external APIs and tools\nBenchmark AI response quality, hallucination metrics, and latency performance'
    ),
    (
      'shreyash1instructor@gmail.com',
      'DevOps & Cloud Automation: Terraform, Docker & Kubernetes',
      'Accelerate software delivery and master infrastructure as code (IaC) with Terraform, Docker, and production Kubernetes clusters. Learn declarative infrastructure provisioning, container orchestration, Helm package management, ingress routing, zero-downtime rolling updates, and monitoring with Prometheus and Grafana.',
      3899.00,
      'Backend',
      'intermediate',
      'online',
      'English',
      'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&auto=format&fit=crop&q=80',
      10,
      35,
      E'Week 1-2: Infrastructure as Code (IaC) with Terraform: Providers, State & Modules\nWeek 3-4: Docker Containerization: Multi-Stage Builds, Caching & Optimization\nWeek 5-6: Kubernetes Core: Pods, Deployments, ReplicaSets & Cluster Architecture\nWeek 7: Kubernetes Networking: Services, Ingress Controllers & Cert-Manager SSL\nWeek 8-9: ConfigMaps, Secrets, Persistent Volumes & Helm Package Management\nWeek 10: Cluster Observability with Prometheus & Grafana Monitoring Dashboards',
      E'Provision repeatable cloud infrastructure reliably using Terraform modules\nBuild minimal, highly-optimized container images with multi-stage Dockerfiles\nDeploy, scale, and manage self-healing container clusters on Kubernetes\nConfigure ingress routing with automated SSL certificate provisioning\nMonitor container metrics, cluster memory, and error rates using Grafana'
    )
) AS demo(email, title, description, price, topic, level, delivery_mode, language, thumbnail_url, duration_weeks, capacity, curriculum, outcomes)
JOIN users ON users.email = demo.email
JOIN categories cat ON cat.name = demo.topic AND cat.parent_id IS NOT NULL
WHERE NOT EXISTS (
  SELECT 1 FROM courses c WHERE c.title = demo.title
);
