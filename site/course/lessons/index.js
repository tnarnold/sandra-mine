// Lessons in order. Each lesson's text lives in i18n/<lang>.js under lessons.<slug>.
import { LESSON_SLUGS } from "./slugs.js";
import follow from "./01-follow.js";
import hash from "./02-hash.js";
import merkle from "./03-merkle.js";
import nonce from "./04-nonce.js";
import difficulty from "./05-difficulty.js";
import odds from "./06-odds.js";
import pool from "./07-pool.js";
import fees from "./08-fees.js";
import nerdminer from "./09-nerdminer.js";

const MODULES = { follow, hash, merkle, nonce, difficulty, odds, pool, fees, nerdminer };

/** A lesson without `module` would be listed as "coming soon". */
export const LESSONS = LESSON_SLUGS.map((slug) => ({ slug, module: MODULES[slug] }));
