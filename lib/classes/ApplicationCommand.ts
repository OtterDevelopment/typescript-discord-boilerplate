import {
    ApplicationCommandType,
    PermissionString,
    ContextMenuInteraction,
    MessageEmbedOptions,
    Snowflake
} from "discord.js";
import BetterClient from "../extensions/BetterClient.js";
import { ApplicationCommandOptions } from "../../typings";
import BetterCommandInteraction from "../extensions/BetterCommandInteraction.js";
import BetterContextMenuInteraction from "../extensions/BetterContextMenuInteraction.js";
import Language from "./Language.js";

export default class ApplicationCommand {
    public readonly name: string;

    public readonly description?: string;

    public readonly type: ApplicationCommandType;

    public readonly options: ApplicationCommandOptions;

    private readonly permissions: PermissionString[];

    private readonly clientPermissions: PermissionString[];

    private readonly devOnly: boolean;

    private readonly guildOnly: boolean;

    private readonly ownerOnly: boolean;

    public readonly cooldown: number;

    public readonly client: BetterClient;

    /**
     * Create our application commands.
     * @param name The name of our application command.
     * @param client Our client.
     * @param options The options for our application command.
     */
    constructor(
        name: string,
        client: BetterClient,
        options: ApplicationCommandOptions
    ) {
        this.name = name;
        this.description = options.description;
        this.options = options;
        this.type = options.type || "CHAT_INPUT";

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
     * Apply the cooldown for this slash command.
     * @param userId The userId to apply the cooldown on.
     * @returns True or false if the cooldown is actually applied.
     */
    public async applyCooldown(userId: Snowflake): Promise<boolean> {
        if (this.cooldown)
            return !!(await this.client.mongo
                .db("cooldowns")
                .collection("applicationCommand")
                .updateOne(
                    { textCommand: this.name.toLowerCase() },
                    { $set: { [userId]: Date.now() } },
                    { upsert: true }
                ));
        return false;
    }

    /**
     * Validate this interaction to make sure this application command can be executed.
     * @param interaction The interaction that was created.
     * @returns Options for the embed to send or null if the application command is valid.
     */
    public async validate(
        interaction: BetterCommandInteraction | BetterContextMenuInteraction
    ): Promise<MessageEmbedOptions | null> {
        const language = (interaction.language ||
            (await interaction.fetchLanguage())) as Language;

        if (this.guildOnly && !interaction.inGuild())
            return {
                title: language.get("MISSING_PERMISSIONS_BASE_TITLE"),
                description: language.get("MISSING_PERMISSIONS_GUILD_ONLY")
            };
        else if (
            this.ownerOnly &&
            interaction.guild?.ownerId !== interaction.user.id
        )
            return {
                title: language.get("MISSING_PERMISSIONS_BASE_TITLE"),
                description: language.get("MISSING_PERMISSIONS_OWNER_ONLY")
            };
        else if (
            this.devOnly &&
            !this.client.functions.isAdmin(interaction.user.id)
        )
            return {
                title: language.get("MISSING_PERMISSIONS_BASE_TITLE"),
                description: language.get("MISSING_PERMISSIONS_DEVELOPER_ONLY")
            };
        else if (
            interaction.guild &&
            this.permissions.length &&
            !interaction.memberPermissions?.has(this.permissions)
        )
            return {
                title: language.get("MISSING_PERMISSIONS_BASE_TITLE"),
                description: language.get(
                    this.permissions.filter(
                        permission =>
                            !interaction.memberPermissions?.has(permission)
                    ).length === 1
                        ? "MISSING_PERMISSIONS_USER_PERMISSIONS_ONE"
                        : "MISSING_PERMISSIONS_USER_PERMISSIONS_OTHER",
                    {
                        permissions: this.permissions
                            .filter(
                                permission =>
                                    !interaction.memberPermissions?.has(
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
            interaction.guild &&
            this.clientPermissions.length &&
            !interaction.guild?.me?.permissions.has(this.clientPermissions)
        )
            return {
                title: language.get("MISSING_PERMISSIONS_BASE_TITLE"),
                description: language.get(
                    this.permissions.filter(
                        permission =>
                            !interaction.guild?.me?.permissions?.has(permission)
                    ).length === 1
                        ? "MISSING_PERMISSIONS_CLIENT_PERMISSIONS_ONE"
                        : "MISSING_PERMISSIONS_CLIENT_PERMISSIONS_OTHER",
                    {
                        permissions: this.permissions
                            .filter(
                                permission =>
                                    !interaction.guild?.me?.permissions?.has(
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
            const onCooldown = await this.client.mongo
                .db("cooldowns")
                .collection("applicationCommand")
                .findOne({
                    textCommand: this.name.toLowerCase(),
                    [interaction.user.id]: { $exists: true }
                });
            if (onCooldown)
                if (Date.now() - onCooldown.createdAt.valueOf() < this.cooldown)
                    return {
                        title: language.get("TYPE_ON_COOLDOWN_TITLE"),
                        description: language.get(
                            "TYPE_ON_COOLDOWN_DESCRIPTION",
                            {
                                type: "command",
                                formattedTime: this.client.functions.format(
                                    onCooldown[interaction.user.id] +
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
     * This function must be evaluated to true or else this application command will not be executed.
     * @param _interaction The interaction that was created.
     */
    public async preCheck(
        _interaction: BetterCommandInteraction | ContextMenuInteraction
    ): Promise<[boolean, MessageEmbedOptions?]> {
        return [true];
    }

    /**
     * Run this application command.
     * @param _interaction The interaction that was created.
     */
    public async run(
        _interaction: BetterCommandInteraction | ContextMenuInteraction
    ): Promise<any> {}
}
