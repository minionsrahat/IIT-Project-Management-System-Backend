const express = require('express');
const router = express.Router();


module.exports = (connection) => {
  router.post('/assign_supervisor', async (req, res) => {
    const { room_id } = req.body;
    try {
      // Check if supervisor is already assigned to any team in the room
      connection.query('SELECT team_id FROM teams WHERE room_id = ? AND supervisor_id IS NOT NULL', [room_id], (error, results) => {
        if (error) {
          console.error('Error executing MySQL query:', error);
          return res.status(500).json({
            error: true,
            message: 'An error occurred while retrieving team information',
          });
        }
        
        if (results.length > 0) {
          // Supervisor already assigned, send error response
          return res.status(500).json({
            error: true,
            message: 'Supervisor is already assigned to teams in this room. Cannot assign again.',
          });
        }
  
        // Fetch all teacher IDs from the teachers table
        connection.query('SELECT * FROM teachers where active=1', (error, results) => {
          if (error) {
            console.error('Error executing MySQL query:', error);
            return res.status(500).json({
              error: true,
              message: 'An error occurred while retrieving teacher information',
            });
          }
          const teacherIds = results;
          const shuffledTeacherIds = shuffleArray(teacherIds); // Shuffle the array of teacher IDs
  
          connection.query('SELECT team_id FROM teams WHERE room_id = ?', [room_id], (error, results) => {
            if (error) {
              console.error('Error executing MySQL query:', error);
              return res.status(500).json({
                error: true,
                message: 'An error occurred while retrieving team information',
              });
            }
            const teamIds = results;
  
            // Assign supervisors to teams
            let supervisorCount = Math.min(shuffledTeacherIds.length, teamIds.length);
            for (let i = 0; i < supervisorCount; i++) {
              const teacherId = shuffledTeacherIds[i].tcr_id;
              const teamId = teamIds[i].team_id;
              // Update the teams table with the assigned supervisor
              connection.query('UPDATE teams SET supervisor_id = ? WHERE team_id = ?', [teacherId, teamId]);
            }
            // Check if there are remaining teams
            const remainingTeams = teamIds.length - supervisorCount;
            if (remainingTeams > 0) {
              const remainingTeacherIds =shuffleArray(teacherIds);
              for (let i = 0; i < remainingTeams; i++) {
                const teacherId = remainingTeacherIds[Math.floor(Math.random() * remainingTeacherIds.length)].tcr_id;
                const teamId = teamIds[supervisorCount + i].team_id;
                // Update the teams table with the assigned supervisor
                connection.query('UPDATE teams SET supervisor_id = ? WHERE team_id = ?', [teacherId, teamId]);
              }
            }
            return res.json({
              message: 'Supervisors assigned successfully',
            });
          });
        });
      });
    } catch (error) {
      console.error('Error assigning supervisors:', error);
      return res.status(500).json({
        error: true,
        message: 'An error occurred while assigning supervisors',
      });
    }
  });


  

    router.post('/get_team_info_by_supervisor_Id', (req, res) => {
        const { supervisor_id } = req.body;
      
        // Query the database to get the team information and team members
        const query = `
        SELECT team_members.*, teams.team_name,teachers.name as supervisor_name
        FROM teams
        JOIN team_members ON team_members.team_id = teams.team_id JOIN teachers on teachers.tcr_id=teams.supervisor_id
        WHERE teams.supervisor_id = ?`;
        connection.query(query, [supervisor_id], (error, results) => {
          if (error) {
            console.error('Error executing MySQL query:', error);
            return res.status(500).json({
              error: true,
              message: 'An error occurred while retrieving the team information',
            });
          }
      
          if (results.length === 0) {
            return res.status(404).json({
              error: true,
              message: 'No teams found for the specified supervisor id',
            });
          }

               // Group team members by team_id
      const teams = {};
      results.forEach((row) => {
        const { team_id, team_name, ...teamMember } = row;
        if (!teams[team_id]) {
          teams[team_id] = {
            team_id,
            team_name,
            team_members: [teamMember],
          };
        } else {
          teams[team_id].team_members.push(teamMember);
        }
      });
  
      // Convert teams object to an array
      const teamsArray = Object.values(teams);

      return res.json({ teams: teamsArray });
        });
      });

    return router;
};

// Function to shuffle an array using Fisher-Yates algorithm
function shuffleArray(array) {
    const shuffledArray = [...array];
    for (let i = shuffledArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    return shuffledArray;
}

const teamWiseRepresentation=(teams)=>{
    const teamInfo = {
      teams: [],
    };
    
    // Group team members by team name
    const teamMap = new Map();
    teams.forEach((team) => {
      if (!teamMap.has(team.team_name)) {
        teamMap.set(team.team_name, []);
      }
      teamMap.get(team.team_name).push({
        team_members_id: team.team_members_id,
        name: team.name,
        roll: team.roll,
        cgpa: team.cgpa,
        batch: team.batch,
      });
    });
    
    // Create a new array with team-wise information
    teamMap.forEach((members, teamName) => {
      teamInfo.teams.push({
        team_name: teamName,
        members: members,
      });
    });

    return teamInfo
  }