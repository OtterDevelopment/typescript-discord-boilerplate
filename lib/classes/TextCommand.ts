import { MessageEmbedOptions, PermissionString, Snowflake } from "discord.js";
import { TextCommandOptions } from "../../typings";
import BetterMessage from "../extensions/BetterMessage.js";
import BetterClient from "../extensions/BetterClient.js";
import Language from "./Language";

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

    /**
     * Create our text command,
     * @param name The name of our text command.
     * @param client Our client.
     * @param options The options for our text command.
     */
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

    /**
     * Apply the cooldown for this text command.
     * @param userId The userId to apply the cooldown on.
     * @returns True or false if the cooldown is actually applied.
     */
    public async applyCooldown(userId: Snowflake): Promise<boolean> {
        if (this.cooldown)
            return !!(await this.client.prisma.cooldown.upsert({
                where: {
                    commandName_commandType_userId: {
                        commandName: this.name.toLowerCase(),
                        commandType: "TEXT_COMMAND",
                        userId
                    }
                },
                update: { createdAt: new Date() },
                create: {
                    commandName: this.name.toLowerCase(),
                    commandType: "TEXT_COMMAND",
                    userId
                }
            }));
        return false;
    }

    /**
     * Validate this interaction to make sure this text command can be executed.
     * @param message The interaction that was created.
     * @returns Options for the embed to send or null if the text command is valid.
     */
    public async validate(
        message: BetterMessage
    ): Promise<{ title: string; description: string } | null> {
        const language = (message.language ||
            (await message.fetchLanguage())) as Language;

        if (this.guildOnly && !message.inGuild())
            return {
                title: language.get("MISSING_PERMISSIONS_BASE_TITLE"),
                description: language.get("MISSING_PERMISSIONS_GUILD_ONLY")
            };
        else if (this.ownerOnly && message.guild?.ownerId !== message.author.id)
            return {
                title: language.get("MISSING_PERMISSIONS_BASE_TITLE"),
                description: language.get("MISSING_PERMISSIONS_OWNER_ONLY")
            };
        else if (
            this.devOnly &&
            !this.client.functions.isAdmin(message.author.id)
        )
            return {
                title: language.get("MISSING_PERMISSIONS_BASE_TITLE"),
                description: language.get("MISSING_PERMISSIONS_DEVELOPER_ONLY")
            };
        else if (
            message.guild &&
            this.permissions.length &&
            !message.member?.permissions?.has(this.permissions)
        )
            return {
                title: language.get("MISSING_PERMISSIONS_BASE_TITLE"),
                description: language.get(
                    this.permissions.filter(
                        permission =>
                            !message.member?.permissions?.has(permission)
                    ).length === 1
                        ? "MISSING_PERMISSIONS_USER_PERMISSIONS_ONE"
                        : "MISSING_PERMISSIONS_USER_PERMISSIONS_OTHER",
                    {
                        permissions: this.permissions
                            .filter(
                                permission =>
                                    !message.member?.permissions?.has(
                                        permission
                                    )
                            )
                            .map(
                                permission =>
                                    `**${this.client.functions.getPermissionName(
                                        permission,
                                        language
                                    )}**`
                            )
                            .join(", "),
                        type: "command"
                    }
                )
            };
        else if (
            message.guild &&
            this.clientPermissions.length &&
            !message.guild?.me?.permissions.has(this.clientPermissions)
        )
            return {
                title: language.get("MISSING_PERMISSIONS_BASE_TITLE"),
                description: language.get(
                    this.permissions.filter(
                        permission =>
                            !message.guild?.me?.permissions?.has(permission)
                    ).length === 1
                        ? "MISSING_PERMISSIONS_CLIENT_PERMISSIONS_ONE"
                        : "MISSING_PERMISSIONS_CLIENT_PERMISSIONS_OTHER",
                    {
                        permissions: this.permissions
                            .filter(
                                permission =>
                                    !message.guild?.me?.permissions?.has(
                                        permission
                                    )
                            )
                            .map(
                                permission =>
                                    `**${this.client.functions.getPermissionName(
                                        permission,
                                        language
                                    )}**`
                            )
                            .join(", "),
                        type: "command"
                    }
                )
            };
        else if (this.cooldown) {
            const cooldownItem = await this.client.prisma.cooldown.findUnique({
                where: {
                    commandName_commandType_userId: {
                        commandName: this.name.toLowerCase(),
                        commandType: "APPLICATION_COMMAND",
                        userId: message.author.id
                    }
                }
            });
            if (cooldownItem)
                if (
                    Date.now() - cooldownItem.createdAt.valueOf() <
                    this.cooldown
                )
                    return {
                        title: language.get("TYPE_ON_COOLDOWN_TITLE"),
                        description: language.get(
                            "TYPE_ON_COOLDOWN_DESCRIPTION",
                            {
                                type: "command",
                                formattedTime: this.client.functions.format(
                                    cooldownItem.createdAt.valueOf() +
                                        this.cooldown -
                                        Date.now(),
                                    true,
                                    language
                                )
                            }
                        )
                    };
        }
        return null;
    }

    /**
     * This function must be evaluated to true or else this text command will not be executed.
     * @param _message The message that was created.
     */
    public async preCheck(
        _message: BetterMessage
    ): Promise<[boolean, MessageEmbedOptions?]> {
        return [true];
    }

    /**
     * Run this text command.
     * @param _message The message that was created.
     * @param _args
     */
    public async run(_message: BetterMessage, _args: string[]): Promise<any> {}
}

