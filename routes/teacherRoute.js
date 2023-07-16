const express = require('express');
const router = express.Router();

module.exports = (connection) => {
    router.get('/getTeachers', (req, res) => {
        try {
            // Fetch all teachers from the teachers table
            const query = 'SELECT * FROM teachers';
            connection.query(query, (error, rows) => {
                if (error) {
                    console.error('Error retrieving teachers:', error);
                    return res.status(500).json({
                        error: true,
                        message: 'An error occurred while retrieving teachers',
                    });
                }

                // Return the teachers' information
                return res.status(200).json({
                    teachers: rows,
                });
            });
        } catch (error) {
            console.error('Error retrieving teachers:', error);
            return res.status(500).json({
                error: true,
                message: 'An error occurred while retrieving teachers',
            });
        }
    });


    router.get('/getActiveTeachers', (req, res) => {
        try {
            // Fetch all teachers from the teachers table
            const query = 'SELECT * FROM teachers where active=1';
            connection.query(query, (error, rows) => {
                if (error) {
                    console.error('Error retrieving teachers:', error);
                    return res.status(500).json({
                        error: true,
                        message: 'An error occurred while retrieving teachers',
                    });
                }

                // Return the teachers' information
                return res.status(200).json({
                    teachers: rows,
                });
            });
        } catch (error) {
            console.error('Error retrieving teachers:', error);
            return res.status(500).json({
                error: true,
                message: 'An error occurred while retrieving teachers',
            });
        }
    });


    router.post('/addTeacher', (req, res) => {
        const { teacherEmail, teacherName, designation, status } = req.body;

        // Generate a random username using the teacher's name
        const username = generateUsername(teacherName);

        // Generate a random password
        const password = generateRandomPassword();

        try {
            // Insert teacher information into the teachers table
            const query = 'INSERT INTO teachers (username, password, email, name, designation, active) VALUES (?, ?, ?, ?, ?, ?)';
            const values = [username, password, teacherEmail, teacherName, designation, status];
            connection.query(query, values, (error) => {
                if (error) {
                    console.error('Error adding teacher:', error);
                    return res.status(500).json({
                        error: true,
                        message: 'An error occurred while adding the teacher',
                    });
                }

                // Return success response
                return res.status(200).json({
                    success: true,
                    message: 'Teacher added successfully',
                });
            });
        } catch (error) {
            console.error('Error adding teacher:', error);
            return res.status(500).json({
                error: true,
                message: 'An error occurred while adding the teacher',
            });
        }
    });
    router.delete('/deleteTeacher/:tcr_id', (req, res) => {
        const tcr_id = req.params.tcr_id;

        try {
            // Delete teacher from the teachers table
            const query = 'DELETE FROM teachers WHERE tcr_id = ?';
            connection.query(query, [tcr_id], (error, result) => {
                if (error) {
                    console.error('Error deleting teacher:', error);
                    return res.status(500).json({
                        error: true,
                        message: 'An error occurred while deleting the teacher',
                    });
                }

                if (result.affectedRows === 0) {
                    // No teacher found with the specified tcr_id
                    return res.status(500).json({
                        error: true,
                        message: 'Teacher not found',
                    });
                }

                // Return success response
                return res.status(200).json({
                    success: true,
                    message: 'Teacher deleted successfully',
                });
            });
        } catch (error) {
            console.error('Error deleting teacher:', error);
            return res.status(500).json({
                error: true,
                message: 'An error occurred while deleting the teacher',
            });
        }
    });



    return router;
};


// Helper function to generate a username from the teacher's name
const generateUsername = (teacherName) => {
    // Convert teacher's name to lowercase and remove spaces
    const username = teacherName.toLowerCase().replace(/\s/g, '');
    return username;
};


// Helper function to generate a random password
const generateRandomPassword = () => {
    // Generate a random 8-character alphanumeric password
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        password += characters.charAt(randomIndex);
    }
    return password;
};
