const signupForm = document.getElementById('signupForm');
const submitBtn = document.getElementById('submitBtn');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const therapistFields = document.getElementById('therapistFields');
const userTypeRadios = document.querySelectorAll('input[name="userType"]');

// Handle user type change
userTypeRadios.forEach(radio => {
    radio.addEventListener('change', function() {
        if (this.value === 'therapist') {
            therapistFields.style.display = 'block';
            // Make therapist fields required
            document.querySelector('input[name="licenseNumber"]').required = true;
            document.querySelector('select[name="licenseType"]').required = true;
            document.querySelector('select[name="yearsExperience"]').required = true;
        } else {
            therapistFields.style.display = 'none';
            // Remove required attribute from therapist fields
            document.querySelector('input[name="licenseNumber"]').required = false;
            document.querySelector('select[name="licenseType"]').required = false;
            document.querySelector('select[name="yearsExperience"]').required = false;
        }
    });
});

// Utility functions
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
}

function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
}

function hideMessages() {
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    // At least 8 characters, one uppercase, one lowercase, one number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
}

function validateForm(formData) {
    const { firstName, lastName, email, dateOfBirth, gender, password, confirmPassword, termsAccepted, userType } = formData;
    
    console.log('🔍 Validating form data:');
    console.log('  - User Type:', userType);
    console.log('  - First Name Length:', firstName?.length || 0);
    console.log('  - Last Name Length:', lastName?.length || 0);
    console.log('  - Email:', `"${email}"`);
    console.log('  - Date of Birth:', `"${dateOfBirth}"`);
    console.log('  - Gender:', `"${gender}"`);
    console.log('  - Password Length:', password?.length || 0);
    console.log('  - Passwords Match:', password === confirmPassword);
    console.log('  - Terms Accepted:', termsAccepted);

    if (!firstName || firstName.trim().length < 2) {
        return { isValid: false, message: 'Please enter your first name (at least 2 characters)' };
    }

    if (!lastName || lastName.trim().length < 2) {
        return { isValid: false, message: 'Please enter your last name (at least 2 characters)' };
    }

    if (!validateEmail(email)) {
        return { 
            isValid: false, 
            message: 'Please enter a valid email address' 
        };
    }

    if (!dateOfBirth) {
        return { isValid: false, message: 'Please select your date of birth' };
    }

    // Check if date is in the past and user is at least 13
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    // Adjust age if birthday hasn't occurred this year
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age--;
    }

    if (birthDate > today) {
        return { isValid: false, message: 'Date of birth cannot be in the future' };
    }

    if (age < 13) {
        return { isValid: false, message: 'You must be at least 13 years old to create an account' };
    }

    if (!gender) {
        return { isValid: false, message: 'Please select your gender' };
    }

    // Therapist-specific validation
    if (userType === 'therapist') {
        if (!formData.licenseNumber || formData.licenseNumber.trim().length < 3) {
            return { isValid: false, message: 'Please enter your professional license number' };
        }

        if (!formData.licenseType) {
            return { isValid: false, message: 'Please select your license type' };
        }

        if (!formData.yearsExperience) {
            return { isValid: false, message: 'Please select your years of experience' };
        }

        if (!formData.specializations || formData.specializations.length === 0) {
            return { isValid: false, message: 'Please select at least one specialization' };
        }
    }

    if (!validatePassword(password)) {
        return { 
            isValid: false, 
            message: 'Password must be at least 8 characters with uppercase, lowercase, and number' 
        };
    }

    if (password !== confirmPassword) {
        return { isValid: false, message: 'Passwords do not match' };
    }

    if (!termsAccepted) {
        return { isValid: false, message: 'Please accept the terms and conditions' };
    }

    return { isValid: true };
}

// Form submission handler
signupForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    hideMessages();

    console.log('🚀 Form submitted');

    // Get user type
    const userType = document.querySelector('input[name="userType"]:checked').value;
    
    // Get form data
    const formData = {
        userType: userType,
        firstName: signupForm.firstName.value.trim(),
        lastName: signupForm.lastName.value.trim(),
        email: signupForm.email.value.trim().toLowerCase(),
        dateOfBirth: signupForm.dateOfBirth.value,
        gender: signupForm.gender.value,
        password: signupForm.password.value,
        confirmPassword: signupForm.confirmPassword.value,
        termsAccepted: signupForm.termsAccepted.checked
    };

    // Add therapist-specific data if applicable
    if (userType === 'therapist') {
        formData.licenseNumber = signupForm.licenseNumber.value.trim();
        formData.licenseType = signupForm.licenseType.value;
        formData.yearsExperience = signupForm.yearsExperience.value;
        formData.professionalBio = signupForm.professionalBio.value.trim();
        
        // Get selected specializations
        const specializations = [];
        document.querySelectorAll('input[name="specializations"]:checked').forEach(checkbox => {
            specializations.push(checkbox.value);
        });
        formData.specializations = specializations;

        console.log('👨‍⚕️ Therapist-specific data:');
        console.log('  - License Number:', formData.licenseNumber);
        console.log('  - License Type:', formData.licenseType);
        console.log('  - Years Experience:', formData.yearsExperience);
        console.log('  - Specializations:', formData.specializations);
        console.log('  - Bio Length:', formData.professionalBio?.length || 0);
    }

    // Validate form
    const validation = validateForm(formData);
    if (!validation.isValid) {
        console.log('❌ Client validation failed:', validation.message);
        showError(validation.message);
        return;
    }

    console.log('✅ Client validation passed');

    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';

    try {
        // Call signup API
        const result = await signupUser(formData);
        
        showSuccess(result.message || 'Account created successfully!');
        
        // Store token if provided
        if (result.token) {
            localStorage.setItem('authToken', result.token);
            
            if (result.user) {
                localStorage.setItem('user', JSON.stringify(result.user));
                console.log('💾 User data stored:', result.user);
            }
        }
        
        // Reset form and redirect to login after success
        setTimeout(() => {
            signupForm.reset();
            hideMessages();
            console.log('🔄 Registration successful, redirecting to login...');
            window.location.href = 'Login.html';
        }, 2000);

    } catch (error) {
        console.error('Signup error:', error);
        showError(error.message || 'An error occurred. Please try again.');
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign Up';
    }
});

