import { TemplateDelegate } from "handlebars";

export interface ITemplatedData {
    link?: string;
    code?: string;
}

export interface ITemplates {
    otp: TemplateDelegate<ITemplatedData>;
}
