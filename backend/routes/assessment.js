const express = require('express');
const router = express.Router();
const Assessment = require('../models/Assessment');

// Submit assessment results
router.post('/submit', async (req, res) => {
    try {
        const { assessmentType, answers, score, interpretation } = req.body;

        // Validate input
        if (!assessmentType || !answers || score === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Validate assessment type
        if (!['phq9', 'gad7'].includes(assessmentType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid assessment type'
            });
        }

        // Validate score ranges
        const maxScore = assessmentType === 'phq9' ? 27 : 21;
        if (score < 0 || score > maxScore) {
            return res.status(400).json({
                success: false,
                message: 'Invalid score range'
            });
        }

        // Calculate interpretation and recommendations
        const result = calculateResults(assessmentType, score, answers);

        // Create assessment record
        const assessment = new Assessment({
            assessmentType,
            answers: new Map(Object.entries(answers)),
            totalScore: score,
            interpretation: {
                level: result.interpretation.level,
                message: result.interpretation.message,
                color: result.interpretation.color
            },
            recommendations: result.recommendations,
            riskLevel: result.riskLevel,
            completedAt: new Date(),
            ipAddress: req.ip
        });

        await assessment.save();

        // Check for crisis situation (PHQ-9 question 9)
        if (assessmentType === 'phq9' && answers['9'] && answers['9'] > 0) {
            console.log('🚨 CRISIS ALERT: User indicated suicidal ideation', {
                sessionId: assessment.sessionId,
                score: score,
                timestamp: new Date()
            });
        }

        res.json({
            success: true,
            data: {
                sessionId: assessment.sessionId,
                score: score,
                interpretation: result.interpretation,
                recommendations: result.recommendations,
                riskLevel: result.riskLevel
            }
        });

    } catch (error) {
        console.error('Assessment submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit assessment'
        });
    }
});

// Get assessment statistics (optional)
router.get('/stats', async (req, res) => {
    try {
        const stats = await Assessment.aggregate([
            {
                $group: {
                    _id: '$assessmentType',
                    count: { $sum: 1 },
                    avgScore: { $avg: '$totalScore' },
                    highRisk: {
                        $sum: {
                            $cond: [{ $eq: ['$riskLevel', 'high'] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get statistics'
        });
    }
});

// Helper function to calculate results
function calculateResults(assessmentType, score, answers) {
    let interpretation, recommendations, riskLevel;

    if (assessmentType === 'phq9') {
        // PHQ-9 interpretation
        if (score <= 4) {
            interpretation = { level: 'Minimal', color: '#27ae60', message: 'Your responses suggest minimal depression symptoms.' };
            riskLevel = 'low';
        } else if (score <= 9) {
            interpretation = { level: 'Mild', color: '#f39c12', message: 'Your responses suggest mild depression symptoms.' };
            riskLevel = 'medium';
        } else if (score <= 14) {
            interpretation = { level: 'Moderate', color: '#e67e22', message: 'Your responses suggest moderate depression symptoms.' };
            riskLevel = 'medium';
        } else if (score <= 19) {
            interpretation = { level: 'Moderately Severe', color: '#d35400', message: 'Your responses suggest moderately severe depression symptoms.' };
            riskLevel = 'high';
        } else {
            interpretation = { level: 'Severe', color: '#c0392b', message: 'Your responses suggest severe depression symptoms.' };
            riskLevel = 'high';
        }

        // PHQ-9 recommendations
        if (score <= 4) {
            recommendations = [
                'Continue maintaining your current mental wellness practices',
                'Consider regular exercise and mindfulness activities',
                'Maintain healthy sleep and nutrition habits'
            ];
        } else if (score <= 9) {
            recommendations = [
                'Try stress reduction techniques and relaxation exercises',
                'Consider speaking with a counselor if symptoms persist',
                'Maintain regular sleep and exercise routines'
            ];
        } else if (score <= 14) {
            recommendations = [
                'We recommend speaking with a mental health professional',
                'Consider counseling or therapy services',
                'Reach out to friends, family, or support groups'
            ];
        } else {
            recommendations = [
                'We strongly recommend immediate consultation with a mental health professional',
                'Contact your local counseling center or healthcare provider',
                'Consider crisis support resources if needed'
            ];
            
            if (answers['9'] && answers['9'] > 0) {
                recommendations.push('⚠️ If you are having thoughts of self-harm, please contact emergency services or a crisis hotline immediately');
                riskLevel = 'crisis';
            }
        }
    } else {
        // GAD-7 interpretation
        if (score <= 4) {
            interpretation = { level: 'Minimal', color: '#27ae60', message: 'Your responses suggest minimal anxiety symptoms.' };
            riskLevel = 'low';
        } else if (score <= 9) {
            interpretation = { level: 'Mild', color: '#f39c12', message: 'Your responses suggest mild anxiety symptoms.' };
            riskLevel = 'medium';
        } else if (score <= 14) {
            interpretation = { level: 'Moderate', color: '#e67e22', message: 'Your responses suggest moderate anxiety symptoms.' };
            riskLevel = 'medium';
        } else {
            interpretation = { level: 'Severe', color: '#c0392b', message: 'Your responses suggest severe anxiety symptoms.' };
            riskLevel = 'high';
        }

        // GAD-7 recommendations
        if (score <= 4) {
            recommendations = [
                'Continue your current stress management practices',
                'Regular relaxation and mindfulness can help maintain low anxiety levels'
            ];
        } else if (score <= 9) {
            recommendations = [
                'Try deep breathing exercises and progressive muscle relaxation',
                'Consider reducing caffeine intake and maintaining regular sleep'
            ];
        } else {
            recommendations = [
                'We recommend speaking with a mental health professional about anxiety management',
                'Consider therapy techniques like Cognitive Behavioral Therapy (CBT)',
                'Practice anxiety reduction techniques and seek support'
            ];
        }
    }

    return { interpretation, recommendations, riskLevel };
}

module.exports = router;