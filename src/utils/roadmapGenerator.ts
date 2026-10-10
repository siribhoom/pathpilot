/**
 * ============================================================================
 * FILE: src/utils/roadmapGenerator.ts
 * PURPOSE: Generates a personalized SemesterRecord from a student's profile
 *          and calculates progress percentages when tasks, skills, or projects
 *          are updated.
 *
 * CRITICAL PERSISTENCE RULE:
 * This generator is ONLY called when:
 * 1. A student completes onboarding for a semester that does NOT yet have a
 *    saved roadmap in storage.
 * 2. A student explicitly starts a new semester.
 * 3. A student explicitly clicks "Regenerate Roadmap" and confirms the dialog.
 * It is NEVER called automatically on page refresh if a saved roadmap already
 * exists in Firestore or local storage.
 * ============================================================================
 */

import {
  AcademicSemester,
  AcademicYear,
  BRANCH_SUGGESTIONS,
  EngineeringBranch,
  MonthlyPlanItem,
  OpportunityItem,
  PlacementTaskItem,
  ProjectItem,
  SemesterRecord,
  SkillResourceItem,
  StudentProfile,
  SubjectBridgeItem,
  WeeklyPlanItem,
} from '../types/student';

/**
 * Converts a semester label like "Semester 3" into a clean document ID like "sem_3"
 * that satisfies our Firestore `isValidId` regex (`^[a-zA-Z0-9_\-]+$`).
 */
export function semesterNameToId(semesterName: AcademicSemester): string {
  const num = semesterName.replace(/[^0-9]/g, '') || '1';
  return `sem_${num}`;
}

/**
 * Infers the BTech academic year corresponding to a given semester.
 */
export function getAcademicYearForSemester(semesterName: AcademicSemester): AcademicYear {
  switch (semesterName) {
    case 'Semester 1':
    case 'Semester 2':
      return '1st Year';
    case 'Semester 3':
    case 'Semester 4':
      return '2nd Year';
    case 'Semester 5':
    case 'Semester 6':
      return '3rd Year';
    case 'Semester 7':
    case 'Semester 8':
      return '4th Year';
  }
}

/**
 * Lookup dictionary mapping common college subject keywords to specific
 * classroom concepts, real-world engineering systems, and career skills.
 */
