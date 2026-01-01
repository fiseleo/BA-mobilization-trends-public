// app/locales/index.ts

import type { Resource } from "i18next";
import en from "./en/index";
import ko from "./ko/index";
import ja from "./ja/index";
import zhHantTW from "./zh-Hant-TW/index";
const resources = { en, ko, ja, "zh-Hant-TW": zhHantTW } satisfies Resource;

export default resources;