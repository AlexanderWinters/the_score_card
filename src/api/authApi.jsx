// export const generateUserKey = async () => {
//     try {
//         const response = await fetch('/api/generate-key', {
//             method: 'POST',  // Change from GET to POST
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//         });
//         if (!response.ok) {
//             throw new Error('Failed to generate user key');
//         }
//         return await response.json();
//     } catch (error) {
//         console.error('Error generating user key:', error);
//         throw error;
//     }
// };

export const registerUser = async (email, password) => {
    try {
        // Simple email validation regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Invalid email format');
        }

        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Registration failed');
        }

        return await response.json();
    } catch (error) {
        console.error('Error registering user:', error);
        throw error;
    }
};

export const loginUser = async (email, password) => {
    try {
        // Simple email validation regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Invalid email format');
        }

        // Create form data for OAuth2 token endpoint
        const formData = new URLSearchParams();
        formData.append('username', email); // Changed from userKey to email
        formData.append('password', password);

        const response = await fetch('/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Login failed');
        }

        const data = await response.json();

        // Store the token in localStorage
        localStorage.setItem('authToken', data.access_token);

        return data;
    } catch (error) {
        console.error('Error logging in:', error);
        throw error;
    }
};

export const logoutUser = () => {
    localStorage.removeItem('authToken');
};

export const getAuthToken = () => {
    return localStorage.getItem('authToken');
};

export const isAuthenticated = () => {
    return !!getAuthToken();
};

// User rounds API
export const saveRound = async (roundData) => {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        const response = await fetch('/api/rounds', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(roundData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to save round');
        }

        return await response.json();
    } catch (error) {
        console.error('Error saving round:', error);
        throw error;
    }
};

export const getUserRounds = async () => {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        const response = await fetch('/api/rounds', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to fetch rounds');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching user rounds:', error);
        throw error;
    }
};