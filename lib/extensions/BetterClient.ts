import i18next from "i18next";
import { resolve } from "path";
import { REST } from "@discordjs/rest";
import * as metrics from "datadog-metrics";
import { PrismaClient } from "@prisma/client";
import { RegExpWorker } from "regexp-worker";
import { Client, ClientOptions, Collection } from "discord.js";
import intervalPlural from "i18next-intervalplural-postprocessor";
import BetterUser from "./BetterUser.js";
import Button from "../classes/Button.js";
import BetterGuild from "./BetterGuild.js";
import DropDown from "../classes/DropDown.js";
import * as Logger from "../classes/Logger.js";
import Config from "../../config/bot.config.js";
import BetterGuildMember from "./BetterGuild.js";
import Functions from "../utilities/functions.js";
import { CachedStats, Stats } from "../../typings";
import TextCommand from "../classes/TextCommand.js";
import EventHandler from "../classes/EventHandler.js";
import AutoComplete from "../classes/AutoComplete.js";
import ButtonHandler from "../classes/ButtonHandler.js";
import DropDownHandler from "../classes/DropDownHandler.js";
import LanguageHandler from "../classes/LanguageHandler.js";
import ApplicationCommand from "../classes/ApplicationCommand.js";
import TextCommandHandler from "../classes/TextCommandHandler.js";
import AutoCompleteHandler from "../classes/AutoCompleteHandler.js";
import ApplicationCommandHandler from "../classes/ApplicationCommandHandler.js";

void BetterUser;
void BetterGuildMember;
void BetterGuild;

export default class BetterClient extends Client {
    public usersUsingBot: Set<string>;

    public readonly config;

    public readonly functions: Functions;

    public readonly logger: Logger.Logger;

    public readonly applicationCommandHandler: ApplicationCommandHandler;

    public applicationCommands: Collection<string, ApplicationCommand>;

    public readonly textCommandHandler: TextCommandHandler;

    public textCommands: Collection<string, TextCommand>;

    public readonly buttonHandler: ButtonHandler;

    public buttons: Collection<string, Button>;

    public readonly dropDownHandler: DropDownHandler;

    public dropDowns: Collection<string, DropDown>;

    public readonly autoCompleteHandler: AutoCompleteHandler;

    public autoCompletes: Collection<string, AutoComplete>;

    public events: Map<string, EventHandler>;

    public readonly prisma: PrismaClient;

    public readonly dataDog: typeof metrics;

    public readonly version: string;

    public stats: Stats;

    public cachedStats: CachedStats;

    public i18n: typeof i18next;

    public languageHandler: LanguageHandler;

    public readonly regexWorker: RegExpWorker;

    public readonly requests: REST;

    /**
     * __dirname is not in our version of ECMA, so we make do with a shitty fix.
     */
    public readonly __dirname: string;

