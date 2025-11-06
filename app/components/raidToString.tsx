import type { RaidInfo } from "~/types/data";
import type { Locale } from "~/utils/i18n/config";
import { difficultyInfo } from "./Difficulty";

export const typecolor = {
    LightArmor: "#b62915",
    HeavyArmor: '#bc8800',
    Unarmed: '#206d9b',
    ElasticArmor: '#9a46a8',
}

export const type_translation = {
    LightArmor: { ko: '경장갑', en: 'LightArmor', ja: '軽装備' },
    HeavyArmor: { ko: '중장갑', en: 'HeavyArmor', ja: '重装甲' },
    Unarmed: { ko: '특수장갑', en: 'Unarmed', ja: '特殊装甲' },
    ElasticArmor: { ko: '탄력장갑', en: 'ElasticArmor', ja: '弾力装甲' },
}
const type_translation_sorted = {
    LightArmor: { ko: '경장', en: 'Light', ja: '爆発' },
    HeavyArmor: { ko: '중장', en: 'Heavy', ja: '貫通' },
    Unarmed: { ko: '특장', en: 'Unarmed', ja: '神秘' },
    ElasticArmor: { ko: '탄력', en: 'Elastic', ja: '振動' },
}

export function getMostDifficultLevel(raid: RaidInfo) {
    for (const { name } of difficultyInfo) {
        if (raid.Cnt[name]) return name
    }
}

export function raidToString(raid: RaidInfo, locale: Locale, showDate: boolean = false, showId: boolean = false, color: boolean = false, onlyId: boolean = false): string {
    if (!raid) return 'unknown'
    const { Id, Boss, Type, Date: date, Alias } = raid;
    if (onlyId) {
        if (Type) return Id + ' ' + type_translation_sorted[Type][locale]
        else return Id
    }
    const arr = []
    if (showId) arr.push(Id)
    if (Alias) arr.push(Alias)
    else {
        arr.push(Boss)
    }
    if (!color && Type) arr.push(type_translation_sorted[Type][locale])
    let txt = arr.join('-')
    if (showDate && date) txt += ` (${(new Date(date)).toLocaleDateString()})`

    if (!color || !Type) return txt

    return `<span style="fill: ${typecolor[Type]}; background-color: ${typecolor[Type]}; color: ${typecolor[Type]};">${txt}</span>`

}


export function raidToStringTsx(raid: RaidInfo, locale: Locale, showDate: boolean = false, showId: boolean = false) {
    if (!raid) return 'unknown'
    const { Id, Boss, Type, Date: date, Alias } = raid;
    const arr = []
    if (showId) arr.push(Id)
    if (Alias) arr.push(Alias)
    else {
        arr.push(Boss)
    }
    if (Type) arr.push(type_translation_sorted[Type][locale])
    let txt = arr.join('-')
    if (showDate && date) txt += ` (${(new Date(date)).toLocaleDateString()})`

    if (Type) return (<span className="text-gray-200 p-0.5" style={
        { backgroundColor: typecolor[Type] }}>
        {txt}
    </span>)

    else return txt
}
