import axios from 'axios';
import qs from 'qs';
import * as functions from 'firebase-functions';

const recaptchaUrl = "https://www.google.com/recaptcha/api/siteverify";
const recaptchaSecretKey = functions.config().recaptcha.secret;

export async function verifyRecaptcha(response: string): Promise<boolean> {
    try {
        const res = await axios.post(recaptchaUrl, qs.stringify({
            secret: recaptchaSecretKey, response
        }));

        return !!res.data.success;
    } catch (e) {
        console.error("ReCAPTCHA error", e);
        return false;
    }
}
