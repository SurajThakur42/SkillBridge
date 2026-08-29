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

  if ((url === '/api/users/certificates' || url === '/api/courses/user/certificates') && method === 'GET') {
    const certs = db.certificates.filter(c => c.userId === currentUser?.id);
    const enriched = certs.map(c => {
      const course = db.courses.find(crs => crs.id === c.courseId);
      return {
        id: c.id,
        certificateNumber: c.certificateNumber,
        score: c.score,
        issuedAt: c.issuedAt,
        courseId: c.courseId,
        courseTitle: course?.title || 'Course of Study',
        category: course?.category || 'Technology',
        recipientName: currentUser?.name || 'Learner',
        organization: currentUser?.organization || 'National Digital Academy'
      };
    });
    return { certificates: enriched } as any;
  }

  if (url === '/api/courses/user/enrollments' && method === 'GET') {
    const userEnrollments = db.enrollments.filter(e => e.userId === currentUser?.id);
    const enriched = userEnrollments.map(enr => {
      const course = db.courses.find(c => c.id === enr.courseId);
      const modules = db.courseModules.filter(m => m.courseId === enr.courseId);
      const completedCount = modules.filter(m =>
        db.lessonProgress.some(lp => lp.userId === currentUser?.id && lp.moduleId === m.id && lp.completed)
      ).length;

      const progressPercentage = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0;
      const cert = db.certificates.find(c => c.userId === currentUser?.id && c.courseId === enr.courseId);

      return {
        enrollmentId: enr.id,
        courseId: enr.courseId,
        title: course?.title || 'Unknown Course',
        thumbnail: course?.thumbnail || '',
        category: course?.category || '',
        difficulty: course?.difficulty || 'BEGINNER',
        duration: course?.duration || '',
        enrolledAt: enr.enrolledAt,
        completedAt: enr.completedAt,
        status: enr.status,
        completedModulesCount: completedCount,
        totalModulesCount: modules.length,
        progressPercentage,
        certificateId: cert?.id,
        certificateNumber: cert?.certificateNumber
      };
    });
    return { enrollments: enriched } as any;
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
    const parts = url.split('/');
    let quiz;
    if (parts[3] === 'course') {
      const courseId = parts[4];
      quiz = db.quizzes.find(q => q.courseId === courseId) || db.quizzes[0];
    } else {
      const quizId = parts[3];
      quiz = db.quizzes.find(q => q.id === quizId) || db.quizzes[0];
    }
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

  if (url === '/api/skills/gap-analysis' || url === '/api/skills/analysis' || url === '/api/skills/user/gap-analysis') {
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
      allSkillGaps,
      skillComparisons: allSkillGaps
    } as any;
  }

  if (url === '/api/skills/recommendations' || url === '/api/skills/user/recommendations') {
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
    return { recommendations: list } as any;
  }

  if (url === '/api/skills/learning-path' || url === '/api/skills/user/learning-path') {
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

  if ((url === '/api/skills' || url === '/api/skills/user/profile') && method === 'GET') {
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

  if (url === '/api/skills/user/calibrate' && method === 'POST') {
    const { skillId, score } = body;
    if (!skillId || typeof score !== 'number') {
      return { error: 'skillId and numeric score (0-100) are required' } as any;
    }
    const skill = db.skills.find(s => s.id === skillId);
    if (!skill) {
      return { error: 'Skill not found' } as any;
    }
    const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
    const now = new Date().toISOString();
    
    let userSkill = db.userSkills.find(us => us.userId === currentUser?.id && us.skillId === skillId);
    if (userSkill) {
      userSkill.score = clampedScore;
      userSkill.competencyLevel = clampedScore >= 95 ? 'EXPERT' : clampedScore >= 85 ? 'ADVANCED' : clampedScore >= 65 ? 'INTERMEDIATE' : 'BEGINNER';
      userSkill.lastAssessedAt = now;
    } else {
      userSkill = {
        userId: currentUser?.id || 'usr-learner-1',
        skillId,
        score: clampedScore,
        competencyLevel: clampedScore >= 95 ? 'EXPERT' : clampedScore >= 85 ? 'ADVANCED' : clampedScore >= 65 ? 'INTERMEDIATE' : 'BEGINNER',
        lastAssessedAt: now
      };
      db.userSkills.push(userSkill);
    }
    clientDatabase.save();
    return {
      message: `Calibrated ${skill.name} competency to ${clampedScore}%`,
      userSkill
    } as any;
  }

  // 6. TRAINER ROUTES
  if (url === '/api/trainer/dashboard' && method === 'GET') {
    const trainerCourses = currentUser?.role === 'ADMIN' 
      ? db.courses 
      : db.courses.filter(c => c.trainerId === currentUser?.id);
    const courseIds = trainerCourses.map(c => c.id);
    const enrollments = db.enrollments.filter(e => courseIds.includes(e.courseId));
    const uniqueLearnerIds = Array.from(new Set(enrollments.map(e => e.userId)));
    const completedEnrollments = enrollments.filter(e => e.status === 'COMPLETED');
    const avgCompletionRate = enrollments.length > 0 ? Math.round((completedEnrollments.length / enrollments.length) * 100) : 0;
    
    const quizIds = db.quizzes.filter(q => courseIds.includes(q.courseId)).map(q => q.id);
    const attempts = db.quizAttempts.filter(qa => quizIds.includes(qa.quizId));
    const avgQuizScore = attempts.length > 0 ? Math.round(attempts.reduce((acc, curr) => acc + curr.percentage, 0) / attempts.length) : 0;

    const coursesWithDetails = trainerCourses.map(course => {
      const courseEnrollments = db.enrollments.filter(e => e.courseId === course.id);
      const courseCompletions = courseEnrollments.filter(e => e.status === 'COMPLETED');
      const courseQuiz = db.quizzes.find(q => q.courseId === course.id);
      const courseAttempts = courseQuiz ? db.quizAttempts.filter(qa => qa.quizId === courseQuiz.id) : [];
      const avgScore = courseAttempts.length > 0 ? Math.round(courseAttempts.reduce((acc, curr) => acc + curr.percentage, 0) / courseAttempts.length) : 0;

      return {
        ...course,
        enrollmentsCount: courseEnrollments.length,
        completionsCount: courseCompletions.length,
        completionRate: courseEnrollments.length > 0 ? Math.round((courseCompletions.length / courseEnrollments.length) * 100) : 0,
        averageQuizScore: avgScore,
        modulesCount: db.courseModules.filter(m => m.courseId === course.id).length
      };
    });

    return {
      metrics: {
        coursesCreated: trainerCourses.length,
        totalLearners: uniqueLearnerIds.length,
        totalEnrollments: enrollments.length,
        averageCompletionRate: avgCompletionRate,
        averageQuizScore: avgQuizScore
      },
      courses: coursesWithDetails
    } as any;
  }

  if (url === '/api/trainer/learners' && method === 'GET') {
    const trainerCourseIds = currentUser?.role === 'ADMIN'
      ? db.courses.map(c => c.id)
      : db.courses.filter(c => c.trainerId === currentUser?.id).map(c => c.id);
    const enrollments = db.enrollments.filter(e => trainerCourseIds.includes(e.courseId));
    const learnerMap = new Map<string, any>();

    for (const enr of enrollments) {
      const user = db.users.find(u => u.id === enr.userId);
      const course = db.courses.find(c => c.id === enr.courseId);
      if (!user || !course) continue;

      const modules = db.courseModules.filter(m => m.courseId === course.id);
      const completedCount = modules.filter(m =>
        db.lessonProgress.some(lp => lp.userId === user.id && lp.moduleId === m.id && lp.completed)
      ).length;
      const progress = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0;

      const quiz = db.quizzes.find(q => q.courseId === course.id);
      const attempt = quiz ? db.quizAttempts.find(qa => qa.quizId === quiz.id && qa.userId === user.id) : null;

      if (!learnerMap.has(user.id)) {
        learnerMap.set(user.id, {
          userId: user.id,
          name: user.name,
          email: user.email,
          department: user.department,
          organization: user.organization,
          profileImage: user.profileImage,
          enrolledCourses: []
        });
      }

      learnerMap.get(user.id).enrolledCourses.push({
        courseId: course.id,
        courseTitle: course.title,
        enrolledAt: enr.enrolledAt,
        status: enr.status,
        progress,
        quizScore: attempt ? attempt.percentage : null
      });
    }

    return {
      learners: Array.from(learnerMap.values())
    } as any;
  }

  if (url === '/api/trainer/courses' && method === 'POST') {
    const { title, description, category, difficulty, duration, thumbnail, skillIds, modules, quiz } = body;
    if (!title || !description || !category) {
      return { error: 'Title, description, and category are required' } as any;
    }
    const now = new Date().toISOString();
    const courseId = `crs-${Date.now()}`;
    const newCourse = {
      id: courseId,
      title,
      description,
      thumbnail: thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
      category,
      difficulty: difficulty || 'BEGINNER',
      duration: duration || '3.5 Hours',
      status: 'PUBLISHED' as const,
      trainerId: currentUser?.id || 'usr-trainer-1',
      createdAt: now,
      updatedAt: now
    };
    db.courses.push(newCourse);

    if (Array.isArray(skillIds)) {
      for (const sId of skillIds) {
        db.courseSkills.push({ courseId, skillId: sId, targetLevel: 'ADVANCED' });
      }
    }

    if (Array.isArray(modules) && modules.length > 0) {
      modules.forEach((mod: any, idx: number) => {
        const modId = `mod-${Date.now()}-${idx}`;
        db.courseModules.push({
          id: modId,
          courseId,
          title: mod.title || `Module ${idx + 1}`,
          description: mod.description || 'Module learning material',
          order: idx + 1
        });
        if (mod.content) {
          db.learningResources.push({
            id: `res-${Date.now()}-${idx}`,
            moduleId: modId,
            title: `${mod.title} - Core Guide`,
            type: 'ARTICLE',
            duration: '15 min read',
            content: mod.content
          });
        }
      });
    }

    if (quiz) {
      const quizId = `quiz-${Date.now()}`;
      db.quizzes.push({
        id: quizId,
        courseId,
        title: quiz.title || `${title} Assessment`,
        passingScore: quiz.passingScore || 70
      });
      if (Array.isArray(quiz.questions)) {
        quiz.questions.forEach((q: any, qIdx: number) => {
          db.quizQuestions.push({
            id: `q-${Date.now()}-${qIdx}`,
            quizId,
            question: q.question,
            options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
            marks: q.marks || 2,
            explanation: q.explanation || 'Correct solution verified.'
          });
        });
      }
    }
    clientDatabase.save();
    return {
      message: 'Course created and published successfully',
      course: newCourse
    } as any;
  }

  if (url.startsWith('/api/trainer/courses/') && url.endsWith('/curriculum') && method === 'GET') {
    const courseId = url.split('/')[4];
    const course = db.courses.find(c => c.id === courseId);
    if (!course) {
      return { error: 'Course not found' } as any;
    }
    const modules = db.courseModules
      .filter(m => m.courseId === course.id)
      .sort((a, b) => a.order - b.order)
      .map(m => ({
        ...m,
        resources: db.learningResources.filter(r => r.moduleId === m.id)
      }));
    const quiz = db.quizzes.find(q => q.courseId === course.id);
    const quizWithQuestions = quiz ? {
      ...quiz,
      questions: db.quizQuestions.filter(q => q.quizId === quiz.id)
    } : null;
    return { course, modules, quiz: quizWithQuestions } as any;
  }

  if (url.startsWith('/api/trainer/courses/') && method === 'PUT') {
    const courseId = url.split('/').pop();
    const course = db.courses.find(c => c.id === courseId);
    if (!course) {
      return { error: 'Course not found' } as any;
    }
    const { title, description, category, difficulty, duration, thumbnail, status } = body;
    if (title) course.title = title;
    if (description) course.description = description;
    if (category) course.category = category;
    if (difficulty) course.difficulty = difficulty;
    if (duration) course.duration = duration;
    if (thumbnail) course.thumbnail = thumbnail;
    if (status) course.status = status;
    course.updatedAt = new Date().toISOString();
    clientDatabase.save();
    return {
      message: 'Course updated successfully',
      course
    } as any;
  }

  if (url.startsWith('/api/trainer/courses/') && method === 'DELETE') {
    const courseId = url.split('/').pop();
    const index = db.courses.findIndex(c => c.id === courseId);
    if (index === -1) {
      return { error: 'Course not found' } as any;
    }
    db.courses.splice(index, 1);
    clientDatabase.save();
    return { message: 'Course deleted successfully' } as any;
  }

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

  // 6b. ADMIN ROUTES
  if (url === '/api/admin/dashboard' && method === 'GET') {
    const totalUsers = db.users.length;
    const learners = db.users.filter(u => u.role === 'LEARNER');
    const trainers = db.users.filter(u => u.role === 'TRAINER');
    const activeLearners = learners.filter(u => u.isActive);
    const courses = db.courses;
    const enrollments = db.enrollments;
    const completedEnrollments = enrollments.filter(e => e.status === 'COMPLETED');
    const certificates = db.certificates;
    const quizAttempts = db.quizAttempts;

    const overallCompletionRate = enrollments.length > 0
      ? Math.round((completedEnrollments.length / enrollments.length) * 100)
      : 0;

    const avgQuizScore = quizAttempts.length > 0
      ? Math.round(quizAttempts.reduce((acc, curr) => acc + curr.percentage, 0) / quizAttempts.length)
      : 0;

    const categoryStats: Record<string, { courses: number; enrollments: number; completions: number }> = {};
    for (const course of courses) {
      if (!categoryStats[course.category]) {
        categoryStats[course.category] = { courses: 0, enrollments: 0, completions: 0 };
      }
      categoryStats[course.category].courses++;
      const courseEnrs = enrollments.filter(e => e.courseId === course.id);
      categoryStats[course.category].enrollments += courseEnrs.length;
      categoryStats[course.category].completions += courseEnrs.filter(e => e.status === 'COMPLETED').length;
    }

    const competencyDist = { BEGINNER: 0, INTERMEDIATE: 0, ADVANCED: 0, EXPERT: 0 };
    for (const us of db.userSkills) {
      if (competencyDist[us.competencyLevel] !== undefined) {
        competencyDist[us.competencyLevel]++;
      }
    }

    const targetRoleDist: Record<string, number> = {};
    for (const role of db.targetRoles) {
      targetRoleDist[role.name] = learners.filter(l => l.targetRoleId === role.id).length;
    }

    const skillGapFrequency: Record<string, { count: number; name: string; avgScore: number; scores: number[] }> = {};
    for (const skill of db.skills) {
      skillGapFrequency[skill.id] = { count: 0, name: skill.name, avgScore: 0, scores: [] };
    }
    for (const us of db.userSkills) {
      if (us.score < 60) {
        if (skillGapFrequency[us.skillId]) {
          skillGapFrequency[us.skillId].count++;
          skillGapFrequency[us.skillId].scores.push(us.score);
        }
      }
    }

    const topOrganizationalGaps = Object.values(skillGapFrequency)
      .filter(g => g.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(g => ({
        skillName: g.name,
        learnersWithGap: g.count,
        averageScore: g.scores.length > 0 ? Math.round(g.scores.reduce((a, b) => a + b, 0) / g.scores.length) : 0
      }));

    return {
      metrics: {
        totalUsers,
        learnersCount: learners.length,
        activeLearnersCount: activeLearners.length,
        trainersCount: trainers.length,
        coursesCount: courses.length,
        enrollmentsCount: enrollments.length,
        completionsCount: completedEnrollments.length,
        certificatesCount: certificates.length,
        overallCompletionRate,
        averageQuizScore: avgQuizScore
      },
      categoryStats: Object.entries(categoryStats).map(([category, stats]) => ({ category, ...stats })),
      competencyDistribution: [
        { level: 'Beginner (0-39%)', count: competencyDist.BEGINNER, fill: '#ef4444' },
        { level: 'Intermediate (40-69%)', count: competencyDist.INTERMEDIATE, fill: '#f59e0b' },
        { level: 'Advanced (70-89%)', count: competencyDist.ADVANCED, fill: '#3b82f6' },
        { level: 'Expert (90-100%)', count: competencyDist.EXPERT, fill: '#10b981' }
      ],
      targetRoleDistribution: Object.entries(targetRoleDist).map(([role, count]) => ({ role, count })),
      topOrganizationalGaps,
      recentCertificates: certificates.slice(-5).reverse().map(cert => {
        const u = db.users.find(usr => usr.id === cert.userId);
        const c = db.courses.find(crs => crs.id === cert.courseId);
        return {
          certificateNumber: cert.certificateNumber,
          learnerName: u?.name || 'Learner',
          courseTitle: c?.title || 'Course',
          score: cert.score,
          issuedAt: cert.issuedAt
        };
      })
    } as any;
  }

  if (url === '/api/admin/users' && method === 'GET') {
    const roleFilter = queryParams.get('role');
    const deptFilter = queryParams.get('department');
    const searchFilter = queryParams.get('search');
    let users = db.users;

    if (roleFilter && roleFilter !== 'ALL') {
      users = users.filter(u => u.role === roleFilter);
    }
    if (deptFilter && deptFilter !== 'ALL') {
      users = users.filter(u => u.department.toLowerCase() === deptFilter.toLowerCase());
    }
    if (searchFilter) {
      const term = searchFilter.toLowerCase();
      users = users.filter(u =>
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.organization.toLowerCase().includes(term) ||
        u.department.toLowerCase().includes(term)
      );
    }

    const enriched = users.map(user => {
      const targetRole = db.targetRoles.find(r => r.id === user.targetRoleId);
      const enrollmentsCount = db.enrollments.filter(e => e.userId === user.id).length;
      const completedCount = db.enrollments.filter(e => e.userId === user.id && e.status === 'COMPLETED').length;
      const certsCount = db.certificates.filter(c => c.userId === user.id).length;
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        organization: user.organization,
        profileImage: user.profileImage,
        targetRoleId: user.targetRoleId,
        isActive: user.isActive,
        createdAt: user.createdAt,
        targetRoleName: targetRole?.name || 'None Selected',
        stats: { enrollmentsCount, completedCount, certsCount }
      };
    });

    return { users: enriched } as any;
  }

  if (url.startsWith('/api/admin/users/') && url.endsWith('/status') && method === 'PUT') {
    const userId = url.split('/')[4];
    const user = db.users.find(u => u.id === userId);
    if (!user) {
      return { error: 'User not found' } as any;
    }
    const { isActive } = body;
    user.isActive = Boolean(isActive);
    user.updatedAt = new Date().toISOString();
    clientDatabase.save();
    return {
      message: `User ${user.name} has been ${user.isActive ? 'activated' : 'deactivated'}.`,
      user: { id: user.id, name: user.name, isActive: user.isActive }
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