function buildSubjectBridge(
  subjectName: string,
  index: number,
  branch: EngineeringBranch,
  careerGoal: string,
  learningMethod: string,
  semesterId: string
): SubjectBridgeItem {
  const lower = subjectName.toLowerCase();
  const branchSample = BRANCH_SUGGESTIONS[branch].sampleBridge;

  let classroomConcepts = `Core mathematical models, state analysis, and design principles in ${subjectName}`;
  let realWorldApplication = `Production ${careerGoal} architecture and industrial diagnostic systems`;
  let industrySkillUnlocked = `Applied ${subjectName} modeling & technical interview problem solving`;

  if (lower.includes('data structure') || lower.includes('algorithm')) {
    classroomConcepts = 'Trees, Heaps, Graph Traversals (BFS/DFS), Dynamic Programming & Hash Indexing';
    realWorldApplication = 'Low-latency database storage engines, search autocomplete, and network routing';
    industrySkillUnlocked = 'Algorithmic optimization & complexity analysis (O(log n) production scaling)';
  } else if (lower.includes('operating system') || lower.includes('os')) {
    classroomConcepts = 'Process Scheduling, Virtual Memory Paging, Mutexes, Semaphores & File Systems';
    realWorldApplication = 'Linux container runtimes (Docker/Kubernetes) and multi-threaded server kernels';
    industrySkillUnlocked = 'Concurrency debugging, memory profiling & systems programming';
  } else if (lower.includes('database') || lower.includes('dbms')) {
    classroomConcepts = 'ACID Transactions, B+ Tree Indexing, Normalization & Query Execution Plans';
    realWorldApplication = 'High-concurrency financial ledgers, e-commerce inventory & distributed caches';
    industrySkillUnlocked = 'Schema design, SQL query tuning & transaction isolation hardening';
  } else if (lower.includes('network')) {
    classroomConcepts = 'OSI/TCP-IP Stack, Congestion Control, DNS, TLS Handshakes & Subnet Routing';
    realWorldApplication = 'Content Delivery Networks (CDNs), load balancers & zero-trust microservices';
    industrySkillUnlocked = 'Packet analysis, API gateway configuration & network security';
  } else if (lower.includes('microprocessor') || lower.includes('microcontroller') || lower.includes('embedded')) {
    classroomConcepts = 'Interrupt Vectors, Timer/Counter Registers, DMA, UART, SPI & I2C Protocols';
    realWorldApplication = 'Automotive ECU firmware, wearable medical telemetry & industrial robotics';
    industrySkillUnlocked = 'Bare-metal C/RTOS driver development & hardware-software co-design';
  } else if (lower.includes('vlsi') || lower.includes('digital logic')) {
    classroomConcepts = 'Combinational/Sequential Logic, FSMs, Setup/Hold Timing & CMOS Layout';
    realWorldApplication = 'Custom AI accelerator ASICs, FPGA signal processors & SoC silicon design';
    industrySkillUnlocked = 'Verilog/SystemVerilog RTL design & Static Timing Analysis (STA)';
  } else if (lower.includes('control') || lower.includes('power')) {
    classroomConcepts = 'PID Feedback Loops, State-Space Stability, PWM Inverters & Transfer Functions';
    realWorldApplication = 'EV traction motor controllers, smart grid inverters & drone flight stabilization';
    industrySkillUnlocked = 'MATLAB/Simulink closed-loop simulation & power stage design';
  } else if (lower.includes('thermo') || lower.includes('heat') || lower.includes('fluid')) {
    classroomConcepts = 'Conservation of Energy, Navier-Stokes Flow, Heat Exchangers & Entropy Cycles';
    realWorldApplication = 'EV battery pack liquid cooling plates, aero-propulsion & HVAC thermal management';
    industrySkillUnlocked = 'CFD thermal simulation (ANSYS/OpenFOAM) & energy efficiency modeling';
  } else if (lower.includes('structur') || lower.includes('strength') || lower.includes('concrete') || lower.includes('geotech')) {
    classroomConcepts = 'Shear/Bending Moment Envelopes, Buckling Loads, Soil Bearing Capacity & Finite Elements';
    realWorldApplication = 'Seismic-resistant metro viaducts, high-rise wind bracing & bridge foundations';
    industrySkillUnlocked = 'Structural BIM/FEA modeling (STAAD/ETABS) & safety code verification';
  } else if (index === 0) {
    classroomConcepts = branchSample.classroomConcept;
    realWorldApplication = branchSample.realWorldSystem;
    industrySkillUnlocked = branchSample.industrySkill;
  }

  return {
    id: `${semesterId}_bridge_${index + 1}`,
    subjectName,
    classroomConcepts,
    realWorldApplication,
    industrySkillUnlocked,
    studyResourceFormat: learningMethod,
    isExplored: false,
  };
}

/**
 * Calculates the overall completion percentage (0 to 100) for a SemesterRecord
 * based on completed weekly tasks, explored subject bridges, mastered skills,
 * project milestones, and completed placement tasks.
 */
