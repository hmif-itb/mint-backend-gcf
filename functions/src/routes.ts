import { Router } from 'express';
import uuidv4 from 'uuid/v4';
import {ActiveSession, FinishedSession, SessionEndParameters, SessionInitParameters} from "./entities";
import db, { Collections } from "./db";
import {sendInterviewSummaryEmail} from "./mailer";
import {verifyRecaptcha} from "./recaptcha";

const router = Router();

router.post("/init", async (req, res) => {
    // Init session
    const sessionId = uuidv4();
    const body = req.body as SessionInitParameters;

    if (!(body)) {
        res.status(400).send({ error: 'Incomplete parameters' });
        return;
    }

    const userAgentId = body.userAgentId || `ua-${uuidv4()}`;

    const session: ActiveSession = {
        id: sessionId,
        created: Date.now(),
        ip: req.ip || '0.0.0.0',
        userAgent: req.header("user-agent") || '',
        userAgentId,
        ...body
    };

    const docRef = db.collection(Collections.ActiveSessions).doc(sessionId);
    await docRef.set(session);

    res.send({ success: true, sessionId, userAgentId });
});

router.get("/sessions/active/:id", async (req, res) => {
    const sessionId = req.params.id;
    const docRef = db.collection(Collections.ActiveSessions).doc(sessionId);

    const result = await docRef.get();

    if (!result.exists) {
        res.status(404).send({ error: 'Not found' });
        return;
    }

    res.send(result.data());
});

router.post("/finish", async (req, res) => {
   // Finalize session
    const sessionEndParameters = req.body as SessionEndParameters;
    const sessionId = sessionEndParameters.id;

    const docRef = db.collection(Collections.ActiveSessions).doc(sessionId);
    const result = await docRef.get();

    if (!result.exists) {
        res.status(404).send({ error: 'Not found' });
        return;
    }

    const activeSession = result.data() as ActiveSession;
    const finishedSession: FinishedSession = { ...activeSession, ...sessionEndParameters };

    const newDocRef = db.collection(Collections.Sessions).doc(sessionId);

    await docRef.delete();
    await newDocRef.set(finishedSession);

    res.send(finishedSession);
});

router.get("/sessions/finished/:id", async (req, res) => {
    const sessionId = req.params.id;
    const docRef = db.collection(Collections.Sessions).doc(sessionId);

    const result = await docRef.get();

    if (!result.exists) {
        res.status(404).send({ error: 'Not found' });
        return;
    }

    res.send(result.data());
});

router.post("/mail", async (req, res) => {
    // Send email
    const { email, sessionId, interviewerNotes, recaptcha } = req.body;

    // Verify recaptcha
    const captchaValid = await verifyRecaptcha(recaptcha);
    if (!captchaValid) {
        res.status(401).send({ error: 'ReCAPTCHA challenge incorrect' });
        return;
    }

    const docRef = db.collection(Collections.Sessions).doc(sessionId);
    const result = await docRef.get();

    if (!result.exists) {
        res.status(404).send({ error: 'Not found' });
        return;
    }

    const finishedSession = result.data() as FinishedSession;
    sendInterviewSummaryEmail(email, interviewerNotes, finishedSession)
        .then(() => {
            res.send({ success: true });
        })
        .catch(e => {
            console.error("Failed sending email", e);
            res.send({ error: e });
        });
});

export default router;
