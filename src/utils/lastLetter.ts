import { bot } from "../main.js";
import { ActivityType } from "discord.js";

export const InitialiseLastLetter = () => {
    if (global.lastLetter === "") {
        bot.user!.setActivity(
            `for any letter`,
            { type: ActivityType.Watching }
          );
    } else {
        bot.user!.setActivity(
            `for the letter ${global.lastLetter}`,
            { type: ActivityType.Watching }
          );
    }
}
