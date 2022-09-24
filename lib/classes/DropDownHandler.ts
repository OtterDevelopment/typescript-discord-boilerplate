import Language from "./Language.js";
import DropDown from "./DropDown.js";
import BetterClient from "../extensions/BetterClient.js";
import BetterSelectMenuInteraction from "../extensions/BetterSelectMenuInteraction.js";

void BetterSelectMenuInteraction;

export default class DropdownHandler {
    private readonly client: BetterClient;

    private readonly coolDownTime: number;

    private readonly coolDowns: Set<string>;

    /**
     * Create our DropDownHandler.
     * @param client Our client.
     */
    constructor(client: BetterClient) {
        this.client = client;

        this.coolDownTime = 1000;
        this.coolDowns = new Set();
    }

    /**
     * Load all the dropdowns in the dropdowns directory.
     */
    public loadDropDowns(): void {
        this.client.functions
            .getFiles(
                `${this.client.__dirname}/dist/src/bot/dropDowns`,
                "",
                true
            )
            .forEach(parentFolder =>
                this.client.functions
                    .getFiles(
                        `${this.client.__dirname}/dist/src/bot/dropDowns`,
                        ".js"
                    )
                    .forEach(async fileName => {
                        const dropDownFile = await import(
                            `../../src/bot/buttons/${parentFolder}/${fileName}`
                        );
                        // eslint-disable-next-line new-cap
                        const dropDown: DropDown = new dropDownFile.default(
                            this.client
                        );
                        return this.client.dropDowns.set(
                            dropDown.name,
                            dropDown
                        );
                    })
            );
    }

    /**
     * Reload all the buttons in the dropdowns directory.
     */
    public reloadDropDowns() {
        this.client.dropDowns.clear();
        this.loadDropDowns();
    }

    /**
     * Fetch the dropdown that starts with the provided customId.
     * @param customId The customId to search for.
     * @returns The button we've found.
     */
    private fetchDropDown(customId: string): DropDown | undefined {
        return this.client.dropDowns.find(dropDown =>
            customId.startsWith(dropDown.name)
        );
    }

    /**
     * Handle the interaction created for this dropdown to make sure the user and client can execute it.
     * @param interaction The interaction created.
     */
    public async handleDropDown(interaction: BetterSelectMenuInteraction) {
        const dropDown = this.fetchDropDown(interaction.message!.id);
        if (
            !dropDown ||
            (process.env.NODE_ENV === "development" &&
                !this.client.functions.isAdmin(interaction.user.id))
        )
            return;

        const missingPermissions = await dropDown.validate(interaction);
        if (missingPermissions)
            return interaction.reply(
                this.client.functions.generateErrorMessage(missingPermissions)
            );

        const preChecked = await dropDown.preCheck(interaction);
        if (!preChecked[0]) {
            if (preChecked[1])
                await interaction.reply(
                    this.client.functions.generateErrorMessage(preChecked[1])
                );
            return;
        }

        return this.runDropDown(dropDown, interaction);
    }

    /**
     * Execute our dropdown.
     * @param dropdown The dropdown we want to execute.
     * @param interaction The interaction for our dropdown.
     */
    private async runDropDown(
        dropdown: DropDown,
        interaction: BetterSelectMenuInteraction
    ): Promise<any> {
        const language = (interaction.language ||
            (await interaction.fetchLanguage())) as Language;

        if (this.coolDowns.has(interaction.user.id))
            return interaction.reply(
                this.client.functions.generateErrorMessage({
                    title: language.get("COOLDOWN_ON_TYPE_TITLE", {
                        type: "Dropdown"
                    }),
                    description: language.get("COOLDOWN_ON_TYPE_DESCRIPTION", {
                        type: "dropdown"
                    })
                })
            );

        this.client.usersUsingBot.add(interaction.user.id);
        dropdown
            .run(interaction)
            .then(() => {
                this.client.usersUsingBot.delete(interaction.user.id);
                this.client.dataDog.increment("dropdownUsage", 1, [
                    `dropdown:${dropdown.name}`
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
                        "AN_ERROR_HAS_OCCURRED_DESCRIPTION_NO_NAME",
                        { type: "dropdown" }
                    ),
                    footer: { text: `Sentry Event ID: ${sentryId} ` }
                });
                if (interaction.replied) return interaction.followUp(toSend);
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
