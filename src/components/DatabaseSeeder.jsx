// src/components/DatabaseSeeder.jsx
import React, { useState } from 'react';
import { seedDatabase } from '../api/courseApi';

function DatabaseSeeder({ onSeedComplete }) {
    const [seeding, setSeeding] = useState(false);
    const [error, setError] = useState(null);

    const handleSeedDatabase = async () => {
        try {
            setSeeding(true);
            setError(null);

            await seedDatabase();

            if (onSeedComplete) {
                onSeedComplete();
            }
        } catch (err) {
            console.error('Error seeding database:', err);
            setError('Failed to seed the database. Please try again.');
        } finally {
            setSeeding(false);
        }
    };

    return (
        <div className="database-seeder">
            <button
                onClick={handleSeedDatabase}
                disabled={seeding}
            >
                {seeding ? 'Seeding Database...' : 'Reset & Seed Database'}
            </button>

            {error && <p className="error-message">{error}</p>}
        </div>
    );
}

export default DatabaseSeeder;