import { dirname, importx } from "@discordx/importer";
import type { Interaction, Message } from "discord.js";
import { ActivityType, IntentsBitField } from "discord.js";
import { Client } from "discordx";
import { env } from "./utils/env.js";
import * as fs from "fs";
import { InitialiseLastLetter } from "./utils/lastLetter.js";
export const bot = new Client({
  // To use only guild command
  // botGuilds: [(client) => client.guilds.cache.map((guild) => guild.id)],

  // Discord intents
  intents: [
    IntentsBitField.Flags.Guilds,
    // IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildMessageReactions,
    // IntentsBitField.Flags.GuildVoiceStates,
    IntentsBitField.Flags.MessageContent,
  ],

  // Debug logs are disabled in silent mode
  silent: false,

  // Configuration for @SimpleCommand
  simpleCommand: {
    prefix: "!",
  },
});

bot.once("ready", async () => {
  // Make sure all guilds are cached
  // await bot.guilds.fetch();

  // Synchronize applications commands with Discord
  await bot.initApplicationCommands();
  global.points = JSON.parse(fs.readFileSync("./src/data/points.json", 'utf8')) || {};
  global.lastLetter = JSON.parse(fs.readFileSync("./src/data/lastLetter.json", 'utf8'))['lastLetter'] || "";
  InitialiseLastLetter();
  // To clear all guild commands, uncomment this line,
  // This is useful when moving from guild commands to global commands
  // It must only be executed once
  //
  //  await bot.clearApplicationCommands(
  //    ...bot.guilds.cache.map((g) => g.id)
  //  );

  console.log("Bot started");
  async function autoSave() {
    fs.writeFileSync("./src/data/points.json", JSON.stringify(global.points));
    fs.writeFileSync("./src/data/lastLetter.json", JSON.stringify({"lastLetter": global.lastLetter}));
  }

  setInterval(autoSave, 4000);

});

bot.on("interactionCreate", (interaction: Interaction) => {
  bot.executeInteraction(interaction);
});

bot.on("messageCreate", (message: Message) => {
  bot.executeCommand(message);
});

async function run() {
  // The following syntax should be used in the commonjs environment
  //
  // await importx(__dirname + "/{events,commands}/**/*.{ts,js}");

  // The following syntax should be used in the ECMAScript environment
  await importx(`${dirname(import.meta.url)}/{events,commands}/**/*.{ts,js}`);

  // Let's start the bot
  if (!env.BOT_TOKEN) {
    throw Error("Could not find BOT_TOKEN in your environment");
  }

  // Log in with your bot token
  await bot.login(env.BOT_TOKEN);
}

run();
process.once("SIGTERM", () => {
  fs.writeFileSync("./src/data/points.json", JSON.stringify(global.points))
  fs.writeFileSync("./src/data/lastLetter.json", JSON.stringify({"lastLetter": global.lastLetter}))
  process.exit()
});