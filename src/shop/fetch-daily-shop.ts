import { CommandInteraction } from "discord.js";
import { getUser } from "@/utils/val-user";
import { authUser, userRegion, deleteUserAuth } from "@/auth/auth";
import { riotClientHeaders } from "@/auth/riot";
import { fetch } from "@/utils/custom-fetch";
import { addShopCache } from "@/caches/shop-cache";

export const fetchShop = async (interaction: CommandInteraction) => {
  const user = getUser(interaction.user.id);
  if (!user) return null;

  let shop = await getShop(interaction.user.id);

  if (!shop) {
    return false;
  }

  return true;
  // return await renderOffers(shop, interaction, user, await emojiPromise, targetId);
};

export const getShop = async (id: string, account = null) => {
  const authSuccess = await authUser(id, account);
  console.log("authSuccess: ", authSuccess);
  if (!authSuccess.success) {
    return false;
  }
  const user = getUser(id, account);
  console.log(`Fetching shop for ${user.username}...`);

  // https://github.com/techchrism/valorant-api-docs/blob/trunk/docs/Store/GET%20Store_GetStorefrontV2.md
  const req = await fetch(`https://pd.${userRegion(user)}.a.pvp.net/store/v3/storefront/${user.puuid}`, {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + user.auth.rso,
      "X-Riot-Entitlements-JWT": user.auth.ent,
      ...riotClientHeaders(),
    },
    body: JSON.stringify({}),
  });
  console.assert(req.statusCode === 200, `Valorant skins offers code is ${req.statusCode}!`, req);

  const json = JSON.parse(req.body);

  if (json.httpStatus === 400 && json.errorCode === "BAD_CLAIMS") {
    deleteUserAuth(user);
    return false;
  }

  // console.log("fetching shop response: ", json);

  // add to shop cache
  addShopCache(user.puuid, json);

  return true;
};
