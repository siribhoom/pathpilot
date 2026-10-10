/**
 * ============================================================================
 * FILE: src/types/student.ts
 * PURPOSE: Defines the data shapes (TypeScript interfaces) and fixed options
 *          used across PathPilot for persistent student profiles, semester-wise
 *          roadmaps, skills, projects, opportunities, and progress tracking.
 *
 * WHY THIS FILE EXISTS (Beginner Concept — TypeScript Interfaces):
 * In a web application, data travels between multiple screens and database
 * collections (from Onboarding -> Storage Service -> Dashboard sections).
 * Defining strict TypeScript interfaces ensures every component and database
 * operation agrees on exact property names and data types.
 * ============================================================================
 */

export type EngineeringBranch =
  | 'CSE'
  | 'IT'
  | 'ECE'
  | 'EEE'
  | 'Mechanical'
  | 'Civil'
  | 'Other';

export type AcademicYear = '1st Year' | '2nd Year' | '3rd Year' | '4th Year';

export type AcademicSemester =
  | 'Semester 1'
  | 'Semester 2'
  | 'Semester 3'
  | 'Semester 4'
  | 'Semester 5'
  | 'Semester 6'
  | 'Semester 7'
  | 'Semester 8';

export type LearningMethod =
  | 'Hands-on Project Building'
  | 'Video Lectures & Visual Walkthroughs'
  | 'Documentation, Textbooks & Research Papers'
  | 'Interactive Coding & Lab Simulations'
  | 'Structured Peer Study & Problem Sets';

/**
 * StudentProfile represents the persistent profile of a student.
 * Includes `userId` to uniquely identify and isolate each student's records.
 */
export interface StudentProfile {
  userId: string;
  fullName: string;
  branch: EngineeringBranch;
  customBranchName: string; // Empty string '' when branch !== 'Other'
  currentYear: AcademicYear;
  currentSemester: AcademicSemester;
  currentSubjects: string[];
  careerGoal: string;
  knownSkills: string[];
  weeklyStudyHours: number;
  preferredLearningMethod: LearningMethod;
  createdAt: string;
  updatedAt: string;
}

/**
 * ValidationErrors stores human-readable error messages for any form field
 * that fails validation. If a field has no error, its key is undefined.
 */
export interface ValidationErrors {
  fullName?: string;
  branch?: string;
  customBranchName?: string;
  currentYear?: string;
  currentSemester?: string;
  currentSubjects?: string;
  careerGoal?: string;
  weeklyStudyHours?: string;
  preferredLearningMethod?: string;
}

/**
 * Connects one academic subject from the student's semester syllabus to a
 * real-world engineering application and career skill.
 */
export interface SubjectBridgeItem {
  id: string;
  subjectName: string;
  classroomConcepts: string;
  realWorldApplication: string;
  industrySkillUnlocked: string;
  studyResourceFormat: string;
  isExplored: boolean;
  practicalSkillOrTool?: string;
  practicalExercise?: string;
}

/**
 * Represents one of the 4 monthly phases within a 16-week engineering semester.
 */
export interface MonthlyPlanItem {
  id: string;
  monthNumber: number;
  title: string;
  focusSummary: string;
  targetOutcome: string;
  isCompleted: boolean;
}

/**
 * Represents a weekly study block in the student's semester roadmap.
 */
export interface WeeklyPlanItem {
  id: string;
  weekNumber: number;
  title: string;
  subjectLinked: string;
  allocatedHours: number;
  deliverableTask: string;
  learningResource: string;
  isCompleted: boolean;
  wasRearranged: boolean;
}

/**
 * Represents a technical skill and its curated learning resource for a semester.
 */
export interface SkillResourceItem {
  id: string;
  skillName: string;
  category: 'Baseline Known' | 'Subject-Linked Core' | 'Career Target Skill';
  linkedSubject: string;
  resourceTitle: string;
  resourceType: string;
  estimatedHours: number;
  status: 'planned' | 'in-progress' | 'mastered';
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  resourceLink?: string;
  practiceTask?: string;
}

/**
 * Represents an engineering project and its milestone checklist for a semester.
 */
