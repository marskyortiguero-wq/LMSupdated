const pageTitle = document.getElementById('pageTitle');
const sidebar = document.getElementById('sidebar');
const menuButton = document.getElementById('menuButton');
const toast = document.getElementById('toast');
const yearSelector = document.getElementById('yearSelector');
const pageContainer = document.getElementById('pageContainer');
const authScreen = document.getElementById('authScreen');
const appShell = document.getElementById('appShell');
const loginForm = document.getElementById('loginForm');
const overviewMarkup = pageContainer.innerHTML;

const viewNames = {
  overview: 'Dashboard',
  'learning-arc': 'CIT Learning Arc',
  courses: 'My classrooms',
  catalog: 'Find classrooms',
  requests: 'Join requests',
  syllabus: 'Syllabus',
  settings: 'Settings',
  assignments: 'Assignments',
  gradebook: 'Gradebook',
  departments: 'Departments',
  reports: 'Reports',
  users: 'User management',
  announcements: 'Announcements'
};

const roleNavigation = {
  student: [['overview', '⌂', 'Dashboard'], ['catalog', '＋', 'Find classrooms'], ['courses', '▦', 'My classrooms'], ['syllabus', '☷', 'Syllabus'], ['learning-arc', '✦', 'Explore learning']],
  instructor: [['overview', '⌂', 'Dashboard'], ['courses', '▦', 'My classrooms'], ['requests', '↗', 'Join requests'], ['assignments', '✓', 'Assignments'], ['gradebook', '≋', 'Gradebook'], ['announcements', '◉', 'Announcements']],
  dean: [['overview', '⌂', 'Dashboard'], ['departments', '▤', 'Departments'], ['courses', '▦', 'Courses'], ['reports', '↗', 'Reports'], ['announcements', '◉', 'Announcements']],
  admin: [['overview', '⌂', 'Dashboard'], ['users', '◎', 'Users'], ['courses', '▦', 'Courses'], ['reports', '↗', 'Reports'], ['announcements', '◉', 'Announcements']]
};

let toastTimer;
let showingOpenTasks = false;
let activeCourse = null;
let activeCourseYear = '';
let authToken = '';
let classroomCache = [];
let activeView = 'learning-arc';
let showClassroomFormOnLoad = false;

