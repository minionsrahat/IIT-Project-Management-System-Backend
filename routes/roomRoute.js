const express = require('express');
const router = express.Router();

  
module.exports = (connection) => {
  router.post('/create_room', async (req, res) => {
    const { batch_no, course_type } = req.body;
    const query = 'SELECT * FROM room WHERE batch = ? AND course_type = ?';
    const values = [batch_no, course_type];
    try {
      connection.query(query, values, (error, result) => {
        if (error) {
          console.error('Error executing MySQL query:', error);
          return;
        }
        if (result.length === 0) {
          // Room does not exist, insert new entry
          connection.query('INSERT INTO room (batch, course_type) VALUES (?, ?)', [batch_no, course_type], (error, insertResult) => {
            if (error) {
              console.error('Error executing MySQL query:', error);
              return res.status(500).json({
                error: true,
                message: 'An error occurred while creating the room',
              });
            }

            const roomId = insertResult.insertId;
            return res.json({
              message: 'Room created successfully',
              roomId: roomId,
            });
          });
        } else {
          // Room already exists
          return res.status(500).json({ error:true,message: 'There is already an existing room for the batch and course type' });
        }
      });
    } catch (error) {
      console.error('Error checking room:', error);
      return res.status(500).json({error:true, message: 'An error occurred while checking the room' });
    }
  });

  router.post('/getRoomId', async (req, res) => {
    const { batch_no, course_type } = req.body;
    console.log(req.body);
    // Query the database to get the room ID
    const query = 'SELECT room_id FROM room WHERE batch = ? AND course_type = ?';
    await connection.query(query, [batch_no, course_type], (error, results) => {
      if (error) {
        console.error('Error executing MySQL query:', error);
        return res.status(500).json({
          error: true,
          message: 'An error occurred while retrieving the room ID',
        });
      }
      console.log(results);
      if (results.length === 0) {
        return res.status(500).json({
          error: true,
          message: 'Room ID not found for the specified batch and course type',
        });
      }
      const roomId = results[0].room_id;
      return res.json({
        roomId,
      });
    });
  });

  router.get('/getTeamRooms', async (req, res) => {
    // Query the database to get all rooms
    const query = 'SELECT room.*, IF(teams.room_id IS NOT NULL, true, false) AS table_created FROM room LEFT JOIN teams ON room.room_id = teams.room_id GROUP BY room.room_id';
    await connection.query(query, (error, results) => {
      if (error) {
        console.error('Error executing MySQL query:', error);
        return res.status(500).json({
          error: true,
          message: 'An error occurred while retrieving the rooms',
        });
      }
      return res.json({ rooms: results });
    });
  });

  router.get('/get_supervisor_assign_rooms', async (req, res) => {
    // Query the database to get all rooms
    const query = `
      SELECT room.*, IF(teams.room_id IS NOT NULL, true, false) AS table_created,
      IF(teams.supervisor_id IS NULL, 0, 1) AS supervisor_assigned
      FROM room
      LEFT JOIN teams ON room.room_id = teams.room_id
      GROUP BY room.room_id
    `;
    await connection.query(query, (error, results) => {
      if (error) {
        console.error('Error executing MySQL query:', error);
        return res.status(500).json({
          error: true,
          message: 'An error occurred while retrieving the rooms',
        });
      }
      return res.json({ rooms: results });
    });
  });


  router.get('/getCommitteeRooms', async (req, res) => {
    // Query the database to get all rooms
    const query = 'SELECT room.*, IF(committee_members.room_id IS NOT NULL, true, false) AS table_created FROM room LEFT JOIN committee_members ON room.room_id = committee_members.room_id GROUP BY room.room_id';
    await connection.query(query, (error, results) => {
      if (error) {
        console.error('Error executing MySQL query:', error);
        return res.status(500).json({
          error: true,
          message: 'An error occurred while retrieving the rooms',
        });
      }
      return res.json({ rooms: results });
    });
  });

  router.get('/getrooms/:tcr_id', (req, res) => {
    const tcrId = req.params.tcr_id;
  
    // Fetch rooms from rooms table where room_id matches committe_members.room_id and tcr_id matches the given tcr_id
    const query = `
      SELECT r.*
      FROM rooms r
      INNER JOIN committee_members cm ON cm.room_id = r.room_id
      WHERE cm.tcr_id = ?`;
  
    connection.query(query, [tcrId], (error, results) => {
      if (error) {
        console.error('Error executing MySQL query:', error);
        return res.status(500).json({
          error: true,
          message: 'An error occurred while retrieving rooms',
        });
      }
  
      // Return the rooms
      return res.status(200).json({
        rooms: results,
      });
    });
  });
  
  router.delete('/resetTeams/:room_id', (req, res) => {
    const roomId = req.params.room_id;
  
    // Delete teams and team members for the room_id
    const deleteQuery = 'DELETE FROM teams WHERE room_id = ?';
    connection.query(deleteQuery, [roomId], (error, results) => {
      if (error) {
        console.error('Error executing MySQL query:', error);
        return res.status(500).json({
          error: true,
          message: 'An error occurred while deleting the teams and team members',
        });
      }
  
      return res.json({
        message: 'Teams Reset successfully',
        rowsAffected: results.affectedRows,
      });
    });
  });
  

  router.put('/resetSupervisor/:room_id', (req, res) => {
    const roomId = req.params.room_id;
  
    // Reset supervisor_id to null for the given room_id
    const resetQuery = 'UPDATE teams SET supervisor_id = null WHERE room_id = ?';
    connection.query(resetQuery, [roomId], (error, results) => {
      if (error) {
        console.error('Error executing MySQL query:', error);
        return res.status(500).json({
          error: true,
          message: 'An error occurred while resetting the supervisor',
        });
      }
  
      return res.json({
        message: 'Supervisor reset successfully',
        rowsAffected: results.affectedRows,
      });
    });
  });
  


  
  router.delete('/deleteRoom/:roomId', async (req, res) => {
    const roomId = req.params.roomId;
  
    // Delete teams and team members for the room_id
    const deleteTeamsQuery = `
      DELETE t, tm
      FROM teams t
      LEFT JOIN team_members tm ON tm.team_id = t.team_id
      WHERE t.room_id = ?`;
  
    connection.query(deleteTeamsQuery, [roomId], (deleteTeamsError, deleteTeamsResults) => {
      if (deleteTeamsError) {
        console.error('Error executing MySQL query:', deleteTeamsError);
        return res.status(500).json({
          error: true,
          message: 'An error occurred while deleting the teams and team members',
        });
      }
  
      // Delete committee members for the room_id
      const deleteCommitteeMembersQuery = 'DELETE FROM committee_members WHERE room_id = ?';
  
      connection.query(deleteCommitteeMembersQuery, [roomId], (deleteCommitteeMembersError, deleteCommitteeMembersResults) => {
        if (deleteCommitteeMembersError) {
          console.error('Error executing MySQL query:', deleteCommitteeMembersError);
          return res.status(500).json({
            error: true,
            message: 'An error occurred while deleting the committee members',
          });
        }
  
        // Delete the room from the room table
        const deleteRoomQuery = 'DELETE FROM room WHERE room_id = ?';
  
        connection.query(deleteRoomQuery, [roomId], (deleteRoomError, deleteRoomResults) => {
          if (deleteRoomError) {
            console.error('Error executing MySQL query:', deleteRoomError);
            return res.status(500).json({
              error: true,
              message: 'An error occurred while deleting the room',
            });
          }
  
          return res.status(200).json({
            message: 'Room and associated teams, team members, and committee members deleted successfully',
            rowsAffected: {
              teamsDeleted: deleteTeamsResults.affectedRows,
              committeeMembersDeleted: deleteCommitteeMembersResults.affectedRows,
              roomDeleted: deleteRoomResults.affectedRows,
            },
          });
        });
      });
    });
  });
  
  

  return router;
};