export interface ProjectItem {
  id: string;
  title: string;
  linkedSubjects: string[];
  targetSkill: string;
  problemStatement: string;
  realWorldContext: string;
  estimatedHours: number;
  status: 'not-started' | 'in-progress' | 'completed';
  progressPercent: number;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  suggestedTools?: string[];
  expectedOutcome?: string;
  milestones: {
    id: string;
    label: string;
    completed: boolean;
  }[];
}

/**
 * Represents an internship, hackathon, or fellowship opportunity for the semester.
 */
export interface OpportunityItem {
  id: string;
  title: string;
  type: 'Internship' | 'Hackathon' | 'Research / Open-Source';
  eligibilityYear: string;
  timelineWindow: string;
  whyRelevant: string;
  requiredSkills: string[];
  status: 'suggested' | 'saved' | 'applied' | 'completed';
  sourceLink?: string;
  isCuratedSample?: boolean;
}

/**
 * Represents a year-appropriate placement preparation task for the semester.
 */
export interface PlacementTaskItem {
  id: string;
  title: string;
  category: 'Core Fundamentals' | 'Problem Solving' | 'Portfolio & Resume' | 'Interview Readiness';
  description: string;
  completed: boolean;
}

/**
 * SemesterRecord holds ALL generated and saved recommendations, tasks, skills,
 * projects, opportunities, and progress for one specific semester (e.g., Semester 3).
 *
 * Organizing everything inside a per-semester record allows the student to:
 * 1. View their current semester
 * 2. Revisit any previous semester without losing data
 * 3. Mark a semester complete
 * 4. Start a new semester while keeping all previous semester records intact
 */
