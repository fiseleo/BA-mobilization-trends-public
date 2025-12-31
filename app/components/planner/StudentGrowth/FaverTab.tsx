// AffectionTab.tsx
import { useState, useEffect, useMemo } from 'react';
import { affectionExpToNextLevel } from '~/data/growthData';
import { useGlobalStore, type GrowthPlan } from '~/store/planner/useGlobalStore';
import type { EventData, IconData, IconInfos } from '~/types/plannerData';
import { NumberInput } from '../common/NumberInput';
import { ItemIcon } from '../common/Icon';
import { CustomNumberInput } from '~/components/CustomInput';
import { useTranslation } from 'react-i18next';

export const HighFlowerBouquetItemIds = [5996, 5997]
export const LowFlowerBouquetItemIds = [5998, 5999]

interface AffectionTabProps {
    plan: GrowthPlan;
    giftAffectionList: {
        id: string;
        type: string;
        rarity: number;
        affectionPoints: number;
        preferenceLevel: number;
    }[];
    eventData: EventData;
    iconData: IconData;
    handlePlanChange: (field: string, value: any, isNumeric?: boolean) => void
}

const cumulativeAffectionExp: Record<number, number> = {};
let cumulativeExp = 0;

Object.keys(affectionExpToNextLevel).sort((a, b) => Number(a) - Number(b)).forEach(levelStr => {
    const level = Number(levelStr);
    cumulativeExp += affectionExpToNextLevel[level];
    cumulativeAffectionExp[level] = cumulativeExp;
});


const getPreferenceIcon = (preferenceLevel: number, rarity: number): string => {
    let levelForIcon = preferenceLevel;

    if (rarity === 3 && levelForIcon === 1) {
        levelForIcon = 2;
    }

    if (levelForIcon >= 4) return '/img/Cafe_Interaction_Gift_04.webp';
    if (levelForIcon === 3) return '/img/Cafe_Interaction_Gift_03.webp';
    if (levelForIcon === 2) return '/img/Cafe_Interaction_Gift_02.webp';
    return '/img/Cafe_Interaction_Gift_01.webp';
};


