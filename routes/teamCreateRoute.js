const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
// Configure Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });



module.exports = (connection) => {

  // Endpoint to handle file upload and team creation

  router.post('/make_team', upload.single('students_file'), (req, res) => {
    if (!req.file) {
      return res.status(500).json({
        error: true,
        message: 'No file uploaded',
      });
    }

    const { room_id,random  } = req.body;

    // Check if team already exists for the given room_id
    const checkQuery = 'SELECT * FROM teams WHERE room_id = ?';
    connection.query(checkQuery, [room_id], (checkError, checkResults) => {
      if (checkError) {
        console.error('Error executing MySQL query:', checkError);
        return res.status(500).json({
          error: true,
          message: 'An error occurred while checking the team',
        });
      }

      console.log("Check Results:", checkResults)

      if (checkResults.length > 0) {
        // Team already created for the room_id
        return res.status(500).json({
          error: true,
          message: 'Teams already created for the specified room_id',
        });
      }

      // Fetch the course type for the given room_id
      const courseTypeQuery = 'SELECT course_type FROM room WHERE room_id = ?';
      connection.query(courseTypeQuery, [room_id], (courseTypeError, courseTypeResults) => {
        if (courseTypeError) {
          console.error('Error executing MySQL query:', courseTypeError);
          return res.status(500).json({
            error: true,
            message: 'An error occurred while fetching the course type',
          });
        }

        if (courseTypeResults.length === 0) {
          // No room found for the given room_id
          return res.status(500).json({
            error: true,
            message: 'No room found for the specified room_id',
          });
        }

        const courseType = courseTypeResults[0].course_type;


        let teams = [];

        if (random === '1') {
          // Create teams randomly with three members each
          const file = req.file;

          // Read the Excel file
          const workbook = XLSX.read(file.buffer, { type: 'buffer' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // Create teams
          const students = jsonData.map((row) => ({
            name: row.Name,
            gpa: row.Cgpa,
            roll: row.StudentID,
            batch: row.Batch
          }));

          // Shuffle the students
          const shuffledStudents = shuffleArray(students);

          // Construct teams with three members each
          while (shuffledStudents.length >= 3) {
            const team = shuffledStudents.splice(0, 3);
            teams.push(team);
          }

        }
        else {
          // Proceed with creating teams
          const file = req.file;

          // Read the Excel file
          const workbook = XLSX.read(file.buffer, { type: 'buffer' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // Create teams
          const students = jsonData.map((row) => ({
            name: row.Name,
            gpa: row.Cgpa,
            roll: row.StudentID,
            batch: row.Batch
          }));
          const teamSize = (courseType === 3) ? 1 : 3; // Set the team size based on the course type

          // Sort students based on GPA in descending order
          const sortedStudents = students.sort((a, b) => b.gpa - a.gpa);

          // Divide students into groups based on GPA
          const goodGPAStudents = sortedStudents.filter((student) => student.gpa >= 3.5);
          const mediumGPAStudents = sortedStudents.filter((student) => student.gpa >= 3.3 && student.gpa < 3.5);
          const belowAverageGPAStudents = sortedStudents.filter((student) => student.gpa < 3.3);

          // Create teams with one member from each group
          while (
            goodGPAStudents.length >= 1 &&
            mediumGPAStudents.length >= 1 &&
            belowAverageGPAStudents.length >= 1
          ) {
            const team = [];

            // Select one member from the good GPA group
            team.push(goodGPAStudents.pop());

            // Select one member from the medium GPA group
            team.push(mediumGPAStudents.pop());

            // Select one member from the below average GPA group
            team.push(belowAverageGPAStudents.pop());

            teams.push(team);
          }

          // Shuffle the remaining students
          const remainingStudents = goodGPAStudents.concat(mediumGPAStudents, belowAverageGPAStudents);
          const shuffledStudents = shuffleArray(remainingStudents);

          // Construct teams with the specified team size
          while (shuffledStudents.length >= teamSize) {
            const team = shuffledStudents.splice(0, teamSize);
            teams.push(team);
          }

          // If there are remaining students, create teams with one member each
          shuffledStudents.forEach((student) => {
            teams.push([student]);
          });
        }
        // Store teams and team members in the database
        teams.forEach((team, index) => {
          const teamName = generateTeamName(index + 1); // Generate a unique team name

          // Store team information in the `teams` table
          const teamQuery = 'INSERT INTO teams (team_name, room_id) VALUES (?, ?)';
          const teamValues = [teamName, room_id];
          connection.query(teamQuery, teamValues, (teamError, teamResult) => {
            if (teamError) {
              console.error('Error inserting team:', teamError);
              return;
            }
            // Store team members information in the `team_members` table
            const teamId = teamResult.insertId;
            team.forEach((member) => {
              const memberQuery = 'INSERT INTO team_members (team_id, name, roll, cgpa, batch) VALUES (?, ?, ?, ?, ?)';
              const memberValues = [teamId, member.name, member.roll, member.gpa, member.batch];
              connection.query(memberQuery, memberValues, (memberError) => {
                if (memberError) {
                  console.error('Error inserting team member:', memberError);
                  return;
                }
              });
            });
          });
        });
        res.json({ teams });
      });
    });
  });

  return router;
};


// Shuffle array randomly
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Generate a unique team name
function generateTeamName(teamIndex) {
  const paddedIndex = teamIndex.toString().padStart(2, '0'); // Add leading zeros if needed
  return `Team_${paddedIndex}`;
}
