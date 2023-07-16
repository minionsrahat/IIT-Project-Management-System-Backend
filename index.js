const express = require('express');
const cors = require('cors');
const mysql = require('mysql');

const app = express();
app.use(cors());
app.use(express.json())
// Configure Multer for file uploads



const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'spl_management_system',
});

// Connect to the MySQL database
connection.connect((error) => {
  if (error) {
    console.error('Error connecting to the database:', error);
  } else {
    console.log('Connected to the MySQL database');
  }
});


const loginRoutes = require('./routes/loginRoute')(connection);
app.use('/api', loginRoutes)

const roomRoutes = require('./routes/roomRoute')(connection);
app.use('/api', roomRoutes)


const teamCreateRoutes = require('./routes/teamCreateRoute')(connection);
app.use('/api', teamCreateRoutes)


const viewTeamRoutes = require('./routes/viewTeamRoute')(connection);
app.use('/api', viewTeamRoutes)

const supervisorRoute = require('./routes/supervisorRoute')(connection);
app.use('/api', supervisorRoute)


const teacherRoutes = require('./routes/teacherRoute')(connection);
app.use('/api', teacherRoutes)

const createCommitteeRoutes = require('./routes/createCommitte')(connection);
app.use('/api', createCommitteeRoutes)

// Start the server
app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
