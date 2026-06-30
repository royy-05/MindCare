const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        minlength: [2, 'Full name must be at least 2 characters'],
        maxlength: [50, 'Full name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false // Don't return password by default
    },
    
    // ADD THESE NEW FIELDS:
    userType: {
        type: String,
        enum: ['patient', 'therapist'],
        default: 'patient'
    },
    dateOfBirth: Date,
    gender: String,
    termsAccepted: {
        type: Boolean,
        default: false
    },
    
    // Therapist-specific fields
    licenseNumber: {
        type: String,
        required: function() { return this.userType === 'therapist'; }
    },
    licenseType: {
        type: String,
        required: function() { return this.userType === 'therapist'; }
    },
    yearsExperience: {
        type: String,
        required: function() { return this.userType === 'therapist'; }
    },
    specializations: [{
        type: String
    }],
    professionalBio: String,
    
    // Keep existing fields
    isActive: {
        type: Boolean,
        default: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    profilePicture: {
        type: String,
        default: null
    },
    lastLogin: {
        type: Date,
        default: null
    },
    assessmentResults: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assessment'
    }],
    chatSessions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatSession'
    }]
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
};

// Add method to get public profile
userSchema.methods.getPublicProfile = function() {
    const profile = {
        id: this._id,
        fullName: this.fullName,
        email: this.email,
        userType: this.userType,
        isVerified: this.isVerified,
        createdAt: this.createdAt
    };
    
    // Add therapist-specific data if user is a therapist
    if (this.userType === 'therapist') {
        profile.licenseType = this.licenseType;
        profile.specializations = this.specializations;
        profile.yearsExperience = this.yearsExperience;
        profile.professionalBio = this.professionalBio;
    }
    
    return profile;
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

module.exports = mongoose.model('User', userSchema);