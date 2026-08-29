import { GoogleGenAI } from '@google/genai';
import { database } from '../db/database.js';
import { SkillEngine } from './skillEngine.js';

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return geminiClient;
}

export interface VoiceCommandParseResult {
  transcript: string;
  action: 'NAVIGATE' | 'CLICK' | 'SEARCH' | 'THEME_TOGGLE' | 'TOGGLE_BADGES' | 'READ_PAGE' | 'AI_COPILOT' | 'ROLE_SWITCH' | 'SCROLL' | 'SOUND_TOGGLE' | 'UNKNOWN';
  path?: string;
  target?: string;
  query?: string;
  role?: 'LEARNER' | 'TRAINER' | 'ADMIN';
  scrollDirection?: 'UP' | 'DOWN' | 'TOP' | 'BOTTOM';
  confidence: number;
  spokenFeedback: string;
  source: 'gemini-neural' | 'heuristic-engine';
}

export class AiService {
  /**
   * Process raw audio (WebM/WAV) using Gemini Multimodal Neural Audio Transcription (Whisper-tier accuracy)
   */
  public static async transcribeAndProcessVoiceAudio(params: {
    base64Audio: string;
    mimeType?: string;
    currentPath?: string;
    currentRole?: string;
  }): Promise<VoiceCommandParseResult> {
    const { base64Audio, mimeType = 'audio/webm', currentPath = '/', currentRole = 'LEARNER' } = params;

    const client = getGeminiClient();
    if (client) {
      try {
        const cleanBase64 = base64Audio.replace(/^data:audio\/[a-z0-9-+.]+;base64,/, '');

        const prompt = `You are the High-Precision Neural Voice Recognition & UI Commander for the SkillBridge (Smart India Hackathon 2026) portal.
The user is at path: "${currentPath}", active persona role: "${currentRole}".

Your tasks:
1. Accurately transcribe the spoken speech verbatim, accommodating Indian and global English accents, background audio, and tech jargon (e.g. Docker, Kubernetes, AWS, SQL, Skill Gap, Recommendations, Quiz, Assessment, Dark Mode, etc.).
2. Determine what user action or intent was requested.

Available UI Commands:
- NAVIGATE:
  * "courses" / "course catalog" / "browse courses" -> path: "/learner/courses"
  * "skill gap" / "skill analysis" / "gap report" -> path: "/learner/skill-gap"
  * "recommendations" / "recommended for me" -> path: "/learner/recommendations"
  * "skills" / "my skills" / "competency matrix" -> path: "/learner/skills"
  * "certificates" / "my certificates" / "credentials" -> path: "/learner/certificates"
  * "profile" / "my profile" / "account settings" -> path: "/learner/profile"
  * "dashboard" / "home" -> path: currentRole === 'ADMIN' ? "/admin/dashboard" : currentRole === 'TRAINER' ? "/trainer/dashboard" : "/learner/dashboard"
  * "trainer" / "switch to trainer" / "trainer portal" -> action: ROLE_SWITCH, role: "TRAINER"
  * "admin" / "switch to admin" -> action: ROLE_SWITCH, role: "ADMIN"
  * "learner" / "switch to learner" -> action: ROLE_SWITCH, role: "LEARNER"
  * "back" / "go back" -> action: NAVIGATE, path: "BACK"
- THEME_TOGGLE:
  * "dark mode" / "light mode" / "toggle theme" / "night mode"
- TOGGLE_BADGES:
  * "show numbers" / "show badges" / "hide numbers" / "toggle badges"
- READ_PAGE:
  * "read page" / "read this page" / "read aloud" / "speak page"
- SOUND_TOGGLE:
  * "mute sound" / "unmute sound" / "toggle sound"
- SEARCH:
  * "search [query]" / "find [query]" -> query: "[query]"
- CLICK:
  * "click [number]" (e.g. "click 3" -> target: "3")
  * "click [button or card text]" (e.g. "click enroll", "click take assessment", "click start course", "click next")
- AI_COPILOT:
  * "ask ai [question]" / "what is my readiness" / conversational queries -> query: "[question]"
- SCROLL:
  * "scroll down" / "scroll up" / "scroll to top" / "scroll to bottom"

Return ONLY a JSON object with:
{
  "transcript": "string",
  "action": "NAVIGATE" | "CLICK" | "SEARCH" | "THEME_TOGGLE" | "TOGGLE_BADGES" | "READ_PAGE" | "AI_COPILOT" | "ROLE_SWITCH" | "SCROLL" | "SOUND_TOGGLE" | "UNKNOWN",
  "path": "optional string URL path",
  "target": "optional target element label or badge number",
  "query": "optional search/ai query string",
  "role": "optional LEARNER | TRAINER | ADMIN",
  "scrollDirection": "optional UP | DOWN | TOP | BOTTOM",
  "confidence": 0.95,
  "spokenFeedback": "Short user-friendly audio confirmation phrase (e.g. 'Opening your skill gap analysis')"
}`;

        const response = await client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType.split(';')[0],
                    data: cleanBase64
                  }
                },
                {
                  text: prompt
                }
              ]
            }
          ],
          config: {
            responseMimeType: 'application/json'
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          return {
            transcript: parsed.transcript || '',
            action: parsed.action || 'UNKNOWN',
            path: parsed.path,
            target: parsed.target,
            query: parsed.query,
            role: parsed.role,
            scrollDirection: parsed.scrollDirection,
            confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.95,
            spokenFeedback: parsed.spokenFeedback || (parsed.transcript ? `Understood: ${parsed.transcript}` : 'Voice command executed'),
            source: 'gemini-neural'
          };
        }
      } catch (err) {
        console.warn('Gemini neural audio transcription failed, invoking smart acoustic fallback:', err);
      }
    }

    // Fallback: If no audio could be sent to Gemini, return empty for client-side fallback
    return {
      transcript: 'Voice audio received',
      action: 'UNKNOWN',
      confidence: 0.5,
      spokenFeedback: 'Processing command',
      source: 'heuristic-engine'
    };
  }

  /**
   * Smart Semantic Parser for text transcribed via any engine
   */
  public static parseVoiceText(text: string, currentPath = '/', currentRole = 'LEARNER'): VoiceCommandParseResult {
    const raw = text.trim();
    const lower = raw.toLowerCase().replace(/^[.,!?:;]+|[.,!?:;]+$/g, '');

    // 1. Navigation heuristics
    if (/(go to |open |show |view |navigate to |visit )?courses?/i.test(lower)) {
      return {
        transcript: raw,
        action: 'NAVIGATE',
        path: '/learner/courses',
        confidence: 0.95,
        spokenFeedback: 'Navigating to Courses catalog',
        source: 'heuristic-engine'
      };
    }

    if (/(skill gap|skill-gap|gap analysis|gap report|readiness)/i.test(lower)) {
      return {
        transcript: raw,
        action: 'NAVIGATE',
        path: '/learner/skill-gap',
        confidence: 0.95,
        spokenFeedback: 'Opening Skill Gap Analysis',
        source: 'heuristic-engine'
      };
    }

    if (/(recommendation|recommended|suggested)/i.test(lower)) {
      return {
        transcript: raw,
        action: 'NAVIGATE',
        path: '/learner/recommendations',
        confidence: 0.95,
        spokenFeedback: 'Opening Course Recommendations',
        source: 'heuristic-engine'
      };
    }

    if (/(my skills|competenc|skill matrix)/i.test(lower)) {
      return {
        transcript: raw,
        action: 'NAVIGATE',
        path: '/learner/skills',
        confidence: 0.95,
        spokenFeedback: 'Opening Competency Matrix',
        source: 'heuristic-engine'
      };
    }

    if (/(certificate|credentials|certify|diploma)/i.test(lower)) {
      return {
        transcript: raw,
        action: 'NAVIGATE',
        path: '/learner/certificates',
        confidence: 0.95,
        spokenFeedback: 'Opening Verifiable Certificates',
        source: 'heuristic-engine'
      };
    }

    if (/(profile|account|my account)/i.test(lower)) {
      return {
        transcript: raw,
        action: 'NAVIGATE',
        path: '/learner/profile',
        confidence: 0.95,
        spokenFeedback: 'Opening Profile',
        source: 'heuristic-engine'
      };
    }

    if (/(dashboard|home|main page)/i.test(lower)) {
      const dest = currentRole === 'ADMIN' ? '/admin/dashboard' : currentRole === 'TRAINER' ? '/trainer/dashboard' : '/learner/dashboard';
      return {
        transcript: raw,
        action: 'NAVIGATE',
        path: dest,
        confidence: 0.95,
        spokenFeedback: 'Navigating to Dashboard',
        source: 'heuristic-engine'
      };
    }

    // Role switching
    if (/(switch to trainer|trainer persona|vikram)/i.test(lower)) {
      return {
        transcript: raw,
        action: 'ROLE_SWITCH',
        role: 'TRAINER',
        confidence: 0.95,
        spokenFeedback: 'Switching to Trainer persona',
        source: 'heuristic-engine'
      };
    }
    if (/(switch to admin|admin persona|rajeshwar)/i.test(lower)) {
      return {
        transcript: raw,
        action: 'ROLE_SWITCH',
        role: 'ADMIN',
        confidence: 0.95,
        spokenFeedback: 'Switching to Administrator persona',
        source: 'heuristic-engine'
      };
    }
    if (/(switch to learner|learner persona|aarav)/i.test(lower)) {
      return {
        transcript: raw,
        action: 'ROLE_SWITCH',
        role: 'LEARNER',
        confidence: 0.95,
        spokenFeedback: 'Switching to Learner persona',
        source: 'heuristic-engine'
      };
    }

    // Theme & Badges
    if (/(dark mode|light mode|toggle theme|night mode|switch theme)/i.test(lower)) {
      return {
        transcript: raw,
        action: 'THEME_TOGGLE',
        confidence: 0.98,
        spokenFeedback: 'Toggling color theme',
        source: 'heuristic-engine'
      };
    }

    if (/(show numbers|show badges|number tags|toggle badges|hide numbers)/i.test(lower)) {
      return {
        transcript: raw,
        action: 'TOGGLE_BADGES',
        confidence: 0.98,
        spokenFeedback: 'Toggled element number badges',
        source: 'heuristic-engine'
      };
    }

    if (/(read this page|read page|read aloud|speak page)/i.test(lower)) {
      return {
        transcript: raw,
        action: 'READ_PAGE',
        confidence: 0.98,
        spokenFeedback: 'Reading current page content aloud',
        source: 'heuristic-engine'
      };
    }

    // Search
    const searchMatch = lower.match(/(?:search for|search|find|filter by)\s+(.+)/i);
    if (searchMatch && searchMatch[1]) {
      return {
        transcript: raw,
        action: 'SEARCH',
        query: searchMatch[1].trim(),
        confidence: 0.92,
        spokenFeedback: `Searching for ${searchMatch[1].trim()}`,
        source: 'heuristic-engine'
      };
    }

    // Click number
    const numMatch = lower.match(/(?:click|select|press|choose|tap)\s+(?:number\s+)?(\d+)/i);
    if (numMatch && numMatch[1]) {
      return {
        transcript: raw,
        action: 'CLICK',
        target: numMatch[1],
        confidence: 0.95,
        spokenFeedback: `Clicked element ${numMatch[1]}`,
        source: 'heuristic-engine'
      };
    }

    // Click label
    const clickMatch = lower.match(/(?:click|select|press|tap|open)\s+(.+)/i);
    if (clickMatch && clickMatch[1]) {
      return {
        transcript: raw,
        action: 'CLICK',
        target: clickMatch[1].trim(),
        confidence: 0.85,
        spokenFeedback: `Clicking ${clickMatch[1].trim()}`,
        source: 'heuristic-engine'
      };
    }

    // Capacity AI
    if (/(capacity ai|ask ai|copilot|open ai)/i.test(lower)) {
      return {
        transcript: raw,
        action: 'AI_COPILOT',
        confidence: 0.95,
        spokenFeedback: 'Opening Capacity AI Copilot',
        source: 'heuristic-engine'
      };
    }

    return {
      transcript: raw,
      action: 'UNKNOWN',
      confidence: 0.5,
      spokenFeedback: `Recognized: "${raw}"`,
      source: 'heuristic-engine'
    };
  }

  public static async answerLearnerQuery(userId: string, question: string): Promise<{
    answer: string;
    source: 'gemini' | 'engine-fallback';
    suggestedActions?: Array<{ label: string; action: string; path?: string }>;
  }> {
    const db = database.db;
    const user = db.users.find(u => u.id === userId);
    const skillGap = SkillEngine.getSkillGapAnalysis(userId);
    const recommendations = SkillEngine.getRecommendations(userId);
    const learningPath = SkillEngine.getLearningPath(userId);
    const userSkills = SkillEngine.getUserSkillProfile(userId);

    const contextSummary = {
      userName: user?.name || 'Learner',
      targetRole: skillGap.targetRole?.name || 'Not Selected',
      readinessPercentage: skillGap.overallReadinessPercentage,
      criticalGaps: skillGap.criticalGaps.map(g => `${g.skillName} (Current: ${g.currentScore}%, Target: ${g.requiredScore}%)`),
      matchedSkills: skillGap.matchedSkills.map(g => `${g.skillName} (${g.currentScore}%)`),
      topRecommendations: recommendations.slice(0, 3).map(r => `${r.courseTitle} (Addresses: ${r.primaryGapSkill})`),
      nextUpStep: learningPath.steps.find(s => s.status === 'NEXT_UP' || s.status === 'IN_PROGRESS')?.title || 'Select a course'
    };

    const client = getGeminiClient();

    if (client) {
      try {
        const systemPrompt = `You are "Capacity AI", a world-class AI assistant and digital capacity-building mentor for SkillBridge (Smart India Hackathon 2026).

You have dual capabilities:
1. PLATFORM & WEBSITE QUERIES: If the user asks about SkillBridge, their courses, learning paths, target roles, skill gaps, certificates, quizzes, dashboard, voice commands, trainers, or progress, provide accurate, helpful, platform-oriented answers grounded in their profile:
   - Learner Name: ${contextSummary.userName}
   - Target Role: ${contextSummary.targetRole}
   - Current Role Readiness: ${contextSummary.readinessPercentage}%
   - Critical Skill Gaps: ${contextSummary.criticalGaps.join(', ') || 'None'}
   - Matched Competencies: ${contextSummary.matchedSkills.join(', ') || 'None'}
   - Recommended Courses: ${contextSummary.topRecommendations.join('; ')}
   - Next Step on Learning Path: ${contextSummary.nextUpStep}

2. GENERAL KNOWLEDGE & TECHNICAL QUESTIONS: If the user asks general questions (coding, algorithms, software architecture, science, mathematics, career advice, technology explanations, or open-ended topics), answer fully, accurately, and intelligently like Gemini with clear markdown explanations, code samples, and step-by-step clarity.

Formatting: Use clear headings, bullet points, and code blocks where appropriate. Be concise, engaging, and professional.`;

        const response = await client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nUser Question: ${question}` }]
            }
          ]
        });

        if (response.text) {
          const isWebsiteRelated = /(course|skill|gap|role|certificate|readiness|quiz|module|learn|path|trainer|admin|dashboard|enroll|progress|platform|skillbridge)/i.test(question);
          return {
            answer: response.text,
            source: 'gemini',
            suggestedActions: isWebsiteRelated ? [
              { label: 'View Skill Gap Analysis', action: 'navigate', path: '/learner/skill-gap' },
              { label: 'Explore Recommendations', action: 'navigate', path: '/learner/recommendations' },
              { label: 'Open Learning Path', action: 'navigate', path: '/learner/dashboard' }
            ] : undefined
          };
        }
      } catch (err) {
        console.warn('Gemini API call failed, falling back to deterministic engine:', err);
      }
    }

    // Deterministic Smart Fallback Engine based on query intent & live user metrics
    const lower = question.toLowerCase();
    let fallbackText = '';
    const suggestedActions: Array<{ label: string; action: string; path?: string }> = [];

    // 1. Website & SkillBridge specific queries
    if (lower.includes('next') || lower.includes('learn next') || lower.includes('start') || lower.includes('what should i do')) {
      const topRec = recommendations[0];
      if (topRec) {
        fallbackText = `Based on your **${contextSummary.targetRole}** roadmap (${contextSummary.readinessPercentage}% readiness), you should focus immediately on **${topRec.primaryGapSkill}**.\n\nWe recommend enrolling in **${topRec.courseTitle}** (${topRec.duration}, ${topRec.difficulty}). Completing this course and passing its assessment will directly eliminate your highest-priority capability deficit.`;
        suggestedActions.push({ label: `Enroll in ${topRec.courseTitle}`, action: 'navigate', path: `/learner/courses/${topRec.courseId}` });
      } else {
        fallbackText = `You are well on your way to mastering ${contextSummary.targetRole}! Continue progressing through your active learning path modules and take the final competency assessments to earn verifiable certifications.`;
      }
    } else if (lower.includes('why') || lower.includes('recommend') || lower.includes('reason')) {
      const highestGap = skillGap.criticalGaps[0] || skillGap.mediumGaps[0];
      if (highestGap) {
        fallbackText = `Courses in **${highestGap.skillName}** are prioritized because your current score is **${highestGap.currentScore}%**, whereas the benchmark for a **${contextSummary.targetRole}** requires **${highestGap.requiredScore}%** (${highestGap.requiredLevel} level with ${highestGap.importance}/5 priority). Bridging this gap will raise your overall readiness from ${contextSummary.readinessPercentage}% significantly.`;
      } else {
        fallbackText = `Your recommendations are curated to maintain mastery across your target domain and prepare you for advanced multi-system design assessments.`;
      }
      suggestedActions.push({ label: 'Review Skill Gap Breakdown', action: 'navigate', path: '/learner/skill-gap' });
    } else if (lower.includes('gap') || lower.includes('missing') || lower.includes('weakness')) {
      if (skillGap.criticalGaps.length > 0) {
        fallbackText = `You currently have **${skillGap.criticalGaps.length} critical skill gaps** for the **${contextSummary.targetRole}** role:\n\n` +
          skillGap.criticalGaps.map((g, idx) => `${idx + 1}. **${g.skillName}**: Current score ${g.currentScore}%, Target is ${g.requiredScore}% (${g.requiredLevel}).`).join('\n') +
          `\n\nYour matched strengths include: ${skillGap.matchedSkills.map(m => m.skillName).join(', ') || 'in progress'}.`;
      } else {
        fallbackText = `Great news! You have no critical skill gaps for **${contextSummary.targetRole}**. You have reached ${contextSummary.readinessPercentage}% competency alignment!`;
      }
      suggestedActions.push({ label: 'Open Competency Matrix', action: 'navigate', path: '/learner/skills' });
    } else if (lower.includes('certificate') || lower.includes('certify') || lower.includes('exam')) {
      fallbackText = `Certificates on SkillBridge are verifiable digital credentials issued automatically when you complete all modules in a course and achieve ≥ 70% on the final competency quiz. Each credential includes a tamper-resistant verification ID (e.g. \`CC-2026-XXXXXX\`) and can be exported for enterprise and SIH validation.`;
      suggestedActions.push({ label: 'View My Certificates', action: 'navigate', path: '/learner/certificates' });
    } else if (lower.includes('docker') || lower.includes('container')) {
      fallbackText = `**Docker & Containerization Overview**:\n\nDocker packages applications and their dependencies into lightweight, isolated containers that execute consistently across all environments.\n\n- **Images & Containers**: Images are immutable blueprints built from \`Dockerfile\`s; containers are active executing instances.\n- **Namespaces & Cgroups**: Leverages Linux kernel namespaces for process isolation and cgroups for CPU/memory throttling.\n- **Key Commands**: \`docker build -t app .\`, \`docker run -p 3000:3000 app\`, \`docker-compose up\`.\n\nCheck out the **Docker & Containerization for Developers** course in your catalog to gain hands-on mastery!`;
      suggestedActions.push({ label: 'View Docker Course', action: 'navigate', path: '/learner/courses/crs-docker-containers' });
    } else if (lower.includes('kubernetes') || lower.includes('k8s')) {
      fallbackText = `**Kubernetes (K8s) Architecture**:\n\nKubernetes is an open-source container orchestration system that automates deployment, scaling, and management of containerized applications.\n\n- **Control Plane**: \`kube-apiserver\`, \`etcd\` (state store), \`kube-scheduler\`, and \`controller-manager\`.\n- **Worker Nodes**: \`kubelet\`, \`kube-proxy\`, and container runtimes executing **Pods**.\n- **Declarative Primitives**: Deployments, Services (ClusterIP, NodePort, LoadBalancer), ConfigMaps, Secrets, and Ingress.`;
      suggestedActions.push({ label: 'View Kubernetes Course', action: 'navigate', path: '/learner/courses/crs-k8s-production' });
    } else if (lower.includes('python') || lower.includes('machine learning') || lower.includes('ai')) {
      fallbackText = `**Machine Learning with Python**:\n\nPython is the primary language for data intelligence and machine learning due to its mature scientific ecosystem:\n\n- **Pandas & NumPy**: High-performance array operations and DataFrame transformations.\n- **Scikit-Learn**: Supervised/unsupervised algorithms (regression, classification, clustering, cross-validation).\n- **Neural Models**: PyTorch and TensorFlow for deep learning and neural representations.`;
      suggestedActions.push({ label: 'View Data Science Course', action: 'navigate', path: '/learner/courses/crs-python-data-science' });
    } else {
      fallbackText = `Hello ${contextSummary.userName}! I am **Capacity AI**, powered by Google Gemini and SkillBridge intelligence.\n\n` +
        `• **Your Goal**: Tracking toward **${contextSummary.targetRole}** (${contextSummary.readinessPercentage}% readiness).\n` +
        `• **Top Focus**: **${contextSummary.topRecommendations[0] || 'Cloud & DevOps Foundations'}**.\n\n` +
        `You can ask me questions about your **SkillBridge learning roadmap, courses, and skill gaps**, or ask **general technical and coding questions** like Python, Docker, system design, cloud architecture, and algorithms!`;
      suggestedActions.push({ label: 'Open Learning Path', action: 'navigate', path: '/learner/dashboard' });
    }

    return {
      answer: fallbackText,
      source: 'engine-fallback',
      suggestedActions
    };
  }
}
