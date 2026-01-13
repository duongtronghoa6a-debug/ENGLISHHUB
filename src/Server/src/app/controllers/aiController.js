/**
 * Gemini AI Controller
 * Handles AI-powered speaking and writing practice with Gemini API
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Speaking Practice - Evaluate pronunciation and provide feedback
 * POST /api/v1/ai/speaking/evaluate
 */
const evaluateSpeaking = async (req, res) => {
    try {
        const { transcript, targetText, topic, level = 'B1' } = req.body;

        if (!transcript) {
            return res.status(400).json({ success: false, message: 'Transcript is required' });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = targetText
            ? `You are an English speaking coach. The student was supposed to say: "${targetText}"
               They actually said: "${transcript}"
               
               Please evaluate their response and provide feedback in Vietnamese. Format your response as JSON:
               {
                   "accuracy": <percentage 0-100>,
                   "pronunciation": <score 1-10>,
                   "fluency": <score 1-10>,
                   "feedback": "<detailed feedback in Vietnamese about what they said correctly and what needs improvement>",
                   "corrections": ["<list of specific corrections if any>"],
                   "tips": ["<list of improvement tips in Vietnamese>"]
               }
               
               Be encouraging but honest. Only return valid JSON.`
            : `You are an English speaking coach. The student said the following about the topic "${topic || 'general conversation'}": "${transcript}"
               
               The student's level is ${level}. Please evaluate their speaking and provide feedback in Vietnamese. Format your response as JSON:
               {
                   "grammarScore": <score 1-10>,
                   "vocabularyScore": <score 1-10>,
                   "fluency": <score 1-10>,
                   "coherence": <score 1-10>,
                   "overallScore": <score 1-10>,
                   "feedback": "<detailed feedback in Vietnamese>",
                   "grammarCorrections": ["<list of grammar corrections with explanations>"],
                   "vocabularySuggestions": ["<better vocabulary choices>"],
                   "modelAnswer": "<a better way to express the same ideas>",
                   "tips": ["<improvement tips in Vietnamese>"]
               }
               
               Be encouraging but honest. Only return valid JSON.`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        let text = response.text();

        // Parse JSON from response
        try {
            // Clean up response - remove markdown code blocks if present
            text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const evaluation = JSON.parse(text);

            res.status(200).json({
                success: true,
                data: evaluation
            });
        } catch (parseError) {
            // If JSON parsing fails, return raw text
            res.status(200).json({
                success: true,
                data: {
                    feedback: text,
                    overallScore: 7
                }
            });
        }
    } catch (error) {
        console.error('evaluateSpeaking error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            hint: 'Make sure GEMINI_API_KEY is set in .env'
        });
    }
};

/**
 * Speaking Practice - Generate conversation prompts
 * GET /api/v1/ai/speaking/prompt
 */
