import { Client, Account, Databases, ID, Query } from 'appwrite';

// Initialize Appwrite client
const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('67b157e600336980e6ee'); // Replace with your project ID

const account = new Account(client);
const databases = new Databases(client);

// Database constants
const DATABASE_ID = '67b1582900033fb8f3b0';
const USER_COLLECTION_ID = '67b302f90028972fb4ce';

// Auth state management
let currentUser = null;

// Helper to update UI based on auth state
function updateAuthUI() {
    const authStateElement = document.getElementById('auth-state');
    const authFormsContainer = document.getElementById('auth-forms');
    const userProfileContainer = document.getElementById('user-profile');

    if (currentUser) {
        const displayName = currentUser.name || currentUser.email;
        authStateElement.textContent = `Welcome, ${displayName}!`;
        authFormsContainer.style.display = 'none';
        userProfileContainer.style.display = 'block';
        
        // Load profile data if user is logged in
        loadProfileData();
    } else {
        authStateElement.textContent = 'Please log in or create an account';
        authFormsContainer.style.display = 'block';
        userProfileContainer.style.display = 'none';
        
        // Show login form by default
        document.getElementById('login-form').style.display = 'flex';
        document.getElementById('register-form').style.display = 'none';
    }
}

// Check current session on page load
async function checkSession() {
    try {
        currentUser = await account.get();
        updateAuthUI();
    } catch (error) {
        currentUser = null;
        updateAuthUI();
    }
}