export const AffectionTab = ({ plan, giftAffectionList, eventData, iconData, handlePlanChange }: AffectionTabProps) => {

    const { ownedGifts, updateOwnedGifts, resetOwnedGifts } = useGlobalStore();
    const [calculateWithOwned, setCalculateWithOwned] = useState(true);
    const [hideNonPreferred, setHideNonPreferred] = useState(true);

    const [maxLevelResult, setMaxLevelResult] = useState<{
        text: string;
        currentExp: number;
        targetExp: number;
        percentage: number;
    } | null>(null);

    const [targetResult, setTargetResult] = useState<React.ReactNode | null>(null);
    const { t, i18n } = useTranslation("planner");


    const expForCurrentLevel = affectionExpToNextLevel[plan.current.affection] || 1;

    useEffect(() => {
        let expNeededForTarget = 0;
        const expToFinishCurrentLevel = (plan.current.affection == plan.target.affection) ? 0 : expForCurrentLevel - plan.current.affectionExp;
        expNeededForTarget += expToFinishCurrentLevel;

        for (let i = plan.current.affection + 1; i < plan.target.affection; i++) {
            expNeededForTarget += affectionExpToNextLevel[i] || 0;
        }

        const expFromOwned = giftAffectionList.reduce((total, gift) => total + (ownedGifts[gift.id] || 0) * gift.affectionPoints, 0);

        const totalExpToCurrentLevelStart = cumulativeAffectionExp[plan.current.affection - 1] || 0;
        const totalExpToTargetLevelStart = cumulativeAffectionExp[plan.target.affection - 1] || 0;

        const currentTotalExp = totalExpToCurrentLevelStart + plan.current.affectionExp;
        const achievableTotalExp = currentTotalExp + expFromOwned;

        let achievableLevel = 1;
        let progressExpInLevel = 0;
        const sortedLevels = Object.keys(cumulativeAffectionExp).map(Number);
        for (const level of sortedLevels) {
            if (achievableTotalExp >= cumulativeAffectionExp[level]) {
                achievableLevel = level + 1;
            } else {
                const baseExp = cumulativeAffectionExp[level - 1] || 0;
                progressExpInLevel = achievableTotalExp - baseExp;
                break;
            }
        }
        const expForAchievableLevel = affectionExpToNextLevel[achievableLevel] || 7365;

        const totalExpRange = totalExpToTargetLevelStart - totalExpToCurrentLevelStart;
        let overallPercentage = 0;
        if (totalExpRange > 0) {
            const expProgress = achievableTotalExp - totalExpToCurrentLevelStart;
            overallPercentage = Math.min(100, (expProgress / totalExpRange) * 100);
        } else if (achievableTotalExp >= totalExpToTargetLevelStart) {
            overallPercentage = 100;
        }

        setMaxLevelResult({
            text: t('affectionTab.results.achievableLevel', {
                level: achievableLevel,
                progressExp: progressExpInLevel,
                expForLevel: expForAchievableLevel
            }),
            currentExp: achievableTotalExp,
            targetExp: totalExpToTargetLevelStart,
            percentage: overallPercentage,
        });



        const bestHighTierGift = giftAffectionList.find(g => g.rarity === 3 && g.affectionPoints > 120 && !HighFlowerBouquetItemIds.includes(Number(g.id)));
        const bestNormalGift = giftAffectionList.find(g => g.rarity === 2 && g.affectionPoints > 20);

        const renderNeededItems = (exp: number) => {
            if (exp <= 0) return null;

            const highTierNeeded = bestHighTierGift ? Math.ceil(exp / bestHighTierGift.affectionPoints) : 0;
            const normalNeeded = bestNormalGift ? Math.ceil(exp / bestNormalGift.affectionPoints) : 0;
            const cafeTouches = Math.ceil(exp / 15);

            return (
                <div className="flex items-center justify-center gap-x-4 gap-y-1 flex-wrap text-xs">
                    {bestHighTierGift && (
                        <div className="flex items-center gap-1">
                            <ItemIcon type="Item" itemId={bestHighTierGift.id} amount={0} size={8} eventData={eventData} iconData={iconData} />
                            <span>&times;{highTierNeeded.toLocaleString()}</span>
                        </div>
                    )}
                    {bestHighTierGift && bestNormalGift && <span>or</span>}
                    {bestNormalGift && (
                        <div className="flex items-center gap-1">
                            <ItemIcon type="Item" itemId={bestNormalGift.id} amount={0} size={8} eventData={eventData} iconData={iconData} />
                            <span>&times;{normalNeeded.toLocaleString()}</span>
                        </div>
                    )}
                    {(bestHighTierGift || bestNormalGift) && <span>{t('affectionTab.results.or')}</span>}
                    <span>{t('affectionTab.results.cafeTouches', { counts: cafeTouches.toLocaleString() })}</span>
                </div>
            );
        };

        // (3) Call the rendering function created above according to each condition.
        if (calculateWithOwned) {
            const finalDeficit = expNeededForTarget - expFromOwned;
            if (finalDeficit <= 0) {
                setTargetResult(t('affectionTab.results.targetMetWithOwned', { surplusExp: (-finalDeficit).toLocaleString() }));
            } else {
                const resultJSX = (
                    <div className="space-y-1">
                        <p className="text-red-500 dark:text-red-400">{t('affectionTab.results.deficit', { deficitExp: finalDeficit.toLocaleString() })}</p>
                        {renderNeededItems(finalDeficit)}
                    </div>
                );
                setTargetResult(resultJSX);
            }
        } else {
            // Call rendering function based on the full required experience (expNeedForTarget) if the gift is not considered for holding
            if (expNeededForTarget <= 0) {
                setTargetResult(t('affectionTab.results.targetMet'));
            } else {
                setTargetResult(renderNeededItems(expNeededForTarget));
            }
        }


    }, [plan.current.affection, plan.target.affection, plan.current.affectionExp, ownedGifts, calculateWithOwned, giftAffectionList]);

    const displayedGifts = useMemo(() => {
        if (!hideNonPreferred) return giftAffectionList;
        return giftAffectionList.filter(gift => {
            if (gift.rarity == 2) return gift.affectionPoints > 20
            if (gift.rarity == 3) return gift.affectionPoints > 120
        });
    }, [giftAffectionList, hideNonPreferred]);


    return (
        <div className="space-y-4 text-sm">
            {/* 1. Set Target */}
            <div className="space-y-3">
                <div className="w-full flex items-center gap-2">
                    <label className="w-18 shrink-0 font-semibold">{t('affectionTab.rank')}</label>
                    <div className="flex-1">
                        <CustomNumberInput min={1} max={100} value={plan.current.affection} onChange={e => handlePlanChange('current.affection', e, true)} className="w-full p-1 border rounded dark:bg-neutral-700 dark:border-neutral-600" />
                    </div>
                    <span className="w-8 text-center text-gray-400 font-bold text-lg shrink-0">→</span>
                    <div className="flex-1">
                        <CustomNumberInput min={plan.current.affection} max={100} value={plan.target.affection} onChange={e => handlePlanChange('target.affection', e, true)} className="w-full p-1 border rounded dark:bg-neutral-700 dark:border-neutral-600" />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-semibold">{t('affectionTab.currentLevelProgress')}</label>
                    <div className="flex items-center gap-2">
                        <input type="range" min="0" max={expForCurrentLevel - 1} value={plan.current.affectionExp} onChange={e => handlePlanChange('current.affectionExp', e.target.value, true)} className="w-full" />
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-28 text-right shrink-0">{plan.current.affectionExp} / {expForCurrentLevel} {t('common.exp')}</span>
                    </div>
                </div>
            </div>


            {/* 2. Input Owned Gifts */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-base dark:text-neutral-200">{t('affectionTab.ownedGiftsTitle')}</h4>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                if (window.confirm(t('affectionTab.resetConfirm'))) {
                                    resetOwnedGifts();
                                }
                            }}
                            className="text-xs font-semibold text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                        >
                            {t('affectionTab.reset')}
                        </button>
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                            <input type="checkbox" checked={hideNonPreferred} onChange={e => setHideNonPreferred(e.target.checked)} className="h-3.5 w-3.5 rounded" />
                            <span>{t('affectionTab.showPreferredOnly')}</span>
                        </label>
                    </div>
                </div>
                <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-200 dark:border-neutral-700">

                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-7 gap-px bg-gray-200 dark:bg-neutral-700">
                        {displayedGifts.map(gift => (
                            <div
                                key={gift.id}
                                className="bg-white dark:bg-neutral-800 p-2 flex flex-col items-center justify-between gap-1.5"
                            >
                                <div className="flex flex-col items-center gap-1 w-full">
                                    <div className="relative">
                                        <ItemIcon type={gift.type} itemId={gift.id} amount={0} size={10} eventData={eventData} iconData={iconData} />

                                    </div>

                                    <div className='flex items-center gap-0.5 justify-center w-full'>
                                        <img
                                            src={getPreferenceIcon(gift.preferenceLevel, gift.rarity)}
                                            alt={t('common.preferenceLevelAlt', { level: gift.preferenceLevel })}
                                            className="object-contain h-3 w-3 opacity-80"
                                        />
                                        <span className="text-[10px] sm:text-xs font-bold text-yellow-600 dark:text-yellow-500 leading-none">
                                            +{gift.affectionPoints}
                                        </span>
                                    </div>
                                </div>

                                <div className="w-full">
                                    <NumberInput
                                        value={ownedGifts[gift.id] || 0}
                                        onChange={val => updateOwnedGifts(gift.id, val)}
                                        min={0}
                                        max={99999}
                                        narrowButtonType='plus'
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 3. Calculation Settings and Results */}
            <div>
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/40 rounded-t-lg">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={calculateWithOwned} onChange={e => setCalculateWithOwned(e.target.checked)} className="h-4 w-4 rounded" />
                        <span className="font-semibold text-blue-800 dark:text-blue-300">{t('affectionTab.calculateWithOwned')}</span>
                    </label>
                </div>
                <div className="p-4 bg-gray-200 dark:bg-neutral-700 rounded-b-lg text-center text-gray-800 dark:text-neutral-200 space-y-2">
                    {maxLevelResult && (
                        <div className="font-bold">
                            <p>{maxLevelResult.text}</p>
                            <div className="w-full bg-gray-300 dark:bg-neutral-600 rounded-full h-2.5 my-1.5">
                                <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${maxLevelResult.percentage}%` }}></div>
                            </div>
                            <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                                {maxLevelResult.currentExp.toLocaleString()} / {maxLevelResult.targetExp.toLocaleString()} {t('common.exp')}
                            </p>
                        </div>
                    )}
                    <div className="text-xs font-normal border-t dark:border-neutral-600 pt-2 mt-2">{targetResult}</div>
                </div>
            </div>
        </div>
    );
};
