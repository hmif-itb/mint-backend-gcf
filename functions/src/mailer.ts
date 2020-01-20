import { FinishedSession } from "./entities";
import sendgridMail from '@sendgrid/mail';
import * as functions from 'firebase-functions';
import moment from 'moment-timezone';

const generateColors = require('./colorgenerator');

const templateId = functions.config().sendgrid.template_id;
const sendgridApiKey = functions.config().sendgrid.api_key;
sendgridMail.setApiKey(sendgridApiKey);

export async function sendInterviewSummaryEmail(email: string, interviewerNotes: string, finishedSession: FinishedSession) {
    const { intervieweeName, interviewerName, interviewName, timeElapsed } = finishedSession;
    const payload = {
        to: `${finishedSession.intervieweeName} <${email}>`,
        from: "Mint by HMIF Tech <mint@hmif.tech>",
        subject: "Ringkasan Mock Interview Kamu",
        replyTo: "mint@hmif.tech",
        templateId,
        dynamicTemplateData: {
            interviewee_name: intervieweeName,
            interviewer_name: interviewerName,
            interview_type: interviewName,
            interview_date: `${moment().tz("Asia/Jakarta").format('DD MMM YYYY, HH:mm')} WIB`,
            interview_duration: secondsToHms(timeElapsed),
            pie_html: generatePieHtml(finishedSession),
            interviewer_notes_html: interviewerNotes
        }
    };

    return await sendgridMail.send(payload)
}

function generatePieHtml(finishedSession: FinishedSession): string {
    const colors = generateColors(finishedSession.sections.length);
    const sortedSections = finishedSession.sections
        .sort((a, b) => {
            if (a.order > b.order)
                return 1;
            else if (a.order < b.order)
                return -1;
            else
                return 0;
        });

    const sections = sortedSections
        .map((section, i) => {
            const color = colors[i];
            const width = `${(section.timeElapsed / finishedSession.timeElapsed) * 100}%`;

            return `<div style="display: flex; background: ${color}; width: ${width}"></div>`;
        })
        .join("");

    const chart = `<div style="height: 56px; display: flex; position: relative">${sections}</div>`;

    const indicators = sortedSections
        .map((section, i) => {
            const outerDivStyle = "display: inline-block; height: 24px; line-height: 24px; margin: 4px;";
            const circleStyle = `height: 24px; width: 24px; display: block; float: left; background: ${colors[i]}; border-radius: 50%; margin-right: 4px;`;

            return `<div style="${outerDivStyle}"><div style="${circleStyle}"></div><small>${section.title}</small></div>`;
        })
        .join("");

    return `<div>${chart}</div><div style="margin-top: 16px;">${indicators}</div>`;
}

function secondsToHms(d: number): string {
    const h = Math.floor(d / 3600);
    const m = Math.floor((d % 3600) / 60);
    const s = Math.floor((d % 3600) % 60);

    return h > 0
        ? `${('00' + h).slice(-2)}:${('00' + m).slice(-2)}:${('00' + s).slice(-2)}`
        : `${('00' + m).slice(-2)}:${('00' + s).slice(-2)}`;
}
