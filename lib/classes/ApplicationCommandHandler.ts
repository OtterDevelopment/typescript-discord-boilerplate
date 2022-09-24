import { Snowflake } from "discord.js";
import ApplicationCommand from "./ApplicationCommand.js";
import BetterClient from "../extensions/BetterClient.js";
import BetterCommandInteraction from "../extensions/BetterCommandInteraction.js";
import BetterContextMenuInteraction from "../extensions/BetterContextMenuInteraction.js";
import Language from "./Language.js";

void BetterCommandInteraction;
void BetterContextMenuInteraction;

export default class ApplicationCommandHandler {
    private readonly client: BetterClient;

    private readonly coolDownTime: number;

    private coolDowns: Set<Snowflake>;

    /**
     * Create our ApplicationCommandHandler.
     * @param client Our client.
     */
    constructor(client: BetterClient) {
        this.client = client;

        this.coolDownTime = 1000;
        this.coolDowns = new Set();
    }

    /**
     * Load all the application commands in the applicationCommands directory.
     */
    public loadApplicationCommands() {
        this.client.functions
            .getFiles(
                `${this.client.__dirname}/dist/src/bot/applicationCommands`,
                "",
                true
            )
            .forEach(parentFolder =>
                this.client.functions
                    .getFiles(
                        `${this.client.__dirname}/dist/src/bot/applicationCommands/${parentFolder}`,
                        ".js"
                    )
                    .forEach(async fileName => {
                        const commandFile = await import(
                            `../../src/bot/applicationCommands/${parentFolder}/${fileName}`
                        );
                        const command: ApplicationCommand =
                            // eslint-disable-next-line new-cap
                            new commandFile.default(this.client);
                        return this.client.applicationCommands.set(
                            command.name,
                            command
                        );
                    })
            );
    }

    public registerApplicationCommands() {
        if (process.env.NODE_ENV === "production") {
            this.client.application?.commands.set(
                this.client.applicationCommands.map(applicationCommand => {
                    if (applicationCommand.type === "CHAT_INPUT")
                        return {
                            name: applicationCommand.name,
                            description: applicationCommand.description || "",
                            options: applicationCommand.options.options || [],
                            type: applicationCommand.type
                        };
                    else
                        return {
                            name: applicationCommand.name,
                            options: applicationCommand.options.options || [],
                            type: applicationCommand.type
                        };
                })
            );
            return Promise.all(
                this.client.guilds.cache.map(guild =>
                    guild.commands.set([]).catch(error => {
                        if (error.code === 50001)
                            this.client.logger.error(
                                null,
                                `I encountered DiscordAPIError: Missing Access in ${guild.name} [${guild.id}] when trying to set application commands!`
                            );
                        else {
                            this.client.logger.error(error);
                            this.client.logger.sentry.captureWithExtras(error, {
                                Guild: guild.name,
                                "Guild ID": guild.id,
                                "Application Command Count":
                                    this.client.applicationCommands.size,
                                "Application Commands":
                                    this.client.applicationCommands.map(
                                        applicationCommand => {
                                            return {
                                                name: applicationCommand.name,
                                                description:
                                                    applicationCommand.description,
                                                type: applicationCommand.type,
                                                options:
                                                    applicationCommand.options
                                            };
                                        }
                                    )
                            });
                        }
                    })
                )
            );
        } else
            return Promise.all(
                this.client.guilds.cache.map(async guild =>
                    guild.commands
                        .set(
                            this.client.applicationCommands.map(
                                applicationCommand => {
                                    if (
                                        applicationCommand.type === "CHAT_INPUT"
                                    )
                                        return {
                                            name: applicationCommand.name,
                                            description:
                                                applicationCommand.description ||
                                                "",
                                            options:
                                                applicationCommand.options
                                                    .options || [],
                                            type: applicationCommand.type
                                        };
                                    else
                                        return {
                                            name: applicationCommand.name,
                                            options:
                                                applicationCommand.options
                                                    .options || [],
                                            type: applicationCommand.type
                                        };
                                }
                            )
                        )
                        .catch(error => {
                            if (error.code === 50001)
                                this.client.logger.error(
                                    null,
                                    `I encountered DiscordAPIError: Missing Access in ${guild.name} [${guild.id}] when trying to set slash commands!`
                                );
                            else {
                                this.client.logger.error(error);
                                this.client.logger.sentry.captureWithExtras(
                                    error,
                                    {
                                        Guild: guild.name,
                                        "Guild ID": guild.id,
                                        "Application Command Count":
                                            this.client.applicationCommands
                                                .size,
                                        "Application Commands":
                                            this.client.applicationCommands.map(
                                                applicationCommand => {
                                                    return {
                                                        name: applicationCommand.name,
                                                        description:
                                                            applicationCommand.description,
                                                        type: applicationCommand.type,
                                                        options:
                                                            applicationCommand.options
                                                    };
                                                }
                                            )
                                    }
                                );
                            }
                        })
                )
            );
    }

    /**
     * Reload all the application commands in the applicationCommands directory.
     */
    public reloadApplicationCommands() {
        this.client.applicationCommands.clear();
        this.loadApplicationCommands();
    }

