import { createHash } from "crypto";
import petitio from "petitio";
import {
    Channel,
    GuildChannel,
    MessageActionRow,
    MessageEmbed,
    MessageEmbedOptions,
    PermissionString,
    Snowflake,
    User
} from "discord.js";
import { existsSync, mkdirSync, readdirSync } from "fs";
import { permissionNames } from "./permissions.js";
import BetterClient from "../extensions/BetterClient.js";
import { GeneratedMessage, GenerateTimestampOptions } from "../../typings";

export default class Functions {
    /**
     * Our Client.
     */
    private client: BetterClient;

    /**
     * Create our functions.
     * @param client Our client.
     */
    constructor(client: BetterClient) {
        this.client = client;
    }

    /**
     * Get all the files in all the subdirectories of a directory.
     * @param directory The directory to get the files from.
     * @param fileExtension The extension to search for.
     * @param createDirIfNotFound Whether or not the parent directory should be created if it doesn't exist.
     * @return The files in the directory.
     */
    public getFiles(
        directory: string,
        fileExtension: string,
        createDirIfNotFound: boolean = false
    ): string[] {
        if (createDirIfNotFound && !existsSync(directory)) mkdirSync(directory);
        return readdirSync(directory).filter(file =>
            file.endsWith(fileExtension)
        );
    }

    /**
     * Generate a full primary message with a simple helper function.
     * @param embedInfo The information to build our embed with.
     * @param components The components for our message.
     * @param ephemeral Whether our message should be ephemeral or not.
     * @return The generated primary message.
     */
    public generatePrimaryMessage(
        embedInfo: MessageEmbedOptions,
        components: MessageActionRow[] = [],
        ephemeral: boolean = false
    ): GeneratedMessage {
        return {
            embeds: [
                new MessageEmbed(embedInfo).setColor(
                    parseInt(this.client.config.colors.primary, 16)
                )
            ],
            components,
            ephemeral
        };
    }

    /**
     * Generate a full success message with a simple helper function.
     * @param embedInfo The information to build our embed with.
     * @param components The components for our message.
     * @param ephemeral Whether our message should be ephemeral or not.
     * @return The generated success message.
     */
    public generateSuccessMessage(
        embedInfo: MessageEmbedOptions,
        components: MessageActionRow[] = [],
        ephemeral: boolean = false
    ): GeneratedMessage {
        return {
            embeds: [
                new MessageEmbed(embedInfo).setColor(
                    parseInt(this.client.config.colors.success, 16)
                )
            ],
            components,
            ephemeral
        };
    }

    /**
     * Generate a full warning message with a simple helper function.
     * @param embedInfo The information to build our embed with.
     * @param components The components for our message.
     * @param ephemeral Whether our message should be ephemeral or not.
     * @return The generated warning message.
     */
    public generateWarningMessage(
        embedInfo: MessageEmbedOptions,
        components: MessageActionRow[] = [],
        ephemeral: boolean = false
    ): GeneratedMessage {
        return {
            embeds: [
                new MessageEmbed(embedInfo).setColor(
                    parseInt(this.client.config.colors.warning, 16)
                )
            ],
            components,
            ephemeral
        };
    }

    /**
     * Generate a full error message with a simple helper function.
     * @param embedInfo The information to build our embed with.
     * @param supportServer Whether or not to add the support server link as a component.
     * @param components The components for our message.
     * @param ephemeral Whether our message should be ephemeral or not.
     * @return The generated error message.
     */
    public generateErrorMessage(
        embedInfo: MessageEmbedOptions,
        components: MessageActionRow[] = [],
        ephemeral: boolean = true
    ): GeneratedMessage {
        return {
            embeds: [
                new MessageEmbed(embedInfo).setColor(
                    parseInt(this.client.config.colors.error, 16)
                )
            ],
            components,
            ephemeral
        };
    }

    /**
     * Upload content to the hastebin we use.
     * @param content The content to upload.
     * @param type The file type to append to the end of the haste.
     * @return The URL to the uploaded content.
     */
    public async uploadHaste(
        content: string,
        type?: string
    ): Promise<string | null> {
        try {
            const haste = await petitio(
                `${this.client.config.hastebin}/documents`,
                "POST"
            )
                .body(content)
                .header(
                    "User-Agent",
                    `${this.client.config.botName}/${this.client.config.version}`
                )
                .send();
            if (haste.text() === "error code: 1020")
                return `Cloudflare Error 1020 - Ray ${haste.headers["cf-ray"]}`;
            return `${this.client.config.hastebin}/${haste.json().key}${
                type ? `.${type}` : ".md"
            }`;
        } catch (error) {
            this.client.logger.error(error);
            this.client.logger.sentry.captureWithExtras(error, {
                Hastebin: this.client.config.hastebin,
                Content: content
            });
            return null;
        }
    }

