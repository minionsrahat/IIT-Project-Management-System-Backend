const express = require('express');
const router = express.Router();


module.exports = (connection) => {
  router.post('/get_team_info', (req, res) => {
    const { room_id } = req.body;

    // Query the database to get the team information and team members
    const query = `
    SELECT team_members.*, teams.team_name,teachers.name as supervisor_name
    FROM teams
    JOIN team_members ON team_members.team_id = teams.team_id LEFT JOIN teachers on teams.supervisor_id=teachers.tcr_id
    WHERE teams.room_id = ?`;
    connection.query(query, [room_id], (error, results) => {
      if (error) {
        console.error('Error executing MySQL query:', error);
        return res.status(500).json({
          error: true,
          message: 'An error occurred while retrieving the team information',
        });
      }

      if (results.length === 0) {
        return res.status(500).json({
          error: true,
          message: 'No teams found for the specified room_id',
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

  router.post('/get_team_info_by_roll', (req, res) => {
    const { student_id } = req.body;

    // Query to get the roll from students table using student_id
    const rollQuery = 'SELECT roll FROM students WHERE student_id = ?';
    connection.query(rollQuery, [student_id], (rollError, rollResults) => {
      if (rollError) {
        console.error('Error executing MySQL query:', rollError);
        return res.status(500).json({
          error: true,
          message: 'An error occurred while retrieving the roll',
        });
      }

      if (rollResults.length === 0) {
        return res.status(500).json({
          error: true,
          message: 'No student found for the specified student_id',
        });
      }

      const roll = rollResults[0].roll;

      // Query to get the team_id from team_members table using roll
      const teamIdQuery = 'SELECT team_id FROM team_members WHERE roll = ?';
      connection.query(teamIdQuery, [roll], (teamIdError, teamIdResults) => {
        if (teamIdError) {
          console.error('Error executing MySQL query:', teamIdError);
          return res.status(500).json({
            error: true,
            message: 'An error occurred while retrieving the team_id',
          });
        }

        if (teamIdResults.length === 0) {
          return res.status(500).json({
            error: true,
            message: 'No team found for the specified student_id',
          });
        }

        const teamId = teamIdResults[0].team_id;

        // Query to get the team members and supervisor information using team_id
        const teamQuery = `
          SELECT team_members.*, teams.team_name, teachers.name as supervisor_name
          FROM teams
          JOIN team_members ON team_members.team_id = teams.team_id
          LEFT JOIN teachers ON teams.supervisor_id = teachers.tcr_id
          WHERE teams.team_id = ?`;

        connection.query(teamQuery, [teamId], (teamError, teamResults) => {
          if (teamError) {
            console.error('Error executing MySQL query:', teamError);
            return res.status(500).json({
              error: true,
              message: 'An error occurred while retrieving the team information',
            });
          }

          if (teamResults.length === 0) {
            return res.status(500).json({
              error: true,
              message: 'No team found for the specified team_id',
            });
          }

          // Group team members by team_id
          const teams = {};
          teamResults.forEach((row) => {
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
    });
  });


  return router;
};