    /**
     * Fetch the application command that has the provided name.
     * @param name The name to search for.
     * @return The application command we've found.
     */
    private fetchCommand(name: string): ApplicationCommand | undefined {
        return this.client.applicationCommands.get(name);
    }

    /**
     * Handle the interaction created for this application command to make sure the user and client can execute it.
     * @param interaction The interaction created.
     */
    public async handleCommand(
        interaction: BetterCommandInteraction | BetterContextMenuInteraction
    ) {
        const command = this.fetchCommand(interaction.commandName);
        if (!command) {
            this.client.logger.error(
                `${interaction.user.tag} [${interaction.user.id}] invoked application command ${interaction.commandName} even though it doesn't exist.`
            );
            const sentryId =
                await this.client.logger.sentry.captureWithInteraction(
                    new Error(`Non existent application command invoked`),
                    interaction
                );
            if (process.env.NODE_ENV === "production")
                this.client.application?.commands.delete(
                    interaction.commandName
                );
            else
                await Promise.all(
                    this.client.guilds.cache.map(guild =>
                        guild.commands
                            .delete(interaction.commandName)
                            .catch(error => {
                                if (error.code === 50001)
                                    this.client.logger.error(
                                        null,
                                        `I encountered DiscordAPIError: Missing Access in ${guild.name} [${guild.id}] when trying to set application commands!`
                                    );
                                else {
                                    this.client.logger.error(error);
                                    this.client.logger.sentry.captureWithExtras(
                                        error,
                                        {
                                            Guild: guild.name,
                                            "Guild ID": guild.id,
                                            "Application Command Count":
                                                this.client.applicationCommands
                                                    .size,
                                            "Application Commands":
                                                this.client.applicationCommands.map(
                                                    cmd => {
                                                        return {
                                                            name: cmd.name,
                                                            description:
                                                                cmd.description,
                                                            type: cmd.type,
                                                            options: cmd.options
                                                        };
                                                    }
                                                )
                                        }
                                    );
                                }
                            })
                    )
                );

            const language = (interaction.language ||
                (await interaction.fetchLanguage())) as Language;

            return interaction.reply(
                this.client.functions.generateErrorMessage({
                    title: language.get("NON_EXISTENT_TITLE"),
                    description: language.get("NON_EXISTENT_DESCRIPTION", {
                        type: "command",
                        name: interaction.commandName,
                        username:
                            interaction.guild?.me?.nickname ||
                            interaction.user.username ||
                            this.client.config.botName
                    }),
                    footer: { text: `Sentry Event ID: ${sentryId} ` }
                })
            );
        }

        if (
            process.env.NODE_ENV === "development" &&
            !this.client.functions.isAdmin(interaction.user.id)
        )
            return;

        const missingPermissions = await command.validate(interaction);
        if (missingPermissions)
            return interaction.reply(
                this.client.functions.generateErrorMessage(missingPermissions)
            );

        const preChecked = await command.preCheck(interaction);
        if (!preChecked[0]) {
            if (preChecked[1])
                await interaction.reply(
                    this.client.functions.generateErrorMessage(preChecked[1])
                );
            return;
        }

        return this.runCommand(command, interaction);
    }

    /**
     * Execute our application command.
     * @param command The application command we want to execute.
     * @param interaction The interaction that was created for our application command.
     */
    private async runCommand(
        command: ApplicationCommand,
        interaction: BetterCommandInteraction | BetterContextMenuInteraction
    ): Promise<any> {
        const language = (interaction.language ||
            (await interaction.fetchLanguage())) as Language;

        if (this.coolDowns.has(interaction.user.id))
            return interaction.reply(
                this.client.functions.generateErrorMessage({
                    title: language.get("COOLDOWN_ON_TYPE_TITLE", {
                        type: "Command"
                    }),
                    description: language.get("COOLDOWN_ON_TYPE_DESCRIPTION", {
                        type: "command"
                    })
                })
            );

        this.client.usersUsingBot.add(interaction.user.id);
        command
            .run(interaction)
            .then(async () => {
                if (command.cooldown)
                    await command.applyCooldown(interaction.user.id);
                this.client.usersUsingBot.delete(interaction.user.id);
                this.client.dataDog.increment("slashCommandUsage", 1, [
                    `command:${command.name}`
                ]);
            })
            .catch(async (error): Promise<any> => {
                this.client.logger.error(error);
                const sentryId =
                    await this.client.logger.sentry.captureWithInteraction(
                        error,
                        interaction
                    );
                const toSend = this.client.functions.generateErrorMessage({
                    title: language.get("AN_ERROR_HAS_OCCURRED_TITLE"),
                    description: language.get(
                        "AN_ERROR_HAS_OCCURRED_DESCRIPTION",
                        { type: "command", name: command.name }
                    ),
                    footer: { text: `Sentry Event ID: ${sentryId} ` }
                });
                if (interaction.replied) return interaction.followUp(toSend);
                else if (interaction.deferred)
                    return interaction.editReply(toSend);
                else
                    return interaction.reply({
                        ...toSend
                    });
            });
        this.coolDowns.add(interaction.user.id);
        setTimeout(
            () => this.coolDowns.delete(interaction.user.id),
            this.coolDownTime
        );
    }
}