export function calculateSemesterProgress(record: SemesterRecord): number {
  const totalWeeks = record.weeklyPlans.length;
  const completedWeeks = record.weeklyPlans.filter((w) => w.isCompleted).length;

  const totalSkills = record.skills.length;
  const masteredSkills = record.skills.filter((s) => s.status === 'mastered').length;
  const inProgressSkills = record.skills.filter((s) => s.status === 'in-progress').length;

  const totalProjects = record.projects.length;
  const projectScore =
    totalProjects > 0
      ? record.projects.reduce((acc, p) => acc + p.progressPercent / 100, 0)
      : 0;

  const totalPlacement = record.placementTasks.length;
  const completedPlacement = record.placementTasks.filter((t) => t.completed).length;

  const totalUnits = totalWeeks + totalSkills + totalProjects + totalPlacement;
  if (totalUnits === 0) return 0;

  const earnedUnits =
    completedWeeks +
    masteredSkills +
    inProgressSkills * 0.4 +
    projectScore +
    completedPlacement;

  return Math.min(100, Math.max(0, Math.round((earnedUnits / totalUnits) * 100)));
}

/**
 * Generates a complete, personalized SemesterRecord for a student's chosen semester.
 */
export function generatePersonalizedSemesterRecord(
  profile: StudentProfile,
  targetSemester?: AcademicSemester,
  customSubjects?: string[]
): SemesterRecord {
  const semesterName = targetSemester || profile.currentSemester;
  const semesterId = semesterNameToId(semesterName);
  const academicYear = getAcademicYearForSemester(semesterName);
  const subjects =
    customSubjects && customSubjects.length > 0
      ? customSubjects.slice(0, 15)
      : profile.currentSubjects.slice(0, 15);

  const nowIso = new Date().toISOString();

  // 1. Subject-to-Real-World Application Bridges
  const subjectBridges: SubjectBridgeItem[] = subjects.map((subject, idx) =>
    buildSubjectBridge(
      subject,
      idx,
      profile.branch,
      profile.careerGoal,
      profile.preferredLearningMethod,
      semesterId
    )
  );

  // 2. Monthly Learning Plans (4 Monthly Sprints per Semester)
  const monthlyPlans: MonthlyPlanItem[] = [
    {
      id: `${semesterId}_month_1`,
      monthNumber: 1,
      title: 'Month 1: Classroom Concept Mapping & Core Tooling Setup',
      focusSummary: `Connect initial syllabus units in ${subjects.slice(0, 2).join(' and ')} to real-world ${profile.careerGoal} workflows.`,
      targetOutcome: 'Complete core environment setup and first 2 subject-to-application lab exercises.',
      isCompleted: false,
    },
    {
      id: `${semesterId}_month_2`,
      monthNumber: 2,
      title: 'Month 2: Applied Skill Sprint & Mid-Sem Synergy',
      focusSummary: `Allocate ${profile.weeklyStudyHours} hrs/week using ${profile.preferredLearningMethod} while preparing for mid-semester evaluations.`,
      targetOutcome: 'Build the core prototype module of your semester engineering project.',
      isCompleted: false,
    },
    {
      id: `${semesterId}_month_3`,
      monthNumber: 3,
      title: 'Month 3: End-to-End Project Integration & Benchmarking',
      focusSummary: `Integrate concepts from ${subjects[subjects.length - 1] || subjects[0]} into a portfolio-grade system and apply for ${academicYear} opportunities.`,
      targetOutcome: 'Complete project testing, documentation, and submit 2 internship/hackathon applications.',
      isCompleted: false,
    },
    {
      id: `${semesterId}_month_4`,
      monthNumber: 4,
      title: 'Month 4: Semester Exam Mastery & Placement Readiness Consolidation',
      focusSummary: 'Consolidate university exam revision alongside interview question defense for your completed subjects.',
      targetOutcome: 'Finish semester placement checklist and archive verified project artifacts.',
      isCompleted: false,
    },
  ];

  // 3. Weekly Learning Plans (8 Focused 2-Week / Weekly Sprint Blocks calibrated to weeklyStudyHours)
  const weeklyPlans: WeeklyPlanItem[] = Array.from({ length: 8 }, (_, idx) => {
    const weekNumber = idx + 1;
    const linkedBridge = subjectBridges[idx % subjectBridges.length];
    const studyHours = profile.weeklyStudyHours;

    const phaseTitles = [
      `Core Concept Foundation: ${linkedBridge.subjectName}`,
      `Real-World Architecture Lab: ${linkedBridge.subjectName}`,
      `Skill Implementation Sprint for ${profile.careerGoal}`,
      `Project Milestone 1: System Design & Setup`,
      `Mid-Semester Theory-to-Practice Integration (${linkedBridge.subjectName})`,
      `Project Milestone 2: Core Engineering Implementation`,
      `Performance Testing & Technical Documentation`,
      `Semester Synthesis & Interview Defense Prep`,
    ];

    return {
      id: `${semesterId}_week_${weekNumber}`,
      weekNumber,
      title: phaseTitles[idx],
      subjectLinked: linkedBridge.subjectName,
      allocatedHours: studyHours,
      deliverableTask:
        idx % 2 === 0
          ? `Map classroom theory (${linkedBridge.classroomConcepts}) into a working technical note or lab exercise.`
          : `Apply ${linkedBridge.industrySkillUnlocked} toward your ${profile.careerGoal} portfolio project.`,
      learningResource: `${profile.preferredLearningMethod} — ${linkedBridge.subjectName} Applied Track`,
      isCompleted: false,
      wasRearranged: false,
    };
  });

  // 4. Skills & Learning Resources (combining existing known skills + subject-linked skills + career goal skills)
  const skills: SkillResourceItem[] = [];

  // Add student's already known skills as Baseline Known (and mark them mastered/in-progress)
  profile.knownSkills.slice(0, 10).forEach((knownSkill, idx) => {
    skills.push({
      id: `${semesterId}_skill_known_${idx + 1}`,
      skillName: knownSkill,
      category: 'Baseline Known',
      linkedSubject: 'Prior Foundation',
      resourceTitle: `Advanced Production Patterns in ${knownSkill} (${profile.preferredLearningMethod})`,
      resourceType: profile.preferredLearningMethod,
      estimatedHours: Math.max(4, Math.round(profile.weeklyStudyHours * 0.5)),
      status: 'mastered',
    });
  });

  // Add Subject-Linked Core Skills derived from each semester subject
  subjectBridges.slice(0, 6).forEach((bridge, idx) => {
    skills.push({
      id: `${semesterId}_skill_sub_${idx + 1}`,
      skillName: bridge.industrySkillUnlocked,
      category: 'Subject-Linked Core',
      linkedSubject: bridge.subjectName,
      resourceTitle: `${bridge.subjectName} → ${bridge.realWorldApplication} (${profile.preferredLearningMethod})`,
      resourceType: profile.preferredLearningMethod,
      estimatedHours: Math.max(6, profile.weeklyStudyHours),
      status: idx === 0 ? 'in-progress' : 'planned',
    });
  });

  // Add Career Target Skills
  const careerSkills = [
    `${profile.careerGoal} System Architecture & Debugging`,
    `Version Control, Automated Testing & Technical Documentation`,
  ];
  careerSkills.forEach((cSkill, idx) => {
    skills.push({
      id: `${semesterId}_skill_career_${idx + 1}`,
      skillName: cSkill,
      category: 'Career Target Skill',
      linkedSubject: subjects[0] || profile.branch,
      resourceTitle: `Industry Case Studies for ${profile.careerGoal} (${profile.preferredLearningMethod})`,
      resourceType: profile.preferredLearningMethod,
      estimatedHours: Math.max(8, Math.round(profile.weeklyStudyHours * 1.2)),
      status: 'planned',
    });
  });

  // 5. Projects and Their Progress
  const primarySubject = subjects[0] || `${profile.branch} Core`;
  const secondarySubject = subjects[1] || primarySubject;
  const projects: ProjectItem[] = [
    {
      id: `${semesterId}_proj_1`,
      title: `Applied ${primarySubject} Engine for ${profile.careerGoal}`,
      linkedSubjects: subjects.slice(0, 2),
      targetSkill: subjectBridges[0]?.industrySkillUnlocked || profile.careerGoal,
      problemStatement: `Design and build a measurable engineering prototype that applies ${primarySubject} and ${secondarySubject} theory to solve a real-world ${profile.careerGoal} problem.`,
      realWorldContext:
        subjectBridges[0]?.realWorldApplication ||
        `Production ${profile.branch} industrial system`,
      estimatedHours: Math.max(12, profile.weeklyStudyHours * 2),
      status: 'not-started',
      progressPercent: 0,
      milestones: [
        {
          id: `${semesterId}_proj_1_m1`,
          label: `Define system architecture & mathematical/logical model from ${primarySubject}`,
          completed: false,
        },
        {
          id: `${semesterId}_proj_1_m2`,
          label: `Implement core working prototype using ${
            profile.knownSkills[0] || 'branch tooling'
          }`,
          completed: false,
        },
        {
          id: `${semesterId}_proj_1_m3`,
          label: 'Benchmark performance with real test inputs and document engineering trade-offs',
          completed: false,
        },
      ],
    },
    {
      id: `${semesterId}_proj_2`,
      title: `${semesterName} Capstone Simulation & Verification Utility`,
      linkedSubjects: subjects.slice(1, 3).length > 0 ? subjects.slice(1, 3) : [primarySubject],
      targetSkill: `${profile.careerGoal} Verification & Diagnostics`,
      problemStatement: `Create a reproducible diagnostic or simulation workflow demonstrating how classroom equations/algorithms behave under edge-case loads.`,
      realWorldContext:
        subjectBridges[1]?.realWorldApplication ||
        subjectBridges[0]?.realWorldApplication ||
        'Real-world reliability verification',
      estimatedHours: Math.max(10, Math.round(profile.weeklyStudyHours * 1.5)),
      status: 'not-started',
      progressPercent: 0,
      milestones: [
        {
          id: `${semesterId}_proj_2_m1`,
          label: 'Set up baseline test cases matching university lab parameters',
          completed: false,
        },
        {
          id: `${semesterId}_proj_2_m2`,
          label: 'Execute stress-test scenarios and visualize output metrics',
          completed: false,
        },
        {
          id: `${semesterId}_proj_2_m3`,
          label: 'Publish clean README report with architecture diagram for placement portfolio',
          completed: false,
        },
      ],
    },
  ];

  // 6. Internships and Hackathons matched to BTech Year & Branch
  const opportunities: OpportunityItem[] = [
    {
      id: `${semesterId}_opp_1`,
      title: `${profile.branch} National Engineering Hackathon & Innovation Challenge`,
      type: 'Hackathon',
      eligibilityYear: `${academicYear} (${semesterName})`,
      timelineWindow: 'Mid-Semester Window (Weeks 5–8)',
      whyRelevant: `Tests rapid prototyping in ${primarySubject} and builds team defense experience for ${profile.careerGoal} interviews.`,
      requiredSkills: [
        ...(profile.knownSkills.slice(0, 2)),
        subjectBridges[0]?.industrySkillUnlocked || primarySubject,
      ].slice(0, 4),
      status: 'suggested',
    },
    {
      id: `${semesterId}_opp_2`,
      title:
        academicYear === '1st Year' || academicYear === '2nd Year'
          ? `Academic Research & Summer Lab Fellowship (${profile.branch} Track)`
          : `Pre-Placement Industrial Internship — ${profile.careerGoal}`,
      type: 'Internship',
      eligibilityYear: `${academicYear} BTech Students`,
      timelineWindow: 'End-of-Semester Break Application Window',
      whyRelevant: `Directly values strong fundamentals in ${subjects.slice(0, 2).join(', ')} and a documented semester project.`,
      requiredSkills: subjects.slice(0, 3),
      status: 'suggested',
    },
    {
      id: `${semesterId}_opp_3`,
      title: `Open-Source / Technical Society Engineering Sprint (${profile.branch})`,
      type: 'Research / Open-Source',
      eligibilityYear: `All BTech Years (${academicYear})`,
      timelineWindow: 'Rolling Throughout Semester',
      whyRelevant: `Demonstrates real-world code/design review habits alongside ${profile.weeklyStudyHours} hrs/week self-paced study.`,
      requiredSkills: [profile.careerGoal, primarySubject],
      status: 'suggested',
    },
  ];

  // 7. Placement Preparation Tasks for this Semester
  const placementTasks: PlacementTaskItem[] = [
    {
      id: `${semesterId}_place_1`,
      title: `Master top 15 core technical interview questions from ${primarySubject}`,
      category: 'Core Fundamentals',
      description: `Explain how ${primarySubject} concepts operate in real-world ${profile.careerGoal} systems rather than memorizing textbook definitions.`,
      completed: false,
    },
    {
      id: `${semesterId}_place_2`,
      title: `Dedicate ${Math.max(2, Math.round(profile.weeklyStudyHours * 0.25))} hrs/week to ${profile.branch} problem-solving & aptitude`,
      category: 'Problem Solving',
      description: 'Consistent weekly practice prevents 4th-year placement cramming.',
      completed: false,
    },
    {
      id: `${semesterId}_place_3`,
      title: `Write outcome-driven resume bullets for your ${semesterName} project`,
      category: 'Portfolio & Resume',
      description: `Document the problem, engineering mechanism, and measurable result for your ${profile.careerGoal} resume.`,
      completed: false,
    },
    {
      id: `${semesterId}_place_4`,
      title: `Conduct a 10-minute mock technical walkthrough of ${secondarySubject}`,
      category: 'Interview Readiness',
      description: 'Practice defending design trade-offs clearly as expected in technical placement panels.',
      completed: false,
    },
  ];

  const initialRecord: SemesterRecord = {
    semesterId,
    userId: profile.userId,
    semesterName,
    academicYear,
    branch: profile.branch,
    careerGoal: profile.careerGoal,
    weeklyStudyHours: profile.weeklyStudyHours,
    preferredLearningMethod: profile.preferredLearningMethod,
    subjects,
    status: 'active',
    progressPercent: 0,
    subjectBridges,
    monthlyPlans,
    weeklyPlans,
    skills,
    projects,
    opportunities,
    placementTasks,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  initialRecord.progressPercent = calculateSemesterProgress(initialRecord);
  return initialRecord;
}

/**
 * Rearranges incomplete weekly study blocks when a student misses a week due to
 * exams, illness, or lab deadlines, redistributing hours smoothly across remaining
 * incomplete weeks without deleting completed progress.
 */
export function rearrangeMissedTimetable(
  record: SemesterRecord,
  missedWeekNumber: number
): SemesterRecord {
  const updatedWeeks = record.weeklyPlans.map((week) => {
    if (week.weekNumber === missedWeekNumber && !week.isCompleted) {
      return {
        ...week,
        title: `[Rescheduled Flexibly] ${week.title.replace(/^\[Rescheduled Flexibly\]\s*/, '')}`,
        deliverableTask: `${week.deliverableTask} (Split across upcoming buffer slots so exam week stays stress-free)`,
        wasRearranged: true,
      };
    }
    if (week.weekNumber > missedWeekNumber && !week.isCompleted) {
      return {
        ...week,
        allocatedHours: Math.min(60, week.allocatedHours + 1),
        wasRearranged: true,
      };
    }
    return week;
  });

  const nextRecord: SemesterRecord = {
    ...record,
    weeklyPlans: updatedWeeks,
    updatedAt: new Date().toISOString(),
  };
  nextRecord.progressPercent = calculateSemesterProgress(nextRecord);
  return nextRecord;
}
