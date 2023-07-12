import { ArgsOf, On, Client, Discord } from "discordx";
import { env } from "../utils/env.js";
import { isRealCity } from "../utils/cityChecker.js";

@Discord()
class Game {
  @On({ event: "messageCreate" })
  async onMessage(
    [message]: ArgsOf<"messageCreate">,
    client: Client,
    guardPayload: any
  ) {
    if (message.channelId !== env.CHANNEL_ID) return;

    if (message.content === "START NEW GAME") {
      message.react("✅");
      return;
    }

    if (!isRealCity(message.content)) {
      message.react("❌");
      console.log("not real city");
      return;
    }

    // get the most recent message from the channel
    const channel = await message.channel.fetch();
    const channelMessages = await channel.messages.fetch({ limit: 100 });

    // check if the city was used before
    for (const [_id, msg] of channelMessages) {
      if (msg.content.toLowerCase() === message.content.toLowerCase()) {
        const reactions = await msg.reactions.resolve("✅")?.fetch();

        if (!reactions) continue;

        const users = await reactions.users.fetch();

        if (users.has(client.user!.id)) {
          // react a red cross
          message.react("❌");
          return;
        }
      }
    }

    for (const [_id, msg] of channelMessages) {
      // check if the message has been reacted to by the bot with a green checkmark

      const reactions = await msg.reactions.resolve("✅")?.fetch();

      if (!reactions) continue;

      const users = await reactions.users.fetch();

      if (users.has(client.user!.id)) {
        // get the last letter of the message
        const lastLetter = msg.content[msg.content.length - 1];

        // check if the last letter is the same as the first letter of the message
        if (lastLetter.toLowerCase() === message.content[0].toLowerCase()) {
          // react a green checkmark
          message.react("✅");
          return;
        } else {
          // react a red cross
          message.react("❌");
          return;
        }
      }
    }

    // react a red cross
    message.react("❌");
  }
}
