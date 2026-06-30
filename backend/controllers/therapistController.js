const User = require('../models/user');

const getTherapists = async (req, res) => {
  try {
    console.log('Fetching therapists...');
    
    // Find all users with userType 'therapist'
    const therapists = await User.find({ 
      userType: 'therapist' 
    });

    console.log(`Found ${therapists.length} therapists`);

    // Simple format for frontend
    const formattedTherapists = therapists.map(therapist => ({
      _id: therapist._id,
      name: therapist.fullName || 'Unknown Therapist',
      displayName: therapist.fullName || 'Unknown Therapist',
      specializations: therapist.specializations || [],
      licenseType: therapist.licenseType || ''
    }));

    res.json({
      success: true,
      therapists: formattedTherapists,
      count: formattedTherapists.length
    });

  } catch (error) {
    console.error('Error fetching therapists:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch therapists',
      error: error.message 
    });
  }
};

module.exports = {
  getTherapists
};