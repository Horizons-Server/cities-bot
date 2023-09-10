import { ArgsOf, On, Client, Discord } from "discordx";
import { env } from "../utils/env.js";
import { isRealCity } from "../utils/cityChecker.js";
import { ActivityType, EmbedBuilder, Message, User } from "discord.js";
import * as fs from "fs";

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
      if (
        message.member?.roles.cache.find((r) => r.name === "Developer") ||
        message.member?.permissions.has("ManageGuild")
      ) {
        message.react("✅");
        setPointEmbed(message, client, "final");
        global.lastLetter = "";
        client.user!.setActivity(
          `for any letter`,
          { type: ActivityType.Watching }
        );
        return;
      } else {
        message.react("❌");
        const response = await message.reply(
          "You don't have permission to do that!"
        );
        deleteMessageAfter(response, 5);
        return;
      }
    } else if (
      message.content.toUpperCase() === "VIEW CURRENT POINTS" ||
      message.content.toUpperCase() === "VIEW CURRENT SCORES"
    ) {
      message.react("✅");
      setPointEmbed(message, client, "current");
      return;
    }

    // remove all accents and uppercase letters
    // const messageContent = message.content.normalize("NFD").toLowerCase();

    // if (!isRealCity(message.content)) {
    //   message.react("❌");
    //   const response = await message.reply("That's not a real city!");
    //   deleteMessageAfter(response, 5);
    //   return;
    // }

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

      if (
        [
          "VIEW CURRENT POINTS",
          "START NEW GAME",
          "VIEW CURRENT SCORES",
        ].includes(msg.content.toUpperCase())
      )
        continue;

      const reactions = await msg.reactions.resolve("✅")?.fetch();

      if (!reactions) continue;

      const users = await reactions.users.fetch();

      if (users.has(client.user!.id)) {
        if (msg.author.id === message.author.id && msg.content !== "START NEW GAME") {
          // react a red cross
          message.react("❌");
          const response = await message.reply("You can't go twice in a row!");
          deleteMessageAfter(response, 5);
          return;
        }
        // get the last letter of the message

        // check if the last letter is the same as the first letter of the message
        console.log(global.lastLetter);
        console.log(message.content[0])
        if (global.lastLetter === "") {
          // react a green checkmark
          message.react("✅");
          global.lastLetter = message.content[message.content.length - 1].toLowerCase();
          if (message.author.id in global.points) {
            global.points[message.author.id]++;
          } else {
            global.points[message.author.id] = 1;
          }
          fs.writeFileSync(
            "./src/data/points.json",
            JSON.stringify(global.points)
          );
          client.user!.setActivity(
            `for the letter ${global.lastLetter}`,
            { type: ActivityType.Watching }
          );
          return;
        } else if (global.lastLetter.toLowerCase() === message.content[0].toLowerCase()) {
          message.react("✅");
          global.lastLetter = message.content[message.content.length - 1].toLowerCase();
          if (message.author.id in global.points) {
            global.points[message.author.id]++;
          } else {
            global.points[message.author.id] = 1;
          }
          fs.writeFileSync(
            "./src/data/points.json",
            JSON.stringify(global.points)
          );
          client.user!.setActivity(
            `for the letter ${global.lastLetter}`,
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

async function setPointEmbed(
  message: Message<boolean>,
  client: Client,
  type: "final" | "current"
) {
  const embedsRequired = Math.ceil(Object.keys(global.points).length / 25);

  if (embedsRequired === 0) {
    message.channel.send("No points have been scored yet!");
    return;
  }

  const tempPointEmbed = [];

  for (const key in global.points) {
    tempPointEmbed.push({
      name: (await client.users.fetch(key)).username.toString(),
      value: points[key].toString(),
    });
  }

  // sort tempPointEmbed by value, descending
  tempPointEmbed.sort((a, b) => {
    return parseInt(b.value) - parseInt(a.value);
  });

  for (let i = 0; i < embedsRequired; i++) {
    const pointEmbed = new EmbedBuilder();

    if (i === 0) {
      if (type === "final") {
        pointEmbed.setTitle("Final scores");
      } else if (type === "current") {
        pointEmbed.setTitle("Current scores");
      }
    } else {
      pointEmbed.setTitle(null);
    }

    pointEmbed.setFields([]);

    for (let j = 0; j < 25; j++) {
      if (tempPointEmbed[j + i * 25] === undefined) {
        break;
      }
      pointEmbed.addFields(tempPointEmbed[j + i * 25]);
    }

    const response = await message.channel.send({ embeds: [pointEmbed] });
  }

  if (type === "final") {
    global.points = {};
    fs.writeFileSync("./src/data/points.json", JSON.stringify(global.points));
  }
}