function updateYearLevel(year) {
  document.querySelectorAll('.year-badge').forEach((badge) => {
    badge.textContent = year;
    badge.className = `year-badge year-${year.charAt(0)}`;
  });
  document.querySelectorAll('.module-header .eyebrow, .view-toolbar strong, .syllabus-banner p, .syllabus-subject small, .arc-track small').forEach((element) => {
    element.textContent = element.textContent.replace(/[1-4](st|nd|rd|th) Year/g, year);
  });
}
const viewMarkup = {
  'learning-arc': `<section class="arc-hero"><div class="arc-hero-copy"><p class="eyebrow">CIT LEARNING ARC · COMPUTER INDUSTRIAL TECHNOLOGY</p><h1>Learn the craft.<br><em>Build what matters.</em></h1><p>One focused learning space for the people who design, build, troubleshoot, and improve the technologies around us.</p><div class="arc-hero-actions"><button class="primary-button" data-action="explore">Explore learning paths <span>→</span></button><button class="arc-quiet-button" data-view="courses">View my courses</button></div></div><div class="arc-hero-visual"><span class="arc-orbit orbit-one"></span><span class="arc-orbit orbit-two"></span><div class="arc-core"><span>01</span><strong>MAKE<br>IT<br>REAL</strong></div><div class="arc-float float-top">♧ <small>Hands-on modules</small></div><div class="arc-float float-bottom">✦ <small>Built for CIT learners</small></div></div></section><section class="arc-intro"><div><p class="eyebrow">A LEARNING SYSTEM FOR THE WORK AHEAD</p><h2>From first concept<br>to finished system.</h2></div><p>Move through practical tracks that connect classroom knowledge to the tools, decisions, and problem-solving habits of modern industrial technology.</p></section><section class="arc-capabilities"><article><span class="arc-cap-icon coral-icon">◒</span><p class="eyebrow">01 · DISCOVER</p><h3>Learn in the flow</h3><p>Short lessons, guided examples, and quick checks keep every module close to the work.</p><button class="arc-link" data-action="discover">Explore modules →</button></article><article><span class="arc-cap-icon blue-icon">⌁</span><p class="eyebrow">02 · PRACTICE</p><h3>Build through doing</h3><p>Turn concepts into interfaces, databases, networks, and working prototypes.</p><button class="arc-link" data-action="practice">Open practice lab →</button></article><article><span class="arc-cap-icon lime-icon">↗</span><p class="eyebrow">03 · PROGRESS</p><h3>See your momentum</h3><p>Track your year level, skill progress, tasks, and the next step in your learning arc.</p><button class="arc-link" data-view="grades">View progress →</button></article></section><section class="arc-paths"><div class="arc-section-heading"><div><p class="eyebrow">YOUR LEARNING PATHS</p><h2>Choose your next build.</h2></div><button class="arc-link" data-view="courses">See all paths →</button></div><div class="arc-track-grid"><button class="arc-track track-coral" data-action="track"><span>01</span><strong>Web &amp; Interface<br>Development</strong><small>2nd Year · 8 modules</small><b>72% <i style="width:72%"></i></b></button><button class="arc-track track-navy" data-action="track"><span>02</span><strong>Data &amp; Database<br>Systems</strong><small>2nd Year · 10 modules</small><b>48% <i style="width:48%"></i></b></button><button class="arc-track track-lime" data-action="track"><span>03</span><strong>Networks &amp;<br>Infrastructure</strong><small>2nd Year · 9 modules</small><b>84% <i style="width:84%"></i></b></button></div></section><section class="arc-bottom-line"><strong>CIT Learning Arc</strong><span>Computer Industrial Technology · First Semester 2026–2027</span><button class="arc-link" data-view="syllabus">Open syllabus →</button></section>`,
  syllabus: `<section class="view-header"><div><p class="eyebrow">ACADEMIC GUIDE</p><h1>Syllabus</h1><p class="subtitle">Your semester guide for subjects, outcomes, and course requirements.</p></div><button class="primary-button" data-action="download">↓ <span>Download PDF</span></button></section><section class="syllabus-banner"><div class="course-color coral"><span>BSIT</span></div><div><span class="course-code">FIRST SEMESTER 2026–2027</span><h2>Bachelor of Science in Information Technology</h2><p>College of Industrial Technology · 2nd Year · 21 academic units</p></div></section><div class="syllabus-grid"><section class="panel syllabus-subjects"><div class="panel-heading"><h2>Course subjects</h2><span class="course-code">4 subjects</span></div><div class="syllabus-subject"><span class="subject-number">01</span><div><strong>IT 204 · Web Development</strong><small>2nd Year · 3 units · Prof. Maria Santos</small></div><span class="subject-status complete">72%</span></div><div class="syllabus-subject"><span class="subject-number">02</span><div><strong>IT 206 · Database Management</strong><small>2nd Year · 3 units · Prof. Carlo Reyes</small></div><span class="subject-status progress">48%</span></div><div class="syllabus-subject"><span class="subject-number">03</span><div><strong>IT 208 · Computer Networking</strong><small>2nd Year · 3 units · Prof. Anna Lim</small></div><span class="subject-status complete">84%</span></div><div class="syllabus-subject"><span class="subject-number">04</span><div><strong>IT 210 · Human-Computer Interaction</strong><small>2nd Year · 3 units · Prof. Leo Garcia</small></div><span class="subject-status progress">63%</span></div></section><section class="panel outcomes-panel"><div class="panel-heading"><h2>Learning outcomes</h2></div><ol><li>Design and develop responsive information systems.</li><li>Apply database concepts to practical technology solutions.</li><li>Configure and troubleshoot basic network environments.</li><li>Evaluate user experience and accessibility in digital products.</li></ol></section></div><section class="panel grading-panel"><div class="panel-heading"><h2>Grading breakdown</h2><span class="course-code">All subjects</span></div><div class="grading-bars"><div><span>Activities & exercises</span><b>20%</b><i style="width:20%"></i></div><div><span>Projects & practical work</span><b>35%</b><i style="width:35%"></i></div><div><span>Quizzes & examinations</span><b>30%</b><i style="width:30%"></i></div><div><span>Participation & attendance</span><b>15%</b><i style="width:15%"></i></div></div></section>`,
  courses: `<section class="view-header"><div><p class="eyebrow">ACADEMIC WORKSPACE</p><h1>My courses</h1><p class="subtitle">Track your enrolled subjects and continue where you left off.</p></div><button class="primary-button" data-action="browse">+ <span>Browse courses</span></button></section><section class="view-toolbar"><strong>Current semester · 2nd Year</strong><button class="filter-button">First Semester 2026–2027 <span>⌄</span></button></section><div class="course-view-grid"><article class="large-course-card"><div class="course-color coral"><span>WD</span></div><div><span class="course-code">IT 204</span><span class="year-badge year-2">2nd Year</span><h2>Web Development</h2><p>Prof. Maria Santos · 8 learning modules</p><div class="progress-line"><i style="width:72%"></i></div><small>72% complete · Next: Responsive layouts</small></div><button class="arrow-button" data-action="course">↗</button></article><article class="large-course-card"><div class="course-color navy"><span>DB</span></div><div><span class="course-code">IT 206</span><span class="year-badge year-2">2nd Year</span><h2>Database Management</h2><p>Prof. Carlo Reyes · 10 learning modules</p><div class="progress-line"><i style="width:48%"></i></div><small>48% complete · Next: SQL normalization</small></div><button class="arrow-button" data-action="course">↗</button></article><article class="large-course-card"><div class="course-color lime"><span>NW</span></div><div><span class="course-code">IT 208</span><span class="year-badge year-2">2nd Year</span><h2>Computer Networking</h2><p>Prof. Anna Lim · 9 learning modules</p><div class="progress-line"><i style="width:84%"></i></div><small>84% complete · Next: Practical quiz</small></div><button class="arrow-button" data-action="course">↗</button></article><article class="large-course-card"><div class="course-color" style="background:#fff0c9;color:#ad8d37"><span>UI</span></div><div><span class="course-code">IT 210</span><span class="year-badge year-2">2nd Year</span><h2>Human-Computer Interaction</h2><p>Prof. Leo Garcia · 7 learning modules</p><div class="progress-line"><i style="width:63%;background:var(--yellow)"></i></div><small>63% complete · Next: Usability testing</small></div><button class="arrow-button" data-action="course">↗</button></article></div>`,
  calendar: `<section class="view-header"><div><p class="eyebrow">PLAN YOUR WEEK</p><h1>Calendar</h1><p class="subtitle">Classes, deadlines, and CIT activities in one place.</p></div><button class="primary-button" data-action="schedule">+ <span>Add event</span></button></section><section class="calendar-panel"><div class="calendar-top"><button class="filter-button">‹ &nbsp; September 2026 &nbsp; ›</button><div class="calendar-legend"><span><i class="legend-dot coral-dot"></i>Class</span><span><i class="legend-dot blue-dot"></i>Deadline</span><span><i class="legend-dot lime-dot"></i>Activity</span></div></div><div class="calendar-week"><span>MON<br><b>28</b></span><span>TUE<br><b>29</b></span><span class="today">WED<br><b>30</b></span><span>THU<br><b>01</b></span><span>FRI<br><b>02</b></span><span>SAT<br><b>03</b></span><span>SUN<br><b>04</b></span></div><div class="calendar-events"><div class="calendar-event coral-event"><b>09:00</b><strong>Web Development</strong><small>Room ICT-302 · Lecture</small></div><div class="calendar-event blue-event"><b>13:30</b><strong>Database Management</strong><small>Room ICT-205 · Laboratory</small></div><div class="calendar-event lime-event"><b>16:00</b><strong>Student consultation hour</strong><small>CIT Learning Hub</small></div></div></section>`,
  grades: `<section class="view-header"><div><p class="eyebrow">ACADEMIC PERFORMANCE</p><h1>Grades</h1><p class="subtitle">Your current standing for the first semester.</p></div><button class="filter-button">First Semester 2026–2027 <span>⌄</span></button></section><section class="grade-summary"><div><span>Current average</span><strong>1.62</strong><small>Equivalent: Very good</small></div><div><span>Units completed</span><strong>12 / 21</strong><small>57% of semester load</small></div><div><span>Attendance</span><strong>94%</strong><small>Excellent standing</small></div></section><section class="panel grade-panel"><div class="panel-heading"><h2>Subject performance</h2><span class="course-code">Updated Sept 26</span></div><div class="grade-row"><strong>IT 204 · Web Development</strong><span>1.50</span><i style="width:88%"></i></div><div class="grade-row"><strong>IT 206 · Database Management</strong><span>1.75</span><i style="width:81%"></i></div><div class="grade-row"><strong>IT 208 · Computer Networking</strong><span>1.50</span><i style="width:86%"></i></div><div class="grade-row"><strong>IT 210 · Human-Computer Interaction</strong><span>1.75</span><i style="width:78%"></i></div></section>`,
  announcements: `<section class="view-header"><div><p class="eyebrow">STAY INFORMED</p><h1>Announcements</h1><p class="subtitle">Important updates from CIT offices, faculty, and student organizations.</p></div><button class="filter-button">All announcements <span>⌄</span></button></section><section class="panel announcements-page"><article class="announcement full-announcement"><span class="announcement-dot coral-dot"></span><div><strong>Midterm examination schedule</strong><p>The official schedule is now available. Please review your assigned room and examination policy before exam week.</p><time>Academic Office · 2 hours ago</time></div></article><article class="announcement full-announcement"><span class="announcement-dot blue-dot"></span><div><strong>Lab access hours updated</strong><p>ICT laboratories are open until 8:00 PM on weekdays during project submission season.</p><time>CIT Laboratory · Yesterday</time></div></article><article class="announcement full-announcement"><span class="announcement-dot lime-dot"></span><div><strong>Tech week registration is open</strong><p>Join the workshops, competitions, and industry talks prepared for this year's CIT Tech Week.</p><time>Student Affairs · Sep 25, 2026</time></div></article></section>`,
  messages: `<section class="view-header"><div><p class="eyebrow">CIT COMMUNITY</p><h1>Messages</h1><p class="subtitle">Connect with your instructors and classmates.</p></div><button class="primary-button" data-action="message">+ <span>New message</span></button></section><section class="panel message-list"><div class="message-row"><div class="avatar">MS</div><div><strong>Prof. Maria Santos</strong><p>Your portfolio outline looks good. Please add the accessibility checklist.</p></div><time>10:42 AM</time></div><div class="message-row"><div class="avatar" style="background:#789bc2">CR</div><div><strong>Prof. Carlo Reyes</strong><p>Reminder: SQL exercises are due this Friday.</p></div><time>Yesterday</time></div><div class="message-row"><div class="avatar" style="background:#9db270">AL</div><div><strong>Prof. Anna Lim</strong><p>The subnetting practical quiz has been posted.</p></div><time>Sep 26</time></div></section>`,
  settings: `<section class="view-header"><div><p class="eyebrow">PERSONALIZE YOUR HUB</p><h1>Settings</h1><p class="subtitle">Manage your profile, notifications, and learning preferences.</p></div><button class="primary-button" data-action="save">Save changes</button></section><section class="settings-grid"><section class="panel settings-card"><h2>Profile information</h2><label>Full name<input value="Juan Dela Cruz"></label><label>Student number<input value="2024-01482"></label><label>Program<input value="BS Information Technology"></label></section><section class="panel settings-card"><h2>Notifications</h2><label class="toggle-row">Assignment reminders <input type="checkbox" checked><i></i></label><label class="toggle-row">Course announcements <input type="checkbox" checked><i></i></label><label class="toggle-row">Message alerts <input type="checkbox" checked><i></i></label></section></section>`
};

