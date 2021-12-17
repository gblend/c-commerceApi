const express = require('express');
require('express-async-errors')
const morgan = require('morgan');
const errorHandlerMiddleware = require('./middleware/error-handler');
const notFoundMiddleware = require('./middleware/not-found');
const connectDB = require('./db/connect')

const app = express();
if(app.get('env') === 'development') {
    app.use(morgan('dev'));
}

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
