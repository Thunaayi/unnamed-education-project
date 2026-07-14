const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ── BSEK 9th Grade Mathematics Topics ──────────────────────────
const TOPICS = [
  { name: 'Algebraic Identities',        subject: 'Mathematics', frequency: 8,  marks_weight: 12, priority: 'high' },
  { name: 'Trigonometry',                subject: 'Mathematics', frequency: 7,  marks_weight: 10, priority: 'high' },
  { name: 'Quadratic Equations',         subject: 'Mathematics', frequency: 6,  marks_weight: 8,  priority: 'medium' },
  { name: 'Logarithms',                  subject: 'Mathematics', frequency: 5,  marks_weight: 6,  priority: 'medium' },
  { name: 'Linear Graphs',               subject: 'Mathematics', frequency: 4,  marks_weight: 5,  priority: 'medium' },
  { name: 'Polynomials',                 subject: 'Mathematics', frequency: 6,  marks_weight: 7,  priority: 'high' },
  { name: 'Inequalities',                subject: 'Mathematics', frequency: 4,  marks_weight: 5,  priority: 'medium' },
  { name: 'Geometry',                    subject: 'Mathematics', frequency: 7,  marks_weight: 10, priority: 'high' },
  { name: 'Complex Numbers',             subject: 'Mathematics', frequency: 3,  marks_weight: 4,  priority: 'low' },
  { name: 'Matrices',                    subject: 'Mathematics', frequency: 5,  marks_weight: 6,  priority: 'medium' },
  { name: 'Kinematics',                  subject: 'Physics',     frequency: 7,  marks_weight: 10, priority: 'high' },
  { name: 'Dynamics',                    subject: 'Physics',     frequency: 6,  marks_weight: 9,  priority: 'high' },
  { name: 'Work & Energy',               subject: 'Physics',     frequency: 5,  marks_weight: 7,  priority: 'medium' },
  { name: 'Properties of Matter',        subject: 'Physics',     frequency: 4,  marks_weight: 6,  priority: 'medium' },
  { name: 'Heat',                        subject: 'Physics',     frequency: 3,  marks_weight: 5,  priority: 'low' },
  { name: 'Chemical Bonding',            subject: 'Chemistry',   frequency: 6,  marks_weight: 8,  priority: 'high' },
  { name: 'Periodic Table',              subject: 'Chemistry',   frequency: 5,  marks_weight: 7,  priority: 'medium' },
  { name: 'Acids & Bases',               subject: 'Chemistry',   frequency: 6,  marks_weight: 8,  priority: 'high' },
  { name: 'Organic Chemistry',           subject: 'Chemistry',   frequency: 4,  marks_weight: 6,  priority: 'medium' },
  { name: 'Cell Biology',                subject: 'Biology',     frequency: 7,  marks_weight: 10, priority: 'high' },
  { name: 'Human Physiology',            subject: 'Biology',     frequency: 6,  marks_weight: 9,  priority: 'high' },
  { name: 'Genetics',                    subject: 'Biology',     frequency: 5,  marks_weight: 7,  priority: 'medium' },
  { name: 'Ecosystem',                   subject: 'Biology',     frequency: 3,  marks_weight: 5,  priority: 'low' },
];

