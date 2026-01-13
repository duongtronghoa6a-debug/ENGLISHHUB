/**
 * 04. Exams Seeder
 * Creates exams and questions from exam.json and placement_test.json
 */

const { v4: uuidv4, validate: uuidValidate } = require('uuid');
const db = require('../../../src/app/models');
const { loadJsonFile, TEST_ACCOUNTS } = require('../helpers/seedUtils');

// Helper to convert non-UUID IDs to UUIDs
function toUUID(id) {
    if (uuidValidate(id)) {
        return id;
    }
    // Generate deterministic UUID from string ID
    // Using a hash-like approach for consistency
    const hash = id.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
    }, 0);
    return `00000000-0000-0000-0000-${Math.abs(hash).toString().padStart(12, '0').slice(0, 12)}`;
}

async function seedExams() {
    console.log('\n📌 [04] Seeding Exams & Questions...');

    // Get teacher for creator_id
    const creatorId = TEST_ACCOUNTS.TEACHER.id;

    // Seed from exam.json
    const examData = loadJsonFile('exam.json');
    if (examData) {
        await seedExamJsonData(examData, creatorId);
    }

    // Seed placement test
    const placementData = loadJsonFile('placement_test.json');
    if (placementData) {
        await seedPlacementTest(placementData, creatorId);
    }

    console.log('  ✅ Exams & questions seeding complete');
}

async function seedExamJsonData(examData, creatorId) {
    // exam.json is an array of batches: [{batch: "1/4", data: {...}}, ...]
    const batches = Array.isArray(examData) ? examData : [examData];

    let examCount = 0;
    let questionCount = 0;
    let errorCount = 0;

    for (const batch of batches) {
        const data = batch.data || batch;

        // STEP 1: Create Questions FIRST
        if (data.questions && Array.isArray(data.questions)) {
            for (const q of data.questions) {
                try {
                    // Skip comment entries (no id)
                    if (!q.id) continue;

                    const questionId = toUUID(q.id);

                    await db.Question.findOrCreate({
                        where: { id: questionId },
                        defaults: {
                            id: questionId,
                            creator_id: creatorId,
                            skill: q.skill || 'grammar',
                            type: q.type || 'multiple_choice',
                            level: q.level || 'B1',
                            content_text: q.content_text || q.question || '',
                            media_url: q.media_url || null,
                            media_type: q.media_type || 'none',
                            options: q.options || null,
                            correct_answer: q.correct_answer || null,
                            explanation: q.explanation || null
                        }
                    });
                    questionCount++;
                } catch (error) {
                    // Ignore duplicates
                }
            }
        }

        // STEP 2: Create Exams (after questions exist)
        if (data.exams && Array.isArray(data.exams)) {
            for (const exam of data.exams) {
                try {
                    const examId = toUUID(exam.id);
                    const questionIds = (exam.list_question_ids || []).map(qid => toUUID(qid));

                    await db.Exam.findOrCreate({
                        where: { title: exam.title },
                        defaults: {
                            id: examId,
                            creator_id: creatorId,
                            title: exam.title,
                            description: exam.description || '',
                            duration_minutes: exam.duration_minutes || 60,
                            pass_score: exam.pass_score || 60,
                            grading_method: exam.grading_method || 'auto',
                            list_question_ids: questionIds,
                            status: exam.status === 'published' ? 'published' : 'draft'
                        }
                    });
                    examCount++;
                } catch (error) {
                    errorCount++;
                    if (errorCount <= 3) {
                        console.error(`  ⚠️ Error creating exam "${exam.title}":`, error.message);
                    }
                }
            }
        }
    }

    if (errorCount > 3) {
        console.log(`  ... and ${errorCount - 3} more errors`);
    }
    console.log(`  ✅ Created ${questionCount} questions from exam.json`);
    console.log(`  ✅ Created ${examCount} exams from exam.json`);
}

async function seedPlacementTest(data, creatorId) {
    // Create placement test exam with a proper UUID
    const placementExamId = '00000000-0000-0000-0001-000000000001';

    const questionIds = [];

    // STEP 1: Create Questions FIRST
    if (data.questions && Array.isArray(data.questions)) {
        for (const q of data.questions) {
            try {
                if (!q.id) continue;

                const questionId = toUUID(q.id);
                questionIds.push(questionId);

                await db.Question.findOrCreate({
                    where: { id: questionId },
                    defaults: {
                        id: questionId,
                        creator_id: creatorId,
                        skill: q.skill || 'grammar',
                        type: q.type || 'multiple_choice',
                        level: q.level || 'B1',
                        content_text: q.content_text || q.question || '',
                        media_url: q.media_url || null,
                        media_type: q.media_type || 'none',
                        options: q.options || null,
                        correct_answer: q.correct_answer || null,
                        explanation: q.explanation || null
                    }
                });
            } catch (error) {
                // Ignore duplicates
            }
        }
    }

    // STEP 2: Create Exam
    try {
        await db.Exam.findOrCreate({
            where: { title: 'Placement Test' },
            defaults: {
                id: placementExamId,
                creator_id: creatorId,
                title: 'Placement Test',
                description: 'Bài kiểm tra xác định trình độ tiếng Anh. 40 câu hỏi từ A1 đến C1 bao gồm Listening, Grammar, Vocabulary, Reading, Writing và Speaking.',
                duration_minutes: 45,
                pass_score: 50,
                grading_method: 'hybrid',
                list_question_ids: questionIds,
                status: 'published'
            }
        });
        console.log(`  ✅ Created Placement Test with ${questionIds.length} questions`);
    } catch (error) {
        console.error('  ⚠️ Error creating placement test:', error.message);
    }
}

module.exports = seedExams;
