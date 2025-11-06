import raidDataRaw_jp_en from '~/data/jp/en.raid_info.json'
import raidDataRaw_jp_ko from '~/data/jp/ko.raid_info.json'
import raidDataRaw_jp_ja from '~/data/jp/ja.raid_info.json'
import raidDataRaw_kr_en from '~/data/kr/en.raid_info.json'
import raidDataRaw_kr_ko from '~/data/kr/ko.raid_info.json'
import raidDataRaw_kr_ja from '~/data/kr/ja.raid_info.json'
import type { GameServer, RaidInfo } from '~/types/data'
import type { Locale } from './i18n/config'
export function loadRaidInfos(server: GameServer, locale: Locale) {
    const raidInfos = [raidDataRaw_jp_en,
        raidDataRaw_jp_ko,
        raidDataRaw_jp_ja,
        raidDataRaw_kr_en,
        raidDataRaw_kr_ko,
        raidDataRaw_kr_ja][['jp', 'kr'].indexOf(server) * 3 + ['en', 'ko', 'ja'].indexOf(locale)]

    return raidInfos as RaidInfo[]
}
export function loadRaidInfo(server: GameServer, locale: Locale, id: string, bossType?: string) {
    const raidInfos = loadRaidInfos(server, locale)

    for (const raid of raidInfos) {
        if (raid.Id == id) {
            if (!bossType || bossType == raid.Type) return raid
        }
    }
}

export function loadRaidInfosById(server: GameServer, locale: Locale, id: string): RaidInfo[] {
    const raidInfos = loadRaidInfos(server, locale);
    return raidInfos.filter(raid => raid.Id === id);
}
