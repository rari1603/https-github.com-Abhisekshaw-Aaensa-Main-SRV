const express = require('express');
const mongoose = require('mongoose');
const { connectToDatabase } = require('./configs/database.config');
// Connect to the database
connectToDatabase();
const Auth = require('./routes/auth.routes');
const SuAdmin = require('./routes/super.admin.routes');
const Enterprise = require('./routes/enterprise.routes');
const SystemInt = require('./routes/system.int.routes');
const Hardware = require('./routes/hardware.routes');

const v1Router = require('./routes/v1.routes');
const entRouter = require('./routes/enterprise.routes');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');
// morgan Middleware: A logging middleware that logs information about incoming requests. 
// It can be useful for debugging and monitoring.This logs incoming requests with additional information, 
// such as the HTTP method, status code, and response time.
const morgan = require('morgan');
// helmet Middleware: Enhances your application's security by setting various HTTP headers. 
// It helps protect against common web vulnerabilities.This middleware automatically sets headers like X-Content-Type-Options, 
// Strict-Transport-Security, and others.
const helmet = require('helmet');
const cors = require('cors');
const app = express();
const moment = require('moment-timezone');
const os = require('os');
// Set the default time zone for the application (Asia/Kolkata in this example)
moment.tz.setDefault('Asia/Kolkata');


// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(morgan('dev'));
// app.use(helmet());
app.use(cors());

// views
app.set("view engine", "ejs");
app.set("views", "views");


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    try {
        const networkInterfaces = os.networkInterfaces();

        // Extract IPv4 addresses
        const ipv4Addresses = Object.values(networkInterfaces)
            .flat()
            .filter(interfaceInfo => interfaceInfo.family === 'IPv4')
            .map(interfaceInfo => interfaceInfo.address);
        if (mongoose.connection.name) {
            const message = {
                host: ipv4Addresses,
                message: 'Healthy',
                status: true,
                time: new Date()
            };
            console.table(message);
            return res.status(200).json({ response: message });
        } else {
            const message = {
                host: ipv4Addresses,
                message: 'Unhealthy.',
                status: false,
                time: new Date()
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
// app.use('/api/srv-1', entRouter);


app.get('/api/hi', (req, res) => {
    res.send("Hello I am Server, Happy To See You..")
});


// Internal Server Error handling middleware
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json(
        {
            status: 500,
            message: 'Server error!'
        }
    );
    // res.status(500).sendFile(path.join(__dirname, 'pages', '500.html'));
});



// Page Not Found middleware
app.use((req, res, next) => {
    console.log(res.statusCode); // Corrected to res.statusCode
    res.status(404).json(
        {
            status: 404,
            message: 'Page not found!'
        }
    );
    // res.status(404).sendFile(path.join(__dirname, 'pages', '404.html'));
});



const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || "http://localhost:5001";

app.listen(PORT, () => {
    console.log(`Server listening on port ${HOST}`);
});
