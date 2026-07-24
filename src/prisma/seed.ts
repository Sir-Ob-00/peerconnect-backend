import { prisma } from "../config/database";

async function seed() {
  console.log("Seeding onboarding reference data...");

  const university = await prisma.university.upsert({
    where: { code: "USTED" },
    update: {},
    create: {
      name: "University of Skill Training and Enterpreneural Development",
      code: "USTED",
      isActive: true,
    },
  });
  console.log("University seeded:", university.name);

  const departments = [
    { id: "dept-itedu-001", name: "Information Technology Education", code: "ITEDU" },
    { id: "dept-mathedu-001", name: "Mathematics Education", code: "MATHEDU" },
    { id: "dept-acct-001", name: "Accounting Studies", code: "ACCT" },
    { id: "dept-mgmt-001", name: "Management Studies", code: "MGMT" },
    { id: "dept-cons-001", name: "Construction Technology and Management Education", code: "CONS" },
    { id: "dept-woods-001", name: "Wood Science and Technology Education", code: "WOOD" },
    { id: "dept-arch-001", name: "Architecture and Civil Engineering", code: "ARCH" },
    { id: "dept-auto-001", name: "Automotive & Mechanical Technology Education", code: "AUTO" },
    { id: "dept-elec-001", name: "Electrical & Electronics Technology Education", code: "ELEC" },
    { id: "dept-cater-001", name: "Catering & Hospitality Education", code: "CATER" },
    { id: "dept-fash-001", name: "Fashion & Textiles Design Education", code: "FASH" },
    { id: "dept-lang-001", name: "Languages Education", code: "LANG" },
  ];

  const createdDepartments: Record<string, string> = {};

  for (const dept of departments) {
    const created = await prisma.department.upsert({
      where: { id: dept.id },
      update: {},
      create: {
        id: dept.id,
        name: dept.name,
        code: dept.code,
        universityId: university.id,
        custom: false,
      },
    });
    createdDepartments[dept.id] = created.id;
    console.log("  Department seeded:", created.name);
  }

  const programmes = [
    { id: "prog-itedu-001", deptId: "dept-itedu-001", name: "B.Ed. Information Technology" },
    { id: "prog-itedu-002", deptId: "dept-itedu-001", name: "B.Ed. Computing with Artificial Intelligence (AI)" },
    { id: "prog-itedu-003", deptId: "dept-itedu-001", name: "B.Ed. Computing with Internet of Things (IoT)" },
    { id: "prog-itedu-004", deptId: "dept-itedu-001", name: "B.Sc. Information Technology Education" },
    { id: "prog-itedu-005", deptId: "dept-itedu-001", name: "B.Sc. Information Technology" },
    { id: "prog-itedu-006", deptId: "dept-itedu-001", name: "B.Sc. Cyber Security and Digital Forensics" },

    { id: "prog-mathedu-001", deptId: "dept-mathedu-001", name: "BSc Mathematics" },
    { id: "prog-mathedu-002", deptId: "dept-mathedu-001", name: "B.Ed. Mathematics" },
    { id: "prog-mathedu-003", deptId: "dept-mathedu-001", name: "MEd Mathematics Education" },

    { id: "prog-acct-001", deptId: "dept-acct-001", name: "BSc. Accounting Education" },
    { id: "prog-acct-002", deptId: "dept-acct-001", name: "BBA / BSc. Accounting" },
    { id: "prog-acct-003", deptId: "dept-acct-001", name: "BSc. Administration" },

    { id: "prog-mgmt-001", deptId: "dept-mgmt-001", name: "BSc. Management Education" },
    { id: "prog-mgmt-002", deptId: "dept-mgmt-001", name: "BBA. Management" },
    { id: "prog-mgmt-003", deptId: "dept-mgmt-001", name: "BBA. Executive Office Administration" },
    { id: "prog-mgmt-004", deptId: "dept-mgmt-001", name: "BBA. Secretarial Education" },
    { id: "prog-mgmt-005", deptId: "dept-mgmt-001", name: "BSc. Marketing" },
    { id: "prog-mgmt-006", deptId: "dept-mgmt-001", name: "BSc. Human Resource Management" },

    { id: "prog-cons-001", deptId: "dept-cons-001", name: "B.Sc. Construction Technology and Management with Education" },
    { id: "prog-cons-002", deptId: "dept-cons-001", name: "B.Sc. Plumbing and Gas Technology" },

    { id: "prog-woods-001", deptId: "dept-woods-001", name: "B.Sc. Wood Technology with Education" },
    { id: "prog-woods-002", deptId: "dept-woods-001", name: "B.Ed. Applied Technology (Building Construction and Wood)" },

    { id: "prog-arch-001", deptId: "dept-arch-001", name: "BSc in Civil Engineering" },

    { id: "prog-auto-001", deptId: "dept-auto-001", name: "B.Sc. Automotive Engineering Technology Education" },
    { id: "prog-auto-002", deptId: "dept-auto-001", name: "B.Sc. Mechanical Engineering Technology Education" },
    { id: "prog-auto-003", deptId: "dept-auto-001", name: "B.Sc. Welding and Fabrication Technology Education" },

    { id: "prog-elec-001", deptId: "dept-elec-001", name: "B.Sc. Electrical and Electronics Engineering with Education" },
    { id: "prog-elec-002", deptId: "dept-elec-001", name: "B.Sc. Electrical and Electronics Engineering" },
    { id: "prog-elec-003", deptId: "dept-elec-001", name: "B.Sc. Renewable Energy Engineering" },
    { id: "prog-elec-004", deptId: "dept-elec-001", name: "B.Sc. Biomedical Equipment Engineering" },
    { id: "prog-elec-005", deptId: "dept-elec-001", name: "B.Ed. Applied Technology (Electrical and Electronics)" },

    { id: "prog-cater-001", deptId: "dept-cater-001", name: "B.Sc. Catering and Hospitality Education" },
    { id: "prog-cater-002", deptId: "dept-cater-001", name: "Diploma in Catering and Hospitality" },

    { id: "prog-fash-001", deptId: "dept-fash-001", name: "BSc Fashion Design and Textiles Education" },
    { id: "prog-fash-002", deptId: "dept-fash-001", name: "Diploma in Fashion Design and Textiles" },

    { id: "prog-lang-001", deptId: "dept-lang-001", name: "B.A. English Language Education" },
    { id: "prog-lang-002", deptId: "dept-lang-001", name: "B.A. Arabic Language Education" },
    { id: "prog-lang-003", deptId: "dept-lang-001", name: "B.A. French Education" },
    { id: "prog-lang-004", deptId: "dept-lang-001", name: "B.A. French with English Education" },
    { id: "prog-lang-005", deptId: "dept-lang-001", name: "B.Ed. Ghanaian Language" },
  ];

  const createdProgrammes: Record<string, string> = {};

  for (const prog of programmes) {
    const created = await prisma.programme.upsert({
      where: { id: prog.id },
      update: {},
      create: {
        id: prog.id,
        name: prog.name,
        universityId: university.id,
        departmentId: prog.deptId,
        custom: false,
      },
    });
    createdProgrammes[prog.id] = created.id;
    console.log("  Programme seeded:", created.name);
  }

  const levels = [
    { id: "level-100", name: "Level 100", code: "L100", sortOrder: 1 },
    { id: "level-200", name: "Level 200", code: "L200", sortOrder: 2 },
    { id: "level-300", name: "Level 300", code: "L300", sortOrder: 3 },
    { id: "level-400", name: "Level 400", code: "L400", sortOrder: 4 },
  ];

  for (const level of levels) {
    await prisma.level.upsert({
      where: { id: level.id },
      update: {},
      create: level,
    });
  }
  console.log("Levels seeded:", levels.map((l) => l.name).join(", "));

  function pickLevel(index: number, total: number): string {
    const step = Math.max(1, Math.floor(total / levels.length));
    const lvlIndex = Math.min(levels.length - 1, Math.floor(index / step));
    return levels[lvlIndex].id;
  }

  async function createCourse(name: string, opts: { programmeId?: string; departmentId?: string; code?: string; levelId?: string | null }) {
    const programme = opts.programmeId ? await prisma.programme.findUnique({ where: { id: opts.programmeId } }) : null;
    const deptId = opts.departmentId || programme?.departmentId;
    const uniId = university.id;
    const existing = await prisma.course.findFirst({
      where: { name: { equals: name, mode: "insensitive" }, universityId: uniId, departmentId: deptId || undefined },
    });
    if (existing) {
      if (opts.levelId && !existing.levelId) {
        await prisma.course.update({ where: { id: existing.id }, data: { levelId: opts.levelId } });
      }
      return existing;
    }
    return prisma.course.create({
      data: {
        name,
        code: opts.code || null,
        universityId: uniId,
        departmentId: deptId || null,
        levelId: opts.levelId ?? null,
        programmeId: opts.programmeId || null,
        custom: false,
      },
    });
  }

  async function createSkill(name: string, opts: { programmeId?: string }) {
    const existing = await prisma.skill.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });
    if (existing) return existing;
    return prisma.skill.create({
      data: {
        name,
        category: null,
        programmeId: opts.programmeId || null,
        isActive: true,
      },
    });
  }

  const programmeCourses: Record<string, string[]> = {
    "prog-itedu-001": ["Introduction to Information Technology", "Computer Programming", "Database Management Systems", "Web Development", "Computer Networks", "Systems Analysis and Design", "Software Engineering", "Operating Systems", "Information Systems", "Computer Security"],
    "prog-itedu-002": ["Introduction to Artificial Intelligence", "Programming Fundamentals", "Machine Learning", "Data Structures and Algorithms", "Database Systems", "Computer Networks", "Natural Language Processing", "Computer Vision", "Data Science", "Neural Networks and Deep Learning"],
    "prog-itedu-003": ["Introduction to Internet of Things", "Programming Fundamentals", "Embedded Systems", "Computer Networks", "IoT Architecture", "Sensors and Actuators", "Microcontrollers", "Cloud Computing", "IoT Security", "Wireless Communication"],
    "prog-itedu-004": ["Introduction to Information Technology", "Programming Fundamentals", "Database Systems", "Web Technologies", "Computer Networks", "Operating Systems", "Systems Analysis and Design", "Software Engineering", "Information Systems Management", "IT Project Management"],
    "prog-itedu-005": ["Programming Fundamentals", "Data Structures and Algorithms", "Database Systems", "Web Application Development", "Computer Networks", "Operating Systems", "Software Engineering", "Systems Analysis and Design", "Information Security", "Cloud Computing"],
    "prog-itedu-006": ["Introduction to Cybersecurity", "Computer Networks", "Network Security", "Digital Forensics", "Ethical Hacking", "Cybercrime and Cyber Law", "Cryptography", "Malware Analysis", "Incident Response", "Cybersecurity Risk Management"],

    "prog-mathedu-001": ["Algebra", "Calculus", "Linear Algebra", "Differential Equations", "Real Analysis", "Complex Analysis", "Number Theory", "Probability Theory", "Statistics", "Numerical Analysis"],
    "prog-mathedu-002": ["Algebra", "Calculus", "Geometry", "Statistics", "Probability", "Number Theory", "Linear Algebra", "Differential Equations", "Mathematics Education", "Teaching Methods in Mathematics"],
    "prog-mathedu-003": ["Advanced Mathematics Education", "Mathematics Curriculum Studies", "Research Methods in Education", "Educational Statistics", "Mathematics Teaching and Learning", "Assessment in Mathematics Education", "Educational Psychology", "Curriculum Development", "Mathematics Education Research", "Instructional Design"],

    "prog-acct-001": ["Financial Accounting", "Management Accounting", "Cost Accounting", "Auditing", "Taxation", "Accounting Information Systems", "Financial Management", "Public Sector Accounting", "Business Law", "Accounting Education"],
    "prog-acct-002": ["Financial Accounting", "Management Accounting", "Cost Accounting", "Auditing", "Taxation", "Financial Management", "Accounting Information Systems", "Corporate Finance", "Business Law", "Financial Reporting"],
    "prog-acct-003": ["Principles of Management", "Business Communication", "Human Resource Management", "Financial Management", "Marketing Management", "Business Law", "Public Administration", "Organizational Behaviour", "Entrepreneurship", "Strategic Management"],

    "prog-mgmt-001": ["Principles of Management", "Organizational Behaviour", "Human Resource Management", "Marketing Management", "Financial Management", "Entrepreneurship", "Strategic Management", "Business Communication", "Operations Management", "Management Education"],
    "prog-mgmt-002": ["Principles of Management", "Organizational Behaviour", "Human Resource Management", "Marketing Management", "Financial Management", "Operations Management", "Strategic Management", "Entrepreneurship", "Business Communication", "Business Law"],
    "prog-mgmt-003": ["Office Administration", "Business Communication", "Records Management", "Office Technology", "Secretarial Practice", "Business Management", "Human Resource Management", "Office Information Systems", "Business Correspondence", "Administrative Management"],
    "prog-mgmt-004": ["Secretarial Practice", "Office Administration", "Business Communication", "Office Technology", "Records Management", "Business Correspondence", "Administrative Management", "Office Information Systems", "Shorthand", "Secretarial Education"],
    "prog-mgmt-005": ["Principles of Marketing", "Consumer Behaviour", "Marketing Research", "Digital Marketing", "Advertising", "Sales Management", "Brand Management", "Social Media Marketing", "Marketing Strategy", "Retail Marketing"],
    "prog-mgmt-006": ["Principles of Human Resource Management", "Recruitment and Selection", "Training and Development", "Performance Management", "Compensation Management", "Labour Relations", "Organizational Behaviour", "Human Resource Planning", "Employment Law", "Strategic Human Resource Management"],

    "prog-cons-001": ["Construction Technology", "Building Materials", "Construction Methods", "Construction Project Management", "Quantity Surveying", "Construction Safety", "Structural Principles", "Building Services", "Construction Estimating", "Construction Education"],
    "prog-cons-002": ["Plumbing Technology", "Pipe Installation", "Plumbing Design", "Water Supply Systems", "Drainage Systems", "Gas Technology", "Gas Installation", "Plumbing Maintenance", "Plumbing Safety", "Building Services"],

    "prog-woods-001": ["Wood Science", "Wood Technology", "Timber Processing", "Wood Machining", "Furniture Design", "Wood Preservation", "Wood Products Manufacturing", "Timber Engineering", "Wood Workshop Technology", "Wood Technology Education"],
    "prog-woods-002": ["Building Construction", "Woodwork Technology", "Construction Materials", "Technical Drawing", "Carpentry", "Furniture Design", "Building Technology", "Construction Methods", "Workshop Technology", "Applied Technology Education"],

    "prog-arch-001": ["Structural Engineering", "Geotechnical Engineering", "Transportation Engineering", "Fluid Mechanics", "Hydraulics", "Surveying", "Construction Engineering", "Reinforced Concrete Design", "Engineering Materials", "Environmental Engineering"],

    "prog-auto-001": ["Automotive Engineering", "Vehicle Mechanics", "Automotive Electrical Systems", "Engine Technology", "Vehicle Diagnostics", "Automotive Electronics", "Vehicle Maintenance", "Automotive Workshop Technology", "Vehicle Dynamics", "Automotive Technology Education"],
    "prog-auto-002": ["Engineering Mechanics", "Thermodynamics", "Fluid Mechanics", "Machine Design", "Manufacturing Technology", "Engineering Materials", "Mechanical Workshop Technology", "Engineering Drawing", "Heat Transfer", "Mechanical Engineering Technology Education"],
    "prog-auto-003": ["Welding Technology", "Metal Fabrication", "Welding Processes", "Welding Metallurgy", "Structural Fabrication", "Welding Inspection", "Welding Safety", "Engineering Drawing", "Fabrication Workshop Technology", "Welding Technology Education"],

    "prog-elec-001": ["Circuit Theory", "Electrical Machines", "Power Systems", "Digital Electronics", "Analog Electronics", "Control Systems", "Electrical Measurements", "Microprocessors", "Renewable Energy Systems", "Electrical Engineering Education"],
    "prog-elec-002": ["Circuit Theory", "Electrical Machines", "Power Systems", "Digital Electronics", "Analog Electronics", "Control Systems", "Microprocessors", "Power Electronics", "Electrical Measurements", "Telecommunications"],
    "prog-elec-003": ["Renewable Energy Systems", "Solar Energy Technology", "Wind Energy Systems", "Energy Storage Systems", "Solar Photovoltaic Systems", "Energy Management", "Power Electronics", "Sustainable Energy Systems", "Energy Efficiency", "Renewable Energy Engineering"],
    "prog-elec-004": ["Biomedical Instrumentation", "Medical Electronics", "Biomedical Equipment", "Medical Imaging Systems", "Biomedical Signal Processing", "Healthcare Technology", "Clinical Engineering", "Medical Equipment Maintenance", "Biosensors", "Biomedical Engineering"],
    "prog-elec-005": ["Electrical Installation", "Circuit Theory", "Electronics", "Digital Electronics", "Electrical Machines", "Electrical Measurements", "Electrical Wiring", "Microcontrollers", "Renewable Energy Technology", "Applied Technology Education"],

    "prog-cater-001": ["Food Production", "Food and Beverage Management", "Hospitality Management", "Food Safety and Hygiene", "Nutrition", "Baking and Pastry", "Hotel Operations", "Catering Management", "Hospitality Marketing", "Catering and Hospitality Education"],
    "prog-cater-002": ["Food Production", "Food and Beverage Service", "Baking and Pastry", "Food Safety", "Catering Operations", "Hospitality Management", "Kitchen Operations", "Nutrition", "Event Catering", "Hotel Operations"],

    "prog-fash-001": ["Fashion Design", "Textile Design", "Pattern Drafting", "Garment Construction", "Fashion Illustration", "Textile Technology", "Clothing Production", "Fashion Marketing", "Fashion Merchandising", "Fashion Design Education"],
    "prog-fash-002": ["Fashion Design", "Pattern Making", "Garment Construction", "Textile Design", "Sewing Technology", "Fashion Illustration", "Clothing Production", "Textile Technology", "Fashion Merchandising", "Fashion Marketing"],

    "prog-lang-001": ["English Grammar", "Phonetics and Phonology", "Morphology", "Syntax", "Semantics", "English Literature", "Academic Writing", "Sociolinguistics", "Language Teaching Methods", "English Language Education"],
    "prog-lang-002": ["Arabic Grammar", "Arabic Phonetics", "Arabic Literature", "Arabic Morphology", "Arabic Syntax", "Arabic Translation", "Arabic Composition", "Arabic Linguistics", "Arabic Language Teaching Methods", "Arabic Language Education"],
    "prog-lang-003": ["French Grammar", "French Phonetics", "French Literature", "French Translation", "French Composition", "French Linguistics", "French Civilization", "Oral French", "French Language Teaching Methods", "French Language Education"],
    "prog-lang-004": ["English Grammar", "French Grammar", "French Literature", "English Literature", "French Translation", "English Linguistics", "French Linguistics", "Comparative Literature", "Language Teaching Methods", "Bilingual Education"],
    "prog-lang-005": ["Ghanaian Language Studies", "Ghanaian Language Grammar", "Ghanaian Oral Literature", "Ghanaian Written Literature", "African Linguistics", "Ghanaian Folklore", "Translation Studies", "Language Teaching Methods", "Indigenous Knowledge Systems", "Ghanaian Language Education"],
  };

  const programmeSkills: Record<string, string[]> = {
    "prog-itedu-001": ["Programming", "Web Development", "Database Management", "Networking", "Software Development", "Systems Analysis", "IT Support", "Cybersecurity", "Computer Troubleshooting", "Technical Documentation"],
    "prog-itedu-002": ["Python Programming", "Machine Learning", "Data Analysis", "Artificial Intelligence", "Deep Learning", "Neural Networks", "Computer Vision", "Natural Language Processing", "Data Visualization", "AI Model Development"],
    "prog-itedu-003": ["IoT Development", "Arduino", "Raspberry Pi", "Embedded Programming", "Sensor Integration", "Microcontroller Programming", "Networking", "Cloud Computing", "Electronics Prototyping", "IoT Security"],
    "prog-itedu-004": ["Programming", "Web Development", "Database Management", "Networking", "Software Development", "IT Support", "Systems Analysis", "Project Management", "Computer Troubleshooting", "Technical Support"],
    "prog-itedu-005": ["JavaScript", "Python", "Java", "React", "Web Development", "Database Management", "API Development", "Networking", "Cloud Computing", "Cybersecurity"],
    "prog-itedu-006": ["Ethical Hacking", "Penetration Testing", "Digital Forensics", "Network Security", "Cybersecurity", "Linux", "Cryptography", "Malware Analysis", "Incident Response", "Security Monitoring"],

    "prog-mathedu-001": ["Mathematical Problem Solving", "Statistical Analysis", "Data Analysis", "Mathematical Modelling", "Calculus", "Algebra", "Numerical Methods", "Logical Reasoning", "Research Methods", "Mathematics Software"],
    "prog-mathedu-002": ["Mathematical Problem Solving", "Mathematics Tutoring", "Statistics", "Data Analysis", "Mathematical Modelling", "Calculus", "Algebra", "Lesson Planning", "Mathematics Teaching", "Educational Technology"],
    "prog-mathedu-003": ["Educational Research", "Statistical Analysis", "Curriculum Development", "Mathematics Teaching", "Educational Assessment", "Research Writing", "Data Analysis", "Academic Writing", "Instructional Design", "Mathematics Curriculum Planning"],

    "prog-acct-001": ["Financial Accounting", "Bookkeeping", "Auditing", "Tax Preparation", "Financial Analysis", "Excel", "Accounting Software", "Budgeting", "Financial Reporting", "Teaching Accounting"],
    "prog-acct-002": ["Bookkeeping", "Financial Analysis", "Auditing", "Taxation", "Excel", "Financial Reporting", "Budgeting", "Accounting Software", "Payroll Management", "Data Analysis"],
    "prog-acct-003": ["Administration", "Leadership", "Business Communication", "Project Management", "Team Management", "Microsoft Office", "Report Writing", "Problem Solving", "Time Management", "Organizational Skills"],

    "prog-mgmt-001": ["Leadership", "Management", "Team Building", "Communication", "Project Management", "Entrepreneurship", "Strategic Planning", "Conflict Resolution", "Decision Making", "Teaching Management"],
    "prog-mgmt-002": ["Leadership", "Project Management", "Team Management", "Business Planning", "Entrepreneurship", "Strategic Thinking", "Communication", "Negotiation", "Problem Solving", "Decision Making"],
    "prog-mgmt-003": ["Microsoft Office", "Typing", "Administrative Support", "Records Management", "Office Management", "Business Writing", "Calendar Management", "Data Entry", "Communication", "Customer Service"],
    "prog-mgmt-004": ["Typing", "Shorthand", "Microsoft Office", "Administrative Support", "Office Management", "Business Writing", "Records Management", "Data Entry", "Communication", "Customer Service"],
    "prog-mgmt-005": ["Digital Marketing", "Social Media Marketing", "Content Creation", "SEO", "Advertising", "Sales", "Branding", "Market Research", "Copywriting", "Customer Relationship Management"],
    "prog-mgmt-006": ["Recruitment", "Interviewing", "Talent Management", "Employee Relations", "Performance Management", "Training", "Conflict Resolution", "Communication", "HR Analytics", "Payroll Administration"],

    "prog-cons-001": ["Construction Management", "Quantity Surveying", "Building Technology", "Project Management", "Construction Estimation", "Site Management", "AutoCAD", "Construction Safety", "Building Materials", "Technical Drawing"],
    "prog-cons-002": ["Plumbing", "Pipe Fitting", "Gas Installation", "Welding", "Plumbing Design", "Pipe Installation", "Plumbing Maintenance", "Technical Drawing", "Building Services", "Safety Practices"],

    "prog-woods-001": ["Carpentry", "Furniture Making", "Woodworking", "Wood Machining", "Furniture Design", "Timber Processing", "Wood Finishing", "Technical Drawing", "CNC Woodworking", "Workshop Safety"],
    "prog-woods-002": ["Carpentry", "Furniture Making", "Building Construction", "Woodworking", "Technical Drawing", "Construction", "Wood Finishing", "Workshop Practice", "Building Materials", "Construction Safety"],

    "prog-arch-001": ["AutoCAD", "Civil 3D", "Structural Analysis", "Surveying", "Engineering Drawing", "Construction Management", "Structural Design", "Quantity Estimation", "Site Management", "Project Management"],

    "prog-auto-001": ["Vehicle Diagnostics", "Auto Mechanics", "Engine Repair", "Automotive Electrical Systems", "Vehicle Maintenance", "Automotive Electronics", "Welding", "AutoCAD", "Vehicle Troubleshooting", "Workshop Safety"],
    "prog-auto-002": ["AutoCAD", "SolidWorks", "CAD Design", "Machine Design", "Welding", "Manufacturing", "Mechanical Maintenance", "Engineering Drawing", "3D Modelling", "CNC Machining"],
    "prog-auto-003": ["Arc Welding", "MIG Welding", "TIG Welding", "Metal Fabrication", "Welding Inspection", "Metal Cutting", "Engineering Drawing", "Steel Fabrication", "Welding Safety", "Workshop Practice"],

    "prog-elec-001": ["Circuit Design", "Electrical Installation", "Electronics", "Arduino", "Microcontrollers", "PLC Programming", "Electrical Troubleshooting", "AutoCAD Electrical", "Solar Installation", "Electrical Safety"],
    "prog-elec-002": ["Circuit Design", "Electronics", "Electrical Installation", "Arduino", "Embedded Systems", "PLC Programming", "Circuit Troubleshooting", "PCB Design", "Electrical Wiring", "Electronics Repair"],
    "prog-elec-003": ["Solar Installation", "Solar PV Design", "Battery Systems", "Energy Auditing", "Renewable Energy Design", "Electrical Wiring", "Solar Maintenance", "Energy Management", "Power Electronics", "System Troubleshooting"],
    "prog-elec-004": ["Biomedical Equipment Maintenance", "Electronics", "Circuit Design", "Medical Equipment Troubleshooting", "Biomedical Instrumentation", "Electronics Repair", "Signal Processing", "Medical Device Testing", "Technical Documentation", "Equipment Calibration"],
    "prog-elec-005": ["Electrical Wiring", "Circuit Design", "Electronics Repair", "Electrical Installation", "Arduino", "Microcontrollers", "Solar Installation", "Electrical Troubleshooting", "PCB Design", "Electrical Safety"],

    "prog-cater-001": ["Cooking", "Baking", "Pastry Making", "Food Decoration", "Catering", "Food Safety", "Event Planning", "Hotel Management", "Food Presentation", "Customer Service"],
    "prog-cater-002": ["Cooking", "Baking", "Pastry Making", "Catering", "Food Presentation", "Event Catering", "Food Safety", "Kitchen Management", "Customer Service", "Event Planning"],

    "prog-fash-001": ["Fashion Design", "Sewing", "Tailoring", "Pattern Making", "Garment Construction", "Fashion Illustration", "Textile Design", "Embroidery", "Fashion Styling", "Clothing Production"],
    "prog-fash-002": ["Sewing", "Tailoring", "Fashion Design", "Pattern Making", "Garment Construction", "Embroidery", "Textile Design", "Fashion Illustration", "Clothing Alteration", "Fashion Styling"],

    "prog-lang-001": ["English Grammar", "Academic Writing", "Public Speaking", "Communication", "Creative Writing", "Editing", "Proofreading", "English Teaching", "Research Writing", "Presentation Skills"],
    "prog-lang-002": ["Arabic Speaking", "Arabic Writing", "Arabic Translation", "Arabic Grammar", "Arabic Reading", "Language Teaching", "Interpretation", "Public Speaking", "Academic Writing", "Communication"],
    "prog-lang-003": ["French Speaking", "French Writing", "French Translation", "French Grammar", "French Reading", "Interpretation", "Language Teaching", "Public Speaking", "Communication", "Academic Writing"],
    "prog-lang-004": ["English Speaking", "French Speaking", "Translation", "Interpretation", "Language Teaching", "Public Speaking", "Academic Writing", "Communication", "Proofreading", "Creative Writing"],
    "prog-lang-005": ["Ghanaian Language Speaking", "Ghanaian Language Writing", "Translation", "Interpretation", "Storytelling", "Language Teaching", "Public Speaking", "Cultural Communication", "Creative Writing", "Oral Literature"],
  };

  for (const [progId, courseNames] of Object.entries(programmeCourses)) {
    for (let idx = 0; idx < courseNames.length; idx++) {
      await createCourse(courseNames[idx], { programmeId: progId, levelId: pickLevel(idx, courseNames.length) });
    }
  }
  console.log("Programme courses seeded.");

  for (const [progId, skillNames] of Object.entries(programmeSkills)) {
    for (const skillName of skillNames) {
      await createSkill(skillName, { programmeId: progId });
    }
  }
  console.log("Programme skills seeded.");

  const genericCoursesByDepartment: Record<string, string[]> = {
    "dept-mathedu-001": ["Calculus I", "Calculus II", "Linear Algebra", "Statistics", "Discrete Mathematics", "Number Theory", "Abstract Algebra", "Real Analysis", "Mathematical Modelling", "Probability Theory"],
    "dept-acct-001": ["Financial Accounting", "Management Accounting", "Auditing", "Taxation", "Cost Accounting", "Financial Reporting", "Accounting Information Systems", "Business Law", "Economics", "Business Statistics"],
    "dept-mgmt-001": ["Principles of Management", "Organizational Behavior", "Marketing Management", "Human Resource Management", "Business Ethics", "Strategic Management", "Operations Management", "Business Communication", "Entrepreneurship", "Business Law"],
    "dept-cons-001": ["Construction Technology", "Building Materials", "Structural Analysis", "Construction Planning", "Surveying", "Building Services", "Construction Economics", "Project Management in Construction", "Health and Safety in Construction", "Sustainable Construction"],
    "dept-woods-001": ["Wood Technology", "Wood Processing", "Furniture Design", "Wood Finishing", "Wood Preservation", "Timber Engineering", "Wood Product Design", "Sustainable Forestry", "Wood Machining", "Wood Quality Assessment"],
    "dept-arch-001": ["Structural Engineering", "Building Technology", "Construction Materials", "Architectural Design", "Surveying", "Engineering Mathematics", "Fluid Mechanics", "Soil Mechanics", "Engineering Drawing", "Project Management"],
    "dept-auto-001": ["Automotive Engineering", "Mechanical Engineering", "Vehicle Maintenance", "Thermodynamics", "Manufacturing Processes", "Welding Technology", "Engine Technology", "Automotive Electronics", "Quality Control", "Industrial Safety"],
    "dept-elec-001": ["Electrical Circuit Theory", "Electronics", "Electrical Machines", "Power Systems", "Control Systems", "Digital Electronics", "Microprocessors", "Renewable Energy Systems", "Electrical Installation", "Instrumentation"],
    "dept-cater-001": ["Food and Beverage Service", "Culinary Arts", "Hotel Management", "Tourism Management", "Food Production", "Bakery and Pastry", "Front Office Operations", "Housekeeping Management", "Catering Operations", "Food Hygiene and Safety"],
    "dept-fash-001": ["Fashion Design Principles", "Textile Science", "Garment Construction", "Fashion Illustration", "Pattern Drafting", "Fibre and Fabric", "Fashion Merchandising", "Surface Ornamentation", "Fashion History", "Quality Control in Fashion"],
    "dept-lang-001": ["Language Teaching Methods", "Linguistics", "Literature", "Translation Studies", "Phonetics and Phonology", "Second Language Acquisition", "Curriculum Design", "Language Assessment", "Comparative Literature", "Communication Skills"],
  };

  for (const [deptId, courseNames] of Object.entries(genericCoursesByDepartment)) {
    for (let idx = 0; idx < courseNames.length; idx++) {
      await createCourse(courseNames[idx], { departmentId: deptId, levelId: pickLevel(idx, courseNames.length) });
    }
  }
  console.log("Generic department courses seeded.");

  const genericSkillsByDepartment: Record<string, string[]> = {
    "dept-mathedu-001": ["Mathematics", "Problem Solving", "Data Analysis", "Critical Thinking", "Statistical Analysis", "Quantitative Reasoning", "Algorithms", "Research Methods", "Teaching Mathematics", "Curriculum Development"],
    "dept-acct-001": ["Financial Analysis", "Bookkeeping", "Auditing", "Tax Preparation", "Budgeting", "Financial Reporting", "Data Entry", "Excel", "Accounting Software", "Business Communication"],
    "dept-mgmt-001": ["Leadership", "Team Management", "Strategic Planning", "Marketing", "Sales", "Customer Service", "Business Development", "Project Management", "Communication", "Negotiation"],
    "dept-cons-001": ["Construction Planning", "Site Supervision", "Surveying", "Quantity Surveying", "Building Inspection", "AutoCAD", "Project Management", "Cost Estimation", "Health and Safety", "Quality Assurance"],
    "dept-woods-001": ["Woodworking", "Furniture Making", "Joinery", "Wood Finishing", "Carpentry", "Design Skills", "Material Selection", "Tool Operation", "Quality Inspection", "Blueprint Reading"],
    "dept-arch-001": ["Structural Analysis", "AutoCAD", "Revit", "Project Management", "Design Thinking", "Technical Drawing", "Building Information Modelling", "Site Planning", "Construction Methods", "Sustainability Design"],
    "dept-auto-001": ["Automotive Diagnostics", "Engine Repair", "Welding", "Machining", "Electrical Systems", "Hydraulics", "Preventive Maintenance", "Quality Control", "Technical Troubleshooting", "Workshop Supervision"],
    "dept-elec-001": ["Electrical Installation", "Circuit Design", "PLC Programming", "Motor Control", "Wiring", "Testing and Inspection", "Renewable Energy Installation", "Electronics Repair", "Instrumentation", "Safety Compliance"],
    "dept-cater-001": ["Cooking", "Baking", "Food Presentation", "Guest Relations", "Event Planning", "Inventory Management", "Food Safety", "Team Leadership", "Customer Service", "Menu Planning"],
    "dept-fash-001": ["Pattern Making", "Sewing", "Fashion Illustration", "Textile Design", "Garment Construction", "Quality Control", "Merchandising", "Trend Forecasting", "CAD for Fashion", "Styling"],
    "dept-lang-001": ["Language Instruction", "Curriculum Design", "Translation", "Interpreting", "Language Assessment", "Linguistic Analysis", "Academic Writing", "Research", "Public Speaking", "Digital Literacy"],
  };

  for (const [_deptId, skillNames] of Object.entries(genericSkillsByDepartment)) {
    for (const skillName of skillNames) {
      await createSkill(skillName, { programmeId: undefined });
    }
  }
  console.log("Generic department skills seeded.");

  const learningInterests = [
    { id: "li-001", name: "One-on-One Study", description: "Personalized study sessions", isActive: true, sortOrder: 1 },
    { id: "li-002", name: "Group Study", description: "Collaborative group learning", isActive: true, sortOrder: 2 },
    { id: "li-003", name: "Peer Tutoring", description: "Teach and learn from peers", isActive: true, sortOrder: 3 },
    { id: "li-004", name: "Exam Preparation", description: "Prepare together for exams", isActive: true, sortOrder: 4 },
    { id: "li-005", name: "Assignment Discussion", description: "Discuss and solve assignments", isActive: true, sortOrder: 5 },
    { id: "li-006", name: "Project Collaboration", description: "Work on projects together", isActive: true, sortOrder: 6 },
    { id: "li-007", name: "Practice Together", description: "Practice problems and exercises", isActive: true, sortOrder: 7 },
    { id: "li-008", name: "Knowledge Sharing", description: "Share resources and knowledge", isActive: true, sortOrder: 8 },
  ];

  for (const interest of learningInterests) {
    await prisma.learningInterest.upsert({
      where: { id: interest.id },
      update: {},
      create: interest,
    });
  }
  console.log("Learning interests seeded:", learningInterests.map((li) => li.name).join(", "));

  console.log("Seeding complete.");
  await prisma.$disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
