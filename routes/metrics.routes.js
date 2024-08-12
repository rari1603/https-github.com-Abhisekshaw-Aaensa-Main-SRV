const express = require('express');
const { MongoClient } = require('mongodb');

const router = express.Router();

// MongoDB connection URI
const uri = 'mongodb+srv://bhanu:Vats123@cluster0.bkwgvyf.mongodb.net/test?retryWrites=true&w=majority'; // Replace with your MongoDB URI

let lastQueryCount = 0;
// Metrics route with Server-Sent Events (SSE)
router.get('/view', async (req, res) => {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    // Set the response headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Send the headers before the body

    try {
        await client.connect();
        const adminDb = client.db().admin();

        // Function to fetch and send metrics
        const sendMetrics = async () => {
            const serverStatus = await adminDb.command({ serverStatus: 1 });

            const currentQueryCount = serverStatus.opcounters.query;
            const queryRate = currentQueryCount - lastQueryCount;

            lastQueryCount = currentQueryCount; // Update the last query count

            // Extract metrics
            const metrics = {
                connections: serverStatus.connections,
                opcounters: serverStatus.opcounters,
                queryRate: queryRate, // Number of queries since the last check
                network: serverStatus.network,
                memory: serverStatus.mem,
                uptime: serverStatus.uptime,
                version: serverStatus.version,
                localTime: serverStatus.localTime
            };

            // Send the metrics as an SSE message
            res.write(`data: ${JSON.stringify(metrics)}\n\n`);
        };

        // Send metrics at an interval (e.g., every 5 seconds)
        const intervalId = setInterval(sendMetrics, 5000);

        // Clean up when the client closes the connection
        req.on('close', () => {
            clearInterval(intervalId);
            client.close();
        });
    } catch (err) {
        console.error('Error fetching MongoDB metrics:', err);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch metrics'
        });
    }
});

module.exports = router;
