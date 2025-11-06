import type { LocalizeEtc } from "~/types/plannerData";
import type { Locale } from "~/utils/i18n/config";

export const getlocaleMethond = (txt: string, type: 'Ja' | 'jp' | 'Jp', locale: Locale) => {
    switch (type) {
        case 'Ja': return `${txt}${{ ja: 'Ja', ko: 'Ko', en: 'En' }[locale]}`
        case 'jp': return `${txt}${{ ja: 'jp', ko: 'kr', en: 'en' }[locale]}`
        case 'Jp': return `${txt}${{ ja: 'Jp', ko: 'Kr', en: 'En' }[locale]}`
        default:
            return `${txt}${locale}`
    }
}

// [getlocaleMethond('Name', 'Jp', locale) as keyof LocalizeEtc]
export const getLocalizeEtcName = (localizeEtc: LocalizeEtc | undefined, locale: Locale,) => {
    if (!localizeEtc) return null
    switch (locale) {
        case 'en': return localizeEtc.NameEn || localizeEtc.NameJp
        case 'ko': return localizeEtc.NameKr
        case 'ja': return localizeEtc.NameJp
    }

}