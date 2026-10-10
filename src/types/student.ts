/**
 * ============================================================================
 * FILE: src/types/student.ts
 * PURPOSE: Defines the data shapes (TypeScript interfaces) and fixed options
 *          used across PathPilot.
 *
 * WHY THIS FILE EXISTS (Beginner Concept — TypeScript Interfaces):
 * In a web application, data travels between multiple screens (from the
 * Onboarding Form -> to App.tsx -> to the Dashboard). Defining a strict
 * "contract" (Interface) here ensures every component agrees on the exact
 * property names and data types (string, number, array), preventing typos
 * and undefined bugs before the code even runs.
 * ============================================================================
 */

/**
 * The allowed BTech engineering branches as requested in the specification.
 * Using a TypeScript union type restricts values to only these exact strings.
 */
export type EngineeringBranch =
  | 'CSE'
  | 'IT'
  | 'ECE'
  | 'EEE'
  | 'Mechanical'
  | 'Civil'
  | 'Other';

/**
 * The 4 academic years of a standard BTech degree program.
 */
export type AcademicYear = '1st Year' | '2nd Year' | '3rd Year' | '4th Year';

/**
 * The 8 semesters of a standard BTech degree program.
 */
export type AcademicSemester =
  | 'Semester 1'
  | 'Semester 2'
  | 'Semester 3'
  | 'Semester 4'
  | 'Semester 5'
  | 'Semester 6'
  | 'Semester 7'
  | 'Semester 8';

/**
 * How the student prefers to learn new engineering concepts and skills.
 */
export type LearningMethod =
  | 'Hands-on Project Building'
  | 'Video Lectures & Visual Walkthroughs'
  | 'Documentation, Textbooks & Research Papers'
  | 'Interactive Coding & Lab Simulations'
  | 'Structured Peer Study & Problem Sets';

/**
 * StudentProfile represents the complete set of information collected
 * from the student during onboarding and displayed on the Dashboard.
 */