const dashboardData = {
  student: {
    description: 'Continue your classes, check deadlines, and keep your learning moving.',
    action: 'browse', actionLabel: 'Find a classroom',
    stats: [['Enrolled classes', '0', 'approved classrooms'], ['Overall progress', '—', 'join a class to begin'], ['Due this week', '0', 'class assignments'], ['Join requests', '0', 'awaiting approval']],
    classesTitle: 'Your classes', classesEyebrow: 'MY LEARNING',
    activityTitle: 'Upcoming work', activityEyebrow: 'NEXT DEADLINES', linkView: 'syllabus', linkLabel: 'Open syllabus',
    activities: []
  },
  instructor: {
    description: 'Manage your classes, review submissions, and keep students on track.',
    action: 'show-classroom-form', actionLabel: '＋ Create classroom',
    stats: [['My classrooms', '0', 'created by you'], ['Join requests', '0', 'awaiting your review'], ['Students', '0', 'approved memberships'], ['Assignments', '0', 'across your classes']],
    classesTitle: 'Classes you teach', classesEyebrow: 'TEACHING SPACE',
    activityTitle: 'Needs your attention', activityEyebrow: 'REVIEW QUEUE', linkView: 'gradebook', linkLabel: 'Open gradebook',
    activities: []
  },
  dean: {
    description: 'Review department activity, course coverage, and academic progress.',
    action: 'export-report', actionLabel: '↓ Export overview',
    stats: [['Programs', '05', 'active programs'], ['Courses', '42', 'this academic year'], ['Faculty', '48', 'teaching staff'], ['Students', '1,248', 'across departments']],
    classesTitle: 'Academic activity', classesEyebrow: 'COLLEGE OVERVIEW',
    activityTitle: 'Department pulse', activityEyebrow: 'AT A GLANCE', linkView: 'reports', linkLabel: 'View reports',
    activities: [['Information Technology', 'Course completion', 'On track'], ['Electronics Technology', 'Faculty submissions', 'Needs review'], ['Computer Technology', 'Attendance reporting', 'Updated today']]
  },
  admin: {
    description: 'Manage learning hub accounts, courses, and workspace settings.',
    action: 'invite-user', actionLabel: '＋ Add user',
    stats: [['User accounts', '1,284', 'registered'], ['Courses', '42', 'in the catalog'], ['Instructors', '48', 'active accounts'], ['Requests', '06', 'awaiting review']],
    classesTitle: 'Workspace activity', classesEyebrow: 'SYSTEM OVERVIEW',
    activityTitle: 'Recent account activity', activityEyebrow: 'ADMIN QUEUE', linkView: 'users', linkLabel: 'Manage users',
    activities: [['New student accounts', 'Registration batch · today', '12 added'], ['Instructor access', 'Pending approvals', '3 requests'], ['Course catalog', 'Semester setup', 'Ready']]
  }
};

const roleViewMarkup = {
  assignments: `<section class="view-header"><div><p class="eyebrow">TEACHING WORKSPACE</p><h1>Assignments</h1><p class="subtitle">Create class work and review submissions across your courses.</p></div><button class="primary-button" data-action="add-assignment">＋ <span>New assignment</span></button></section><section class="panel"><div class="panel-heading"><h2>Recent assignments</h2><span class="course-code">DEMO DATA</span></div><div class="workspace-row"><div><strong>Responsive portfolio checkpoint</strong><small>IT 204 · Web Development · Due Oct 8</small></div><span class="subject-status progress">8 to review</span><button class="text-button" data-action="review-work">Review →</button></div><div class="workspace-row"><div><strong>SQL normalization practice</strong><small>IT 206 · Database Management · Due Oct 10</small></div><span class="subject-status complete">6 to review</span><button class="text-button" data-action="review-work">Review →</button></div><div class="workspace-row"><div><strong>Subnetting lab report</strong><small>IT 208 · Computer Networking · Due Oct 12</small></div><span class="subject-status progress">4 to review</span><button class="text-button" data-action="review-work">Review →</button></div></section>`,
  gradebook: `<section class="view-header"><div><p class="eyebrow">TEACHING WORKSPACE</p><h1>Gradebook</h1><p class="subtitle">Review class progress and outstanding grading.</p></div><button class="filter-button">All classes <span>⌄</span></button></section><section class="panel"><div class="panel-heading"><h2>Class progress</h2><span class="course-code">DEMO DATA</span></div><div class="workspace-row"><div><strong>Web Development · IT 204</strong><small>32 students · Latest activity: Portfolio checkpoint</small></div><span class="subject-status progress">8 pending</span><button class="text-button" data-action="review-work">Open →</button></div><div class="workspace-row"><div><strong>Database Management · IT 206</strong><small>28 students · Latest activity: SQL practice</small></div><span class="subject-status progress">6 pending</span><button class="text-button" data-action="review-work">Open →</button></div><div class="workspace-row"><div><strong>Computer Networking · IT 208</strong><small>34 students · Latest activity: Lab report</small></div><span class="subject-status complete">4 pending</span><button class="text-button" data-action="review-work">Open →</button></div></section>`,
  departments: `<section class="view-header"><div><p class="eyebrow">ACADEMIC WORKSPACE</p><h1>Departments</h1><p class="subtitle">A college-wide view of programs and current teaching activity.</p></div><button class="filter-button">Academic year 2026–2027 <span>⌄</span></button></section><section class="workspace-card-grid"><article class="workspace-card"><span class="eyebrow">01 · PROGRAM</span><h2>Information Technology</h2><p>18 courses · 420 students · 16 faculty</p><button class="text-button" data-view="courses">View courses →</button></article><article class="workspace-card"><span class="eyebrow">02 · PROGRAM</span><h2>Electronics Technology</h2><p>12 courses · 336 students · 12 faculty</p><button class="text-button" data-view="courses">View courses →</button></article><article class="workspace-card"><span class="eyebrow">03 · PROGRAM</span><h2>Computer Technology</h2><p>12 courses · 492 students · 20 faculty</p><button class="text-button" data-view="courses">View courses →</button></article></section>`,
  reports: `<section class="view-header"><div><p class="eyebrow">ACADEMIC INSIGHTS</p><h1>Reports</h1><p class="subtitle">Sample indicators for enrollment, course activity, and completion.</p></div><button class="primary-button" data-action="export-report">↓ <span>Export report</span></button></section><section class="stats-grid" aria-label="Demo report metrics"><article class="stat-card accent-coral"><div class="stat-top"><span>Course completion</span><span class="stat-symbol">◒</span></div><strong>76%</strong><small>sample semester average</small></article><article class="stat-card accent-lime"><div class="stat-top"><span>Attendance</span><span class="stat-symbol">↗</span></div><strong>92%</strong><small>sample reporting rate</small></article><article class="stat-card accent-blue"><div class="stat-top"><span>Active courses</span><span class="stat-symbol">▦</span></div><strong>42</strong><small>across programs</small></article><article class="stat-card accent-yellow"><div class="stat-top"><span>Faculty activity</span><span class="stat-symbol">✦</span></div><strong>89%</strong><small>sample participation</small></article></section><section class="panel"><div class="panel-heading"><h2>Program progress</h2><span class="course-code">DEMO DATA</span></div><div class="report-progress"><span>Information Technology</span><div class="progress-line"><i style="width:82%"></i></div><strong>82%</strong></div><div class="report-progress"><span>Electronics Technology</span><div class="progress-line"><i style="width:74%"></i></div><strong>74%</strong></div><div class="report-progress"><span>Computer Technology</span><div class="progress-line"><i style="width:68%"></i></div><strong>68%</strong></div></section>`,
  users: `<section class="view-header"><div><p class="eyebrow">ADMINISTRATION</p><h1>User management</h1><p class="subtitle">Review sample accounts and access roles in the learning hub.</p></div><button class="primary-button" data-action="invite-user">＋ <span>Add user</span></button></section><section class="panel"><div class="panel-heading"><h2>Accounts</h2><button class="filter-button">All roles <span>⌄</span></button></div><div class="workspace-row"><div><strong>Maria Santos</strong><small>INS-014 · Instructor</small></div><span class="subject-status complete">Active</span><button class="dots-button" aria-label="More account actions">•••</button></div><div class="workspace-row"><div><strong>Juan Dela Cruz</strong><small>2024-01482 · Student</small></div><span class="subject-status complete">Active</span><button class="dots-button" aria-label="More account actions">•••</button></div><div class="workspace-row"><div><strong>Carlo Reyes</strong><small>INS-021 · Instructor</small></div><span class="subject-status progress">Review</span><button class="dots-button" aria-label="More account actions">•••</button></div></section>`
};

