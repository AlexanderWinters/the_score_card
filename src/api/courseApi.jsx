// src/api/courseApi.jsx
// Remove the hardcoded base URL
// const API_BASE_URL = 'http://0.0.0.0:3000/api';

export const fetchAllCourses = async () => {
    try {
        const response = await fetch('/api/courses');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching courses:', error);
        throw error;
    }
};

export const fetchCourseById = async (courseId) => {
    try {
        const response = await fetch(`/api/courses/${courseId}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
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