export interface SemesterRecord {
  semesterId: string; // e.g. 'sem_1', 'sem_2', ..., 'sem_8'
  userId: string;
  semesterName: AcademicSemester;
  academicYear: AcademicYear;
  branch: EngineeringBranch;
  careerGoal: string;
  weeklyStudyHours: number;
  preferredLearningMethod: LearningMethod;
  subjects: string[];
  status: 'active' | 'completed';
  progressPercent: number;
  subjectBridges: SubjectBridgeItem[];
  monthlyPlans: MonthlyPlanItem[];
  weeklyPlans: WeeklyPlanItem[];
  skills: SkillResourceItem[];
  projects: ProjectItem[];
  opportunities: OpportunityItem[];
  placementTasks: PlacementTaskItem[];
  threeMonthMilestone?: {
    title: string;
    targetSkills: string[];
    outcome: string;
    isCompleted?: boolean;
  };
  roadmapOverview?: {
    currentLevel: string;
    careerGoal: string;
    learningSequence: string[];
    careerReadinessNote: string;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Identifiers for the 6 separated Dashboard sections requested in Requirement 5:
 * - My Profile
 * - My Roadmap
 * - My Skills
 * - My Projects
 * - My Opportunities
 * - My Progress
 */
export type DashboardSectionId =
  | 'my-profile'
  | 'my-roadmap'
  | 'my-skills'
  | 'my-projects'
  | 'my-opportunities'
  | 'my-progress';

export interface DashboardSectionNavMeta {
  id: DashboardSectionId;
  number: string;
  title: string;
  description: string;
}

export const DASHBOARD_NAVIGATION_SECTIONS: DashboardSectionNavMeta[] = [
  {
    id: 'my-profile',
    number: '01',
    title: 'My Profile',
    description: 'Your saved academic profile, edit controls, semester switcher, and completed history across previous semesters.',
  },
  {
    id: 'my-roadmap',
    number: '02',
    title: 'My Roadmap',
    description: 'Semester-wise Subject-to-Real-World bridges, monthly milestones, and weekly study plan.',
  },
  {
    id: 'my-skills',
    number: '03',
    title: 'My Skills',
    description: 'Baseline known skills, target engineering skills, and learning resources matched to your study preference.',
  },
  {
    id: 'my-projects',
    number: '04',
    title: 'My Projects',
    description: 'Portfolio projects connecting your current semester subjects to your target career field.',
  },
  {
    id: 'my-opportunities',
    number: '05',
    title: 'My Opportunities',
    description: 'Year-matched internships, hackathons, technical competitions, and placement preparation tasks.',
  },
  {
    id: 'my-progress',
    number: '06',
    title: 'My Progress',
    description: 'Completion analytics, milestone tracker, and adaptive timetable rearrangement for missed weeks.',
  },
];

export const BRANCH_OPTIONS: { value: EngineeringBranch; label: string; coreFocus: string }[] = [
  { value: 'CSE', label: 'CSE — Computer Science & Engineering', coreFocus: 'Algorithms, Systems, AI & Full-Stack Software' },
  { value: 'IT', label: 'IT — Information Technology', coreFocus: 'Cloud Infrastructure, Web Systems, Networks & Security' },
  { value: 'ECE', label: 'ECE — Electronics & Communication', coreFocus: 'VLSI, Embedded Systems, Signal Processing & IoT' },
  { value: 'EEE', label: 'EEE — Electrical & Electronics', coreFocus: 'Power Electronics, Control Systems, EV & Smart Grids' },
  { value: 'Mechanical', label: 'Mechanical Engineering', coreFocus: 'CAD/CAE, Thermodynamics, Robotics & Manufacturing' },
  { value: 'Civil', label: 'Civil Engineering', coreFocus: 'Structural Analysis, BIM, Geotechnical & Smart Infrastructure' },
  { value: 'Other', label: 'Other BTech Specialization', coreFocus: 'Chemical, Biotechnology, Aerospace, Metallurgy, etc.' },
];

export const YEAR_OPTIONS: AcademicYear[] = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

export const SEMESTER_OPTIONS: AcademicSemester[] = [
  'Semester 1',
  'Semester 2',
  'Semester 3',
  'Semester 4',
  'Semester 5',
  'Semester 6',
  'Semester 7',
  'Semester 8',
];

export const LEARNING_METHOD_OPTIONS: LearningMethod[] = [
  'Hands-on Project Building',
  'Video Lectures & Visual Walkthroughs',
  'Documentation, Textbooks & Research Papers',
  'Interactive Coding & Lab Simulations',
  'Structured Peer Study & Problem Sets',
];

export const BRANCH_SUGGESTIONS: Record<
  EngineeringBranch,
  {
    subjects: string[];
    careerGoals: string[];
    sampleBridge: {
      subject: string;
      classroomConcept: string;
      realWorldSystem: string;
      industrySkill: string;
    };
  }
> = {
  CSE: {
    subjects: [
      'Data Structures & Algorithms',
      'Operating Systems',
      'Database Management Systems',
      'Computer Networks',
      'Object-Oriented Programming',
      'Discrete Mathematics',
    ],
    careerGoals: [
      'Full-Stack Software Engineer',
      'Backend & Distributed Systems Engineer',
      'Machine Learning & AI Engineer',
      'Cloud & DevOps Engineer',
    ],
    sampleBridge: {
      subject: 'Data Structures & Algorithms',
      classroomConcept: 'B-Trees, Hash Tables & Graph Traversal',
      realWorldSystem: 'Database Query Indexing & Route Optimization Engines',
      industrySkill: 'High-Throughput Backend API & Storage Architecture',
    },
  },
  IT: {
    subjects: [
      'Web Technologies',
      'Database Management Systems',
      'Computer Networks & Security',
      'Software Engineering',
      'Cloud Computing',
      'Data Structures',
    ],
    careerGoals: [
      'Cloud Solutions Architect',
      'Full-Stack Web Developer',
      'Cybersecurity & Network Engineer',
      'Site Reliability Engineer (SRE)',
    ],
    sampleBridge: {
      subject: 'Computer Networks & Security',
      classroomConcept: 'TCP/IP Handshakes, DNS Resolution & TLS Encryption',
      realWorldSystem: 'Zero-Trust API Gateways & Global Content Delivery Networks',
      industrySkill: 'Cloud Networking, Load Balancing & Security Auditing',
    },
  },
  ECE: {
    subjects: [
      'Digital Logic Design',
      'Microprocessors & Microcontrollers',
      'Signals & Systems',
      'VLSI Design',
      'Analog Electronic Circuits',
      'Communication Systems',
    ],
    careerGoals: [
      'Embedded Firmware Engineer',
      'VLSI / RTL Design Engineer',
      'IoT & Edge Hardware Architect',
      'Wireless DSP Engineer',
    ],
    sampleBridge: {
      subject: 'Microprocessors & Microcontrollers',
      classroomConcept: 'Interrupt Service Routines, Timers & UART/SPI Registers',
      realWorldSystem: 'Real-Time Automotive Sensor Fusion & Medical Wearables',
      industrySkill: 'Embedded C/Rust, RTOS Scheduling & Logic Analyzer Debugging',
    },
  },
  EEE: {
    subjects: [
      'Power Electronics',
      'Control Systems Engineering',
      'Electrical Machines',
      'Power Systems Analysis',
      'Linear Integrated Circuits',
      'Measurements & Instrumentation',
    ],
    careerGoals: [
      'EV Powertrain & Battery Management Engineer',
      'Control & Automation Systems Engineer',
      'Renewable Smart Grid Engineer',
      'Embedded Power Hardware Engineer',
    ],
    sampleBridge: {
      subject: 'Control Systems Engineering',
      classroomConcept: 'PID Controllers, Bode Plots & State-Space Stability',
      realWorldSystem: 'Electric Vehicle Traction Control & Drone Flight Stabilizers',
      industrySkill: 'MATLAB/Simulink Modeling & Closed-Loop Hardware Testing',
    },
  },
  Mechanical: {
    subjects: [
      'Engineering Thermodynamics',
      'Fluid Mechanics',
      'Strength of Materials',
      'Kinematics & Dynamics of Machines',
      'Heat & Mass Transfer',
      'CAD/CAM & Manufacturing Processes',
    ],
    careerGoals: [
      'Robotics & Mechatronics Engineer',
      'Automotive Thermal & CFD Engineer',
      'Product Design & FEA Simulation Engineer',
      'Advanced Manufacturing & Supply Chain Engineer',
    ],
    sampleBridge: {
      subject: 'Heat & Mass Transfer',
      classroomConcept: 'Convection Coefficients, Fin Efficiency & Conduction Equations',
      realWorldSystem: 'EV Battery Pack Liquid Cooling Plates & Data Center Thermal Racks',
      industrySkill: 'ANSYS Fluent CFD Simulation & Thermal Design Optimization',
    },
  },
  Civil: {
    subjects: [
      'Structural Analysis',
      'Strength of Materials',
      'Geotechnical Engineering',
      'Reinforced Concrete Design',
      'Fluid Mechanics & Hydraulics',
      'Surveying & Geomatics',
    ],
    careerGoals: [
      'Structural Design & BIM Engineer',
      'Smart Urban Infrastructure Planner',
      'Geotechnical & Foundation Specialist',
      'Construction Project Management Engineer',
    ],
    sampleBridge: {
      subject: 'Structural Analysis',
      classroomConcept: 'Bending Moment Diagrams, Shear Force & Truss Deflection',
      realWorldSystem: 'Seismic-Resilient Metro Viaducts & High-Rise Wind Bracing',
      industrySkill: 'STAAD.Pro / ETABS Structural Modeling & Eurocode/IS Compliance',
    },
  },
  Other: {
    subjects: [
      'Engineering Mathematics',
      'Process Calculations & Thermodynamics',
      'Materials Science & Engineering',
      'Numerical Methods & Programming',
      'System Modeling & Simulation',
    ],
    careerGoals: [
      'R&D Systems Engineer',
      'Computational Modeling & Data Analyst',
      'Process & Operations Engineer',
      'Interdisciplinary Product Engineer',
    ],
    sampleBridge: {
      subject: 'Numerical Methods & System Modeling',
      classroomConcept: 'Differential Equations, Matrix Solvers & Error Convergence',
      realWorldSystem: 'Bioreactor Yield Simulation & Aerospace Trajectory Optimization',
      industrySkill: 'Python Scientific Computing (NumPy/SciPy) & Digital Twins',
    },
  },
};