function renderRoleDashboard(role) {
  const dashboard = dashboardData[role] || dashboardData.student;
  const classCards = [
    ['web', 'IT 204', 'Web Development', 'Prof. Maria Santos', 'coral', '72%'],
    ['database', 'IT 206', 'Database Management', 'Prof. Carlo Reyes', 'navy', '48%'],
    ['networking', 'IT 208', 'Computer Networking', 'Prof. Anna Lim', 'lime', '84%'],
    ['hci', 'IT 210', 'Human-Computer Interaction', 'Prof. Leo Garcia', 'yellow', '63%']
  ];
  const stats = dashboard.stats.map(([label, value, note], index) => `<article class="stat-card accent-${['coral', 'lime', 'blue', 'yellow'][index]}"><div class="stat-top"><span>${label}</span><span class="stat-symbol">${['◒', '↗', '◷', '✦'][index]}</span></div><strong>${value}</strong><small>${note}</small></article>`).join('');
  const sampleClasses = role === 'dean' || role === 'admin';
  const classes = sampleClasses
    ? classCards.map(([key, code, title, instructor, color, progress]) => `<article class="classroom-card"><div class="classroom-banner ${color}"><span>${code}</span><span>2026–2027</span></div><div class="classroom-body"><h3>${title}</h3><p>${instructor}</p><div class="progress-line"><i style="width:${progress}"></i></div><div class="classroom-footer"><small>${progress} progress · Semester 1</small><button class="text-button" data-action="course" data-course="${key}">Open class →</button></div></div></article>`).join('')
    : `<div class="empty-state"><span class="empty-state-mark">▦</span><strong>Loading classrooms</strong><p>Getting your classroom list.</p></div>`;
  const activities = dashboard.activities.map(([title, detail, status]) => `<article class="dashboard-activity"><span class="activity-marker"></span><div><strong>${title}</strong><small>${detail}</small></div><span class="activity-status">${status}</span></article>`).join('');

  return `<section class="welcome-row"><div><p class="eyebrow">ACADEMIC YEAR 2026–2027 · ${sampleClasses ? 'DEMO WORKSPACE' : 'CLASSROOM WORKSPACE'}</p><h1 id="greeting">Welcome back.</h1><p class="subtitle">${dashboard.description}</p></div><button class="primary-button" data-action="${dashboard.action}">${dashboard.actionLabel}</button></section><section class="stats-grid" aria-label="Workspace summary">${stats}</section><section class="dashboard-layout"><div class="dashboard-main"><div class="dashboard-heading"><div><p class="eyebrow">${dashboard.classesEyebrow}</p><h2>${dashboard.classesTitle}</h2></div><button class="text-button" data-view="courses">View all <span>→</span></button></div><div class="classroom-grid" id="dashboardClassrooms">${classes}</div></div><aside class="dashboard-side"><section class="panel dashboard-activity-panel"><div class="panel-heading"><div><p class="eyebrow">${dashboard.activityEyebrow}</p><h2>${dashboard.activityTitle}</h2></div></div><div id="dashboardActivity">${activities || '<p class="empty-copy">Nothing to show yet.</p>'}</div><button class="full-link" data-view="${dashboard.linkView}">${dashboard.linkLabel}<span>→</span></button></section><section class="dashboard-note"><span class="eyebrow">CIT LEARNING HUB</span><strong>One place for the work that moves learning forward.</strong><button data-view="announcements">View announcements →</button></section></aside></section>`;
}

function configureRoleWorkspace(role) {
  const normalizedRole = roleNavigation[role] ? role : 'student';
  const navigation = roleNavigation[normalizedRole];
  document.querySelector('.main-nav').innerHTML = `<p class="nav-label">Workspace</p>${navigation.map(([view, icon, label]) => `<button class="nav-item" data-view="${view}"><span class="nav-icon">${icon}</span>${label}</button>`).join('')}`;
  const name = appShell.dataset.userName || 'CIT account';
  document.getElementById('profileName').textContent = name;
  document.getElementById('profileRole').textContent = normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1);
  document.getElementById('profileAvatar').textContent = name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  yearSelector.hidden = normalizedRole !== 'student';
  document.querySelector('.topbar-year-label').hidden = normalizedRole !== 'student';
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`http://localhost:3000${path}`, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${authToken}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'The request could not be completed.');
  return data;
}

function classroomCard(classroom, action, statusText) {
  const colors = ['coral', 'navy', 'lime', 'yellow'];
  const color = colors[Number(classroom.id) % colors.length];
  const status = statusText ? `<span class="subject-status ${statusText === 'Accepted' ? 'complete' : 'progress'}">${escapeHtml(statusText)}</span>` : '';
  return `<article class="classroom-card"><div class="classroom-banner ${color}"><span>${escapeHtml(classroom.courseCode)}</span><span>${classroom.studentCount ?? 0} students</span></div><div class="classroom-body"><h3>${escapeHtml(classroom.name)}</h3><p>${escapeHtml(classroom.instructorName || classroom.description || '')}</p><div class="classroom-footer">${status}<button class="text-button" data-action="${action}" data-class-id="${classroom.id}">${action === 'request-join' ? 'Request to join →' : action === 'open-class' ? 'Open classroom →' : 'View requests →'}</button></div></div></article>`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2300);
}

function setView(view) {
  activeView = view;
  const title = viewNames[view] || 'Overview';
  pageTitle.textContent = title;
  document.querySelectorAll('.nav-item[data-view]').forEach((item) => item.classList.toggle('active', item.dataset.view === view));
  pageContainer.innerHTML = view === 'overview' ? renderRoleDashboard(appShell.dataset.role || 'student') : viewMarkup[view] || roleViewMarkup[view] || overviewMarkup;
  if (view === 'overview') {
    const dashboardGreeting = pageContainer.querySelector('#greeting');
    if (dashboardGreeting) dashboardGreeting.textContent = `Welcome, ${appShell.dataset.userName || 'learner'}!`;
  }
  updateYearLevel(yearSelector.value);
  pageContainer.querySelector('input[value="Juan Dela Cruz"]')?.setAttribute('value', '');
  if (view !== 'overview' && !appShell.hidden) showToast(`${title} opened`);
  bindDynamicActions();
  sidebar.classList.remove('open');
  loadRoleView(view);
}

