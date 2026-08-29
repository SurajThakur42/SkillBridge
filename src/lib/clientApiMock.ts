import { clientDatabase } from './clientDatabase.js';

export function handleClientMockRequest<T = any>(endpoint: string, options: RequestInit = {}): T {
  const method = (options.method || 'GET').toUpperCase();
  const db = clientDatabase.db;
  const url = endpoint.split('?')[0];
  const queryParams = new URLSearchParams(endpoint.includes('?') ? endpoint.split('?')[1] : '');

  // Parse body if present
  let body: any = {};
  if (options.body && typeof options.body === 'string') {
    try {
      body = JSON.parse(options.body);
    } catch {
      body = {};
    }
  }

  // Get current token from Authorization header or localStorage
  let currentToken = '';
  const authHeader = (options.headers as Record<string, string>)?.['Authorization'] || '';
  if (authHeader.startsWith('Bearer ')) {
    currentToken = authHeader.substring(7);
  } else if (typeof window !== 'undefined') {
    currentToken = localStorage.getItem('skillbridge_auth_token') || '';
  }

  // Find user by token
  let currentUser = db.users.find(u => u.id === currentToken || currentToken.includes(u.id));
  if (!currentUser && db.users.length > 0) {
    currentUser = db.users[0]; // fallback to Aarav
  }

  // Helper sanitize user
  const sanitize = (u: any) => {
    const { password, passwordHash, ...rest } = u;
    return rest;
  };

  // 1. AUTH ROUTES
  if (url === '/api/auth/login' && method === 'POST') {
    const { email, password } = body;
    const user = db.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
    if (!user) {
      // Auto-create demo guest if not found
      const newUser = {
        id: `usr-${Date.now()}`,
        name: email.split('@')[0],
        email: email.toLowerCase(),
        password: password || 'demo1234',
        role: email.includes('admin') ? 'ADMIN' : email.includes('trainer') ? 'TRAINER' : 'LEARNER',
        department: 'Digital Systems',
        organization: 'National Digital Academy',
        profileImage: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}`,
        targetRoleId: 'role-cloud-dev',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.users.push(newUser);
      clientDatabase.save();
      return {
        message: 'Login successful',
        token: newUser.id,
        user: sanitize(newUser)
      } as any;
    }

    return {
      message: 'Login successful',
      token: user.id,
      user: sanitize(user)
    } as any;
  }

  if (url === '/api/auth/register' && method === 'POST') {
    const { name, email, password, role, department, organization, targetRoleId } = body;
    const existing = db.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
    if (existing) {
      return {
        message: 'Login successful',
        token: existing.id,
        user: sanitize(existing)
      } as any;
    }
    const newUser = {
      id: `usr-${Date.now()}`,
      name: name || 'Learner',
      email: (email || `user${Date.now()}@demo.com`).toLowerCase(),
      password: password || 'demo1234',
      role: role || 'LEARNER',
      department: department || 'Engineering',
      organization: organization || 'National Digital Academy',
      profileImage: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'User')}`,
      targetRoleId: targetRoleId || 'role-cloud-dev',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.users.push(newUser);
    clientDatabase.save();
    return {
      message: 'User registered successfully',
      token: newUser.id,
      user: sanitize(newUser)
    } as any;
  }

  if (url === '/api/auth/me' && method === 'GET') {
    return { user: currentUser ? sanitize(currentUser) : null } as any;
  }

  if (url === '/api/auth/logout' && method === 'POST') {
    return { message: 'Logged out successfully' } as any;
  }

  if (url === '/api/auth/reset-demo' && method === 'POST') {
    clientDatabase.resetToSeed();
    return { message: 'Database reset to default seed.' } as any;
  }

  // 2. USER ROUTES
  if (url === '/api/users/me' && method === 'GET') {
    const targetRole = db.targetRoles.find(r => r.id === currentUser?.targetRoleId);
    const enrollmentsCount = db.enrollments.filter(e => e.userId === currentUser?.id).length;
    const completedCount = db.enrollments.filter(e => e.userId === currentUser?.id && e.status === 'COMPLETED').length;
    const certificatesCount = db.certificates.filter(c => c.userId === currentUser?.id).length;
    return {
      user: currentUser ? sanitize(currentUser) : null,
      targetRole,
      stats: { enrollmentsCount, completedCount, certificatesCount }
    } as any;
  }

  if (url === '/api/users/me' && method === 'PUT') {
    if (currentUser) {
      if (body.name) currentUser.name = body.name;
      if (body.department) currentUser.department = body.department;
      if (body.organization) currentUser.organization = body.organization;
      if (body.profileImage) currentUser.profileImage = body.profileImage;
      currentUser.updatedAt = new Date().toISOString();
      clientDatabase.save();
    }
    return { message: 'Profile updated', user: currentUser ? sanitize(currentUser) : null } as any;
  }

  if ((url === '/api/users/me/target-role' || url === '/api/skills/update-target-role') && method === 'PUT') {
    if (currentUser && body.targetRoleId) {
      currentUser.targetRoleId = body.targetRoleId;
      currentUser.updatedAt = new Date().toISOString();
      clientDatabase.save();
    }
    return { message: 'Target role updated', targetRoleId: body.targetRoleId } as any;
  }

  if (url === '/api/users/notifications' && method === 'GET') {
    const notifs = db.notifications.filter(n => n.userId === currentUser?.id);
    return notifs as any;
  }

  if (url.startsWith('/api/users/notifications/') && url.endsWith('/read') && method === 'PUT') {
    const notifId = url.split('/')[4];
    const n = db.notifications.find(item => item.id === notifId);
    if (n) {
      n.isRead = true;
      clientDatabase.save();
    }
    return { message: 'Marked as read' } as any;
  }

  if (url === '/api/users/certificates' && method === 'GET') {
    const certs = db.certificates.filter(c => c.userId === currentUser?.id);
    const enriched = certs.map(c => {
      const course = db.courses.find(crs => crs.id === c.courseId);
      return {
        ...c,
        courseTitle: course?.title || 'Cloud Engineering Certificate',
        userName: currentUser?.name || 'Aarav Sharma'
      };
    });
    return enriched as any;
  }

  if (url.startsWith('/api/users/certificates/verify/') || url.startsWith('/api/users/certificates/')) {
    const certParam = url.split('/').pop();
    const cert = db.certificates.find(c => c.certificateNumber === certParam || c.id === certParam);
    if (cert) {
      const user = db.users.find(u => u.id === cert.userId);
      const course = db.courses.find(c => c.id === cert.courseId);
      return {
        valid: true,
        certificate: cert,
        learnerName: user?.name || 'Aarav Sharma',
        courseTitle: course?.title || 'Certification Course',
        issuedAt: cert.issuedAt,
        score: cert.score
      } as any;
    }
    return { valid: false, message: 'Certificate not found in ledger' } as any;
  }

  // 3. COURSE ROUTES
  if (url === '/api/courses' && method === 'GET') {
    const category = queryParams.get('category');
    const difficulty = queryParams.get('difficulty');
    let list = [...db.courses];
    if (category && category !== 'ALL') {
      list = list.filter(c => c.category === category);
    }
    if (difficulty && difficulty !== 'ALL') {
      list = list.filter(c => c.difficulty === difficulty);
    }
    const enriched = list.map(c => {
      const enrollment = db.enrollments.find(e => e.courseId === c.id && e.userId === currentUser?.id);
      return {
        ...c,
        isEnrolled: !!enrollment,
        enrollmentStatus: enrollment?.status
      };
    });
    return enriched as any;
  }

  if (url.startsWith('/api/courses/') && !url.includes('/enroll') && !url.includes('/progress') && method === 'GET') {
    const courseId = url.split('/')[3];
    const course = db.courses.find(c => c.id === courseId);
    if (!course) {
      return (db.courses[0] || {}) as any;
    }
    const modules = db.courseModules.filter(m => m.courseId === courseId).sort((a, b) => a.order - b.order);
    const enrichedModules = modules.map(m => {
      const resources = db.learningResources.filter(r => r.moduleId === m.id);
      const progress = db.lessonProgress.find(lp => lp.moduleId === m.id && lp.userId === currentUser?.id);
      return {
        ...m,
        resources,
        isCompleted: !!progress?.completed
      };
    });
    const quiz = db.quizzes.find(q => q.courseId === courseId);
    const enrollment = db.enrollments.find(e => e.courseId === courseId && e.userId === currentUser?.id);
    return {
      course,
      modules: enrichedModules,
      quiz,
      isEnrolled: !!enrollment,
      enrollment
    } as any;
  }

  if (url.endsWith('/enroll') && method === 'POST') {
    const courseId = url.split('/')[3];
    let enrollment = db.enrollments.find(e => e.courseId === courseId && e.userId === currentUser?.id);
    if (!enrollment) {
      enrollment = {
        id: `enr-${Date.now()}`,
        userId: currentUser?.id || 'usr-learner-1',
        courseId,
        enrolledAt: new Date().toISOString(),
        status: 'IN_PROGRESS'
      };
      db.enrollments.push(enrollment);
      clientDatabase.save();
    }
    return { message: 'Enrolled successfully', enrollment } as any;
  }

  if (url.endsWith('/progress') && method === 'POST') {
    const { moduleId, completed = true } = body;
    let lp = db.lessonProgress.find(p => p.moduleId === moduleId && p.userId === currentUser?.id);
    if (!lp) {
      lp = {
        id: `lp-${Date.now()}`,
        userId: currentUser?.id || 'usr-learner-1',
        moduleId,
        completed,
        completedAt: new Date().toISOString()
      };
      db.lessonProgress.push(lp);
    } else {
      lp.completed = completed;
      lp.completedAt = new Date().toISOString();
    }
    clientDatabase.save();
    return { message: 'Progress updated', progress: lp } as any;
  }

  // 4. QUIZ ROUTES
  if (url.startsWith('/api/quizzes/') && !url.includes('/submit') && method === 'GET') {
    const quizId = url.split('/')[3];
    const quiz = db.quizzes.find(q => q.id === quizId) || db.quizzes[0];
    const questions = db.quizQuestions.filter(q => q.quizId === quiz.id);
    return { quiz, questions } as any;
  }

  if (url.endsWith('/submit') && method === 'POST') {
    const quizId = url.split('/')[3];
    const { answers = [] } = body;
    const quiz = db.quizzes.find(q => q.id === quizId) || db.quizzes[0];
    const questions = db.quizQuestions.filter(q => q.quizId === quiz.id);

    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) {
        correctCount++;
      }
    });

    const percentage = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 100;
    const passed = percentage >= (quiz.passingScore || 70);

    // Save attempt
    const attempt = {
      id: `att-${Date.now()}`,
      quizId: quiz.id,
      userId: currentUser?.id || 'usr-learner-1',
      score: correctCount * 20,
      percentage,
      passed,
      attemptedAt: new Date().toISOString(),
      answers
    };
    db.quizAttempts.push(attempt);

    // If passed, grant certificate and complete course
    let certificate: any = null;
    if (passed && quiz.courseId) {
      let enr = db.enrollments.find(e => e.courseId === quiz.courseId && e.userId === currentUser?.id);
      if (enr) {
        enr.status = 'COMPLETED';
        enr.completedAt = new Date().toISOString();
      }
      const existingCert = db.certificates.find(c => c.courseId === quiz.courseId && c.userId === currentUser?.id);
      if (!existingCert) {
        certificate = {
          id: `cert-${Date.now()}`,
          userId: currentUser?.id || 'usr-learner-1',
          courseId: quiz.courseId,
          certificateNumber: `CC-2026-${Math.floor(100000 + Math.random() * 900000)}`,
          score: percentage,
          issuedAt: new Date().toISOString()
        };
        db.certificates.push(certificate);
        db.notifications.push({
          id: `notif-${Date.now()}`,
          userId: currentUser?.id || 'usr-learner-1',
          title: 'Certificate Awarded!',
          message: `Congratulations! You scored ${percentage}% on ${quiz.title}. Your verifiable credential is ready.`,
          type: 'CERTIFICATE',
          isRead: false,
          createdAt: new Date().toISOString()
        });
      }
    }

    clientDatabase.save();
    return {
      attempt,
      percentage,
      passed,
      passingScore: quiz.passingScore || 70,
      certificate
    } as any;
  }

  // 5. SKILL ROUTES & GAP ANALYSIS
  if (url === '/api/skills/target-roles' && method === 'GET') {
    return db.targetRoles as any;
  }

  if (url === '/api/skills/gap-analysis' || url === '/api/skills/analysis') {
    const targetRoleId = currentUser?.targetRoleId || 'role-cloud-dev';
    const targetRole = db.targetRoles.find(r => r.id === targetRoleId) || db.targetRoles[0];
    const roleSkills = db.targetRoleSkills.filter(trs => trs.targetRoleId === targetRole.id);
    const userSkills = db.userSkills.filter(us => us.userId === currentUser?.id);

    const levelBenchmarks: Record<string, number> = {
      BEGINNER: 40,
      INTERMEDIATE: 65,
      ADVANCED: 85,
      EXPERT: 95
    };

    let totalWeight = 0;
    let earnedWeight = 0;

    const allSkillGaps = roleSkills.map(trs => {
      const skill = db.skills.find(s => s.id === trs.skillId) || { name: trs.skillId, category: 'Technical' };
      const userSkill = userSkills.find(us => us.skillId === trs.skillId);
      const currentScore = userSkill ? userSkill.score : 0;
      const requiredScore = levelBenchmarks[trs.requiredLevel] || 70;
      const gapScore = Math.max(0, requiredScore - currentScore);
      const importance = trs.importance || 4;

      totalWeight += requiredScore * importance;
      earnedWeight += Math.min(currentScore, requiredScore) * importance;

      let gapType: 'CRITICAL' | 'MEDIUM' | 'MINOR' | 'MATCHED' = 'MATCHED';
      if (currentScore >= requiredScore) {
        gapType = 'MATCHED';
      } else if (gapScore > 40) {
        gapType = 'CRITICAL';
      } else if (gapScore > 20) {
        gapType = 'MEDIUM';
      } else {
        gapType = 'MINOR';
      }

      return {
        skillId: trs.skillId,
        skillName: skill.name,
        category: skill.category,
        currentScore,
        currentLevel: userSkill?.competencyLevel || 'BEGINNER',
        requiredLevel: trs.requiredLevel,
        requiredScore,
        gapScore,
        importance,
        priorityScore: gapScore * importance,
        gapType,
        reason: `${skill.name} is a key requirement for ${targetRole.name}.`
      };
    });

    const overallReadinessPercentage = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 60;
    const criticalGaps = allSkillGaps.filter(g => g.gapType === 'CRITICAL');
    const mediumGaps = allSkillGaps.filter(g => g.gapType === 'MEDIUM');
    const minorGaps = allSkillGaps.filter(g => g.gapType === 'MINOR');
    const matchedSkills = allSkillGaps.filter(g => g.gapType === 'MATCHED');

    return {
      targetRole,
      overallReadinessPercentage,
      totalRequiredSkills: roleSkills.length,
      matchedCount: matchedSkills.length,
      criticalGapsCount: criticalGaps.length,
      mediumGapsCount: mediumGaps.length,
      matchedSkills,
      criticalGaps,
      mediumGaps,
      minorGaps,
      allSkillGaps
    } as any;
  }

  if (url === '/api/skills/recommendations') {
    const list = db.courses.map(c => {
      const enrollment = db.enrollments.find(e => e.courseId === c.id && e.userId === currentUser?.id);
      return {
        courseId: c.id,
        courseTitle: c.title,
        thumbnail: c.thumbnail,
        category: c.category,
        difficulty: c.difficulty,
        duration: c.duration,
        relevanceScore: 92,
        targetSkills: ['Cloud', 'Containers', 'DevOps'],
        primaryGapSkill: 'Cloud & Containers',
        reason: 'Addresses your high-priority skill deficit for your Target Role.',
        isEnrolled: !!enrollment,
        enrollmentStatus: enrollment?.status,
        progressPercentage: enrollment?.status === 'COMPLETED' ? 100 : enrollment ? 50 : 0
      };
    });
    return list as any;
  }

  if (url === '/api/skills/learning-path') {
    const steps = [
      {
        stepNumber: 1,
        courseId: 'crs-cloud-foundations',
        title: 'Cloud Computing Foundations & Architecture',
        description: 'Core compute, object buckets, and security perimeters',
        targetSkill: 'Cloud Computing',
        difficulty: 'BEGINNER',
        duration: '4.5 Hours',
        status: 'COMPLETED',
        reason: 'Completed competency assessment'
      },
      {
        stepNumber: 2,
        courseId: 'crs-docker-containers',
        title: 'Docker & Containerization for Developers',
        description: 'Microservices containerization and multi-stage builds',
        targetSkill: 'Docker & Containers',
        difficulty: 'INTERMEDIATE',
        duration: '5.0 Hours',
        status: 'IN_PROGRESS',
        reason: 'Top priority critical skill gap'
      },
      {
        stepNumber: 3,
        courseId: 'crs-linux-sysadmin',
        title: 'Linux Systems & Shell Mastery',
        description: 'Bash automation, process control, and systemd units',
        targetSkill: 'Linux Fundamentals',
        difficulty: 'BEGINNER',
        duration: '6.0 Hours',
        status: 'NEXT_UP',
        reason: 'Essential foundational competency'
      },
      {
        stepNumber: 4,
        courseId: 'crs-k8s-production',
        title: 'Kubernetes in Production: Deployments & Scaling',
        description: 'Production cluster orchestration and ingress',
        targetSkill: 'Kubernetes Orchestration',
        difficulty: 'ADVANCED',
        duration: '8.0 Hours',
        status: 'LOCKED',
        reason: 'Requires Docker mastery'
      }
    ];
    return {
      targetRole: db.targetRoles[0],
      totalSteps: steps.length,
      completedSteps: 1,
      steps
    } as any;
  }

  if (url === '/api/skills' && method === 'GET') {
    const userSkills = db.userSkills.filter(us => us.userId === currentUser?.id);
    const enriched = db.skills.map(s => {
      const us = userSkills.find(u => u.skillId === s.id);
      return {
        ...s,
        score: us ? us.score : 0,
        competencyLevel: us ? us.competencyLevel : 'BEGINNER'
      };
    });
    return { skills: enriched, targetRoles: db.targetRoles } as any;
  }

  // 6. TRAINER & ADMIN ROUTES
  if (url.startsWith('/api/trainer/')) {
    return {
      courses: db.courses,
      learners: db.users.filter(u => u.role === 'LEARNER'),
      analytics: {
        totalLearners: 142,
        activeCourses: 10,
        averagePassRate: 88,
        completionRate: 74
      }
    } as any;
  }

  if (url.startsWith('/api/admin/')) {
    return {
      totalUsers: db.users.length + 120,
      activeLearners: 110,
      totalTrainers: 8,
      averageReadiness: 68,
      coursesCount: db.courses.length,
      users: db.users,
      departmentBreakdown: [
        { department: 'Software Engineering', count: 45, readiness: 72 },
        { department: 'Data & Analytics', count: 35, readiness: 65 },
        { department: 'Infrastructure & SecOps', count: 25, readiness: 60 },
        { department: 'Product & Design', count: 15, readiness: 80 }
      ]
    } as any;
  }

  // 7. CAPACITY AI CHAT
  if (url === '/api/ai/chat' && method === 'POST') {
    const q = (body.question || '').toLowerCase();
    const isWebsite = /(course|skill|gap|role|certificate|readiness|quiz|learn|path|trainer|admin|dashboard|enroll|progress|platform|skillbridge|recommend)/i.test(q);

    let answer = '';
    const suggestedActions: any[] = [];

    if (isWebsite) {
      if (q.includes('next') || q.includes('start') || q.includes('learn')) {
        answer = `Based on your **Cloud Developer** roadmap (45% readiness), you should focus immediately on **Docker & Containers**.\n\nWe recommend enrolling in **Docker & Containerization for Developers** (5.0 Hours, INTERMEDIATE). Completing this course and passing its assessment will eliminate your highest-priority capability deficit.`;
        suggestedActions.push({ label: 'Open Docker Course', action: 'navigate', path: '/learner/courses/crs-docker-containers' });
      } else if (q.includes('gap') || q.includes('missing')) {
        answer = `You currently have **3 critical skill gaps** for the **Cloud Developer** role:\n\n1. **Docker & Containers**: Current score 10%, Target 85% (ADVANCED)\n2. **Cloud Computing**: Current score 20%, Target 95% (EXPERT)\n3. **Linux Fundamentals**: Current score 30%, Target 85% (ADVANCED)\n\nYour matched strengths include **Python (78%)**, **Git (65%)**, and **SQL (60%)**.`;
        suggestedActions.push({ label: 'View Skill Gap Analysis', action: 'navigate', path: '/learner/skill-gap' });
      } else if (q.includes('certificate') || q.includes('certify')) {
        answer = `Certificates on SkillBridge are verifiable digital credentials issued automatically when you complete all modules in a course and achieve ≥ 70% on the final competency quiz. Each credential includes a tamper-resistant verification ID (e.g. \`CC-2026-884920\`).`;
        suggestedActions.push({ label: 'View My Certificates', action: 'navigate', path: '/learner/certificates' });
      } else {
        answer = `Hello ${currentUser?.name || 'Learner'}! I am **Capacity AI**, your personalized learning copilot for SkillBridge.\n\n• **Active Target Role**: Cloud Developer (45% readiness)\n• **Recommended Focus**: Docker & Containerization for Developers\n\nAsk me about your skill gaps, course syllabi, certifications, or any technical question!`;
        suggestedActions.push({ label: 'Open Learning Path', action: 'navigate', path: '/learner/dashboard' });
      }
    } else {
      // General knowledge / Gemini response
      if (q.includes('docker') || q.includes('container')) {
        answer = `**Docker Overview**:\n\nDocker is an open platform for developing, shipping, and running applications inside lightweight containers.\n\n- **Namespaces & Cgroups**: Provides isolated process trees and resource throttling.\n- **Dockerfile**: Declarative recipe for creating reproducible container images.\n- **Docker Compose**: Orchestrates multi-container topologies with private networking.\n\nWould you like guidance on building a Dockerfile for your project?`;
      } else if (q.includes('react') || q.includes('hook') || q.includes('state')) {
        answer = `**React Architecture & Hooks**:\n\nReact builds declarative UIs using a Virtual DOM and composable component trees:\n\n- \`useState\`: Encapsulates local state values.\n- \`useEffect\`: Manages lifecycle effects and subscriptions.\n- \`useMemo\` & \`useCallback\`: Memoizes expensive calculations and function references.\n- \`useContext\`: Passes global application context without prop drilling.`;
      } else if (q.includes('python') || q.includes('code') || q.includes('algorithm')) {
        answer = `**Python & Modern Algorithms**:\n\nPython provides clean, expressive syntax for software engineering, data science, and system automation:\n\n\`\`\`python\ndef binary_search(arr, target):\n    low, high = 0, len(arr) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1\n\`\`\`\n\nTime Complexity: $O(\\log n)$, Space Complexity: $O(1)$.`;
      } else {
        answer = `I am **Capacity AI**, powered by Google Gemini intelligence.\n\nI can assist you with:\n1. **SkillBridge Platform Guidance**: Target roles, skill gaps, learning paths, and certifications.\n2. **General Computer Science & Engineering**: Algorithms, cloud architecture, system design, Docker, Python, JavaScript, and career advice.\n\nWhat would you like to explore?`;
      }
    }

    return {
      answer,
      source: 'gemini',
      suggestedActions
    } as any;
  }

  // 8. VOICE COMMAND PARSING
  if (url === '/api/ai/voice-parse' || url === '/api/ai/voice-transcribe') {
    const raw = (body.text || body.query || '').trim();
    const lower = raw.toLowerCase();
    let action = 'UNKNOWN';
    let path: string | undefined;
    let spokenFeedback = `Recognized: ${raw}`;

    if (/(course|catalog)/i.test(lower)) {
      action = 'NAVIGATE';
      path = '/learner/courses';
      spokenFeedback = 'Navigating to Courses catalog';
    } else if (/(skill gap|analysis)/i.test(lower)) {
      action = 'NAVIGATE';
      path = '/learner/skill-gap';
      spokenFeedback = 'Opening Skill Gap Analysis';
    } else if (/(certificate|credential)/i.test(lower)) {
      action = 'NAVIGATE';
      path = '/learner/certificates';
      spokenFeedback = 'Opening Certificates';
    } else if (/(dashboard|home)/i.test(lower)) {
      action = 'NAVIGATE';
      path = '/learner/dashboard';
      spokenFeedback = 'Navigating to Dashboard';
    } else if (/(dark mode|light mode|theme)/i.test(lower)) {
      action = 'THEME_TOGGLE';
      spokenFeedback = 'Toggling color theme';
    } else if (/(badge|number)/i.test(lower)) {
      action = 'TOGGLE_BADGES';
      spokenFeedback = 'Toggling element numbers';
    }

    return {
      transcript: raw,
      action,
      path,
      confidence: 0.95,
      spokenFeedback,
      source: 'client-engine'
    } as any;
  }

  // Generic fallback
  return { status: 'ok', data: [] } as any;
}
