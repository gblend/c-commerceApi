const express = require('express');
require('express-async-errors')
const morgan = require('morgan');
const errorHandlerMiddleware = require('./middleware/error-handler');
const notFoundMiddleware = require('./middleware/not-found');
const connectDB = require('./db/connect')
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { decodeCookies } = require('./utils');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false}));
app.use(cookieParser(process.env.JWT_SECRET));
app.use(decodeCookies);
app.use(cors());
if(app.get('env') === 'development') {
    app.use(morgan('dev'));
}

app.get('/api/v1/', (req, res) => {
    return res.json({'status': '200', message: 'Ecommerce backend service running'});
});
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 3000;
const start = async () => {
    try {
        await connectDB(process.env.MONGO_URI);
        app.listen(port, () => {
            console.log(`server listening on port ${port}`);
        });
    } catch (err) {
        console.log(err.message);
    }
}

start();

module.exports = app;
