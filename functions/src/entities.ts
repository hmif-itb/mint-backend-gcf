export interface SessionInitParameters {
    interviewerNim: string;
    interviewerName: string;
    intervieweeNim: string;
    intervieweeName: string;
    interviewId: string;
    interviewName: string;
    userAgentId?: string;
}

export interface SessionEndParameters {
    id: string;
    sections: Section[];
    timeElapsed: number;
}

export interface SessionMetadata {
    id: string;
    created: number;
    ip: string;
    userAgent: string;
}

export type ActiveSession = SessionMetadata & SessionInitParameters;
export type FinishedSession = SessionMetadata & SessionInitParameters & SessionEndParameters;

export interface Section {
    title: string;
    order: number;
    timeElapsed: number;
}
