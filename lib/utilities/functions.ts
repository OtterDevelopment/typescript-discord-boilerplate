import { createHash } from "crypto";
import { createPaste } from "hastebin";
import {
    MessageActionRow,
    MessageButton,
    MessageEmbed,
    MessageEmbedOptions,
    PermissionString,
    User
} from "discord.js";
import { existsSync, mkdirSync, readdirSync } from "fs";
import { permissionNames } from "./permissions.js";
import BetterClient from "../extensions/BetterClient.js";
import { GeneratedMessage, GenerateTimestampOptions } from "../../typings";

export default class Functions {
    private client: BetterClient;

    constructor(client: BetterClient) {
        this.client = client;
    }

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

    public generateErrorMessage(
        embedInfo: MessageEmbedOptions,
        supportServer: boolean = false,
        components: MessageActionRow[] = [],
        ephemeral: boolean = true
    ): GeneratedMessage {
        if (supportServer)
            components.concat([
                new MessageActionRow().addComponents(
                    new MessageButton({
                        label: "Support Server",
                        url: this.client.config.supportServer,
                        style: "LINK"
                    })
                )
            ]);
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

    public async uploadHaste(content: string): Promise<string | null> {
        try {
            return `${await createPaste(content, {
                server: this.client.config.hastebin
            })}.md`;
        } catch (error) {
            this.client.logger.error(error);
            this.client.logger.sentry.captureWithExtras(error, {
                Hastebin: this.client.config.hastebin,
                Content: content
            });
            return null;
        }
    }

    public generateRandomId(
        length: number,
        from: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    ): string {
        let generatedId = "";
        for (let i = 0; i < length; i++)
            generatedId += from[Math.floor(Math.random() * from.length)];
        return generatedId;
    }

    public getPermissionName(permission: PermissionString): string {
        if (permissionNames.has(permission))
            return permissionNames.get(permission)!;
        return permission;
    }

    public generateTimestamp(options?: GenerateTimestampOptions): string {
        let timestamp = options?.timestamp || new Date();
        const type = options?.type || "f";
        if (timestamp instanceof Date) timestamp = timestamp.getTime();
        return `<t:${Math.floor(timestamp / 1000)}:${type}>`;
    }

    public async parseUser(user?: string): Promise<User | undefined> {
        if (!user) return undefined;
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
            if (error.code === 50035) return undefined;
            this.client.logger.error(error);
            this.client.logger.sentry.captureWithExtras(error, { input: user });
        }
    }

    public titleCase(string: string): string {
        return string
            .split(" ")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    }

    public hash(string: string): string {
        return createHash("sha256").update(string).digest("hex");
    }

    public random(choices: any[]): any {
        return choices[Math.floor(Math.random() * choices.length)];
    }
}