// User registration with improved error handling
async function registerUser(email, password, firstName, lastName) {
    try {
        // Create account
        const user = await account.create(ID.unique(), email, password, `${firstName} ${lastName}`);

        try {
            // Create user profile in database
            await databases.createDocument(
                DATABASE_ID,
                USER_COLLECTION_ID,
                ID.unique(),
                {
                    userId: user.$id,
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    // bio: '',
                    // createdAt: new Date().toISOString()
                }
            );
        } catch (dbError) {
            console.error('Error creating user profile:', dbError);
            // Consider deleting the created user account if profile creation fails
            try {
                await account.delete();
            } catch (deleteError) {
                console.error('Error deleting account after profile creation failure:', deleteError);
            }
            throw new Error(`Profile creation failed: ${dbError.message}`);
        }

        try {
            // Auto login after registration
            await loginUser(email, password);
        } catch (loginError) {
            console.error('Auto-login failed:', loginError);
            // User is created but not logged in automatically
            alert('Account created successfully! Please log in manually.');
            // Refresh the UI to show login form
            updateAuthUI();
            return user;
        }

        return user;
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

// User login
async function loginUser(email, password) {
    try {
        // Make sure we're using the correct method from the SDK
        const session = await account.createEmailSession(email, password);
        currentUser = await account.get();
        updateAuthUI();
        return session;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

// User logout
async function logoutUser() {
    try {
        await account.deleteSession('current');
        currentUser = null;
        updateAuthUI();
    } catch (error) {
        console.error('Logout error:', error);
        throw error;
    }
}

// Delete user account with improved error handling
async function deleteAccount() {
    try {
        // First, delete user profile from database
        const profile = await getUserProfile(currentUser.$id);
        if (profile) {
            try {
                await databases.deleteDocument(
                    DATABASE_ID,
                    USER_COLLECTION_ID,
                    profile.$id
                );
            } catch (dbError) {
                console.error('Failed to delete user profile:', dbError);
                if (!confirm('Failed to delete profile data. Continue with account deletion anyway?')) {
                    return;
                }
            }
        }

        // Then delete the account
        await account.delete();
        currentUser = null;
        updateAuthUI();
    } catch (error) {
        console.error('Account deletion error:', error);
        throw error;
    }
}

// Get user profile
async function getUserProfile(userId) {
    try {
        const profiles = await databases.listDocuments(
            DATABASE_ID,
            USER_COLLECTION_ID,
            [
                Query.equal('userId', userId),
                Query.limit(1)
            ]
        );
        return profiles.documents.length > 0 ? profiles.documents[0] : null;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
    }
}

// Load user profile data to form
async function loadProfileData() {
    if (!currentUser) return;
    
    try {
        const profile = await getUserProfile(currentUser.$id);
        if (profile) {
            document.getElementById('profile-first-name').value = profile.firstName || '';
            document.getElementById('profile-last-name').value = profile.lastName || '';
            document.getElementById('profile-bio').value = profile.bio || '';
        } else {
            console.warn('No profile found for current user. Creating one...');
            try {
                // Create profile if it doesn't exist
                await databases.createDocument(
                    DATABASE_ID,
                    USER_COLLECTION_ID,
                    ID.unique(),
                    {
                        userId: currentUser.$id,
                        firstName: currentUser.name ? currentUser.name.split(' ')[0] : '',
                        lastName: currentUser.name ? currentUser.name.split(' ').slice(1).join(' ') : '',
                        email: currentUser.email,
                        bio: '',
                        createdAt: new Date().toISOString()
                    }
                );
                // Try loading again
                loadProfileData();
            } catch (createError) {
                console.error('Failed to create profile for existing user:', createError);
            }
        }
    } catch (error) {
        console.error('Error loading profile data:', error);
    }
}

// Update user profile
async function updateUserProfile(profileData) {
    try {
        const profile = await getUserProfile(currentUser.$id);
        if (!profile) {
            // Create profile if it doesn't exist
            return await databases.createDocument(
                DATABASE_ID,
                USER_COLLECTION_ID,
                ID.unique(),
                {
                    userId: currentUser.$id,
                    ...profileData,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            );
        }

        const updatedProfile = await databases.updateDocument(
            DATABASE_ID,
            USER_COLLECTION_ID,
            profile.$id,
            {
                ...profileData,
                updatedAt: new Date().toISOString()
            }
        );

        return updatedProfile;
    } catch (error) {
        console.error('Profile update error:', error);
        throw error;
    }
}

// Password strength checker
function checkPasswordStrength(password) {
    const strengthBar = document.querySelector('.password-strength-bar');
    
    if (!password) {
        strengthBar.style.width = '0';
        strengthBar.className = 'password-strength-bar';
        return;
    }
    
    // Basic strength check
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    // Update strength bar
    const percentage = (strength / 4) * 100;
    strengthBar.style.width = `${percentage}%`;
    
    if (strength <= 1) {
        strengthBar.className = 'password-strength-bar strength-weak';
    } else if (strength <= 3) {
        strengthBar.className = 'password-strength-bar strength-medium';
    } else {
        strengthBar.className = 'password-strength-bar strength-strong';
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    checkSession();

    // Toggle between login and register forms
    document.getElementById('show-register')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'flex';
    });

    document.getElementById('show-login')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('login-form').style.display = 'flex';
    });
    
    // Password strength checker
    document.getElementById('register-password')?.addEventListener('input', (e) => {
        checkPasswordStrength(e.target.value);
    });

    // Registration form
    document.getElementById('register-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Creating account...';
        
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const firstName = document.getElementById('register-first-name').value;
        const lastName = document.getElementById('register-last-name').value;

        try {
            await registerUser(email, password, firstName, lastName);
            alert('Registration successful!');
        } catch (error) {
            alert(`Registration failed: ${error.message}`);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Register';
        }
    });

    // Login form
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Logging in...';
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            await loginUser(email, password);
            // No alert needed, UI will update
        } catch (error) {
            alert(`Login failed: ${error.message}`);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Login';
        }
    });

    // Profile form
    document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Updating...';
        
        const firstName = document.getElementById('profile-first-name').value;
        const lastName = document.getElementById('profile-last-name').value;
        const bio = document.getElementById('profile-bio').value;

        try {
            await updateUserProfile({ firstName, lastName, bio });
            
            // Also update the name in Appwrite account if changed
            if (currentUser.name !== `${firstName} ${lastName}`) {
                await account.updateName(`${firstName} ${lastName}`);
                currentUser = await account.get(); // Refresh user data
            }
            
            alert('Profile updated successfully!');
            updateAuthUI(); // Refresh UI with new name
        } catch (error) {
            alert(`Profile update failed: ${error.message}`);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Update Profile';
        }
    });

    // Logout button
    document.getElementById('logout-button')?.addEventListener('click', async () => {
        try {
            await logoutUser();
            // No alert needed, UI will update
        } catch (error) {
            alert(`Logout failed: ${error.message}`);
        }
    });

    // Delete account button
    document.getElementById('delete-account-button')?.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
            try {
                await deleteAccount();
                alert('Account deleted successfully!');
            } catch (error) {
                alert(`Account deletion failed: ${error.message}`);
            }
        }
    });
});