    /**
     * Create our client.
     * @param options The options for our client.
     */
    constructor(options: ClientOptions) {
        super(options);

        this.__dirname = resolve();

        this.usersUsingBot = new Set();
        this.config = Config;
        this.functions = new Functions(this);
        this.logger = Logger.default;

        this.applicationCommandHandler = new ApplicationCommandHandler(this);
        this.applicationCommands = new Collection();

        this.textCommandHandler = new TextCommandHandler(this);
        this.textCommands = new Collection();

        this.buttonHandler = new ButtonHandler(this);
        this.buttons = new Collection();

        this.dropDownHandler = new DropDownHandler(this);
        this.dropDowns = new Collection();

        this.autoCompleteHandler = new AutoCompleteHandler(this);
        this.autoCompletes = new Collection();

        this.events = new Map();

        this.prisma = new PrismaClient();

        this.version =
            process.env.NODE_ENV === "development"
                ? `${this.config.version}-dev`
                : this.config.version;

        this.stats = {
            messageCount: 0,
            commandsRun: 0
        };

        this.cachedStats = {
            guilds: 0,
            users: 0,
            cachedUsers: 0,
            channels: 0,
            roles: 0
        };

        this.i18n = i18next;
        this.languageHandler = new LanguageHandler(this);

        this.loadEvents();
        this.buttonHandler.loadButtons();
        this.dropDownHandler.loadDropDowns();
        this.languageHandler.loadLanguages();
        this.textCommandHandler.loadTextCommands();
        this.autoCompleteHandler.loadAutoCompletes();
        this.applicationCommandHandler.loadApplicationCommands();

        this.i18n.use(intervalPlural).init({
            fallbackLng: "en-US",
            resources: {},
            fallbackNS: "simplemod",
            lng: "eng-US"
        });

        this.regexWorker = new RegExpWorker(100);

        this.requests = new REST({}).setToken(process.env.DISCORD_TOKEN);

        // @ts-ignore
        this.dataDog = metrics.default;
        if (this.config.dataDog.apiKey?.length) {
            this.dataDog.init({
                flushIntervalSeconds: 0,
                apiKey: this.config.dataDog.apiKey,
                prefix: `${this.config.botName}.`,
                defaultTags: [`env:${process.env.NODE_ENV}`]
            });
            setInterval(() => {
                this.dataDog.gauge("guilds", this.cachedStats.guilds);
                this.dataDog.gauge("users", this.cachedStats.users);
                if (this.isReady())
                    this.dataDog.flush(
                        () =>
                            this.logger.info(`Flushed information to DataDog.`),
                        error => {
                            this.logger.error(
                                error,
                                "Failed sending information to DataDog."
                            );
                            this.logger.sentry.captureException(error);
                        }
                    );
            }, 60000);
        }
    }

    /**
     * Load all the events in the events directory.
     */
    private loadEvents() {
        return this.functions
            .getFiles(`${this.__dirname}/dist/src/bot/events`, ".js", true)
            .forEach(async eventFileName => {
                const eventFile = await import(
                    `./../../src/bot/events/${eventFileName}`
                );
                // eslint-disable-next-line new-cap
                const event: EventHandler = new eventFile.default(
                    this,
                    eventFileName.split(".js")[0]
                );
                event.listen();
                return this.events.set(event.name, event);
            });
    }

    /**
     * Reload all the events in the events directory.
     */
    public reloadEvents() {
        this.events.forEach(event => event.removeListener());
        this.loadEvents();
    }

    /**
     * Fetch all the stats for our client.
     */
    public async fetchStats() {
        const stats = await this.shard?.broadcastEval(client => {
            return {
                guilds: client.guilds.cache.size,
                users: client.guilds.cache.reduce(
                    (previous, guild) => previous + (guild.memberCount ?? 0),
                    0
                ),
                cachedUsers: client.users.cache.size,
                channels: client.channels.cache.size,
                roles: client.guilds.cache.reduce(
                    (previous, guild) => previous + guild.roles.cache.size,
                    0
                )
            };
        });

        const reducedStats = stats?.reduce((previous, current) => {
            Object.keys(current).forEach(
                // @ts-ignore
                key => (previous[key] += current[key])
            );
            return previous;
        });
        this.cachedStats = reducedStats || this.cachedStats;
        return reducedStats || this.cachedStats;
    }

    /**
     * Execute regex on a string using a worker.
     * @param regex The regex to execute.
     * @param content The content to execute the regex on.
     * @returns The result of the regex.
     */
    public async executeRegex(regex: RegExp, content: string) {
        try {
            const result = await this.regexWorker.execRegExp(regex, content);
            return result.matches.length || regex.global
                ? result.matches
                : null;
        } catch (error: any) {
            if (error.message !== null && error.elapsedTimeMs !== null)
                return null;
            this.logger.error(error);
            this.logger.sentry.captureWithExtras(error, {
                "Regular Expression": regex,
                Content: content
            });
            return null;
        }
    }
}
