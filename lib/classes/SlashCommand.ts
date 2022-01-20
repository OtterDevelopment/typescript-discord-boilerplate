import { format } from "@lukeed/ms";
import {
    ApplicationCommandOptionData,
    CommandInteraction,
    PermissionString,
    Snowflake
} from "discord.js";
import { SlashCommandOptions } from "../../typings";
import BetterClient from "../extensions/BetterClient.js";

export default class SlashCommand {
    public readonly name: string;

    public readonly description: string;

    public readonly options: ApplicationCommandOptionData[];

    private readonly permissions: PermissionString[];

    private readonly clientPermissions: PermissionString[];

    private readonly devOnly: boolean;

    private readonly guildOnly: boolean;

    private readonly ownerOnly: boolean;

    public readonly cooldown: number;

    public readonly client: BetterClient;

    constructor(
        name: string,
        client: BetterClient,
        options: SlashCommandOptions
    ) {
        this.name = name;
        this.description = options.description || "";
        this.options = options.options || [];

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
                .collection("slashCommands")
                .updateOne(
                    { textCommand: this.name.toLowerCase() },
                    { $set: { [userId]: Date.now() } },
                    { upsert: true }
                );
        return false;
    }

    public async validate(
        interaction: CommandInteraction
    ): Promise<{ title: string; description: string } | null> {
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
        else if (this.devOnly && !this.client.config.admins)
            return {
                title: "Missing Permissions",
                description: "This command can only be ran by my developer!"
            };
        else if (
            this.permissions &&
            !interaction.memberPermissions?.has(this.permissions)
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
            this.clientPermissions &&
            !interaction.memberPermissions?.has(this.clientPermissions)
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
                .collection("slashCommands")
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

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public async run(interaction: CommandInteraction): Promise<any> {}
}
