// src/api/courseApi.jsx
// Remove the hardcoded base URL
// const API_BASE_URL = 'http://0.0.0.0:3000/api';

export const fetchAllCourses = async (includeInactive = false) => {
    try {
        const url = includeInactive ? '/api/courses?include_inactive=true' : '/api/courses';
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching courses:', error);
        throw error;
    }
};

export const updateCourse = async (courseId, courseData) => {
    try {
        const response = await fetch(`/api/courses/${courseId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(courseData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to update course');
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating course:', error);
        throw error;
    }
};

export const toggleCourseActive = async (courseId) => {
    try {
        const response = await fetch(`/api/courses/${courseId}/toggle-active`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to toggle course status');
        }

        return await response.json();
    } catch (error) {
        console.error('Error toggling course status:', error);
        throw error;
    }
};

// In api/courseApi.jsx
export const fetchCourseById = async (courseId) => {
    try {
        const response = await fetch(`/api/courses/${courseId}`);

        if (!response.ok) {
            const error = new Error('Network response was not ok');
            error.status = response.status;
            throw error;
        }

        return await response.json();
    } catch (error) {
        console.error(`Error fetching course ${courseId}:`, error);
        throw error;
    }
};

export const seedDatabase = async () => {
    try {
        const response = await fetch('/api/seed', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        return await response.json();
    } catch (error) {
        console.error('Error seeding database:', error);
        throw error;
    }
};

// Add these functions to courseApi.jsx

export const addCourse = async (courseData) => {
    try {
        const response = await fetch('/api/courses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(courseData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to add course');
        }

        return await response.json();
    } catch (error) {
        console.error('Error adding course:', error);
        throw error;
    }
};

export const uploadJsonCourses = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/courses/json-upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to upload JSON file');
        }

        return await response.json();
    } catch (error) {
        console.error('Error uploading JSON:', error);
        throw error;
    }
};

export const uploadCsvCourses = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/courses/csv-upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to upload CSV file');
        }

        return await response.json();
    } catch (error) {
        console.error('Error uploading CSV:', error);
        throw error;
    }
};

export const checkDatabase = async () => {
    try {
        const response = await fetch('/api/check-database');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error('Error checking database:', error);
        throw error;
    }
};