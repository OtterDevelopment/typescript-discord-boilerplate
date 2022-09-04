import {
    ButtonInteraction,
    MessageEmbedOptions,
    PermissionString
} from "discord.js";
import Language from "./Language.js";
import { ButtonOptions } from "../../typings";
import BetterClient from "../extensions/BetterClient.js";
import BetterButtonInteraction from "../extensions/BetterButtonInteraction.js";

export default class Button {
    public readonly name: string;

    private readonly permissions: PermissionString[];

    private readonly clientPermissions: PermissionString[];

    private readonly devOnly: boolean;

    private readonly guildOnly: boolean;

    private readonly ownerOnly: boolean;

    public readonly client: BetterClient;

    /**
     * Create our Button.
     * @param name The beginning of the customId this button listens for.
     * @param client Our client.
     * @param options The options for our button.
     */
    constructor(name: string, client: BetterClient, options?: ButtonOptions) {
        this.name = name;

        this.permissions = options?.permissions || [];
        this.clientPermissions = client.config.requiredPermissions.concat(
            options?.clientPermissions || []
        );

        this.devOnly = options?.devOnly || false;
        this.guildOnly = options?.guildOnly || false;
        this.ownerOnly = options?.ownerOnly || false;

        this.client = client;
    }

    /**
     * Validate this interaction to make sure this button can be executed.
     * @param interaction The interaction that was created.
     * @returns The error or null if the command is valid.
     */
    public async validate(
        interaction: BetterButtonInteraction
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
                        type: "button"
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
                        type: "button"
                    }
                )
            };
        return null;
    }

    /**
     * This function must be evaluated to true or else this slash command will not be executed.
     * @param _interaction The interaction that was created.
     */
    public async preCheck(
        _interaction: ButtonInteraction
    ): Promise<[boolean, MessageEmbedOptions?]> {
        return [true];
    }

    /**
     * Run this button.
     * @param _interaction The interaction that was created.
     */
    public async run(_interaction: ButtonInteraction): Promise<any> {}
}