// ── Questions for each topic ────────────────────────────────────
const MCQ_BY_TOPIC = {
  'Algebraic Identities': [
    { q: 'What is the expansion of (a + b)²?',                opts: ['a² + b²', 'a² + 2ab + b²', 'a² - 2ab + b²', '2a + 2b'], correct: 1 },
    { q: 'What is the value of (x + y)(x - y)?',             opts: ['x² + y²', 'x² - y²', 'x² + 2xy + y²', '0'], correct: 1 },
    { q: 'Factorize: a² + 2ab + b²',                        opts: ['(a + b)(a - b)', '(a + b)²', '(a - b)²', 'a(a + 2b)'], correct: 1 },
  ],
  Trigonometry: [
    { q: 'What is the value of sin 90°?',                    opts: ['0', '1', '-1', '0.5'], correct: 1 },
    { q: 'What is the value of cos 0°?',                     opts: ['0', '1', '-1', '0.5'], correct: 1 },
    { q: 'What is tan θ equal to?',                          opts: ['sin θ / cos θ', 'cos θ / sin θ', '1 / sin θ', '1 / cos θ'], correct: 0 },
  ],
  'Quadratic Equations': [
    { q: 'What is the standard form of a quadratic equation?', opts: ['ax + b = 0', 'ax² + bx + c = 0', 'ax³ + bx² + c = 0', 'a + b = c'], correct: 1 },
    { q: 'What is the discriminant of ax² + bx + c?',         opts: ['b² - 4ac', 'b² + 4ac', '2ab - c', '4ac - b²'], correct: 0 },
  ],
  Logarithms: [
    { q: 'What is logₐ 1 equal to?',                         opts: ['1', '0', 'a', 'undefined'], correct: 1 },
    { q: 'What is logₐ a equal to?',                         opts: ['0', '1', 'a', 'log a'], correct: 1 },
  ],
  Geometry: [
    { q: 'What is the sum of angles in a triangle?',          opts: ['180°', '360°', '90°', '270°'], correct: 0 },
    { q: 'What is a triangle with all sides equal called?',   opts: ['Isosceles', 'Scalene', 'Equilateral', 'Right'], correct: 2 },
    { q: 'The longest side of a right triangle is called?',   opts: ['Base', 'Perpendicular', 'Hypotenuse', 'Altitude'], correct: 2 },
  ],
  'Complex Numbers': [
    { q: 'What is the value of i²?',                          opts: ['1', '-1', 'i', '-i'], correct: 1 },
    { q: 'What is the real part of 3 + 4i?',                  opts: ['3', '4', '7', 'i'], correct: 0 },
  ],
  Kinematics: [
    { q: 'What is the SI unit of velocity?',                  opts: ['m/s', 'm/s²', 'N', 'J'], correct: 0 },
    { q: 'What is acceleration due to gravity on Earth?',     opts: ['9.8 m/s²', '0 m/s²', '10 N', '9.8 m/s'], correct: 0 },
  ],
  Dynamics: [
    { q: 'Newton\'s First Law is also known as?',             opts: ['Law of Acceleration', 'Law of Inertia', 'Law of Action-Reaction', 'Law of Gravitation'], correct: 1 },
    { q: 'Force is equal to?',                                opts: ['m × a', 'm / a', 'a / m', 'm + a'], correct: 0 },
  ],
  'Work & Energy': [
    { q: 'What is the SI unit of work?',                      opts: ['Newton', 'Joule', 'Watt', 'Pascal'], correct: 1 },
    { q: 'Kinetic energy depends on?',                        opts: ['Mass only', 'Velocity only', 'Mass and velocity', 'Height only'], correct: 2 },
  ],
  'Chemical Bonding': [
    { q: 'What type of bond forms between Na and Cl?',        opts: ['Covalent', 'Ionic', 'Metallic', 'Hydrogen'], correct: 1 },
    { q: 'A covalent bond involves?',                         opts: ['Transfer of electrons', 'Sharing of electrons', 'Loss of protons', 'Gain of neutrons'], correct: 1 },
  ],
  'Acids & Bases': [
    { q: 'What is the pH of a neutral solution?',             opts: ['0', '7', '14', '1'], correct: 1 },
    { q: 'Which acid is found in lemons?',                    opts: ['Sulfuric acid', 'Nitric acid', 'Citric acid', 'Acetic acid'], correct: 2 },
  ],
  'Cell Biology': [
    { q: 'Which organelle is the powerhouse of the cell?',    opts: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi body'], correct: 2 },
    { q: 'The cell membrane is made of?',                     opts: ['Cellulose', 'Phospholipid bilayer', 'Protein only', 'Carbohydrate'], correct: 1 },
  ],
  'Human Physiology': [
    { q: 'How many chambers does the human heart have?',       opts: ['2', '3', '4', '5'], correct: 2 },
    { q: 'Which gas do red blood cells carry?',                opts: ['CO₂', 'N₂', 'O₂', 'H₂'], correct: 2 },
  ],
};

const SHORT_BY_TOPIC = {
  'Algebraic Identities': [
    { q: 'Factorize: x² - y²', m: 5 },
    { q: 'If a + b = 7 and ab = 12, find a² + b²', m: 5 },
  ],
  'Trigonometry': [
    { q: 'Prove that sin²θ + cos²θ = 1', m: 5 },
    { q: 'If tan A = 3/4, find sin A and cos A', m: 5 },
  ],
  'Quadratic Equations': [
    { q: 'Solve: x² - 5x + 6 = 0', m: 5 },
    { q: 'Find the discriminant of 2x² + 3x - 5 = 0', m: 4 },
  ],
  'Logarithms': [
    { q: 'Simplify: log₂ 8 + log₂ 4', m: 4 },
    { q: 'If logₓ 81 = 4, find x', m: 4 },
  ],
  'Linear Graphs': [
    { q: 'Plot the graph of y = 2x + 1', m: 5 },
    { q: 'Find the slope of the line passing through (1,2) and (3,6)', m: 5 },
  ],
  'Polynomials': [
    { q: 'Find the degree of polynomial: 3x⁴ + 2x² - x + 7', m: 3 },
    { q: 'Add: (3x² + 2x - 1) + (x² - 4x + 5)', m: 4 },
  ],
  'Geometry': [
    { q: 'Prove that opposite angles of a parallelogram are equal', m: 5 },
    { q: 'A triangle has sides 5, 12, 13. Is it right-angled?', m: 5 },
  ],
  'Matrices': [
    { q: 'Find the determinant of [[2, 3], [1, 4]]', m: 4 },
    { q: 'Add: [[1, 2], [3, 4]] + [[5, 6], [7, 8]]', m: 4 },
  ],
  'Kinematics': [
    { q: 'A car accelerates from rest at 2 m/s². Find its velocity after 5 seconds', m: 5 },
    { q: 'Define velocity and acceleration', m: 4 },
  ],
  'Dynamics': [
    { q: 'A 5 kg object is pushed with 20 N. Find acceleration', m: 5 },
    { q: 'State Newton\'s three laws of motion', m: 5 },
  ],
  'Acids & Bases': [
    { q: 'What is the difference between an acid and a base?', m: 5 },
    { q: 'Write the chemical equation for neutralization', m: 4 },
  ],
  'Cell Biology': [
    { q: 'Draw and label a typical plant cell', m: 5 },
    { q: 'Differentiate between plant and animal cells', m: 5 },
  ],
};

const DETAILED_BY_TOPIC = [
  { q: 'Solve the quadratic equation 3x² - 5x + 2 = 0 using the quadratic formula. Show all steps.', m: 10, topic: 'Quadratic Equations' },
  { q: 'Prove the Pythagorean theorem using geometric construction. Include a diagram.', m: 10, topic: 'Geometry' },
  { q: 'A ball is thrown vertically upward with initial velocity 20 m/s. Calculate (a) maximum height (b) time to reach top (c) total time of flight.', m: 10, topic: 'Kinematics' },
  { q: 'Using algebraic identities, prove that (a + b + c)² = a² + b² + c² + 2ab + 2bc + 2ca. Give a numerical example.', m: 10, topic: 'Algebraic Identities' },
  { q: 'In a right triangle ABC with right angle at B, AB = 3, BC = 4. Find sin A, cos A, tan A. Hence verify sin²A + cos²A = 1.', m: 10, topic: 'Trigonometry' },
  { q: 'Describe the structure of DNA and explain its role in protein synthesis.', m: 10, topic: 'Genetics' },
];

async function seed() {
  console.log('Seeding BSEK 9th Grade exam preparation data...\n');

  // ── 1. Upsert Topics ─────────────────────────────────────────
  console.log('Upserting topics...');
  const topicMap = {};
  for (const t of TOPICS) {
    const { data, error } = await supabase
      .from('topics')
      .upsert({ name: t.name, subject: t.subject, frequency: t.frequency, marks_weight: t.marks_weight, priority: t.priority }, { onConflict: 'name' })
      .select('id, name')
      .single();
    if (error) { console.error(`  ERROR: ${t.name}:`, error.message); continue; }
    topicMap[data.name] = data.id;
    console.log(`  ${t.name} (${t.subject}) → ${data.id.slice(0,8)}…`);
  }

  // ── 2. Create Exams ──────────────────────────────────────────
  const EXAM_YEARS = [2024, 2023];
  const examIds = {};
  for (const year of EXAM_YEARS) {
    const { data, error } = await supabase
      .from('exams')
      .upsert({
        year, subject: 'Mathematics', board: 'BSEK', grade: 9, group: 'Science',
        total_marks: 75, time_hours: 3,
        source_files: [`${year}_paper.jpg`],
        pages_found: [1, 2, 3, 4],
      }, { onConflict: 'year' })
      .select('id')
      .single();
    if (error) { console.error(`  ERROR exam ${year}:`, error.message); continue; }
    examIds[year] = data.id;
    console.log(`\nExam ${year} → ${data.id.slice(0,8)}…`);

    // ── 3. Insert Section A (MCQ) Questions ────────────────────
    const mcqTopics = Object.keys(MCQ_BY_TOPIC);
    for (let i = 0; i < 15; i++) {
      const topicName = mcqTopics[i % mcqTopics.length];
      const questions = MCQ_BY_TOPIC[topicName];
      const qi = i % questions.length;
      const qd = questions[qi];
      const topicId = topicMap[topicName];

      const { data: q, error: qe } = await supabase
        .from('questions')
        .insert({
          exam_id: data.id,
          topic_id: topicId,
          section: 'A',
          type: 'mcq',
          question_number: String(i + 1),
          question_text: qd.q,
          marks: 1,
        })
        .select('id')
        .single();

      if (qe) { console.error(`    ERROR MCQ ${i + 1}:`, qe.message); continue; }

      const { error: oe } = await supabase
        .from('mcq_options')
        .insert(qd.opts.map((text, idx) => ({
          question_id: q.id,
          option_text: text,
          is_correct: idx === qd.correct,
          display_order: idx,
        })));

      if (oe) console.error(`    ERROR MCQ options ${i + 1}:`, oe.message);
      else if (i % 5 === 0) console.log(`  Section A: ${i + 1}/15 MCQs inserted`);
    }

    // ── 4. Insert Section B (Short Answer) Questions ───────────
    const shortTopics = Object.keys(SHORT_BY_TOPIC);
    for (let i = 0; i < 6; i++) {
      const topicName = shortTopics[i % shortTopics.length];
      const questions = SHORT_BY_TOPIC[topicName];
      const qi = i % questions.length;
      const qd = questions[qi];
      const topicId = topicMap[topicName];

      const { error: qe } = await supabase
        .from('questions')
        .insert({
          exam_id: data.id,
          topic_id: topicId,
          section: 'B',
          type: 'short_answer',
          question_number: String(i + 1),
          question_text: qd.q,
          marks: qd.m,
        });

      if (qe) console.error(`    ERROR Short ${i + 1}:`, qe.message);
      else if (i % 3 === 0) console.log(`  Section B: ${i + 1}/6 short questions inserted`);
    }

    // ── 5. Insert Section C (Detailed) Questions ───────────────
    for (let i = 0; i < 3; i++) {
      const qd = DETAILED_BY_TOPIC[(year * 3 + i) % DETAILED_BY_TOPIC.length];
      const topicId = topicMap[qd.topic];

      const { error: qe } = await supabase
        .from('questions')
        .insert({
          exam_id: data.id,
          topic_id: topicId,
          section: 'C',
          type: 'detailed_answer',
          question_number: String(i + 1),
          question_text: qd.q,
          marks: qd.m,
        });

      if (qe) console.error(`    ERROR Detailed ${i + 1}:`, qe.message);
      else if (i === 0) console.log(`  Section C: 3 detailed questions inserted`);
    }
  }

  console.log('\n✓ Seeding complete!');
  console.log('  Topics seeded:', TOPICS.length);
  console.log('  Exams seeded:', EXAM_YEARS.length);
  console.log('  MCQs seeded: 30 (15 per exam × 2 exams)');
  console.log('  Short Qs: 12 (6 per exam × 2 exams)');
  console.log('  Detailed Qs: 6 (3 per exam × 2 exams)');
}

seed().catch(console.error);
