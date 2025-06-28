import { TemplateDelegate } from "handlebars";

export interface ITemplatedData {
    link?: string;
    code?: string;
    companyName?: string;
    jobTitle?: string;
    applicationStatus?: string;
    testSetLink?: string;
}

export interface ITemplates {
    otp: TemplateDelegate<ITemplatedData>;
    application: TemplateDelegate<ITemplatedData>;
}
