import type { RaidInfo } from "~/types/data";
import type { Locale } from "~/utils/i18n/config";

export const LiveRaidInfos = [
    // { "Id": "R83", "Boss": "Yesod", "Location": "Street", "Date": "2025-10-29", "Alias": "", "MaxLv": 90, "Cnt": { "All": 20000, "Lunatic": 1, "Torment": 1, "Insane": 1 } },
    // { "Id": "E27", "Boss": "Shiro&Kuro", "Location": "Indoor", "Type": "LightArmor", "Date": "2025-10-15", "Alias": "", "MaxLv": 90, "Cnt": { "All": 20000, "Torment": 1,  "Insane": 1 } },
    // { "Id": "E27", "Boss": "Shiro&Kuro", "Location": "Indoor", "Type": "ElasticArmor", "Date": "2025-10-15", "Alias": "", "MaxLv": 90, "Cnt": { "All": 20000, "Torment": 1,  "Insane": 1 } },
    // { "Id": "E27", "Boss": "Shiro&Kuro", "Location": "Indoor", "Type": "Unarmed", "Date": "2025-10-15", "Alias": "", "MaxLv": 90, "Cnt": { "All": 20000, "Insane": 1} }
] as RaidInfo[]

// 25.10.29. ~ 25.11.05.
// YESOD


export const getLiveRaidInfo = (locale: Locale) => {
    return []
    return LiveRaidInfos.map(v => {

        // v.Boss = ((locale: Locale)=>{
        //     if (locale == 'ko') return '시로&쿠로'
        //     else if (locale == 'ja') return 'シロ＆クロ'
        //     else return 'Shiro&Kuro'
        // })(locale);
        v.Boss = ((locale: Locale) => {
            if (locale == 'ko') return '예소드'
            else if (locale == 'ja') return 'イェソド'
            else return 'Yesod'
        })(locale);

        return v
    })
}