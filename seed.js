const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Or SERVICE_ROLE_KEY if bypassing RLS

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  const data = JSON.parse(fs.readFileSync('structured_questions.json', 'utf8'));

  console.log(`Starting to seed ${data.length} exams...`);

  for (const examData of data) {
    console.log(`\nProcessing Exam ${examData.year}...`);

    // 1. Insert Exam
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .upsert(
        {
          year: examData.year,
          subject: examData.subject || 'Mathematics',
          board: examData.board || 'BSEK',
          grade: examData.grade || 9,
          group: examData.group || 'Science',
          total_marks: examData.total_marks || 75,
          time_hours: examData.time_hours || 3,
          source_files: examData.source_files || [],
          pages_found: examData.pages_found || [],
        },
        { onConflict: 'year' }
      )
      .select()
      .single();

    if (examError) {
      console.error(`Error inserting exam ${examData.year}:`, examError);
      continue;
    }

    const examId = exam.id;

    // 2. Process Sections
    for (const [sectionKey, sectionObj] of Object.entries(examData.sections)) {
      if (sectionObj.type === 'unparsed') continue;

      console.log(`  Seeding Section ${sectionKey} (${sectionObj.questions?.length || 0} questions)...`);

      for (const q of sectionObj.questions || []) {
        // Find or create topic
        let topicId = null;
        if (q.topic) {
          const { data: topic } = await supabase
            .from('topics')
            .upsert({ name: q.topic, priority: 'medium' }, { onConflict: 'name' })
            .select('id')
            .single();
          if (topic) topicId = topic.id;
        }

        // Insert Question
        const { data: question, error: questionError } = await supabase
          .from('questions')
          .insert({
            exam_id: examId,
            topic_id: topicId,
            section: sectionKey,
            type: sectionObj.type,
            question_number: String(q.number),
            question_text: q.question_text,
            marks: q.marks || 1,
            has_alternative: !!q.has_alternative,
            alternative_text: q.alternative_text || null,
          })
          .select()
          .single();

        if (questionError) {
          console.error(`Error inserting question ${q.number}:`, questionError);
          continue;
        }

        // Insert Options if MCQ
        if (sectionObj.type === 'mcq' && q.options && q.options.length > 0) {
          const optionsData = q.options.map((optText, index) => ({
            question_id: question.id,
            option_text: optText,
            is_correct: q.correct_answer === optText,
            display_order: index,
          }));

          const { error: optionsError } = await supabase
            .from('mcq_options')
            .insert(optionsData);

          if (optionsError) {
            console.error(`Error inserting options for question ${q.number}:`, optionsError);
          }
        }
      }
    }
  }

  console.log('\nSeeding completed!');
}

seed().catch(console.error);