function emptyState(title, detail, actionLabel, view) {
  return `<div class="empty-state"><span class="empty-state-mark">▦</span><strong>${escapeHtml(title)}</strong><p>${escapeHtml(detail)}</p>${actionLabel ? `<button class="primary-button" data-view="${view}">${escapeHtml(actionLabel)}</button>` : ''}</div>`;
}

function renderClassroomsView() {
  const role = appShell.dataset.role;
  if (role === 'student') {
    const accepted = classroomCache.filter((classroom) => classroom.membershipStatus === 'Accepted');
    const pending = classroomCache.filter((classroom) => classroom.membershipStatus === 'Pending');
    const cards = accepted.map((classroom) => classroomCard(classroom, 'open-class', 'Accepted')).join('');
    const pendingRows = pending.map((classroom) => `<article class="workspace-row"><div><strong>${escapeHtml(classroom.name)}</strong><small>${escapeHtml(classroom.courseCode)} · ${escapeHtml(classroom.instructorName)}</small></div><span class="subject-status progress">Awaiting approval</span></article>`).join('');
    pageContainer.innerHTML = `<section class="view-header"><div><p class="eyebrow">STUDENT WORKSPACE</p><h1>My classrooms</h1><p class="subtitle">Only instructor-approved classrooms appear in your learning space.</p></div><button class="primary-button" data-view="catalog">Find a classroom</button></section>${accepted.length ? `<div class="classroom-grid">${cards}</div>` : emptyState('No classrooms yet', 'Class materials and modules will appear here after an instructor accepts your request.', 'Find a classroom', 'catalog')}${pendingRows ? `<section class="panel pending-panel"><div class="panel-heading"><h2>Requests waiting for approval</h2></div>${pendingRows}</section>` : ''}`;
    return;
  }

  const cards = classroomCache.map((classroom) => classroomCard(classroom, 'view-requests')).join('');
  pageContainer.innerHTML = `<section class="view-header"><div><p class="eyebrow">INSTRUCTOR WORKSPACE</p><h1>My classrooms</h1><p class="subtitle">Create a classroom, then approve students who request to join.</p></div><button class="primary-button" data-action="show-classroom-form">＋ <span>Create classroom</span></button></section><form class="classroom-form" id="createClassroomForm" hidden><label>Class name<input name="name" maxlength="120" placeholder="e.g. Web Development" required></label><label>Course code<input name="courseCode" maxlength="30" placeholder="e.g. IT 204" required></label><label>Description<input name="description" maxlength="500" placeholder="Optional class details"></label><button class="primary-button" type="submit">Create classroom</button></form><div class="classroom-grid">${cards || emptyState('No classrooms created', 'Create your first classroom to let students request access.', 'Create classroom', 'courses')}</div>`;
}

function renderClassCatalog() {
  const cards = classroomCache.map((classroom) => {
    const status = classroom.membershipStatus;
    const action = status === 'Accepted' ? '<span class="subject-status complete">Joined</span>' : status === 'Pending' ? '<span class="subject-status progress">Pending approval</span>' : `<button class="text-button" data-action="request-join" data-class-id="${classroom.id}">Request to join →</button>`;
    return `<article class="classroom-card"><div class="classroom-banner coral"><span>${escapeHtml(classroom.courseCode)}</span><span>CIT CLASS</span></div><div class="classroom-body"><h3>${escapeHtml(classroom.name)}</h3><p>${escapeHtml(classroom.instructorName)}</p><div class="classroom-footer"><small>${escapeHtml(classroom.description || 'Instructor-led classroom')}</small>${action}</div></div></article>`;
  }).join('');
  pageContainer.innerHTML = `<section class="view-header"><div><p class="eyebrow">CLASS DIRECTORY</p><h1>Find classrooms</h1><p class="subtitle">Request to join an instructor's classroom. Its materials unlock after approval.</p></div></section><div class="classroom-grid">${cards || emptyState('No classrooms available', 'Your instructors have not created classrooms yet. Check back later.', '', '')}</div>`;
}

function renderJoinRequests(requests) {
  const rows = requests.map((request) => `<article class="workspace-row request-row"><div><strong>${escapeHtml(request.studentName)}</strong><small>${escapeHtml(request.studentUserId)} · ${escapeHtml(request.className)} · ${escapeHtml(request.courseCode)}</small></div><span class="subject-status progress">Pending</span><button class="primary-button" data-action="accept-request" data-request-id="${request.id}">Accept</button></article>`).join('');
  pageContainer.innerHTML = `<section class="view-header"><div><p class="eyebrow">CLASSROOM ACCESS</p><h1>Join requests</h1><p class="subtitle">Accept a student to add them officially to your classroom.</p></div><button class="filter-button" data-action="refresh-requests">Refresh requests</button></section><section class="panel"><div class="panel-heading"><h2>Waiting for approval</h2><span class="course-code">${requests.length} pending</span></div>${rows || '<p class="empty-copy">No students are waiting to join your classrooms.</p>'}</section>`;
}

async function loadRoleView(view) {
  const role = appShell.dataset.role;
  if (!authToken || !['student', 'instructor'].includes(role)) return;
  if (!['overview', 'courses', 'catalog', 'requests'].includes(view)) return;

  try {
    const result = await apiRequest('/api/classrooms');
    classroomCache = result.classrooms || [];
    if (activeView !== view) return;

    if (view === 'catalog' && role === 'student') {
      renderClassCatalog();
      return;
    }
    if (view === 'courses') {
      renderClassroomsView();
      if (showClassroomFormOnLoad) {
        showClassroomFormOnLoad = false;
        const form = document.getElementById('createClassroomForm');
        if (form) {
          form.hidden = false;
          form.querySelector('input')?.focus();
        }
      }
      return;
    }
    if (view === 'requests' && role === 'instructor') {
      const requestResult = await apiRequest('/api/classroom-requests');
      if (activeView === view) renderJoinRequests(requestResult.requests || []);
      return;
    }
    if (view !== 'overview') return;

    const stats = pageContainer.querySelectorAll('.stat-card > strong');
    const classGrid = pageContainer.querySelector('#dashboardClassrooms');
    const activity = pageContainer.querySelector('#dashboardActivity');
    if (role === 'student') {
      const accepted = classroomCache.filter((classroom) => classroom.membershipStatus === 'Accepted');
      const pending = classroomCache.filter((classroom) => classroom.membershipStatus === 'Pending');
      if (stats[0]) stats[0].textContent = String(accepted.length);
      if (stats[1]) stats[1].textContent = accepted.length ? '—' : '—';
      if (stats[2]) stats[2].textContent = '0';
      if (stats[3]) stats[3].textContent = String(pending.length);
      if (classGrid) classGrid.innerHTML = accepted.length ? accepted.map((classroom) => classroomCard(classroom, 'open-class', 'Accepted')).join('') : emptyState('No classrooms yet', 'Modules and class materials stay unavailable until an instructor accepts your request.', 'Find a classroom', 'catalog');
      if (activity) activity.innerHTML = pending.length ? pending.map((classroom) => `<article class="dashboard-activity"><span class="activity-marker"></span><div><strong>${escapeHtml(classroom.name)}</strong><small>${escapeHtml(classroom.instructorName)}</small></div><span class="activity-status">Pending</span></article>`).join('') : `<p class="empty-copy">${accepted.length ? 'No assignments have been posted to your classrooms yet.' : 'No class activity until you join a classroom.'}</p>`;
      return;
    }

    const requestResult = await apiRequest('/api/classroom-requests');
    if (activeView !== view) return;
    const requests = requestResult.requests || [];
    const students = classroomCache.reduce((total, classroom) => total + Number(classroom.studentCount || 0), 0);
    if (stats[0]) stats[0].textContent = String(classroomCache.length);
    if (stats[1]) stats[1].textContent = String(requests.length);
    if (stats[2]) stats[2].textContent = String(students);
    if (stats[3]) stats[3].textContent = '0';
    if (classGrid) classGrid.innerHTML = classroomCache.map((classroom) => classroomCard(classroom, 'view-requests', `${classroom.pendingCount || 0} pending`)).join('') || emptyState('No classrooms created', 'Create a classroom to start receiving student join requests.', 'Create classroom', 'courses');
    if (activity) activity.innerHTML = requests.length ? requests.slice(0, 4).map((request) => `<article class="dashboard-activity"><span class="activity-marker"></span><div><strong>${escapeHtml(request.studentName)}</strong><small>${escapeHtml(request.className)}</small></div><button class="activity-accept" data-action="accept-request" data-request-id="${request.id}">Accept</button></article>`).join('') : '<p class="empty-copy">No pending join requests.</p>';
  } catch (error) {
    if (activeView === view) showToast(error.message || 'Could not load classroom data.');
  }
}