// API call for signup with better debugging
async function signupUser(userData) {
    // Detect if we're running from Live Server or backend server
    const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? (window.location.port === '5000' ? '' : 'http://localhost:5000') : '';
    
    console.log('🔄 Attempting signup with:', {
        userType: userData.userType,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password ? '[HIDDEN]' : 'MISSING'
    });
    
    try {
        const requestBody = {
            userType: userData.userType,
            fullName: `${userData.firstName} ${userData.lastName}`.trim(),
            email: userData.email,
            dateOfBirth: userData.dateOfBirth,
            gender: userData.gender,
            password: userData.password,
            termsAccepted: userData.termsAccepted
        };

        // Add therapist-specific fields if user is a therapist
        if (userData.userType === 'therapist') {
            requestBody.licenseNumber = userData.licenseNumber;
            requestBody.licenseType = userData.licenseType;
            requestBody.yearsExperience = userData.yearsExperience;
            requestBody.specializations = userData.specializations;
            requestBody.professionalBio = userData.professionalBio;
        }

        const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        console.log('📡 Response status:', response.status);

        // Check if response is ok before trying to parse JSON
        if (!response.ok) {
            console.error('❌ Response not OK:', response.status, response.statusText);
            
            let errorMessage = `Server error: ${response.status} ${response.statusText}`;
            
            try {
                const errorData = await response.json();
                console.log('❌ Raw error data:', JSON.stringify(errorData, null, 2));
                
                // Handle validation errors array
                if (errorData.errors && Array.isArray(errorData.errors)) {
                    console.log('📝 Server validation errors:');
                    errorData.errors.forEach((error, index) => {
                        console.log(`  ${index + 1}. ${error.msg || error.message || error}`);
                    });
                    errorMessage = errorData.errors.map(error => error.msg || error.message || error).join('; ');
                }
                // Handle single error message
                else if (errorData.message || errorData.error) {
                    errorMessage = errorData.message || errorData.error;
                }
                
            } catch (jsonError) {
                console.error('❌ Could not parse error JSON:', jsonError);
            }
            
            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('✅ Success data:', data);
        return data;
        
    } catch (error) {
        console.error('🚨 API Error:', error);
        
        // Check if it's a network error
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Cannot connect to server. Please make sure the backend server is running on port 5000.');
        }
        
        throw error;
    }
}

// Real-time validation feedback
signupForm.addEventListener('input', function(e) {
    const input = e.target;
    
    if (input.name === 'email' && input.value) {
        if (validateEmail(input.value)) {
            input.style.borderColor = '#27ae60';
        } else {
            input.style.borderColor = '#e74c3c';
        }
    }

    if (input.name === 'password' && input.value) {
        if (validatePassword(input.value)) {
            input.style.borderColor = '#27ae60';
        } else {
            input.style.borderColor = '#e74c3c';
        }
    }

    if (input.name === 'confirmPassword' && input.value) {
        const password = signupForm.password.value;
        if (input.value === password && password) {
            input.style.borderColor = '#27ae60';
        } else {
            input.style.borderColor = '#e74c3c';
        }
    }
});

// Handle login redirect
function handleLoginRedirect() {
    console.log('🔄 Redirecting to login page...');
    window.location.href = 'Login.html';
}

// Set date input limits when page loads
document.addEventListener('DOMContentLoaded', function() {
    const dateInput = document.getElementById('dateOfBirth');
    const today = new Date();
    const maxDate = today.toISOString().split('T')[0]; // Today's date
    
    // Set maximum date to today
    dateInput.setAttribute('max', maxDate);
    
    // Set minimum date to 100 years ago
    const minDate = new Date();
    minDate.setFullYear(today.getFullYear() - 100);
    dateInput.setAttribute('min', minDate.toISOString().split('T')[0]);
    
    console.log('📅 Date input limits set:', {
        min: minDate.toISOString().split('T')[0],
        max: maxDate
    });
});

// Handle enter key
document.getElementById('password').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        signupForm.dispatchEvent(new Event('submit'));
    }
});

function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.querySelector('.password-toggle');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.textContent = '🙈'; // Eye closed emoji
    } else {
        passwordInput.type = 'password';
        toggleIcon.textContent = '👁️'; // Eye open emoji
    }
}