import * as functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import routes from './routes';

const app = express();

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));
app.use(express.json());
app.use("/v1", routes);

// Add middleware to authenticate requests
// app.use(myMiddleware);

// build multiple CRUD interfaces:
app.get('/', (req, res) => res.send({
    hello: 'world'
}));

// Expose Express API as a single Cloud Function:
exports.api = functions.https.onRequest(app);