function openClassroom(classId) {
  const classroom = classroomCache.find((item) => String(item.id) === String(classId));
  if (!classroom || (appShell.dataset.role === 'student' && classroom.membershipStatus !== 'Accepted')) {
    showToast('Only approved classroom members can open class materials.');
    return;
  }

  const courseEntry = Object.entries(moduleCatalog).find(([, course]) => course.code.toLowerCase() === String(classroom.courseCode).toLowerCase());
  const modules = courseEntry ? yearModuleCatalog[yearSelector.value][courseEntry[0]] || moduleCatalog[courseEntry[0]].modules : [];
  activeView = 'class-detail';
  pageTitle.textContent = classroom.name;
  document.querySelectorAll('.nav-item[data-view]').forEach((item) => item.classList.toggle('active', item.dataset.view === 'courses'));
  pageContainer.innerHTML = `<section class="view-header"><div><p class="eyebrow">${escapeHtml(classroom.courseCode)} · ${escapeHtml(classroom.instructorName || 'INSTRUCTOR CLASSROOM')}</p><h1>${escapeHtml(classroom.name)}</h1><p class="subtitle">${escapeHtml(classroom.description || 'Classroom materials and learning modules.')}</p></div><button class="filter-button" data-view="courses">← Back to classrooms</button></section><section class="panel"><div class="panel-heading"><h2>Class modules</h2><span class="course-code">${modules.length} modules</span></div>${modules.length ? modules.map((module, index) => `<article class="workspace-row"><div><strong>${String(index + 1).padStart(2, '0')} · ${escapeHtml(module)}</strong><small>Learning module · ${index === 0 ? 'Ready to start' : 'Available'}</small></div><button class="text-button" data-action="lesson" data-module="${escapeHtml(module)}">Open →</button></article>`).join('') : '<p class="empty-copy">Your instructor has not posted modules to this classroom yet.</p>'}</section>`;
}

function bindDynamicActions() {
  showingOpenTasks = false;
}

const moduleCatalog = {
  web: { title: 'Web Development', code: 'IT 204', color: 'coral', instructor: 'Prof. Maria Santos', progress: 72, modules: ['Web foundations and the browser', 'Semantic HTML structure', 'CSS layout systems', 'Responsive interface patterns', 'JavaScript interactions', 'Accessible components', 'Portfolio project', 'Final deployment checklist'] },
  database: { title: 'Database Management', code: 'IT 206', color: 'navy', instructor: 'Prof. Carlo Reyes', progress: 48, modules: ['Database concepts and models', 'Entity relationship diagrams', 'Relational table design', 'SQL queries and filtering', 'Joins and aggregate functions', 'Normalization exercises', 'Transactions and security', 'Database project'] },
  networking: { title: 'Computer Networking', code: 'IT 208', color: 'lime', instructor: 'Prof. Anna Lim', progress: 84, modules: ['Network foundations', 'OSI and TCP/IP models', 'IP addressing basics', 'Subnetting practice', 'Switching and VLANs', 'Routing fundamentals', 'Network security basics', 'Troubleshooting lab', 'Practical assessment'] },
  hci: { title: 'Human-Computer Interaction', code: 'IT 210', color: 'yellow', instructor: 'Prof. Leo Garcia', progress: 63, modules: ['Introduction to user experience', 'User research methods', 'Personas and journey maps', 'Information architecture', 'Interface prototyping', 'Usability testing', 'Accessibility principles'] }
};

const yearModuleCatalog = {
  '1st Year': {
    web: ['Digital technology foundations', 'HTML and page structure', 'CSS styling basics', 'Intro to responsive design', 'JavaScript fundamentals'],
    database: ['Information and data concepts', 'Tables and records', 'Basic data types', 'Intro to SQL', 'Simple database activity'],
    networking: ['Computer hardware essentials', 'Network devices', 'Internet and web basics', 'IP address introduction', 'Basic connectivity lab'],
    hci: ['People and technology', 'User needs and empathy', 'Design thinking basics', 'Wireframe introduction', 'Simple usability check']
  },
  '2nd Year': {
    web: ['Web foundations and the browser', 'Semantic HTML structure', 'CSS layout systems', 'Responsive interface patterns', 'JavaScript interactions', 'Accessible components', 'Portfolio project', 'Final deployment checklist'],
    database: ['Database concepts and models', 'Entity relationship diagrams', 'Relational table design', 'SQL queries and filtering', 'Joins and aggregate functions', 'Normalization exercises', 'Transactions and security', 'Database project'],
    networking: ['Network foundations', 'OSI and TCP/IP models', 'IP addressing basics', 'Subnetting practice', 'Switching and VLANs', 'Routing fundamentals', 'Network security basics', 'Troubleshooting lab', 'Practical assessment'],
    hci: ['Introduction to user experience', 'User research methods', 'Personas and journey maps', 'Information architecture', 'Interface prototyping', 'Usability testing', 'Accessibility principles']
  },
  '3rd Year': {
    web: ['Full-stack application architecture', 'API design and integration', 'Authentication and sessions', 'Frontend state management', 'Testing web applications', 'Performance optimization', 'Cloud deployment', 'Industry web project'],
    database: ['Advanced SQL patterns', 'Stored procedures and views', 'Database administration', 'Indexing and optimization', 'Distributed databases', 'Data warehousing', 'Backup and recovery', 'Enterprise data project'],
    networking: ['Advanced routing protocols', 'Wireless network design', 'Network monitoring', 'Server and service management', 'Virtual networks', 'Cybersecurity operations', 'Network automation', 'Infrastructure deployment'],
    hci: ['Interaction design systems', 'Product discovery', 'Inclusive design research', 'Advanced prototyping', 'Design evaluation methods', 'Service blueprinting', 'HCI case study']
  },
  '4th Year': {
    web: ['Software project planning', 'Scalable web architecture', 'DevOps delivery workflow', 'Secure application review', 'Industry code quality', 'Client requirements workshop', 'Capstone implementation', 'Capstone presentation'],
    database: ['Enterprise data architecture', 'Data governance', 'Analytics pipeline design', 'High availability systems', 'Privacy and compliance', 'Business intelligence project', 'Capstone database build', 'Technical documentation'],
    networking: ['Enterprise infrastructure planning', 'Cloud and hybrid networks', 'Security architecture', 'Disaster recovery planning', 'Network audit and compliance', 'Professional troubleshooting', 'Industry practicum', 'Capstone infrastructure defense'],
    hci: ['Human-centered product strategy', 'Ethics in technology design', 'Research portfolio', 'Advanced usability study', 'Design leadership', 'Industry case presentation', 'Capstone experience design']
  }
};

