import { InteractionType, LocaleString } from "discord.js";
import { collectDefaultMetrics, Gauge } from "prom-client";
import ExtendedClient from "../extensions/ExtendedClient";

export default class Metrics {
    /** Our extended client. */
    public readonly client: ExtendedClient;

    private readonly commandsUsed = new Gauge({
        name: "command_used",
        help: "The usage of each command.",
        labelNames: ["command", "type", "success", "shard"]
    });

    private readonly autocompleteResponses = new Gauge({
        name: "autocomplete_responses",
        help: "The number of autocomplete responses sent.",
        labelNames: ["name", "shard"]
    });

    private readonly interactionsCreated = new Gauge({
        name: "interactions_created",
        help: "The number of interactions created.",
        labelNames: ["name", "type", "shard"]
    });

    private readonly userLocales = new Gauge({
        name: "user_locales",
        help: "What users have their language set to.",
        labelNames: ["locale", "shard"]
    });

    private readonly guildCount = new Gauge({
        name: "guild_count",
        help: "The number of guilds the server is in.",
        labelNames: ["shard"]
    });

    private readonly userCount = new Gauge({
        name: "user_count",
        help: "The number of users the bot can see.",
        labelNames: ["shard"]
    });

    private readonly websocketEvents = new Gauge({
        name: "websocket_events",
        help: "The number of websocket events the bot has received.",
        labelNames: ["type", "shard"]
    });

    /**
     * Create our Metrics class.
     * @param client Our extended client.
     */
    constructor(client: ExtendedClient) {
        this.client = client;

        collectDefaultMetrics();
    }

    public incrementCommandUse(
        command: string,
        type: string,
        success: boolean,
        shard: number
    ) {
        this.commandsUsed.inc({
            command,
            type,
            shard,
            success: success?.toString()
        });
    }

    public incrementInteractionCreate(
        name: string,
        type: InteractionType,
        shard: number
    ) {
        this.interactionsCreated.inc({ name, shard, type: type.toString() });
    }

    public incrementUserLocale(locale: LocaleString, shard: number) {
        this.userLocales.inc({ shard, locale: locale.toString() });
    }

    public incrementAutocompleteResponse(name: string, shard: number) {
        this.autocompleteResponses.inc({ name, shard });
    }

    public updateGuildCount(count: number, shard?: number) {
        this.guildCount.set({ shard }, count);
    }

    public updateUserCount(count: number, shard?: number) {
        this.userCount.set({ shard }, count);
    }

    public incrementWebsocketEvent(type: string, shard: number) {
        this.websocketEvents.inc({ type, shard: shard.toString() });
    }
}

