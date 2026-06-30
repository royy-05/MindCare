const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        default: () => Math.random().toString(36).substr(2, 12) + Date.now().toString(36),
        unique: true
    },
    assessmentType: {
        type: String,
        required: true,
        enum: ['phq9', 'gad7']
    },
    answers: {
        type: Map,
        of: Number,
        required: true,
        validate: {
            validator: function(answers) {
                // Validate that all answers are between 0-3
                for (let [key, value] of answers) {
                    if (value < 0 || value > 3 || !Number.isInteger(value)) {
                        return false;
                    }
                }
                
                // Check question count based on assessment type
                const expectedCount = this.assessmentType === 'phq9' ? 9 : 7;
                return answers.size === expectedCount;
            },
            message: 'Invalid answers format or count'
        }
    },
    totalScore: {
        type: Number,
        required: true,
        min: 0,
        validate: {
            validator: function(score) {
                const maxScore = this.assessmentType === 'phq9' ? 27 : 21;
                return score <= maxScore;
            },
            message: 'Score exceeds maximum for assessment type'
        }
    },
    interpretation: {
        level: {
            type: String,
            required: true,
            enum: ['Minimal', 'Mild', 'Moderate', 'Moderately Severe', 'Severe']
        },
        message: {
            type: String,
            required: true
        },
        color: {
            type: String,
            required: true,
            match: /^#[0-9A-Fa-f]{6}$/
        }
    },
    recommendations: [{
        type: String,
        required: true
    }],
    riskLevel: {
        type: String,
        required: true,
        enum: ['low', 'medium', 'high', 'crisis'],
        default: 'low'
    },
    completedAt: {
        type: Date,
        default: Date.now
    },
    ipAddress: {
        type: String,
        required: false
    },
    userAgent: {
        type: String,
        required: false
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

// Indexes for better query performance
assessmentSchema.index({ assessmentType: 1, completedAt: -1 });
assessmentSchema.index({ riskLevel: 1, completedAt: -1 });
assessmentSchema.index({ sessionId: 1 }, { unique: true });

// Virtual for assessment name
assessmentSchema.virtual('assessmentName').get(function() {
    return this.assessmentType === 'phq9' ? 'PHQ-9 Depression Screening' : 'GAD-7 Anxiety Screening';
});

// Method to check if assessment indicates crisis
assessmentSchema.methods.isCrisis = function() {
    return this.riskLevel === 'crisis' || 
           (this.assessmentType === 'phq9' && this.answers.get('9') > 0);
};

// Static method to get risk statistics
assessmentSchema.statics.getRiskStats = async function(assessmentType = null) {
    const match = assessmentType ? { assessmentType } : {};
    
    return await this.aggregate([
        { $match: match },
        {
            $group: {
                _id: '$riskLevel',
                count: { $sum: 1 },
                avgScore: { $avg: '$totalScore' }
            }
        }
    ]);
};

// Pre-save middleware to capture additional data
assessmentSchema.pre('save', function(next) {
    // Log high-risk assessments
    if (this.riskLevel === 'high' || this.riskLevel === 'crisis') {
        console.log(`High-risk ${this.assessmentType} assessment:`, {
            sessionId: this.sessionId,
            score: this.totalScore,
            level: this.interpretation.level,
            timestamp: this.completedAt
        });
    }
    next();
});

module.exports = mongoose.model('Assessment', assessmentSchema);