const getSpeakingPrompt = async (req, res) => {
    try {
        const { topic, level = 'B1', type = 'conversation' } = req.query;

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `Generate an English speaking practice prompt for a ${level} level student.
            Topic: ${topic || 'daily life'}
            Type: ${type === 'ielts' ? 'IELTS Speaking Part 2' : 'conversational practice'}
            
            Provide your response in JSON format:
            {
                "mainQuestion": "<the main question or topic to speak about>",
                "subQuestions": ["<2-3 sub-questions to guide the response>"],
                "vocabularyHints": ["<5-6 useful vocabulary words for this topic>"],
                "timeLimit": <suggested speaking time in seconds>,
                "sampleTopics": ["<related talking points>"],
                "difficulty": "${level}"
            }
            
            Only return valid JSON.`;

        const result = await model.generateContent(prompt);
        let text = result.response.text();
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        try {
            const promptData = JSON.parse(text);
            res.status(200).json({ success: true, data: promptData });
        } catch {
            res.status(200).json({
                success: true,
                data: {
                    mainQuestion: text,
                    subQuestions: [],
                    vocabularyHints: [],
                    timeLimit: 120
                }
            });
        }
    } catch (error) {
        console.error('getSpeakingPrompt error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Writing Practice - Evaluate writing
 * POST /api/v1/ai/writing/evaluate
 */
const evaluateWriting = async (req, res) => {
    try {
        const { text, taskType, topic, level = 'B1', wordLimit } = req.body;

        if (!text) {
            return res.status(400).json({ success: false, message: 'Text is required' });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const taskDescription = taskType === 'ielts1'
            ? 'IELTS Writing Task 1 (graph/chart description)'
            : taskType === 'ielts2'
                ? 'IELTS Writing Task 2 (argumentative essay)'
                : taskType === 'email'
                    ? 'Email writing'
                    : 'General English writing';

        const prompt = `You are an English writing examiner. Evaluate this ${taskDescription} written by a ${level} student.
            Topic: ${topic || 'general'}
            Word limit: ${wordLimit || 'not specified'}
            
            Student's writing:
            """
            ${text}
            """
            
            Provide detailed feedback in Vietnamese. Format as JSON:
            {
                "wordCount": <actual word count>,
                "scores": {
                    "taskAchievement": <score 1-9 for IELTS or 1-10>,
                    "coherenceAndCohesion": <score 1-9 or 1-10>,
                    "lexicalResource": <score 1-9 or 1-10>,
                    "grammaticalRange": <score 1-9 or 1-10>,
                    "overall": <average score>
                },
                "bandScore": <IELTS band 1-9 if applicable>,
                "feedback": {
                    "strengths": ["<what the student did well>"],
                    "weaknesses": ["<areas needing improvement>"],
                    "taskAchievement": "<specific feedback on task response>",
                    "coherence": "<feedback on organization and linking>",
                    "vocabulary": "<feedback on word choice>",
                    "grammar": "<feedback on grammar usage>"
                },
                "corrections": [
                    {
                        "original": "<original phrase>",
                        "corrected": "<corrected version>",
                        "explanation": "<why this is better>"
                    }
                ],
                "improvedVersion": "<optionally rewrite 1-2 paragraphs to show improvement>",
                "tips": ["<specific tips for improvement>"]
            }
            
            Be thorough but encouraging. Only return valid JSON.`;

        const result = await model.generateContent(prompt);
        let responseText = result.response.text();
        responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        try {
            const evaluation = JSON.parse(responseText);
            res.status(200).json({ success: true, data: evaluation });
        } catch {
            res.status(200).json({
                success: true,
                data: {
                    feedback: { strengths: [responseText] },
                    scores: { overall: 6 }
                }
            });
        }
    } catch (error) {
        console.error('evaluateWriting error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Writing Practice - Generate writing prompts
 * GET /api/v1/ai/writing/prompt
 */
const getWritingPrompt = async (req, res) => {
    try {
        const { type = 'essay', level = 'B1', topic } = req.query;

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `Generate an English writing practice task for a ${level} level student.
            Type: ${type === 'ielts1' ? 'IELTS Task 1' : type === 'ielts2' ? 'IELTS Task 2' : type === 'email' ? 'Email' : 'Essay'}
            Theme: ${topic || 'any suitable topic'}
            
            Provide in JSON format:
            {
                "taskType": "${type}",
                "prompt": "<the writing task/question>",
                "instructions": ["<specific instructions>"],
                "wordLimit": {
                    "minimum": <min words>,
                    "maximum": <max words>
                },
                "timeLimit": <suggested time in minutes>,
                "tips": ["<helpful tips for this type of task>"],
                "vocabularyHints": ["<useful vocabulary>"],
                "structureSuggestion": "<suggested paragraph structure>"
            }
            
            Only return valid JSON.`;

        const result = await model.generateContent(prompt);
        let text = result.response.text();
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        try {
            const promptData = JSON.parse(text);
            res.status(200).json({ success: true, data: promptData });
        } catch {
            res.status(200).json({
                success: true,
                data: {
                    prompt: text,
                    wordLimit: { minimum: 150, maximum: 300 },
                    timeLimit: 30
                }
            });
        }
    } catch (error) {
        console.error('getWritingPrompt error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Grammar correction
 * POST /api/v1/ai/grammar/check
 */
const checkGrammar = async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ success: false, message: 'Text is required' });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `Check the grammar of this English text and provide corrections. Respond in Vietnamese.
            
            Text: "${text}"
            
            Provide in JSON format:
            {
                "hasErrors": <true/false>,
                "correctedText": "<the corrected version>",
                "errors": [
                    {
                        "original": "<original phrase>",
                        "corrected": "<corrected phrase>",
                        "type": "<grammar error type>",
                        "explanation": "<explanation in Vietnamese>"
                    }
                ],
                "overallFeedback": "<brief overall feedback in Vietnamese>"
            }
            
            Only return valid JSON.`;

        const result = await model.generateContent(prompt);
        let responseText = result.response.text();
        responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        try {
            const grammarCheck = JSON.parse(responseText);
            res.status(200).json({ success: true, data: grammarCheck });
        } catch {
            res.status(200).json({
                success: true,
                data: {
                    correctedText: responseText,
                    hasErrors: false
                }
            });
        }
    } catch (error) {
        console.error('checkGrammar error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * AI Chat conversation
 * POST /api/v1/ai/chat
 */
const aiChat = async (req, res) => {
    try {
        const { message, context = [], role = 'tutor' } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const systemContext = role === 'tutor'
            ? 'You are a friendly English tutor helping Vietnamese students learn English. Respond in a mix of English and Vietnamese when helpful. Be encouraging and provide clear explanations.'
            : 'You are an English conversation partner. Have natural conversations in English, gently correcting mistakes and teaching new vocabulary. Keep responses concise.';

        const conversationHistory = context.map(c => `${c.role}: ${c.content}`).join('\n');

        const prompt = `${systemContext}

Previous conversation:
${conversationHistory}

Student: ${message}

Respond naturally as the English ${role}. If the student makes grammar mistakes, gently correct them. Include vocabulary tips when appropriate.`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        res.status(200).json({
            success: true,
            data: {
                message: response,
                role: role
            }
        });
    } catch (error) {
        console.error('aiChat error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Speaking Practice - Evaluate audio file
 * POST /api/v1/ai/speaking/evaluate-audio
 */
const evaluateSpeakingAudio = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Audio file is required' });
        }

        const { targetText, topic, level = 'B1' } = req.body;
        const audioBuffer = req.file.buffer;
        const mimeType = req.file.mimetype;

        // Gemini 1.5+ supports audio input
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        // Convert buffer to base64
        const base64Audio = audioBuffer.toString('base64');

        const prompt = `You are an English speaking coach evaluating a student's pronunciation and speaking.
The student's level is ${level}.
${targetText ? `They were supposed to say or discuss: "${targetText}"` : ''}
${topic ? `The topic is: "${topic}"` : ''}

Listen to this audio recording and evaluate:
1. First, transcribe what the student said
2. Evaluate their pronunciation, fluency, and clarity
3. Identify any pronunciation errors
4. Provide constructive feedback in Vietnamese

Respond in JSON format:
{
    "transcription": "<what the student actually said>",
    "pronunciationScore": <score 1-10>,
    "fluencyScore": <score 1-10>,
    "clarityScore": <score 1-10>,
    "overallScore": <score 1-10>,
    "feedback": "<detailed feedback in Vietnamese about their pronunciation and speaking>",
    "pronunciationErrors": [
        {"word": "<mispronounced word>", "issue": "<what was wrong>", "correct": "<how to say it correctly>"}
    ],
    "tips": ["<improvement tips in Vietnamese>"]
}

Be encouraging but honest. Only return valid JSON.`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: mimeType,
                    data: base64Audio
                }
            }
        ]);

        let text = result.response.text();
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        try {
            const evaluation = JSON.parse(text);
            res.status(200).json({ success: true, data: evaluation });
        } catch (parseError) {
            res.status(200).json({
                success: true,
                data: {
                    feedback: text,
                    overallScore: 7
                }
            });
        }
    } catch (error) {
        console.error('evaluateSpeakingAudio error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            hint: 'Audio processing failed. Make sure GEMINI_API_KEY is valid.'
        });
    }
};

module.exports = {
    evaluateSpeaking,
    getSpeakingPrompt,
    evaluateSpeakingAudio,
    evaluateWriting,
    getWritingPrompt,
    checkGrammar,
    aiChat
};
