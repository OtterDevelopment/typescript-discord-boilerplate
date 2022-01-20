import { format } from "@lukeed/ms";
import { PermissionString, Snowflake } from "discord.js";
import { TextCommandOptions } from "../../typings";
import BetterMessage from "../extensions/BetterMessage";
import BetterClient from "../extensions/BetterClient.js";

export default class TextCommand {
    public readonly name: string;

    public readonly description: string;

    public readonly aliases: string[];

    public readonly permissions: PermissionString[];

    private readonly clientPermissions: PermissionString[];

    private readonly devOnly: boolean;

    private readonly guildOnly: boolean;

    private readonly ownerOnly: boolean;

    public readonly cooldown: number;

    public readonly client: BetterClient;

    constructor(
        name: string,
        client: BetterClient,
        options: TextCommandOptions
    ) {
        this.name = name;
        this.description = "";
        this.aliases = options.aliases || [];

        this.permissions = options.permissions || [];
        this.clientPermissions = client.config.requiredPermissions.concat(
            options.clientPermissions || []
        );

        this.devOnly = options.devOnly || false;
        this.guildOnly = options.guildOnly || false;
        this.ownerOnly = options.ownerOnly || false;

        this.cooldown = options.cooldown || 0;

        this.client = client;
    }

    public applyCooldown(userId: Snowflake): boolean {
        if (this.cooldown)
            return !!this.client.mongo
                .db("cooldowns")
                .collection("textCommands")
                .updateOne(
                    { textCommand: this.name.toLowerCase() },
                    { $set: { [userId]: Date.now() } },
                    { upsert: true }
                );
        return false;
    }

    public async validate(
        message: BetterMessage
    ): Promise<{ title: string; description: string } | null> {
        if (this.guildOnly && !message.inGuild())
            return {
                title: "Missing Permissions",
                description: "This command can only be used in guilds."
            };
        else if (this.ownerOnly && message.guild?.ownerId !== message.author.id)
            return {
                title: "Missing Permissions",
                description:
                    "This command can only be ran by the owner of this guild!"
            };
        else if (
            this.devOnly &&
            !this.client.config.admins.includes(message.author.id)
        )
            return {
                title: "Missing Permissions",
                description:
                    "This command can only be used by the bot developer."
            };
        else if (
            this.permissions.length > 0 &&
            !message.member?.permissions.has(this.permissions)
        )
            return {
                title: "Missing Permissions",
                description: `You need ${
                    this.permissions.length > 1 ? "" : "the"
                } ${this.permissions
                    .map(
                        permission =>
                            `**${this.client.functions.getPermissionName(
                                permission
                            )}**`
                    )
                    .join(", ")} permission${
                    this.permissions.length > 1 ? "s" : ""
                } to run this command.`
            };
        else if (
            this.clientPermissions.length > 0 &&
            !message.guild?.me?.permissions.has(this.clientPermissions)
        )
            return {
                title: "Missing Permissions",
                description: `You need ${
                    this.permissions.length > 1 ? "" : "the"
                } ${this.permissions
                    .map(
                        permission =>
                            `**${this.client.functions.getPermissionName(
                                permission
                            )}**`
                    )
                    .join(", ")} permission${
                    this.permissions.length > 1 ? "s" : ""
                } to run this command.`
            };
        else if (this.cooldown) {
            const onCooldown = await this.client.mongo
                .db("cooldowns")
                .collection("textCommands")
                .findOne({
                    textCommand: this.name.toLowerCase(),
                    [message.author.id]: { $exists: true }
                });
            if (onCooldown)
                if (Date.now() - onCooldown[message.author.id] < this.cooldown)
                    return {
                        title: "Command On Cooldown",
                        description: `This command is still on cooldown for another ${format(
                            onCooldown[message.author.id] +
                                this.cooldown -
                                Date.now(),
                            true
                        )}!`
                    };
        }
        return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public async run(message: BetterMessage, args: string[]): Promise<any> {}
}
