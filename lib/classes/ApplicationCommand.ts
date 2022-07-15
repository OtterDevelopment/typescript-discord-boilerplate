import { format } from "@lukeed/ms";
import {
    ApplicationCommandType,
    PermissionString,
    CommandInteraction,
    ContextMenuInteraction,
    MessageEmbedOptions,
    Snowflake
} from "discord.js";
import { ApplicationCommandOptions } from "../../typings";
import BetterClient from "../extensions/BetterClient";

export default class ApplicationCommand {
    /**
     * The name for our slash command.
     */
    public readonly name: string;

    /**
     * The description for our slash command.
     */
    public readonly description?: string;

    /**
     * The type of the slash command, usually CHAT_INPUT
     */
    public readonly type: ApplicationCommandType;

    /**
     * The options for our slash command.
     */
    public readonly options: ApplicationCommandOptions;

    /**
     * The permissions a user would require to execute this slash command.
     */
    private readonly permissions: PermissionString[];

    /**
     * The permissions the client requires to execute this slash command.
     */
    private readonly clientPermissions: PermissionString[];

    /**
     * Whether this slash command is only for developers.
     */
    private readonly devOnly: boolean;

    /**
     * Whether this slash command is only to be used in guilds.
     */
    private readonly guildOnly: boolean;

    /**
     * Whether this slash command is only to be used by guild owners.
     */
    private readonly ownerOnly: boolean;

    /**
     * The cooldown for this slash command.
     */
    public readonly cooldown: number;

    /**
     * Our client.
     */
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
        interaction: CommandInteraction | ContextMenuInteraction
    ): Promise<MessageEmbedOptions | null> {
        if (this.guildOnly && !interaction.inGuild())
            return {
                title: "Missing Permissions",
                description: "This command can only be used in guilds!"
            };
        else if (
            this.ownerOnly &&
            interaction.guild?.ownerId !== interaction.user.id
        )
            return {
                title: "Missing Permissions",
                description:
                    "This command can only be ran by the owner of this guild!"
            };
        else if (
            this.devOnly &&
            !this.client.functions.isAdmin(interaction.user.id)
        )
            return {
                title: "Missing Permissions",
                description: "This command can only be used by my developers!"
            };
        else if (
            interaction.guild &&
            this.permissions.length &&
            !interaction.memberPermissions?.has(this.permissions)
        )
            return {
                title: "Missing Permissions",
                description: `You need the ${this.permissions
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
            interaction.guild &&
            this.clientPermissions.length &&
            !interaction.guild?.me?.permissions.has(this.clientPermissions)
        )
            return {
                title: "Missing Permissions",
                description: `I need the ${this.clientPermissions
                    .map(
                        permission =>
                            `**${this.client.functions.getPermissionName(
                                permission
                            )}**`
                    )
                    .join(", ")} permission${
                    this.clientPermissions.length > 1 ? "s" : ""
                } to run this command.`
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
                if (
                    Date.now() - onCooldown[interaction.user.id] <
                    this.cooldown
                )
                    return {
                        title: "Command On Cooldown",
                        description: `This command is still on cooldown for another ${format(
                            onCooldown[interaction.user.id] +
                                this.cooldown -
                                Date.now(),
                            true
                        )}!`
                    };
        }
        return null;
    }

    /**
     * This function must be evaluated to true or else this application command will not be executed.
     * @param _interaction The interaction that was created.
     */
    public async preCheck(
        _interaction: CommandInteraction | ContextMenuInteraction
    ): Promise<[boolean, MessageEmbedOptions?]> {
        return [true];
    }

    /**
     * Run this application command.
     * @param _interaction The interaction that was created.
     */
    public async run(
        _interaction: CommandInteraction | ContextMenuInteraction
    ): Promise<any> {}
}
