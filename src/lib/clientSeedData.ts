export interface ClientDatabaseSchema {
  users: any[];
  targetRoles: any[];
  skills: any[];
  targetRoleSkills: any[];
  userSkills: any[];
  courses: any[];
  courseSkills: any[];
  courseModules: any[];
  learningResources: any[];
  enrollments: any[];
  lessonProgress: any[];
  quizzes: any[];
  quizQuestions: any[];
  quizAttempts: any[];
  certificates: any[];
  notifications: any[];
}

export function getClientInitialSeedData(): ClientDatabaseSchema {
  const users = [
    {
      id: 'usr-learner-1',
      name: 'Aarav Sharma',
      email: 'learner@capacityconnect.demo',
      password: 'demo1234',
      role: 'LEARNER',
      department: 'Software Engineering',
      organization: 'National Digital Academy',
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
      targetRoleId: 'role-cloud-dev',
      isActive: true,
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-08-20T14:30:00Z',
    },
    {
      id: 'usr-learner-2',
      name: 'Priya Patel',
      email: 'priya.patel@capacityconnect.demo',
      password: 'demo1234',
      role: 'LEARNER',
      department: 'Data & Analytics',
      organization: 'National Digital Academy',
      profileImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=faces',
      targetRoleId: 'role-ai-data',
      isActive: true,
      createdAt: '2026-02-01T09:15:00Z',
      updatedAt: '2026-08-22T11:00:00Z',
    },
    {
      id: 'usr-learner-3',
      name: 'Rohan Verma',
      email: 'rohan.verma@capacityconnect.demo',
      password: 'demo1234',
      role: 'LEARNER',
      department: 'Infrastructure & SecOps',
      organization: 'National Digital Academy',
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
      targetRoleId: 'role-cybersecurity',
      isActive: true,
      createdAt: '2026-02-10T14:20:00Z',
      updatedAt: '2026-08-21T09:45:00Z',
    },
    {
      id: 'usr-trainer-1',
      name: 'Dr. Vikramaditya Rao',
      email: 'trainer@capacityconnect.demo',
      password: 'demo1234',
      role: 'TRAINER',
      department: 'Cloud & Distributed Systems',
      organization: 'National Digital Academy',
      profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces',
      isActive: true,
      createdAt: '2025-11-10T08:00:00Z',
      updatedAt: '2026-08-24T16:00:00Z',
    },
    {
      id: 'usr-trainer-2',
      name: 'Ananya Deshmukh',
      email: 'ananya.deshmukh@capacityconnect.demo',
      password: 'demo1234',
      role: 'TRAINER',
      department: 'Full-Stack Architecture',
      organization: 'National Digital Academy',
      profileImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=faces',
      isActive: true,
      createdAt: '2025-12-01T08:00:00Z',
      updatedAt: '2026-08-24T16:00:00Z',
    },
    {
      id: 'usr-admin-1',
      name: 'Prof. Rajeshwar Kulkarni',
      email: 'admin@capacityconnect.demo',
      password: 'demo1234',
      role: 'ADMIN',
      department: 'Organizational Learning & Governance',
      organization: 'National Digital Academy',
      profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=faces',
      isActive: true,
      createdAt: '2025-10-01T00:00:00Z',
      updatedAt: '2026-08-24T18:00:00Z',
    }
  ];

  const targetRoles = [
    {
      id: 'role-cloud-dev',
      name: 'Cloud Developer',
      description: 'Designs, deploys, and manages scalable cloud-native architectures, containerized microservices, and serverless applications.',
      icon: 'Cloud',
      category: 'Cloud Engineering'
    },
    {
      id: 'role-fullstack',
      name: 'Full-Stack Developer',
      description: 'Builds end-to-end web applications with modern frontend frameworks, backend APIs, relational databases, and secure authentication.',
      icon: 'Layers',
      category: 'Software Development'
    },
    {
      id: 'role-ai-data',
      name: 'AI & Data Analyst',
      description: 'Extracts actionable business intelligence, constructs machine learning pipelines, and visualizes complex multidimensional data.',
      icon: 'BarChart2',
      category: 'Artificial Intelligence'
    },
    {
      id: 'role-cybersecurity',
      name: 'Cybersecurity Specialist',
      description: 'Protects enterprise digital assets, conducts vulnerability assessments, implements zero-trust policies, and responds to threats.',
      icon: 'ShieldCheck',
      category: 'Information Security'
    },
    {
      id: 'role-devops',
      name: 'DevOps & SRE Engineer',
      description: 'Automates continuous integration, infrastructure as code (IaC), zero-downtime deployments, and reliability telemetry.',
      icon: 'Cpu',
      category: 'Infrastructure & Operations'
    }
  ];

  const skills = [
    { id: 'sk-python', name: 'Python', description: 'Core programming, asynchronous programming, scripting, data handling and standard libraries', category: 'Programming' },
    { id: 'sk-javascript', name: 'JavaScript', description: 'Modern ECMAScript, DOM manipulation, asynchronous promises, and runtime environments', category: 'Programming' },
    { id: 'sk-typescript', name: 'TypeScript', description: 'Static typing, generics, interfaces, and enterprise code maintainability', category: 'Programming' },
    { id: 'sk-sql', name: 'SQL & Relational DBs', description: 'Relational query design, indexing, normalization, transactions, and schema management', category: 'Database' },
    { id: 'sk-git', name: 'Git & Version Control', description: 'Branching workflows, merge conflicts, interactive rebasing, pull requests, and GitOps', category: 'Tools' },
    { id: 'sk-linux', name: 'Linux Fundamentals', description: 'Shell scripting, file permissions, process monitoring, systemd, and server administration', category: 'System' },
    { id: 'sk-docker', name: 'Docker & Containers', description: 'Containerization, Dockerfile optimization, multi-stage builds, volumes, and networking', category: 'DevOps' },
    { id: 'sk-k8s', name: 'Kubernetes Orchestration', description: 'Cluster architecture, Pods, Deployments, Services, ConfigMaps, and Ingress routing', category: 'DevOps' },
    { id: 'sk-cloud', name: 'Cloud Computing (AWS/GCP)', description: 'Compute instances, object storage, serverless functions, IAM policies, and VPC networking', category: 'Cloud' },
    { id: 'sk-react', name: 'React & UI Architecture', description: 'Component state, custom hooks, virtual DOM rendering, routing, and modern UI patterns', category: 'Frontend' },
    { id: 'sk-node', name: 'Node.js & Express', description: 'Server-side runtime, middleware pipelines, RESTful controllers, and streaming data', category: 'Backend' },
    { id: 'sk-rest', name: 'REST & API Security', description: 'API contract design, OpenAPI specifications, JWT authentication, rate limiting, and CORS', category: 'Backend' },
    { id: 'sk-cicd', name: 'CI/CD Pipelines', description: 'Automated testing workflows, GitHub Actions, build artifacts, and automated deployments', category: 'DevOps' },
    { id: 'sk-ml', name: 'Machine Learning Basics', description: 'Supervised/unsupervised algorithms, evaluation metrics, feature engineering, and model training', category: 'Data & AI' },
    { id: 'sk-dataviz', name: 'Data Visualization', description: 'Exploratory data analytics, charting dashboards, interactive metrics, and storytelling', category: 'Data & AI' },
    { id: 'sk-netsec', name: 'Network Security', description: 'Firewalls, TLS/SSL encryption, subnet segmentation, intrusion detection, and protocols', category: 'Security' },
    { id: 'sk-appsec', name: 'Application Security (OWASP)', description: 'Mitigating SQLi, XSS, CSRF, insecure deserialization, and authentication bypasses', category: 'Security' },
    { id: 'sk-sysdesign', name: 'System Design & Scalability', description: 'High-availability architectures, load balancing, caching strategies, and message queues', category: 'Architecture' },
    { id: 'sk-communication', name: 'Technical Communication', description: 'Architecture documentation, cross-functional articulation, and stakeholder reporting', category: 'Soft Skills' },
    { id: 'sk-agile', name: 'Agile & Scrum Delivery', description: 'Sprint planning, backlog refinement, user story estimation, and iterative delivery', category: 'Soft Skills' }
  ];

  const targetRoleSkills = [
    { targetRoleId: 'role-cloud-dev', skillId: 'sk-python', requiredLevel: 'ADVANCED', importance: 4 },
    { targetRoleId: 'role-cloud-dev', skillId: 'sk-git', requiredLevel: 'INTERMEDIATE', importance: 4 },
    { targetRoleId: 'role-cloud-dev', skillId: 'sk-linux', requiredLevel: 'ADVANCED', importance: 5 },
    { targetRoleId: 'role-cloud-dev', skillId: 'sk-cloud', requiredLevel: 'EXPERT', importance: 5 },
    { targetRoleId: 'role-cloud-dev', skillId: 'sk-docker', requiredLevel: 'ADVANCED', importance: 5 },
    { targetRoleId: 'role-cloud-dev', skillId: 'sk-k8s', requiredLevel: 'INTERMEDIATE', importance: 4 },
    { targetRoleId: 'role-cloud-dev', skillId: 'sk-rest', requiredLevel: 'INTERMEDIATE', importance: 3 },

    { targetRoleId: 'role-fullstack', skillId: 'sk-javascript', requiredLevel: 'EXPERT', importance: 5 },
    { targetRoleId: 'role-fullstack', skillId: 'sk-typescript', requiredLevel: 'ADVANCED', importance: 4 },
    { targetRoleId: 'role-fullstack', skillId: 'sk-react', requiredLevel: 'EXPERT', importance: 5 },
    { targetRoleId: 'role-fullstack', skillId: 'sk-node', requiredLevel: 'ADVANCED', importance: 5 },
    { targetRoleId: 'role-fullstack', skillId: 'sk-sql', requiredLevel: 'ADVANCED', importance: 4 },
    { targetRoleId: 'role-fullstack', skillId: 'sk-rest', requiredLevel: 'ADVANCED', importance: 4 },
    { targetRoleId: 'role-fullstack', skillId: 'sk-git', requiredLevel: 'INTERMEDIATE', importance: 3 },

    { targetRoleId: 'role-ai-data', skillId: 'sk-python', requiredLevel: 'EXPERT', importance: 5 },
    { targetRoleId: 'role-ai-data', skillId: 'sk-sql', requiredLevel: 'EXPERT', importance: 5 },
    { targetRoleId: 'role-ai-data', skillId: 'sk-ml', requiredLevel: 'ADVANCED', importance: 5 },
    { targetRoleId: 'role-ai-data', skillId: 'sk-dataviz', requiredLevel: 'ADVANCED', importance: 4 },
    { targetRoleId: 'role-ai-data', skillId: 'sk-git', requiredLevel: 'INTERMEDIATE', importance: 3 },

    { targetRoleId: 'role-cybersecurity', skillId: 'sk-netsec', requiredLevel: 'EXPERT', importance: 5 },
    { targetRoleId: 'role-cybersecurity', skillId: 'sk-appsec', requiredLevel: 'EXPERT', importance: 5 },
    { targetRoleId: 'role-cybersecurity', skillId: 'sk-linux', requiredLevel: 'ADVANCED', importance: 4 },
    { targetRoleId: 'role-cybersecurity', skillId: 'sk-python', requiredLevel: 'INTERMEDIATE', importance: 3 },
    { targetRoleId: 'role-cybersecurity', skillId: 'sk-cloud', requiredLevel: 'INTERMEDIATE', importance: 4 },

    { targetRoleId: 'role-devops', skillId: 'sk-linux', requiredLevel: 'EXPERT', importance: 5 },
    { targetRoleId: 'role-devops', skillId: 'sk-docker', requiredLevel: 'EXPERT', importance: 5 },
    { targetRoleId: 'role-devops', skillId: 'sk-k8s', requiredLevel: 'EXPERT', importance: 5 },
    { targetRoleId: 'role-devops', skillId: 'sk-cicd', requiredLevel: 'EXPERT', importance: 5 },
    { targetRoleId: 'role-devops', skillId: 'sk-cloud', requiredLevel: 'ADVANCED', importance: 5 },
    { targetRoleId: 'role-devops', skillId: 'sk-sysdesign', requiredLevel: 'ADVANCED', importance: 4 },
    { targetRoleId: 'role-devops', skillId: 'sk-git', requiredLevel: 'ADVANCED', importance: 4 }
  ];

  const userSkills = [
    { userId: 'usr-learner-1', skillId: 'sk-python', competencyLevel: 'ADVANCED', score: 78, lastAssessedAt: '2026-08-10T10:00:00Z' },
    { userId: 'usr-learner-1', skillId: 'sk-git', competencyLevel: 'INTERMEDIATE', score: 65, lastAssessedAt: '2026-08-12T11:30:00Z' },
    { userId: 'usr-learner-1', skillId: 'sk-sql', competencyLevel: 'INTERMEDIATE', score: 60, lastAssessedAt: '2026-08-14T09:00:00Z' },
    { userId: 'usr-learner-1', skillId: 'sk-javascript', competencyLevel: 'INTERMEDIATE', score: 55, lastAssessedAt: '2026-08-15T14:00:00Z' },
    { userId: 'usr-learner-1', skillId: 'sk-linux', competencyLevel: 'BEGINNER', score: 30, lastAssessedAt: '2026-08-18T16:00:00Z' },
    { userId: 'usr-learner-1', skillId: 'sk-cloud', competencyLevel: 'BEGINNER', score: 20, lastAssessedAt: '2026-08-19T10:00:00Z' },
    { userId: 'usr-learner-1', skillId: 'sk-docker', competencyLevel: 'BEGINNER', score: 10, lastAssessedAt: '2026-08-20T12:00:00Z' },

    { userId: 'usr-learner-2', skillId: 'sk-python', competencyLevel: 'EXPERT', score: 92, lastAssessedAt: '2026-08-15T10:00:00Z' },
    { userId: 'usr-learner-2', skillId: 'sk-sql', competencyLevel: 'ADVANCED', score: 85, lastAssessedAt: '2026-08-16T11:00:00Z' },
    { userId: 'usr-learner-2', skillId: 'sk-ml', competencyLevel: 'INTERMEDIATE', score: 68, lastAssessedAt: '2026-08-18T14:00:00Z' },
    { userId: 'usr-learner-2', skillId: 'sk-dataviz', competencyLevel: 'ADVANCED', score: 75, lastAssessedAt: '2026-08-20T09:00:00Z' },

    { userId: 'usr-learner-3', skillId: 'sk-netsec', competencyLevel: 'ADVANCED', score: 82, lastAssessedAt: '2026-08-14T10:00:00Z' },
    { userId: 'usr-learner-3', skillId: 'sk-linux', competencyLevel: 'ADVANCED', score: 78, lastAssessedAt: '2026-08-15T11:00:00Z' },
    { userId: 'usr-learner-3', skillId: 'sk-appsec', competencyLevel: 'INTERMEDIATE', score: 60, lastAssessedAt: '2026-08-17T12:00:00Z' }
  ];

  const courses = [
    {
      id: 'crs-cloud-foundations',
      title: 'Cloud Computing Foundations & Architecture',
      description: 'Master core cloud primitives, virtualization, managed storage, identity management, and serverless compute on modern cloud providers.',
      thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
      category: 'Cloud Engineering',
      difficulty: 'BEGINNER',
      duration: '4.5 Hours',
      status: 'PUBLISHED',
      trainerId: 'usr-trainer-1',
      createdAt: '2026-01-10T10:00:00Z',
      updatedAt: '2026-08-15T12:00:00Z',
    },
    {
      id: 'crs-docker-containers',
      title: 'Docker & Containerization for Developers',
      description: 'Build, package, run, and optimize containerized microservices. Learn multi-stage builds, networking, volumes, and Docker Compose.',
      thumbnail: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=800&auto=format&fit=crop&q=80',
      category: 'DevOps',
      difficulty: 'INTERMEDIATE',
      duration: '5.0 Hours',
      status: 'PUBLISHED',
      trainerId: 'usr-trainer-1',
      createdAt: '2026-01-20T10:00:00Z',
      updatedAt: '2026-08-18T14:00:00Z',
    },
    {
      id: 'crs-linux-sysadmin',
      title: 'Linux Systems & Shell Mastery',
      description: 'Comprehensive guide to Linux architecture, bash scripting, permission models, systemd services, and production server diagnostics.',
      thumbnail: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800&auto=format&fit=crop&q=80',
      category: 'System',
      difficulty: 'BEGINNER',
      duration: '6.0 Hours',
      status: 'PUBLISHED',
      trainerId: 'usr-trainer-1',
      createdAt: '2026-01-25T10:00:00Z',
      updatedAt: '2026-08-19T10:00:00Z',
    },
    {
      id: 'crs-k8s-production',
      title: 'Kubernetes in Production: Deployments & Scaling',
      description: 'Master enterprise container orchestration with Kubernetes. Deploy pods, services, ingress controllers, config maps, and autoscaling policies.',
      thumbnail: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&auto=format&fit=crop&q=80',
      category: 'DevOps',
      difficulty: 'ADVANCED',
      duration: '8.0 Hours',
      status: 'PUBLISHED',
      trainerId: 'usr-trainer-1',
      createdAt: '2026-02-05T10:00:00Z',
      updatedAt: '2026-08-20T11:00:00Z',
    },
    {
      id: 'crs-fullstack-react-node',
      title: 'Full-Stack Architecture with React & Node.js',
      description: 'Design and implement production-ready web systems. Connect React frontends with Express APIs, JWT security, and relational Postgres databases.',
      thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
      category: 'Software Development',
      difficulty: 'INTERMEDIATE',
      duration: '7.5 Hours',
      status: 'PUBLISHED',
      trainerId: 'usr-trainer-2',
      createdAt: '2026-02-12T10:00:00Z',
      updatedAt: '2026-08-21T15:00:00Z',
    },
    {
      id: 'crs-python-data-science',
      title: 'Applied Machine Learning & Data Analytics with Python',
      description: 'From NumPy and Pandas to Scikit-Learn pipelines. Clean real-world datasets, construct predictive models, and evaluate precision/recall.',
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
      category: 'Artificial Intelligence',
      difficulty: 'ADVANCED',
      duration: '9.0 Hours',
      status: 'PUBLISHED',
      trainerId: 'usr-trainer-2',
      createdAt: '2026-02-18T10:00:00Z',
      updatedAt: '2026-08-22T09:00:00Z',
    },
    {
      id: 'crs-appsec-owasp',
      title: 'Application Security & OWASP Top 10 Mitigation',
      description: 'Defend against the most critical web vulnerabilities. Learn hands-on threat modeling, secure code audits, and defense-in-depth engineering.',
      thumbnail: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
      category: 'Information Security',
      difficulty: 'ADVANCED',
      duration: '6.5 Hours',
      status: 'PUBLISHED',
      trainerId: 'usr-trainer-1',
      createdAt: '2026-03-01T10:00:00Z',
      updatedAt: '2026-08-22T14:00:00Z',
    },
    {
      id: 'crs-git-devops',
      title: 'Advanced Git Workflows & CI/CD Pipelines',
      description: 'Scale collaborative engineering with feature branch strategies, trunk-based development, semantic versioning, and GitHub Actions automation.',
      thumbnail: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop&q=80',
      category: 'DevOps',
      difficulty: 'BEGINNER',
      duration: '4.0 Hours',
      status: 'PUBLISHED',
      trainerId: 'usr-trainer-2',
      createdAt: '2026-03-10T10:00:00Z',
      updatedAt: '2026-08-23T10:00:00Z',
    },
    {
      id: 'crs-sql-mastery',
      title: 'Relational Database Engineering & Query Optimization',
      description: 'Design robust 3NF schemas, master window functions, analyze EXPLAIN execution plans, and eliminate bottleneck table scans.',
      thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=80',
      category: 'Database',
      difficulty: 'INTERMEDIATE',
      duration: '5.5 Hours',
      status: 'PUBLISHED',
      trainerId: 'usr-trainer-2',
      createdAt: '2026-03-15T10:00:00Z',
      updatedAt: '2026-08-23T11:00:00Z',
    },
    {
      id: 'crs-system-design',
      title: 'High-Scale Distributed Systems & Microservices',
      description: 'Architect resilient internet-scale applications. Learn caching patterns, event-driven messaging, CAP theorem trade-offs, and database sharding.',
      thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
      category: 'Architecture',
      difficulty: 'ADVANCED',
      duration: '8.5 Hours',
      status: 'PUBLISHED',
      trainerId: 'usr-trainer-1',
      createdAt: '2026-03-20T10:00:00Z',
      updatedAt: '2026-08-24T09:00:00Z',
    }
  ];

  const courseSkills = [
    { courseId: 'crs-cloud-foundations', skillId: 'sk-cloud', targetLevel: 'ADVANCED' },
    { courseId: 'crs-cloud-foundations', skillId: 'sk-linux', targetLevel: 'INTERMEDIATE' },
    { courseId: 'crs-docker-containers', skillId: 'sk-docker', targetLevel: 'ADVANCED' },
    { courseId: 'crs-docker-containers', skillId: 'sk-linux', targetLevel: 'INTERMEDIATE' },
    { courseId: 'crs-linux-sysadmin', skillId: 'sk-linux', targetLevel: 'ADVANCED' },
    { courseId: 'crs-linux-sysadmin', skillId: 'sk-netsec', targetLevel: 'BEGINNER' },
    { courseId: 'crs-k8s-production', skillId: 'sk-k8s', targetLevel: 'ADVANCED' },
    { courseId: 'crs-k8s-production', skillId: 'sk-docker', targetLevel: 'ADVANCED' },
    { courseId: 'crs-k8s-production', skillId: 'sk-cloud', targetLevel: 'ADVANCED' },
    { courseId: 'crs-fullstack-react-node', skillId: 'sk-react', targetLevel: 'ADVANCED' },
    { courseId: 'crs-fullstack-react-node', skillId: 'sk-node', targetLevel: 'ADVANCED' },
    { courseId: 'crs-fullstack-react-node', skillId: 'sk-rest', targetLevel: 'ADVANCED' },
    { courseId: 'crs-fullstack-react-node', skillId: 'sk-javascript', targetLevel: 'ADVANCED' },
    { courseId: 'crs-python-data-science', skillId: 'sk-python', targetLevel: 'EXPERT' },
    { courseId: 'crs-python-data-science', skillId: 'sk-ml', targetLevel: 'ADVANCED' },
    { courseId: 'crs-python-data-science', skillId: 'sk-dataviz', targetLevel: 'ADVANCED' },
    { courseId: 'crs-appsec-owasp', skillId: 'sk-appsec', targetLevel: 'ADVANCED' },
    { courseId: 'crs-appsec-owasp', skillId: 'sk-netsec', targetLevel: 'ADVANCED' },
    { courseId: 'crs-git-devops', skillId: 'sk-git', targetLevel: 'ADVANCED' },
    { courseId: 'crs-git-devops', skillId: 'sk-cicd', targetLevel: 'INTERMEDIATE' },
    { courseId: 'crs-sql-mastery', skillId: 'sk-sql', targetLevel: 'ADVANCED' },
    { courseId: 'crs-system-design', skillId: 'sk-sysdesign', targetLevel: 'ADVANCED' },
    { courseId: 'crs-system-design', skillId: 'sk-cloud', targetLevel: 'ADVANCED' }
  ];

  const courseModules = [
    { id: 'mod-cloud-1', courseId: 'crs-cloud-foundations', title: 'Module 1: Cloud Architecture Fundamentals & Core Primitives', description: 'Understanding compute virtual machines, storage buckets, VPC networking, and security perimeters.', order: 1 },
    { id: 'mod-cloud-2', courseId: 'crs-cloud-foundations', title: 'Module 2: Serverless Compute & Cloud Functions', description: 'Event-driven architectures, API Gateways, trigger-based microservices, and concurrency scaling.', order: 2 },
    { id: 'mod-cloud-3', courseId: 'crs-cloud-foundations', title: 'Module 3: Cloud IAM, Least Privilege & Infrastructure Security', description: 'Configuring roles, policies, service accounts, audit logging, and zero-trust credentials.', order: 3 },

    { id: 'mod-docker-1', courseId: 'crs-docker-containers', title: 'Module 1: Container Core Engine & Image Building', description: 'Anatomy of containers, layer caching, Dockerfile syntax, and lightweight alpine images.', order: 1 },
    { id: 'mod-docker-2', courseId: 'crs-docker-containers', title: 'Module 2: Multi-Container Composition & Networking', description: 'Configuring docker-compose.yml, internal DNS resolution, bridge networks, and volume persistence.', order: 2 },
    { id: 'mod-docker-3', courseId: 'crs-docker-containers', title: 'Module 3: Production Security & Multi-Stage Builds', description: 'Non-root container execution, vulnerability scanning with Trivy, and image slimming techniques.', order: 3 },

    { id: 'mod-linux-1', courseId: 'crs-linux-sysadmin', title: 'Module 1: Linux Kernel Architecture & Navigation', description: 'Filesystem hierarchy standard, process management, top/htop telemetry, and piping streams.', order: 1 },
    { id: 'mod-linux-2', courseId: 'crs-linux-sysadmin', title: 'Module 2: User Permissions, ACLs & SSH Hardening', description: 'Chmod/chown octal masks, sudoers configurations, ed25519 key authentication, and fail2ban.', order: 2 },
    { id: 'mod-linux-3', courseId: 'crs-linux-sysadmin', title: 'Module 3: Systemd Unit Files & Automated Bash Scripting', description: 'Creating background daemon services, automated cron jobs, log rotation, and journalctl analysis.', order: 3 },

    { id: 'mod-k8s-1', courseId: 'crs-k8s-production', title: 'Module 1: Control Plane Architecture & Pod Lifecycles', description: 'etcd, kube-apiserver, kube-scheduler, and declarative manifest specifications.', order: 1 },
    { id: 'mod-k8s-2', courseId: 'crs-k8s-production', title: 'Module 2: Services, Ingress Controllers & Network Policies', description: 'ClusterIP, NodePort, LoadBalancers, TLS cert-manager, and East-West traffic segmentation.', order: 2 },
    { id: 'mod-k8s-3', courseId: 'crs-k8s-production', title: 'Module 3: Horizontal Pod Autoscaling & Rolling Upgrades', description: 'Metrics-server setup, CPU/memory threshold triggers, readiness/liveness probes, and canary rollouts.', order: 3 },

    { id: 'mod-fullstack-1', courseId: 'crs-fullstack-react-node', title: 'Module 1: REST API Engineering & Express Middleware', description: 'Route controllers, async error boundaries, input validation with Zod, and JWT header parsing.', order: 1 },
    { id: 'mod-fullstack-2', courseId: 'crs-fullstack-react-node', title: 'Module 2: React State Architecture & TanStack Query', description: 'Server state management, optimistic mutations, caching invalidation, and custom hooks.', order: 2 },
    { id: 'mod-fullstack-3', courseId: 'crs-fullstack-react-node', title: 'Module 3: Relational Persistence, Migrations & Security', description: 'Connection pooling, parameterized queries against SQL injection, and rate limiting.', order: 3 },

    { id: 'mod-pyds-1', courseId: 'crs-python-data-science', title: 'Module 1: Data Wrangling & Exploration with Pandas', description: 'DataFrames, missing value imputation, group-by aggregations, and vectorized operations.', order: 1 },
    { id: 'mod-pyds-2', courseId: 'crs-python-data-science', title: 'Module 2: Supervised Learning & Model Validation', description: 'Cross-validation, hyperparameter tuning with GridSearchCV, and ROC-AUC curve analysis.', order: 2 },
    { id: 'mod-pyds-3', courseId: 'crs-python-data-science', title: 'Module 3: Model Serialization & API Inference Serving', description: 'Exporting models with Joblib/ONNX and serving real-time predictions with FastAPI.', order: 3 },

    { id: 'mod-appsec-1', courseId: 'crs-appsec-owasp', title: 'Module 1: Injection Flaws & Broken Object Level Auth', description: 'Identifying SQL injection vectors, NoSQL tampering, and IDOR vulnerabilities.', order: 1 },
    { id: 'mod-appsec-2', courseId: 'crs-appsec-owasp', title: 'Module 2: Cross-Site Scripting (XSS) & CSRF Defense', description: 'DOM/Reflected/Stored XSS mitigations, Content Security Policy (CSP), and SameSite cookies.', order: 2 },
    { id: 'mod-appsec-3', courseId: 'crs-appsec-owasp', title: 'Module 3: Security Headers, Cryptography & SAST Tools', description: 'Implementing HSTS, secure hashing (Argon2/Bcrypt), and automated dependency audits.', order: 3 },

    { id: 'mod-git-1', courseId: 'crs-git-devops', title: 'Module 1: Advanced Git Internals & Rebase Workflows', description: 'Git tree objects, DAG commit graphs, interactive rebase squashing, and reflog recovery.', order: 1 },
    { id: 'mod-git-2', courseId: 'crs-git-devops', title: 'Module 2: Automated Testing Pipelines with GitHub Actions', description: 'Matrix builds, caching dependencies, secret management, and pull-request gating.', order: 2 },
    { id: 'mod-git-3', courseId: 'crs-git-devops', title: 'Module 3: Semantic Versioning & Release Automation', description: 'Conventional commits, automated changelog generation, and package publishing.', order: 3 },

    { id: 'mod-sql-1', courseId: 'crs-sql-mastery', title: 'Module 1: Relational Schema Modeling & Constraints', description: 'Primary/foreign key integrity, check constraints, composite unique indexes, and 3NF design.', order: 1 },
    { id: 'mod-sql-2', courseId: 'crs-sql-mastery', title: 'Module 2: Advanced Window Functions & CTEs', description: 'ROW_NUMBER, RANK, LAG/LEAD, recursive common table expressions, and analytical slicing.', order: 2 },
    { id: 'mod-sql-3', courseId: 'crs-sql-mastery', title: 'Module 3: Query Execution Analysis & B-Tree Indexing', description: 'Interpreting EXPLAIN ANALYZE trees, partial indexes, and preventing index degradation.', order: 3 },

    { id: 'mod-sys-1', courseId: 'crs-system-design', title: 'Module 1: High Availability & Load Balancing Strategies', description: 'Layer 4 vs Layer 7 routing, round-robin, consistent hashing, and health check algorithms.', order: 1 },
    { id: 'mod-sys-2', courseId: 'crs-system-design', title: 'Module 2: Distributed Caching & Event Messaging', description: 'Redis cache-aside/write-through policies, Kafka message brokers, and idempotency guarantees.', order: 2 },
    { id: 'mod-sys-3', courseId: 'crs-system-design', title: 'Module 3: Database Sharding & Microservice Resiliency', description: 'Horizontal partitioning, distributed locking, circuit breakers, and rate limiters.', order: 3 }
  ];

  const learningResources = [
    {
      id: 'res-cloud-1',
      moduleId: 'mod-cloud-1',
      title: 'Cloud Primitives: Compute, Block Storage, and Object Buckets',
      type: 'ARTICLE',
      duration: '15 min read',
      content: `## 1. Fundamentals of Modern Cloud Architecture\nCloud computing operates on three primary resource abstractions:\n\n1. **Virtual Compute (IaaS/PaaS)**: Virtual machines or containers running on hypervisors, enabling dynamic scaling, isolated tenant execution, and automated failover.\n2. **Object Storage**: High-durability distributed storage systems providing 99.999999999% durability.\n3. **Software-Defined Networking (VPC)**: Isolated virtual private clouds with customizable subnets, security group firewalls, and managed gateways.`
    },
    {
      id: 'res-cloud-2',
      moduleId: 'mod-cloud-1',
      title: 'Video Guide: Deploying Resilient VPCs & Subnet Routing',
      type: 'VIDEO',
      duration: '22 mins',
      url: 'https://www.youtube.com/embed/g2J6LhTtg3U',
      content: 'In this recorded deep-dive, we construct a multi-AZ Virtual Private Cloud with public load-balancer subnets and private application database subnets.'
    },
    {
      id: 'res-doc-1',
      moduleId: 'mod-docker-1',
      title: 'Anatomy of Docker Containers and Layer Caching',
      type: 'ARTICLE',
      duration: '18 min read',
      content: `## How Containers Work\nContainers leverage Linux kernel **namespaces** (for process, mount, and network isolation) and **cgroups** (for CPU/memory resource limits).\n\n### Dockerfile Best Practices:\n1. Put infrequently changing steps near the top.\n2. Put application code that changes frequently near the bottom.\n3. Use multi-stage builds to discard heavy build tools and compilers from the final production runtime image.`
    },
    {
      id: 'res-lin-1',
      moduleId: 'mod-linux-1',
      title: 'Linux Process Management & System Diagnostics',
      type: 'ARTICLE',
      duration: '20 min read',
      content: `## Linux Core Telemetry\nMaster essential terminal tools:\n- \`ps aux | grep node\` - Identify running processes and PID.\n- \`lsof -i :3000\` - Discover which process has bound to port 3000.\n- \`df -h\` and \`du -sh *\` - Diagnose disk usage bottlenecks.\n- \`top\` / \`htop\` - Real-time CPU and memory utilization.`
    }
  ];

  const quizzes = [
    {
      id: 'quiz-cloud-foundations',
      courseId: 'crs-cloud-foundations',
      moduleId: 'mod-cloud-3',
      title: 'Cloud Foundations & Architecture Competency Assessment',
      passingScore: 70
    },
    {
      id: 'quiz-docker-containers',
      courseId: 'crs-docker-containers',
      moduleId: 'mod-docker-3',
      title: 'Docker & Microservices Containerization Assessment',
      passingScore: 70
    },
    {
      id: 'quiz-linux-sysadmin',
      courseId: 'crs-linux-sysadmin',
      moduleId: 'mod-linux-3',
      title: 'Linux Systems & Shell Diagnostics Assessment',
      passingScore: 70
    },
    {
      id: 'quiz-k8s-production',
      courseId: 'crs-k8s-production',
      moduleId: 'mod-k8s-3',
      title: 'Kubernetes Production Orchestration Assessment',
      passingScore: 70
    },
    {
      id: 'quiz-fullstack-react-node',
      courseId: 'crs-fullstack-react-node',
      moduleId: 'mod-fullstack-3',
      title: 'Full-Stack Architecture & API Security Assessment',
      passingScore: 70
    },
    {
      id: 'quiz-python-data-science',
      courseId: 'crs-python-data-science',
      moduleId: 'mod-pyds-3',
      title: 'Machine Learning & Predictive Modeling Assessment',
      passingScore: 70
    },
    {
      id: 'quiz-appsec-owasp',
      courseId: 'crs-appsec-owasp',
      moduleId: 'mod-appsec-3',
      title: 'Application Security & OWASP Top 10 Mitigation Assessment',
      passingScore: 70
    },
    {
      id: 'quiz-git-devops',
      courseId: 'crs-git-devops',
      moduleId: 'mod-git-3',
      title: 'Git Workflows & CI/CD Pipeline Automation Assessment',
      passingScore: 70
    },
    {
      id: 'quiz-sql-mastery',
      courseId: 'crs-sql-mastery',
      moduleId: 'mod-sql-3',
      title: 'Relational Database Engineering & Query Optimization Assessment',
      passingScore: 70
    },
    {
      id: 'quiz-system-design',
      courseId: 'crs-system-design',
      moduleId: 'mod-sys-3',
      title: 'Distributed System Design & Scalability Assessment',
      passingScore: 70
    }
  ];

  const quizQuestions = [
    // Cloud foundations questions
    {
      id: 'q-cf-1',
      quizId: 'quiz-cloud-foundations',
      question: 'Which of the following architectural strategies provides the highest durability against multi-region data center outages?',
      options: [
        'Single-AZ Solid State Drive (SSD) volumes',
        'Geo-redundant object storage buckets with automated multi-region replication',
        'In-memory Redis cache clusters with nightly local snapshots',
        'Ephemeral container storage on single node instances'
      ],
      correctAnswer: 1,
      marks: 20,
      explanation: 'Geo-redundant object storage (such as multi-region S3/GCS buckets) replicates objects across geographically separated regions.'
    },
    {
      id: 'q-cf-2',
      quizId: 'quiz-cloud-foundations',
      question: 'What is the primary purpose of separating private application subnets from public ingress subnets in a VPC?',
      options: [
        'To reduce outbound network bandwidth costs',
        'To ensure backend compute and databases are unreachable directly from the public internet without passing through load balancers or bastion hosts',
        'To enable faster DNS resolution times',
        'To automatically provision SSL certificates'
      ],
      correctAnswer: 1,
      marks: 20,
      explanation: 'Private subnets have no direct route to the Internet Gateway, isolating database and application instances behind firewalls.'
    },
    {
      id: 'q-cf-3',
      quizId: 'quiz-cloud-foundations',
      question: 'Under the Cloud Shared Responsibility Model, which component is the customer responsible for in an Infrastructure-as-a-Service (IaaS) deployment?',
      options: [
        'Physical data center facility perimeter security',
        'Hypervisor hardware cooling and maintenance',
        'Guest operating system patching, application security, and network firewall configuration',
        'Physical hard drive disposal and destruction'
      ],
      correctAnswer: 2,
      marks: 20,
      explanation: 'In IaaS, the cloud provider manages physical hardware and hypervisors, while the customer manages guest OS, patches, firewall rules, and IAM.'
    },
    {
      id: 'q-cf-4',
      quizId: 'quiz-cloud-foundations',
      question: 'How do serverless execution functions (e.g. AWS Lambda / Cloud Functions) achieve automated horizontal scaling?',
      options: [
        'By manually allocating larger RAM instances during peak traffic',
        'By dynamically spinning up isolated stateless micro-containers in response to incoming concurrency events',
        'By maintaining persistent idle CPU threads in standby mode',
        'By disabling database connection pools'
      ],
      correctAnswer: 1,
      marks: 20,
      explanation: 'Serverless engines launch isolated ephemeral execution environments automatically for each incoming concurrency burst.'
    },
    {
      id: 'q-cf-5',
      quizId: 'quiz-cloud-foundations',
      question: 'Which IAM policy follows the Principle of Least Privilege for an automated microservice that only reads metadata from an object bucket?',
      options: [
        'AdministratorAccess with wildcard actions (*:*)',
        'A targeted policy with Action: ["s3:GetObject", "s3:ListBucket"] restricted to the specific bucket ARN Resource',
        'ReadWriteAccess applied globally across all AWS accounts',
        'Public anonymous read permission on the storage bucket'
      ],
      correctAnswer: 1,
      marks: 20,
      explanation: 'Least privilege dictates granting only minimal actions (GetObject, ListBucket) scoped explicitly to the single required Resource ARN.'
    },

    // Docker questions
    {
      id: 'q-doc-1',
      quizId: 'quiz-docker-containers',
      question: 'Why are multi-stage Docker builds widely recommended for production web applications?',
      options: [
        'They run containers in parallel across multiple physical host machines',
        'They separate the build environment (compilers, npm devDependencies) from the lean runtime container, minimizing image size and attack surface',
        'They automatically encrypt the Docker daemon socket',
        'They eliminate the need for container port forwarding'
      ],
      correctAnswer: 1,
      marks: 20,
      explanation: 'Multi-stage builds leave behind heavy SDKs and node_modules in intermediary stages, producing minimal production runtime images.'
    },
    {
      id: 'q-doc-2',
      quizId: 'quiz-docker-containers',
      question: 'Which underlying Linux kernel mechanism is responsible for restricting the CPU and memory consumption of a Docker container?',
      options: [
        'Network Namespaces',
        'Control Groups (cgroups)',
        'AppArmor Profiles',
        'Virtual File System (VFS)'
      ],
      correctAnswer: 1,
      marks: 20,
      explanation: 'Linux cgroups (control groups) meter and enforce hard resource limits on CPU, memory, disk I/O, and network bandwidth.'
    },
    {
      id: 'q-doc-3',
      quizId: 'quiz-docker-containers',
      question: 'In a multi-container Docker Compose network, how does the frontend container communicate with the backend API container?',
      options: [
        'By querying the physical host machine IP address on port 8080',
        'Using the service name defined in docker-compose.yml as a hostname via Docker built-in DNS resolution',
        'By sharing a loopback localhost port directly',
        'By writing requests to a shared block volume file'
      ],
      correctAnswer: 1,
      marks: 20,
      explanation: 'Docker embeds an internal DNS server (127.0.0.11) that automatically resolves service names to their container IP addresses.'
    },
    {
      id: 'q-doc-4',
      quizId: 'quiz-docker-containers',
      question: 'Which of the following Dockerfile instructions will cause the entire subsequent build cache to invalidate if any source file changes?',
      options: [
        'EXPOSE 3000',
        'COPY . /app',
        'ENV NODE_ENV=production',
        'WORKDIR /app'
      ],
      correctAnswer: 1,
      marks: 20,
      explanation: 'COPY . /app checks file checksums. If any file changed, Docker invalidates the cache for that instruction and all following lines.'
    },
    {
      id: 'q-doc-5',
      quizId: 'quiz-docker-containers',
      question: 'What is the primary security risk of running container processes as the default UID 0 (root)?',
      options: [
        'Containers consume twice as much system memory',
        'If a container breakout vulnerability occurs, the attacker immediately gains root privilege on the underlying host operating system',
        'Docker Compose will reject deployment manifests',
        'Network sockets cannot bind to ports higher than 1024'
      ],
      correctAnswer: 1,
      marks: 20,
      explanation: 'Container UID 0 maps to host UID 0 unless user namespaces are remapped. Always specify USER node or USER nonroot.'
    }
  ];

  const enrollments = [
    {
      id: 'enr-1',
      userId: 'usr-learner-1',
      courseId: 'crs-cloud-foundations',
      enrolledAt: '2026-08-10T10:00:00Z',
      completedAt: '2026-08-16T15:00:00Z',
      status: 'COMPLETED'
    },
    {
      id: 'enr-2',
      userId: 'usr-learner-1',
      courseId: 'crs-docker-containers',
      enrolledAt: '2026-08-18T09:00:00Z',
      status: 'IN_PROGRESS'
    },
    {
      id: 'enr-3',
      userId: 'usr-learner-1',
      courseId: 'crs-linux-sysadmin',
      enrolledAt: '2026-08-20T11:00:00Z',
      status: 'IN_PROGRESS'
    }
  ];

  const lessonProgress = [
    { id: 'lp-1', userId: 'usr-learner-1', moduleId: 'mod-cloud-1', completed: true, completedAt: '2026-08-12T12:00:00Z' },
    { id: 'lp-2', userId: 'usr-learner-1', moduleId: 'mod-cloud-2', completed: true, completedAt: '2026-08-14T14:00:00Z' },
    { id: 'lp-3', userId: 'usr-learner-1', moduleId: 'mod-cloud-3', completed: true, completedAt: '2026-08-16T10:00:00Z' },
    { id: 'lp-4', userId: 'usr-learner-1', moduleId: 'mod-docker-1', completed: true, completedAt: '2026-08-19T14:00:00Z' },
    { id: 'lp-5', userId: 'usr-learner-1', moduleId: 'mod-docker-2', completed: true, completedAt: '2026-08-22T16:00:00Z' }
  ];

  const certificates = [
    {
      id: 'cert-aarav-cloud',
      userId: 'usr-learner-1',
      courseId: 'crs-cloud-foundations',
      certificateNumber: 'CC-2026-884920',
      score: 95,
      issuedAt: '2026-08-16T15:30:00Z'
    }
  ];

  const notifications = [
    {
      id: 'notif-1',
      userId: 'usr-learner-1',
      title: 'Certificate Awarded: Cloud Computing Foundations',
      message: 'Congratulations! You scored 95% on your assessment. Your verifiable credential CC-2026-884920 is now available.',
      type: 'CERTIFICATE',
      isRead: false,
      createdAt: '2026-08-16T15:30:00Z'
    },
    {
      id: 'notif-2',
      userId: 'usr-learner-1',
      title: 'Target Role Alignment Updated',
      message: 'Your Cloud Developer readiness has reached 45%. Complete Docker & Containerization to eliminate your next critical gap.',
      type: 'RECOMMENDATION',
      isRead: true,
      createdAt: '2026-08-20T10:00:00Z'
    }
  ];

  return {
    users,
    targetRoles,
    skills,
    targetRoleSkills,
    userSkills,
    courses,
    courseSkills,
    courseModules,
    learningResources,
    enrollments,
    lessonProgress,
    quizzes,
    quizQuestions,
    quizAttempts: [],
    certificates,
    notifications
  };
}
