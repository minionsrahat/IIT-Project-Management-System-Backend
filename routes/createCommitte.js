const express = require('express');
const router = express.Router();


module.exports = (connection) => {
    router.post('/add_committee_members', (req, res) => {
        const { tcr_id, room_id, role } = req.body;
      
        // Check if the teacher already exists in the given room
        const checkQuery = 'SELECT * FROM committee_members WHERE tcr_id = ? AND room_id = ?';
        connection.query(checkQuery, [tcr_id, room_id], (checkError, checkResults) => {
          if (checkError) {
            console.error('Error executing MySQL query:', checkError);
            return res.status(500).json({
              error: true,
              message: 'An error occurred while checking existing committee members',
            });
          }
      
          if (checkResults.length > 0) {
            return res.status(500).json({
              error: true,
              message: 'Teacher already exists in the given room',
            });
          }
      
          // Check if the role=1 (chairman) already assigned for the given room
          if (role == 1) {
            const chairmanQuery = 'SELECT * FROM committee_members WHERE room_id = ? AND role = 1';
            connection.query(chairmanQuery, [room_id], (chairmanError, chairmanResults) => {
              if (chairmanError) {
                console.error('Error executing MySQL query:', chairmanError);
                return res.status(500).json({
                  error: true,
                  message: 'An error occurred while checking existing chairman',
                });
              }
      
              if (chairmanResults.length > 0) {
                return res.status(500).json({
                  error: true,
                  message: 'Chairman already assigned for this room, cannot assign again',
                });
              }
      
              // Add the new committee member to the committee_members table
              const addQuery = 'INSERT INTO committee_members (tcr_id, room_id, role) VALUES (?, ?, ?)';
              connection.query(addQuery, [tcr_id, room_id, role], (addError) => {
                if (addError) {
                  console.error('Error executing MySQL query:', addError);
                  return res.status(500).json({
                    error: true,
                    message: 'An error occurred while adding committee member',
                  });
                }
      
                return res.status(200).json({
                  message: 'Committee member added successfully',
                });
              });
            });
          } else {
            // Add the new committee member to the committee_members table (when role is not 1)
            const addQuery = 'INSERT INTO committee_members (tcr_id, room_id, role) VALUES (?, ?, ?)';
            connection.query(addQuery, [tcr_id, room_id, role], (addError) => {
              if (addError) {
                console.error('Error executing MySQL query:', addError);
                return res.status(500).json({
                  error: true,
                  message: 'An error occurred while adding committee member',
                });
              }
      
              return res.status(200).json({
                message: 'Committee member added successfully',
              });
            });
          }
        });
      });


      router.delete('/delete_committee_members/:member_id', (req, res) => {
        const memberId = req.params.member_id;
      
        // Delete the committee member from the committee_members table
        const deleteQuery = 'DELETE FROM committee_members WHERE member_id = ?';
        connection.query(deleteQuery, [memberId], (error, results) => {
          if (error) {
            console.error('Error executing MySQL query:', error);
            return res.status(500).json({
              error: true,
              message: 'An error occurred while deleting committee member',
            });
          }
      
          return res.status(200).json({
            message: 'Committee member deleted successfully',
            rowsAffected: results.affectedRows,
          });
        });
      });


      router.get('/committee_members/:room_id', (req, res) => {
        const roomId = req.params.room_id;
        // Retrieve committee members from the committee_members table
        const query = `SELECT teachers.name as name, committee_members.*  FROM committee_members, teachers WHERE room_id =? 
        and committee_members.tcr_id=teachers.tcr_id ORDER BY committee_members.role`;
        connection.query(query, [roomId], (error, rows) => {
          if (error) {
            console.error('Error executing MySQL query:', error);
            return res.status(500).json({
              error: true,
              message: 'An error occurred while retrieving committee members',
            });
          }
      
          if (rows.length === 0) {
            return res.status(500).json({
              message: 'No committee members found for the given room',
            });
          }
      
          return res.status(200).json({
            committeeMembers: rows,
          });
        });
      });
      
      
      
    return router;
  };
  
