import {
    bgGreenBright,
    bgMagentaBright,
    bgRedBright,
    bgYellowBright,
    blackBright,
    bold
} from "colorette";
import { format } from "util";
import { WebhookClient, WebhookMessageOptions } from "discord.js";
import init from "../utilities/sentry.js";

export class Logger {
    public readonly sentry;

    private webhooks: Record<string, WebhookClient>;

    constructor() {
        this.sentry = init();
        this.webhooks = {};
    }

    private get timestamp(): string {
        const now = new Date();
        const [year, month, day] = now.toISOString().substr(0, 10).split("-");
        return `${day}/${month}/${year} @ ${now.toISOString().substr(11, 8)}`;
    }

    public debug(...args: string | any) {
        process.stdout.write(
            (bold(bgMagentaBright(`[${this.timestamp}]`)),
            bold(format(...args)),
            "\n")
        );
    }

    public info(...args: string | any) {
        process.stdout.write(
            (bold(bgGreenBright(blackBright(`[${this.timestamp}]`))),
            bold(format(...args)),
            "\n")
        );
    }

    public warn(...args: string | any) {
        process.stdout.write(
            (bold(bgYellowBright(blackBright(`[${this.timestamp}]`))),
            bold(format(...args)),
            "\n")
        );
    }

    public error(error: any | null, ...args: string | any) {
        if (error)
            process.stdout.write(
                (bold(bgRedBright(`[${this.timestamp}]`)),
                error,
                bold(format(...args)),
                "\n")
            );
        else
            process.stdout.write(
                (bold(bgRedBright(`[${this.timestamp}]`)),
                bold(format(...args)),
                "\n")
            );
    }

    public async webhookLog(type: string, options: WebhookMessageOptions) {
        if (!type) throw new Error("No webhook type provided!");
        else if (!this.webhooks[type.toLowerCase()]) {
            const webhookURL = process.env[`${type.toUpperCase()}_HOOK`];
            if (!webhookURL) throw new Error(`Invalid webhook type provided!`);
            this.webhooks[type.toLowerCase()] = new WebhookClient({
                url: process.env[`${type.toUpperCase()}_HOOK`]!
            });
        }
        return this.webhooks[type.toLowerCase()]!.send(options);
    }
}

export default new Logger();
