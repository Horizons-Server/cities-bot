import "dotenv/config";
import { envsafe, str } from "envsafe";

export const env = envsafe({
  CHANNEL_ID: str({}),
  BOT_TOKEN: str({})
});
