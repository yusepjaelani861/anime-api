import express from 'express';
import dotenv from 'dotenv';
import http from 'http';
import cors from 'cors';
import errorHandler from './middleware/error';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

const server = http.createServer(app);

app.use(cors({
    origin: function (origin, callback) {
        callback(null, true);
    },
    credentials: true
}))

app.use('/public', express.static('public'));


app.get('/', (req, res) => {
    res.send('Hello World!');
    }
);

import auth from './routes/v1/authentication';
import kusonime from './routes/v1/kusonime'

app.use('/api/v1/auth', auth);
app.use('/api/v1/kusonime', kusonime);

app.use(errorHandler);

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});