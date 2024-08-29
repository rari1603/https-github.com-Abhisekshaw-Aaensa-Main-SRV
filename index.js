const express = require('express');
const mongoose = require('mongoose');
const { connectToDatabase } = require('./configs/database.config');
const Auth = require('./routes/auth.routes');
const SuAdmin = require('./routes/super.admin.routes');
const Enterprise = require('./routes/enterprise.routes');
const SystemInt = require('./routes/system.int.routes');
const Hardware = require('./routes/hardware.routes');
const v1Router = require('./routes/v1.routes');
const entRouter = require('./routes/enterprise.routes');
const Metrics = require('./routes/metrics.routes');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const moment = require('moment-timezone');
const os = require('os');
const timeout = require('connect-timeout');
const scheduleJobs = require('./configs/schedule-job');

// Connect to the database
connectToDatabase();

// Set the default time zone for the application (Asia/Kolkata in this example)
moment.tz.setDefault('Asia/Kolkata');

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(morgan('dev'));
// app.use(helmet());
app.use(cors());
app.use(require('express-status-monitor')());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Set timeout for all requests
app.use(timeout('5m')); // Set timeout to 5 minutes

// Middleware to handle timeout
app.use((req, res, next) => {
    if (!req.timedout) next();
});

// views
app.set("view engine", "ejs");
app.set("views", "views");

app.get('/health', (req, res) => {
    try {
        const networkInterfaces = os.networkInterfaces();

        // Extract IPv4 addresses
        const ipv4Addresses = Object.values(networkInterfaces)
            .flat()
            .filter(interfaceInfo => interfaceInfo.family === 'IPv4')
            .map(interfaceInfo => interfaceInfo.address);

        if (mongoose.connection.name) {
            const message = {
                host: ipv4Addresses[0],
                message: 'Healthy',
                status: true,
                time: (new Date()).toString()
            };
            console.table(message);
            // setInterval(() => {
            // }, 10000);
            const memoryUsage = process.memoryUsage();
            console.log(`Heap Total: ${memoryUsage.heapTotal / 1024 / 1024} MB`);
            console.log(`Heap Used: ${memoryUsage.heapUsed / 1024 / 1024} MB`);
            console.log(`RSS: ${memoryUsage.rss / 1024 / 1024} MB`);

            return res.status(200).json({ response: message });
        } else {
            const message = {
                host: ipv4Addresses,
                message: 'Unhealthy.',
                status: false,
                time: (new Date()).toString()
            };
            console.table(message);
            return res.status(200).json({ response: message });
        }

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// APIs Routes
app.use('/api/auth', Auth);
app.use('/api/admin', SuAdmin);
app.use('/api/enterprise', Enterprise);
app.use('/api/system', SystemInt);
app.use('/api/hardware', Hardware);
app.use('/api/fake', v1Router);
app.use('/api/metrics', Metrics);
// app.use('/api/srv-1', entRouter);

app.get('/api/hi', (req, res) => {
    res.send("Hello I am Server, Happy To See You..")
});



// Internal Server Error handling middleware
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({
        status: 500,
        message: 'Server error!'
    });
    // res.status(500).sendFile(path.join(__dirname, 'pages', '500.html'));
});

// Page Not Found middleware
app.use((req, res, next) => {
    console.log(res.statusCode); // Corrected to res.statusCode
    res.status(404).json({
        status: 404,
        message: 'Page not found!'
    });
    // res.status(404).sendFile(path.join(__dirname, 'pages', '404.html'));
});
//  require('./configs/Schedule_job');



const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || `http://localhost:${PORT}`;

const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${HOST}`);
});

// Set server timeout to 5 minutes
server.timeout = 300000;
