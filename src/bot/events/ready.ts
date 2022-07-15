import EventHandler from "../../../lib/classes/EventHandler.js";

export default class Ready extends EventHandler {
    override async run() {
        const [allGuilds] = await Promise.all([
            this.client.shard?.broadcastEval(async c =>
                c.guilds.cache.map(
                    guild =>
                        `${guild.name} [${guild.id}] - ${guild.memberCount} members.`
                )
            )!,
            this.client.application?.fetch(),
            this.client.applicationCommandHandler.registerApplicationCommands()
        ]);
        const guildsStringList: string[] = [];
        for (let i = 0; i < allGuilds.length; i++) {
            guildsStringList.push(`Shard ${i + 1}\n${allGuilds[i].join("\n")}`);
        }
        const stats = await this.client.fetchStats();
        this.client.logger.info(
            `Logged in as ${this.client.user?.tag} [${
                this.client.user?.id
            }] with ${
                stats.guilds
            } guilds (${await this.client.functions.uploadHaste(
                `Currently in ${stats.guilds} guilds with ${
                    stats.users
                } users.\n\n${guildsStringList.join("\n\n")}`
            )}) and ${stats.users} users.`
        );
        this.client.dataDog.gauge("guilds", stats.guilds);
        this.client.dataDog.gauge("users", stats.users);
    }
}