function openCourseModules(courseKey) {
  const baseCourse = moduleCatalog[courseKey];
  const selectedYear = yearSelector.value;
  const course = { ...baseCourse, modules: yearModuleCatalog[selectedYear][courseKey] || baseCourse.modules };
  if (!course) return;
  activeCourse = course;
  activeCourseYear = selectedYear;
  const completed = Math.round(course.modules.length * course.progress / 100);
  pageTitle.textContent = course.title;
  document.querySelectorAll('.nav-item[data-view]').forEach((item) => item.classList.toggle('active', item.dataset.view === 'courses'));
  pageContainer.innerHTML = `<section class="module-header"><button class="back-link" data-view="courses">← Back to My courses</button><div class="module-title-row"><div class="course-color ${course.color}"><span>${course.code.slice(-2)}</span></div><div><p class="eyebrow">2ND YEAR · ${course.code}</p><h1>${course.title}</h1><p>${course.instructor} · ${course.modules.length} learning modules</p></div></div><div class="module-progress"><div><strong>${course.progress}% complete</strong><span>${completed} of ${course.modules.length} modules finished</span></div><div class="progress-line"><i style="width:${course.progress}%"></i></div></div></section><section class="module-layout"><div class="module-list"><div class="section-heading"><div><p class="eyebrow">COURSE CONTENT</p><h2>Learning modules</h2></div><span class="course-code">${course.modules.length} modules</span></div>${course.modules.map((module, index) => { const done = index < completed; return `<article class="module-row ${done ? 'module-done' : ''}"><span class="module-number">${String(index + 1).padStart(2, '0')}</span><div class="module-copy"><strong>${module}</strong><small>${done ? 'Completed' : index === completed ? 'Next up · 20 min' : 'Lesson · 20 min'}</small></div><span class="module-state">${done ? '✓' : index === completed ? 'Start' : 'Locked'}</span><button class="module-open" data-action="lesson" data-module="${module}">${done ? 'Review' : index === completed ? 'Open' : 'View'} →</button></article>`; }).join('')}</div><aside class="module-side"><section class="panel"><p class="eyebrow">AT A GLANCE</p><h2>Build your skill set.</h2><p class="module-note">Complete each module to unlock the next practical activity.</p><div class="module-stat"><strong>${course.progress}%</strong><span>overall progress</span></div><div class="module-stat"><strong>${course.modules.length * 20} min</strong><span>estimated course time</span></div></section><section class="quote-card"><p>Small modules. Real practice. Visible progress.</p><small>CIT Learning Arc</small></section></aside></section>`;
  pageContainer.querySelectorAll('[data-action="lesson"]').forEach((button) => {
    button.dataset.action = 'module-pdf';
    button.textContent = 'Preview →';
  });
  const moduleEyebrow = pageContainer.querySelector('.module-header .eyebrow');
  if (moduleEyebrow) moduleEyebrow.textContent = `${selectedYear.toUpperCase()} · ${course.code}`;
  sidebar.classList.remove('open');
}

menuButton.addEventListener('click', () => sidebar.classList.toggle('open'));

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const accountId = document.getElementById('loginAccountId').value.trim();
  const password = document.getElementById('loginPassword').value;

  try {
    const response = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: accountId, password })
    });
    const data = await response.json();

    if (!response.ok || !data.success) {
      showToast(data.message || 'Invalid account ID or password.');
      return;
    }

    const role = String(data.role || '').trim();
    if (!role) {
      showToast('The account does not have a valid role.');
      return;
    }
    if (!data.token) {
      showToast('The server did not create a login session.');
      return;
    }

    authToken = data.token;
    appShell.dataset.role = role.toLowerCase();
    appShell.dataset.userName = data.name || accountId;
    configureRoleWorkspace(appShell.dataset.role);
    setView('overview');
    authScreen.hidden = true;
    appShell.hidden = false;
    showToast(`Signed in as ${role}`);
  } catch (error) {
    console.error('Login request failed:', error);
    showToast('Hindi makakonekta sa server. Tiyaking tumatakbo ang backend.');
  }
});

document.getElementById('logoutButton').addEventListener('click', () => {
  if (authToken) fetch('http://localhost:3000/api/logout', { method: 'POST', headers: { Authorization: `Bearer ${authToken}` } });
  authToken = '';
  classroomCache = [];
  appShell.hidden = true;
  authScreen.hidden = false;
  loginForm.reset();
  delete appShell.dataset.role;
  delete appShell.dataset.userName;
});

document.querySelector('.sidebar-bottom .nav-item').addEventListener('click', () => setView('settings'));

function downloadSyllabus() {
  const lines = [
    'CIT LEARNING HUB',
    'Bachelor of Science in Information Technology',
    'First Semester 2026-2027',
    '',
    'COURSE SUBJECTS',
    'IT 204 - Web Development (2nd Year, 3 units)',
    'IT 206 - Database Management (2nd Year, 3 units)',
    'IT 208 - Computer Networking (2nd Year, 3 units)',
    'IT 210 - Human-Computer Interaction (2nd Year, 3 units)',
    '',
    'LEARNING OUTCOMES',
    '1. Design and develop responsive information systems.',
    '2. Apply database concepts to practical technology solutions.',
    '3. Configure and troubleshoot basic network environments.',
    '4. Evaluate user experience and accessibility in digital products.',
    '',
    'LEARNING PROGRESS',
    'Complete modules to build your practical technology skills.'
  ];
  const escapePdfText = (text) => text.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
  const stream = ['BT', '/F1 16 Tf', '50 750 Td', `(${escapePdfText(lines[0])}) Tj`, '/F1 10 Tf', '0 -24 Td', ...lines.slice(1).map((line) => `(${escapePdfText(line)}) Tj 0 -16 Td`), 'ET'].join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }));
  link.download = 'CIT-Syllabus-2026-2027.pdf';
  link.click();
  URL.revokeObjectURL(link.href);
  showToast('Syllabus downloaded');
}

function downloadModulePdf(moduleTitle) {
  if (!activeCourse) return;
  const lines = [
    'CIT LEARNING HUB',
    `${activeCourse.title} · ${activeCourse.code}`,
    `${activeCourseYear} · Computer Industrial Technology`,
    '',
    `LEARNING MODULE: ${moduleTitle}`,
    '',
    'MODULE OVERVIEW',
    `This module is part of the ${activeCourse.title} learning path. Study the lesson, complete the practical activity, and record your output in your learning notes.`,
    '',
    'LEARNING OBJECTIVES',
    `Understand the key concepts covered in ${moduleTitle}.`,
    'Apply the lesson through a practical technology activity.',
    'Explain the result using clear technical documentation.',
    '',
    'PRACTICAL OUTPUT',
    'Submit your activity, screenshots, notes, or working prototype to complete this module.',
    '',
    'CIT Learning Arc · Computer Industrial Technology'
  ];
  const escapePdfText = (text) => text.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
  const stream = ['BT', '/F1 16 Tf', '50 750 Td', `(${escapePdfText(lines[0])}) Tj`, '/F1 12 Tf', '0 -25 Td', `(${escapePdfText(lines[1])}) Tj`, '/F1 10 Tf', '0 -20 Td', ...lines.slice(2).map((line) => `(${escapePdfText(line)}) Tj 0 -16 Td`), 'ET'].join('\n');
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }));
  link.download = `${activeCourse.code}-${activeCourseYear}-${moduleTitle.replaceAll(' ', '-')}.pdf`;
  link.click();
  URL.revokeObjectURL(link.href);
  showToast('Learning module PDF downloaded');
}

