import { ArgsOf, On, Client, Discord } from "discordx";
import { env } from "../utils/env.js";
import { isRealCity } from "../utils/cityChecker.js";
import { ActivityType, Message } from "discord.js";

@Discord()
class Game {
  @On({ event: "messageCreate" })
  async onMessage(
    [message]: ArgsOf<"messageCreate">,
    client: Client,
    guardPayload: any
  ) {
    if (message.channelId !== env.CHANNEL_ID) return;
    if (message.author.bot) return;

    if (message.content === "START NEW GAME") {
      message.react("✅");
      return;
    }

    // remove all accents and uppercase letters
    // const messageContent = message.content.normalize("NFD").toLowerCase();

    if (!isRealCity(message.content)) {
      message.react("❌");
      const response = await message.reply("That's not a real city!");
      deleteMessageAfter(response, 5);
      return;
    }

    // get the most recent message from the channel
    const channel = await message.channel.fetch();
    const channelMessages = await channel.messages.fetch({ limit: 100 });

    // check if the city was used before
    for (const [_id, msg] of channelMessages) {
      if (msg.author.id === client.user!.id) continue;
      if (msg.content.toLowerCase() === message.content.toLowerCase()) {
        const reactions = await msg.reactions.resolve("✅")?.fetch();

        if (!reactions) continue;

        const users = await reactions.users.fetch();

        if (users.has(client.user!.id)) {
          // react a red cross
          message.react("❌");
          const response = await message.reply("That city was already used!");
          deleteMessageAfter(response, 5);
          return;
        }
      }
    }

    for (const [_id, msg] of channelMessages) {
      // check if the message has been reacted to by the bot with a green checkmark

      if (msg.author.id === client.user!.id) continue;

      const reactions = await msg.reactions.resolve("✅")?.fetch();

      if (!reactions) continue;

      const users = await reactions.users.fetch();

      if (users.has(client.user!.id)) {
        if (msg.author.id === message.author.id) {
          // react a red cross
          message.react("❌");
          const response = await message.reply("You can't go twice in a row!");
          deleteMessageAfter(response, 5);
          return;
        }

        // get the last letter of the message
        const lastLetter = msg.content[msg.content.length - 1];

        // check if the last letter is the same as the first letter of the message
        if (lastLetter.toLowerCase() === message.content[0].toLowerCase()) {
          // react a green checkmark
          message.react("✅");
          client.user!.setActivity(
            `for the letter ${message.content[message.content.length - 1]}`,
            { type: ActivityType.Watching }
          );
          return;
        } else {
          // react a red cross
          message.react("❌");
          const response = await message.reply(
            "That city doesn't start with the right letter!"
          );
          deleteMessageAfter(response, 5);
          return;
        }
      }
    }

    // react a red cross
    message.react("❌");
    message.reply("Obi goofed up.");
  }
}

const deleteMessageAfter = (message: Message<boolean>, seconds: number) => {
  setTimeout(() => {
    message.delete();
  }, seconds * 1000);
};
