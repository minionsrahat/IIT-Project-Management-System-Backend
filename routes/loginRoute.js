const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const JWT_SECRET = 'g#T5m9$H@3n!7s&c';

module.exports = (connection) => {
    router.post('/supervisor_login', (req, res) => {
      const { username, password } = req.body;
  
      // Retrieve user data from teachers table
      const query = 'SELECT * FROM teachers WHERE username = ?';
      connection.query(query, [username], (error, results) => {
        if (error) {
          console.error(error);
          return res.status(500).json({ error: true, login: false, message: 'Internal server error' });
        }
  
        if (results.length === 0) {
          return res.status(200).json({ error: true, login: false, message: 'Invalid username' });
        }
  
        // Verify password
        if (password !== results[0].password) {
          return res.status(200).json({ error: true,login: false, message: 'Invalid password' });
        }
  
        // Generate and sign the access token
        const accessToken = jwt.sign({ userId: results[0].id, type: 3 }, JWT_SECRET);
  
        // Return the response
        return res.status(200).json({ login: true,user_id:results[0].tcr_id, accessToken, type: 3 });
      });
    });
  
    router.post('/committee_login', (req, res) => {
      const { username, password } = req.body;
  
      // Retrieve user data from teachers table
      const query = 'SELECT * FROM teachers WHERE username = ?';
      connection.query(query, [username], (error, results) => {
        if (error) {
          console.error(error);
          return res.status(500).json({error: true, login: false, message: 'Internal server error' });
        }
  
        if (results.length === 0) {
          return res.status(200).json({error: true, login: false, message: 'Invalid username' });
        }
  
        // Verify password
        if (password !== results[0].password) {
          return res.status(200).json({error: true, login: false, message: 'Invalid password' });
        }
  
        // Retrieve committee member data from committe_members table
        const committeeQuery = 'SELECT * FROM committee_members WHERE tcr_id = ?';
        connection.query(committeeQuery, [results[0].tcr_id], (committeeError, committeeResults) => {
          if (committeeError) {
            console.error(committeeError);
            return res.status(500).json({error: true, login: false, message: 'Internal server error' });
          }
  
          if (committeeResults.length === 0) {
            return res.status(200).json({ error: true,login: false, message: 'User is not a committee member' });
          }
  
          // Generate and sign the access token
          const accessToken = jwt.sign({ userId: results[0].tcr_id, type: 2 }, JWT_SECRET);
  
          // Return the response
          return res.status(200).json({ login: true,user_id:results[0].tcr_id, accessToken, type: 2 });
        });
      });
    });
  
    router.post('/admin_login', (req, res) => {
      const { username, password } = req.body;
  
      // Retrieve admin data from admin table
      const query = 'SELECT * FROM admin WHERE username = ?';
      connection.query(query, [username], async (error, results) => {
        if (error) {
          console.error(error);
          return res.status(500).json({error: true, login: false, message: 'Internal server error' });
        }
  
        if (results.length === 0) {
          return res.status(200).json({error: true, login: false, message: 'Invalid username ' });
        }
  
         // Verify password
         if (password !== results[0].password) {
            return res.status(200).json({error: true, login: false, message: 'Invalid password' });
          }

        // Generate and sign the access token
        const accessToken = jwt.sign({ userId: results[0].id, type: 1 }, JWT_SECRET);
  
        // Return the response
        return res.status(200).json({ login: true,user_id:results[0].admin_id, accessToken, type: 1 });
      });
    });

    router.post('/student_login', (req, res) => {
      const { username, password } = req.body;
    
      // Retrieve user data from students table
      const query = 'SELECT * FROM students WHERE roll = ?';
      connection.query(query, [username], (error, results) => {
        if (error) {
          console.error(error);
          return res.status(500).json({ error: true, login: false, message: 'Internal server error' });
        }
    
        if (results.length === 0) {
          return res.status(200).json({ error: true, login: false, message: 'Invalid username' });
        }
    
        // Verify password
        if (password !== results[0].password) {
          return res.status(200).json({ error: true, login: false, message: 'Invalid password' });
        }
    
        // Generate and sign the access token
        const accessToken = jwt.sign({ userId: results[0].id, type: 4 }, JWT_SECRET);
    
        // Return the response
        return res.status(200).json({ login: true, user_id: results[0].student_id, accessToken, type: 4 });
      });
    });
    
  
    return router;
  };
  
