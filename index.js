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
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const moment = require('moment-timezone');
const os = require('os');
const timeout = require('connect-timeout');

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
// app.use('/api/srv-1', entRouter);

app.get('/api/hi', (req, res) => {
    res.send("Hello I am Server, Happy To See You..")
});

// -------------------------------------------------- DB VIEWER ----------------------------------------------
// Connect to MongoDB using environment variable
const connectionString = process.env.MONGODB_URI;

if (!connectionString) {
    console.error('MongoDB connection string is not defined. Please set MONGODB_URI in the environment variables.');
    process.exit(1);
}

mongoose.connect(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
});

// Middleware to ensure MongoDB connection is established before handling requests
const ensureDatabaseConnection = (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(500).send('Database connection not established yet. Please try again later.');
    }
    next();
};

// Route to display collections
app.get('/viewer/collections', ensureDatabaseConnection, async (req, res) => {
    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        const collectionNames = collections.map(collection => collection.name);

        const collectionsWithCount = await Promise.all(collectionNames.map(async (name) => {
            const count = await mongoose.connection.db.collection(name).countDocuments();
            return { name, count };
        }));

        res.render('index', { collections: collectionsWithCount });
    } catch (error) {
        console.error('Error fetching collections:', error);
        res.status(500).send({ error: error.toString(), message: "Please wait for DB connection" });
    }
});

// Route to display documents of a specific collection with pagination
app.get('/viewer/collection/:name', ensureDatabaseConnection, async (req, res) => {
    try {
        const collectionName = req.params.name;
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;

        const collection = mongoose.connection.db.collection(collectionName);

        const [documents, totalDocuments] = await Promise.all([
            collection.find({})
                .skip(skip)
                .limit(limit)
                .toArray(),
            collection.countDocuments()
        ]);

        const totalPages = Math.ceil(totalDocuments / limit);
        const fields = documents.length > 0 ? Object.keys(documents[0]) : [];

        res.render('collection', { collectionName, documents, fields, page, totalPages });
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).send(error.toString());
    }
});

// Route to delete a document
app.post('/viewer/collection/:name/delete/:id', ensureDatabaseConnection, async (req, res) => {
    try {
        const collectionName = req.params.name;
        const documentId = req.params.id;

        await mongoose.connection.db.collection(collectionName).deleteOne({ _id: new mongoose.Types.ObjectId(documentId) });

        res.redirect(`/viewer/collection/${collectionName}`);
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).send(error.toString());
    }
});

// Route to render the edit form for a specific document
app.get('/viewer/collection/:name/edit/:id', ensureDatabaseConnection, async (req, res) => {
    try {
        const collectionName = req.params.name;
        const documentId = req.params.id;

        const collection = mongoose.connection.db.collection(collectionName);
        const document = await collection.findOne({ _id: mongoose.Types.ObjectId(documentId) });

        if (!document) {
            return res.status(404).send('Document not found');
        }

        res.render('edit', { collectionName, document });
    } catch (error) {
        console.error('Error fetching document for edit:', error);
        res.status(500).send(error.toString());
    }
});

// Route to handle the update of a specific document
app.post('/viewer/collection/:name/update/:id', ensureDatabaseConnection, async (req, res) => {
    try {
        const collectionName = req.params.name;
        const documentId = req.params.id;

        const newData = req.body.newData; // Assuming your form sends newData with updated fields

        const collection = mongoose.connection.db.collection(collectionName);
        const updatedDocument = await collection.findOneAndUpdate(
            { _id: mongoose.Types.ObjectId(documentId) },
            { $set: newData }, // Update with the new data
            { returnOriginal: false }
        );

        if (!updatedDocument.value) {
            return res.status(404).send('Document not found');
        }

        res.redirect(`/viewer/collection/${collectionName}?page=1`); // Redirect to collection page after update
    } catch (error) {
        console.error('Error updating document:', error);
        res.status(500).send(error.toString());
    }
});

// -------------------------------------------------- DB VIEWER ----------------------------------------------

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

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || `http://localhost:${PORT}`;

const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${HOST}`);
});

// Set server timeout to 5 minutes
server.timeout = 300000;