function showModulePreview(moduleTitle) {
  if (!activeCourse) return;
  document.querySelector('.module-preview-overlay')?.remove();
  const preview = document.createElement('div');
  preview.className = 'module-preview-overlay';
  preview.innerHTML = `<section class="module-preview" role="dialog" aria-modal="true" aria-labelledby="previewTitle"><button class="preview-close" aria-label="Close module preview">×</button><p class="eyebrow">${activeCourseYear.toUpperCase()} · ${activeCourse.code} · ${activeCourse.title.toUpperCase()}</p><h2 id="previewTitle">${moduleTitle}</h2><p class="preview-lead">A practical learning module in the ${activeCourse.title} path.</p><div class="preview-block"><strong>Module overview</strong><p>Study the core ideas, follow the guided examples, and apply the lesson through a focused technology activity.</p></div><div class="preview-block"><strong>Learning objectives</strong><ul><li>Understand the key concepts covered in this lesson.</li><li>Apply the lesson through a practical activity.</li><li>Explain the result using clear technical documentation.</li></ul></div><div class="preview-block"><strong>Practical output</strong><p>Submit your activity, screenshots, notes, or working prototype to complete this module.</p></div><div class="preview-actions"><button class="filter-button preview-close-action">Close preview</button><button class="primary-button preview-download">↓ Download PDF</button></div></section>`;
  const lessons = [
    { number: 'Lesson 01', title: `Understand ${moduleTitle}`, detail: 'Key concepts, terminology, and a short guided reading.', duration: '15 min' },
    { number: 'Lesson 02', title: `Practice ${moduleTitle}`, detail: 'Follow a worked example and apply the technique step by step.', duration: '25 min' },
    { number: 'Lesson 03', title: `Apply ${moduleTitle}`, detail: 'Complete a hands-on checkpoint and document your result.', duration: '30 min' }
  ];
  preview.querySelector('.preview-lead').insertAdjacentHTML('afterend', `<div class="preview-lessons"><div class="preview-lessons-heading"><strong>Module lessons</strong><span>3 lessons · 70 min</span></div>${lessons.map((lesson) => `<article class="preview-lesson"><span>${lesson.number}</span><div><strong>${lesson.title}</strong><p>${lesson.detail}</p></div><small>${lesson.duration}</small></article>`).join('')}</div>`);
  document.body.appendChild(preview);
  preview.querySelectorAll('.preview-close, .preview-close-action').forEach((button) => button.addEventListener('click', () => preview.remove()));
  preview.querySelector('.preview-download').addEventListener('click', () => downloadModulePdf(moduleTitle));
  preview.addEventListener('click', (event) => { if (event.target === preview) preview.remove(); });
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  const item = event.target.closest('.course-card, .task-row, .large-course-card, .announcement');
  if (item && !button) {
    if (item.classList.contains('large-course-card')) {
      const title = item.querySelector('h2')?.textContent || '';
      const key = Object.keys(moduleCatalog).find((catalogKey) => moduleCatalog[catalogKey].title === title);
      if (key) openCourseModules(key);
      return;
    }
    if (item.dataset.course) {
      openCourseModules(item.dataset.course);
      return;
    }
    showToast('Item selected - detail view coming next');
    return;
  }
  if (!button) return;
  if (button.dataset.view === 'grades') {
    setView('courses');
    return;
  }
  if (button.dataset.view) {
    setView(button.dataset.view);
    return;
  }
  if (button.dataset.action === 'download') {
    downloadSyllabus();
    return;
  }
  if (button.dataset.action === 'browse') {
    setView(appShell.dataset.role === 'student' ? 'catalog' : 'courses');
    return;
  }
  if (button.dataset.action === 'show-classroom-form') {
    const form = document.getElementById('createClassroomForm');
    if (form) {
      form.hidden = false;
      form.querySelector('input')?.focus();
    } else {
      showClassroomFormOnLoad = true;
      setView('courses');
    }
    return;
  }
  if (button.dataset.action === 'request-join') {
    button.disabled = true;
    apiRequest(`/api/classrooms/${button.dataset.classId}/join`, { method: 'POST' })
      .then(() => { showToast('Join request sent to the instructor.'); loadRoleView(activeView); })
      .catch((error) => { showToast(error.message); button.disabled = false; });
    return;
  }
  if (button.dataset.action === 'accept-request') {
    button.disabled = true;
    apiRequest(`/api/classroom-requests/${button.dataset.requestId}/accept`, { method: 'POST' })
      .then(() => { showToast('Student accepted into your classroom.'); loadRoleView(activeView); })
      .catch((error) => { showToast(error.message); button.disabled = false; });
    return;
  }
  if (button.dataset.action === 'view-requests') {
    setView('requests');
    return;
  }
  if (button.dataset.action === 'open-class') {
    openClassroom(button.dataset.classId);
    return;
  }
  if (button.dataset.action === 'refresh-requests') {
    loadRoleView('requests');
    return;
  }
  if (button.dataset.action === 'add-assignment') {
    showToast('New assignment draft is ready');
    return;
  }
  if (button.dataset.action === 'invite-user') {
    showToast('New user invitation form is ready');
    return;
  }
  if (button.dataset.action === 'export-report') {
    showToast('Report export is ready');
    return;
  }
  if (button.dataset.action === 'review-work') {
    showToast('Submission review opened');
    return;
  }
  if (button.dataset.action === 'save') {
    showToast('Settings saved for this session');
    return;
  }
  if (button.dataset.action === 'schedule') {
    showToast('Event form is ready for your next class schedule');
    return;
  }
  if (button.dataset.action === 'message') {
    showToast('New message form is ready');
    return;
  }
  if (button.dataset.action === 'course') {
    const card = button.closest('.large-course-card');
    const title = card?.querySelector('h2')?.textContent || '';
    const key = button.dataset.course || Object.keys(moduleCatalog).find((catalogKey) => moduleCatalog[catalogKey].title === title);
    if (key) openCourseModules(key);
    else showToast('Course module opened');
    return;
  }
  if (button.dataset.action === 'lesson') {
    showToast(`${button.dataset.module} opened`);
    return;
  }
  if (button.dataset.action === 'module-pdf') {
    showModulePreview(button.dataset.module);
    return;
  }
  if (button.dataset.action === 'explore' || button.dataset.action === 'discover') {
    setView('courses');
    return;
  }
  if (button.dataset.action === 'practice') {
    showToast('Practice lab opened');
    return;
  }
  if (button.dataset.action === 'track') {
    showToast('Learning path opened');
    return;
  }
  if (button.id === 'quickAction') {
    showToast('Quick action menu opened: add task or announcement');
    return;
  }
  if (button.id === 'filterButton') {
    showingOpenTasks = !showingOpenTasks;
    button.innerHTML = showingOpenTasks ? 'Open tasks <span>⌄</span>' : 'All tasks <span>⌄</span>';
    document.querySelectorAll('.task-row').forEach((task, index) => {
      task.style.display = showingOpenTasks && index === 2 ? 'none' : 'flex';
    });
    showToast(showingOpenTasks ? 'Showing tasks due this week' : 'Showing all tasks');
    return;
  }
  if (button.closest('.help-card')) {
    showToast('CIT Help Desk: helpdesk@cit.edu.ph');
    return;
  }
  if (button.classList.contains('arrow-button')) {
    showToast('Course module opened');
    return;
  }
  if (button.classList.contains('more-button')) {
    showToast('Task options opened');
    return;
  }
  if (button.classList.contains('dots-button')) {
    showToast('More options opened');
    return;
  }
  if (button.classList.contains('filter-button')) {
    showToast('Filter options opened');
  }
});

document.addEventListener('submit', async (event) => {
  if (event.target.id !== 'createClassroomForm') return;
  event.preventDefault();
  const form = event.target;
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  try {
    const formData = new FormData(form);
    await apiRequest('/api/classrooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.get('name'),
        courseCode: formData.get('courseCode'),
        description: formData.get('description')
      })
    });
    showToast('Classroom created. Students can now request to join.');
    setView('courses');
  } catch (error) {
    showToast(error.message);
    submitButton.disabled = false;
  }
});

setView('learning-arc');

yearSelector.addEventListener('change', () => {
  updateYearLevel(yearSelector.value);
  showToast(`Student year changed to ${yearSelector.value}`);
});