export interface StudentProfile {
  fullName: string;
  branch: EngineeringBranch;
  customBranchName?: string; // Used when branch === 'Other'
  currentYear: AcademicYear;
  currentSemester: AcademicSemester;
  currentSubjects: string[]; // Stored as an array of clean subject names
  careerGoal: string;
  knownSkills: string[]; // Can be empty if the student is a complete beginner
  weeklyStudyHours: number; // Number of hours available outside regular classes
  preferredLearningMethod: LearningMethod;
  updatedAt: string; // ISO date string showing when the profile was saved
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
 * Identifiers for the 7 required Dashboard navigation sections plus the
 * main 'overview' home screen of the dashboard.
 */
export type DashboardSectionId =
  | 'overview'
  | 'my-roadmap'
  | 'subject-applications'
  | 'skills'
  | 'projects'
  | 'internships-hackathons'
  | 'progress-tracker'
  | 'placement-prep';

/**
 * Metadata describing each of the 7 required navigation sections in the
 * Dashboard so we can render navigation items and section placeholders cleanly
 * without repeating code.
 */
export interface DashboardSectionMeta {
  id: DashboardSectionId;
  number: string;
  title: string;
  shortLabel: string;
  summary: string;
  plannedCapabilities: string[];
  dataInputsUsed: string[];
  futureInteractivePreview: string;
}

/**
 * Fixed list of engineering branches with full descriptive titles for the UI.
 */
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

/**
 * Helper mapping that suggests typical college subjects and career goals
 * based on the student's selected branch. This makes filling out the
 * onboarding form faster and more intuitive for students.
 */
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

/**
 * The 7 required dashboard navigation sections defined in the project specification.
 * In Version 1, each section renders a clear, honest architectural blueprint
 * showing how the student's onboarding inputs will power that module in upcoming versions.
 */
export const DASHBOARD_SECTIONS: DashboardSectionMeta[] = [
  {
    id: 'my-roadmap',
    number: '01',
    title: 'My Roadmap',
    shortLabel: 'My Roadmap',
    summary:
      'Year-by-year and semester-by-semester engineering action plan tailored to your branch, weekly study hours, and target career role.',
    plannedCapabilities: [
      'Semester milestone breakdown balancing university exams with career skill sprints',
      'Weekly study block allocator calibrated to your exact available hours per week',
      'Dynamic timetable rearrangement engine that reschedules missed study blocks automatically when college labs or exams overrun',
      'Learning-mode adaptation that prioritizes resources matching your preferred learning style',
    ],
    dataInputsUsed: ['Branch', 'Current Year & Semester', 'Available Study Hours/Week', 'Preferred Learning Method'],
    futureInteractivePreview:
      'In Version 2, this view will generate a week-by-week timeline with a "Missed a Week? Rearrange Timetable" action that redistributes unfinished topics across upcoming weeks without overloading exam weeks.',
  },
  {
    id: 'subject-applications',
    number: '02',
    title: 'Subject-to-Real-World Applications',
    shortLabel: 'Subject Bridge',
    summary:
      'PathPilot’s core differentiator: translating every theoretical syllabus unit you study in class into concrete industrial engineering systems.',
    plannedCapabilities: [
      'Direct mapping from each of your current semester subjects to real-world production hardware and software systems',
      'Why-It-Matters breakdown showing where formulas, theorems, and lab experiments appear in industry engineering interviews',
      'Interactive concept-to-application bridge cards linking syllabus theory to open-source tools and engineering workflows',
    ],
    dataInputsUsed: ['Current Academic Subjects', 'BTech Branch', 'Career Goal'],
    futureInteractivePreview:
      'In Version 2, clicking any of your entered subjects will expand unit-by-unit cards showing the exact industrial machinery, software architecture, or physical system built on top of that theory.',
  },
  {
    id: 'skills',
    number: '03',
    title: 'Skills',
    shortLabel: 'Skills Matrix',
    summary:
      'Gap analysis comparing the skills you already know against the core competencies required for your target engineering career goal.',
    plannedCapabilities: [
      'Three-tier skill tree: Foundation (Core Subject Linked), Applied Tooling, and Production Engineering',
      'Automatic filtering that marks your already-known skills as baseline and highlights high-impact next skills',
      'Curated study format recommendations aligned with your preferred learning method',
    ],
    dataInputsUsed: ['Skills Already Known', 'Career Goal', 'Preferred Learning Method'],
    futureInteractivePreview:
      'In Version 2, you will be able to toggle skill proficiency levels (Beginner -> Applied -> Project-Proven) and see which semester subject reinforces each technical skill.',
  },
  {
    id: 'projects',
    number: '04',
    title: 'Projects',
    shortLabel: 'Projects',
    summary:
      'Portfolio-grade engineering project blueprints that combine your current semester subjects with industry-standard tools.',
    plannedCapabilities: [
      'Subject-integrated project briefs so your semester mini-project doubles as a standout resume asset',
      'Architecture milestones, hardware/software bill of materials, and realistic completion time estimates',
      'Evaluation rubric showing how to document engineering trade-offs rather than just copying tutorial code',
    ],
    dataInputsUsed: ['Current Academic Subjects', 'Skills Already Known', 'Available Study Hours/Week'],
    futureInteractivePreview:
      'In Version 2, this module will unlock step-by-step project workspaces scoped to your weekly hour budget and linked directly to the subjects you are taking this semester.',
  },
  {
    id: 'internships-hackathons',
    number: '05',
    title: 'Internships and Hackathons',
    shortLabel: 'Internships & Hackathons',
    summary:
      'Year-appropriate research internships, industrial training programs, technical competitions, and open-source fellowships.',
    plannedCapabilities: [
      'Eligibility filter matched to your current BTech year (1st/2nd year exploration vs. 3rd/4th year pre-placement internships)',
      'Application window timeline so you never miss academic research fellowships, PSU/core internships, or major hackathons',
      'Readiness checklist mapping required skills before you submit an application',
    ],
    dataInputsUsed: ['BTech Branch', 'Current Year', 'Career Goal', 'Skills Already Known'],
    futureInteractivePreview:
      'In Version 2, this view will organize upcoming opportunities by preparation lead-time and readiness match for your specific engineering branch and year.',
  },
  {
    id: 'progress-tracker',
    number: '06',
    title: 'Progress Tracker',
    shortLabel: 'Progress & Timetable',
    summary:
      'Weekly consistency tracker and adaptive timetable scheduler that helps you recover smoothly when mid-sems or lab submissions disrupt your plan.',
    plannedCapabilities: [
      'Weekly planned hours vs. completed hours log with realistic pace indicators',
      'One-click "Rearrange Missed Schedule" calculator that re-balances backlog tasks across future weeks',
      'Subject concept mastery log connected to your project and skill milestones',
    ],
    dataInputsUsed: ['Available Study Hours/Week', 'Current Semester', 'Current Academic Subjects'],
    futureInteractivePreview:
      'In Version 2, you will log weekly hours here and trigger the Adaptive Timetable Rearranger whenever exams, illness, or college events cause you to miss planned sessions.',
  },
  {
    id: 'placement-prep',
    number: '07',
    title: 'Placement Preparation',
    shortLabel: 'Placement Prep',
    summary:
      'Year-by-year placement readiness covering core technical fundamentals, problem solving, system/domain design, and project defense.',
    plannedCapabilities: [
      'Stage-gated preparation plan appropriate for your current BTech year (no 4th-year panic cramming)',
      'Core subject interview question bank tied directly to the academic subjects you have completed',
      'Resume bullet synthesizer that frames your academic labs and projects around measurable engineering outcomes',
    ],
    dataInputsUsed: ['Current Year & Semester', 'BTech Branch', 'Career Goal', 'Current Academic Subjects'],
    futureInteractivePreview:
      'In Version 2, this section will unlock branch-specific technical interview readiness tracks, core subject revision sheets, and project storytelling checklists.',
  },
];
