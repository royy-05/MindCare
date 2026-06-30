const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/user');

// Generate JWT Token
const generateToken = (userId) => {
    return jwt.sign(
        { userId, timestamp: Date.now() },
        process.env.JWT_SECRET || 'your-fallback-secret-key',
        { expiresIn: '7d' }
    );
};

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array().map(err => ({
                    field: err.param,
                    message: err.msg
                }))
            });
        }

        const { 
            fullName, 
            email, 
            password, 
            userType = 'patient', // Default to patient if not specified
            dateOfBirth,
            gender,
            termsAccepted,
            // Therapist-specific fields
            licenseNumber,
            licenseType,
            yearsExperience,
            specializations,
            professionalBio
        } = req.body;

        console.log('📝 Signup request:', {
            fullName,
            email,
            userType,
            hasTherapistFields: !!(licenseNumber || licenseType)
        });

        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists'
            });
        }

        // Create user object with common fields
        const userData = {
            fullName: fullName.trim(),
            email: email.toLowerCase().trim(),
            password: password,
            userType: userType,
            dateOfBirth,
            gender,
            termsAccepted
        };

        // Add therapist-specific fields if user is a therapist
        if (userType === 'therapist') {
            userData.licenseNumber = licenseNumber;
            userData.licenseType = licenseType;
            userData.yearsExperience = yearsExperience;
            userData.specializations = specializations || [];
            userData.professionalBio = professionalBio;
            
            console.log('👨‍⚕️ Therapist data:', {
                licenseNumber: userData.licenseNumber,
                licenseType: userData.licenseType,
                specializations: userData.specializations
            });
        }

        // Create new user
        const user = new User(userData);

        // Save user to database
        await user.save();

        // Generate JWT token
        const token = generateToken(user._id);

        // Log the successful registration
        console.log(`✅ New ${userType} registered: ${user.email}`);

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Send success response
        res.status(201).json({
            success: true,
            message: `${userType === 'therapist' ? 'Therapist' : 'Patient'} account created successfully`,
            token,
            user: user.getPublicProfile()
        });

    } catch (error) {
        console.error('Signup error:', error);
        
        // Handle specific MongoDB errors
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists'
            });
        }
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => ({
                field: err.path,
                message: err.message
            }));
            
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        // Generic server error
        res.status(500).json({
            success: false,
            message: 'Server error during registration. Please try again.'
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array().map(err => ({
                    field: err.param,
                    message: err.msg
                }))
            });
        }

        const { email, password } = req.body;

        // Find user by email
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Your account has been deactivated. Please contact support.'
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT token
        const token = generateToken(user._id);

        console.log(`✅ ${user.userType || 'User'} logged in: ${user.email}`);

        // Send success response with userType
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                ...user.getPublicProfile(),
                userType: user.userType // Ensure userType is included
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login. Please try again.'
        });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: {
                ...user.getPublicProfile(),
                userType: user.userType // Include userType in profile
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};