    /**
     * Generate a random string of a given length.
     * @param length The length of the string to generate.
     * @param from The characters to use for the string.
     * @return The generated random ID.
     */
    public generateRandomId(
        length: number,
        from: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    ): string {
        let generatedId = "";
        for (let i = 0; i < length; i++)
            generatedId += from[Math.floor(Math.random() * from.length)];
        return generatedId;
    }

    /**
     * Get the proper name of a permission.
     * @param permission The permission to get the name of.
     * @return The proper name of the permission.
     */
    public getPermissionName(permission: PermissionString): string {
        if (permissionNames.has(permission))
            return permissionNames.get(permission)!;
        return permission;
    }

    /**
     * Generate a unix timestamp for Discord to be rendered locally per user.
     * @param options The options to use for the timestamp.
     * @return The generated timestamp.
     */
    public generateTimestamp(options?: GenerateTimestampOptions): string {
        let timestamp = options?.timestamp || new Date();
        const type = options?.type || "f";
        if (timestamp instanceof Date) timestamp = timestamp.getTime();
        return `<t:${Math.floor(timestamp / 1000)}:${type}>`;
    }

    /**
     * Parse a string to a User.
     * @param user The user to parse.
     * @return The parsed user.
     */
    public async parseUser(user: string): Promise<User | null> {
        if (
            (user.startsWith("<@") || user.startsWith("<@!")) &&
            user.endsWith(">")
        )
            user = user.slice(2, -1);
        if (user.startsWith("!")) user = user.slice(1);
        try {
            return (
                this.client.users.cache.get(user) ||
                this.client.users.cache.find(
                    u => u.tag.toLowerCase() === user?.toLowerCase()
                ) ||
                (await this.client.users.fetch(user))
            );
        } catch (error: any) {
            if (error.code === 50035) return null;
            this.client.logger.error(error);
            this.client.logger.sentry.captureWithExtras(error, { input: user });
        }
        return null;
    }

    public async parseChannel(channel: string): Promise<Channel | null> {
        if (channel.startsWith("#")) channel = channel.slice(1);
        else if (channel.startsWith("<#") && channel.endsWith(">"))
            channel = channel.slice(2, -1);
        try {
            return (
                this.client.channels.cache.get(channel) ||
                this.client.channels.cache.find(c =>
                    c instanceof GuildChannel
                        ? c.name.toLowerCase() === channel.toLowerCase()
                        : false
                ) ||
                (await this.client.channels.fetch(channel))
            );
        } catch (error: any) {
            if (error.code === 50035) return null;
            else if (error.httpStatus === 404) return null;
            this.client.logger.error(error);
            this.client.logger.sentry.captureWithExtras(error, {
                input: channel
            });
        }
        return null;
    }

    /**
     * Turn a string into Title Case.
     * @param string The string to convert.
     * @return The converted string.
     */
    public titleCase(string: string): string {
        return string
            .split(" ")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    }

    /**
     * Hash a string into SHA256.
     * @param string The string to hash.
     * @return The hashed string.
     */
    public hash(string: string): string {
        return createHash("sha256").update(string).digest("hex");
    }

    /**
     * Choose an item out of a list of items.
     * @param choices The list of items to choose from.
     * @return The chosen item.
     */
    public random(choices: any[]): any {
        return choices[Math.floor(Math.random() * choices.length)];
    }

    /**
     * Get whether a user is an admin or not.
     * @param snowflake The user ID to check.
     * @returns Whether the user is an admin or not.
     */
    public isAdmin(snowflake: Snowflake) {
        return this.client.config.admins.includes(snowflake);
    }

    /**
     * Verify if an object is a promise.
     * @param input The object to verify.
     * @returns Whether the object is a promise or not.
     */
    public isThenable(input: any): boolean {
        if (!input) return false;
        return (
            input instanceof Promise ||
            (input !== Promise.prototype &&
                this.isFunction(input.then) &&
                this.isFunction(input.catch))
        );
    }

    /**
     * Verify if the input is a function.
     * @param input The input to verify.
     * @returns Whether the input is a function or not.
     */
    public isFunction(input: any): boolean {
        return typeof input === "function";
    }
}

