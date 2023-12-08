const express = require('express');
require('./configs/database.config');
const router = require('./routes/user.routes');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();
app.use(express.json());
app.use(bodyParser.json());


app.use('/api', router);



app.listen(3000, () => {
    console.log('Server listening on port 3000');
});