// app/components/planner/StudentGrowth/BasicStatsTab.tsx
import { useTranslation } from 'react-i18next';
import { CustomNumberInput } from '~/components/CustomInput';
import type { GrowthPlan } from '~/store/planner/useGlobalStore';
import type { Student } from '~/types/plannerData';

export const BasicStatsTab = ({ plan, studentInfo, handlePlanChange, handleRankChange, rankOptions }: {
    plan: GrowthPlan;
    studentInfo: Student;
    handlePlanChange: (field: string, value: any, isNumeric?: boolean) => void,
    handleRankChange: (type: "current" | "target", value: string) => void,
    rankOptions: {
        value: string;
        label: string;
    }[]

}) => {
    const baseStarGrade = studentInfo?.StarGrade || 1;
    const currentRankValue = plan.current.uw > 0 ? `uw_${plan.current.uw}` : `star_${plan.current.star}`;
    const targetRankValue = plan.target.uw > 0 ? `uw_${plan.target.uw}` : `star_${plan.target.star}`;
    const { t } = useTranslation("planner");


    return (
        <>
            <div className="space-y-2 text-sm">

                <div className="flex items-center gap-2 mb-2 text-center font-semibold">
                    <span className="w-24 shrink-0"></span>
                    <h3 className="flex-1 text-gray-700 dark:text-neutral-300">{t('common.current')}</h3>
                    <span className="w-8 shrink-0"></span>
                    <h3 className="flex-1 text-blue-600 dark:text-blue-400">{t('common.target')}</h3>
                </div>

                <div className="flex items-center gap-2">
                    <label className="w-24 shrink-0 font-semibold">{t('basicStatsTab.level')}</label>
                    <div className="flex-1">
                        <CustomNumberInput min={1} max={90} value={plan.current.level} onChange={e => handlePlanChange('current.level', e, true)} className="w-full p-1 border rounded dark:bg-neutral-700 dark:border-neutral-600" />
                    </div>
                    <span className="w-8 text-center text-gray-400 font-bold text-lg shrink-0">→</span>
                    <div className="flex-1">
                        <CustomNumberInput min={plan.current.level} max={90} value={plan.target.level} onChange={e => handlePlanChange('target.level', e, true)} className="w-full p-1 border rounded dark:bg-neutral-700 dark:border-neutral-600" />
                    </div>
                </div>


                <div className="flex items-center gap-2">
                    <label className="w-24 shrink-0 font-semibold">{t('basicStatsTab.rank')}</label>
                    <div className="flex-1">
                        <select value={currentRankValue} onChange={e => handleRankChange('current', e.target.value)} className="w-full p-1.5 border rounded bg-white dark:bg-neutral-700 dark:border-neutral-600">
                            {rankOptions.map(opt => {
                                const [type, level] = opt.value.split('_');
                                if (type === 'star' && Number(level) < baseStarGrade) return null;
                                return <option key={opt.value} value={opt.value}>{opt.label}</option>;
                            })}
                        </select>
                    </div>
                    <span className="w-8 text-center text-gray-400 font-bold text-lg shrink-0">→</span>
                    <div className="flex-1">
                        <select value={targetRankValue} onChange={e => handleRankChange('target', e.target.value)} className="w-full p-1.5 border rounded bg-white dark:bg-neutral-700 dark:border-neutral-600">
                            {rankOptions.map(opt => {
                                const [type, level] = opt.value.split('_');
                                if (type === 'star' && Number(level) < baseStarGrade) return null;
                                const optRank = opt.value.startsWith('uw') ? 5 + Number(level) : Number(level);
                                const currentRank = currentRankValue.startsWith('uw') ? 5 + Number(currentRankValue.split('_')[1]) : Number(currentRankValue.split('_')[1]);
                                if (optRank < currentRank) return null;
                                return <option key={opt.value} value={opt.value}>{opt.label}</option>;
                            })}
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <label className="w-24 shrink-0 font-semibold">{t('basicStatsTab.affectionRank')}</label>
                    <div className="flex-1">
                        <CustomNumberInput min={1} max={plan.current.uw ? 100 : (plan.current.star < 3 ? 10 : 20)} value={plan.current.affection} onChange={e => handlePlanChange('current.affection', e, true)} className="w-full p-1 border rounded dark:bg-neutral-700 dark:border-neutral-600" />
                    </div>
                    <span className="w-8 text-center text-gray-400 font-bold text-lg shrink-0">→</span>
                    <div className="flex-1">
                        <CustomNumberInput min={plan.current.affection} max={plan.target.uw ? 100 : (plan.target.star < 3 ? 10 : 20)} value={plan.target.affection} onChange={e => handlePlanChange('target.affection', e, true)} className="w-full p-1 border rounded dark:bg-neutral-700 dark:border-neutral-600" />
                    </div>
                </div>
            </div>
            <div className="mt-4 border-t dark:border-neutral-700 pt-3">
                <h4 className="font-semibold text-sm mb-2">{t('basicStatsTab.growthOptionsTitle')}</h4>
                <div className="p-3 rounded-md bg-white dark:bg-neutral-800 border dark:border-neutral-700">

                    <div className="flex items-center gap-4">
                        <label className="font-semibold shrink-0">{t('basicStatsTab.ownedEleph')}</label>
                        <div className="flex-1 max-w-[120px] ml-auto">
                            <CustomNumberInput
                                min={0}
                                max={99999}
                                value={plan.current.eleph}
                                onChange={e => handlePlanChange('current.eleph', e, true)}
                                className="w-full p-1 border rounded dark:bg-neutral-700 dark:border-neutral-600 text-center"
                            />
                        </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            className="h-4 w-4 rounded"
                            checked={plan.useEligmaForStar}
                            onChange={e => handlePlanChange('useEligmaForStar', e.target.checked)}
                        />
                        <span>{t('basicStatsTab.useEligmaForRankUp')}</span>
                    </label>

                    {plan.useEligmaForStar && (
                        <div className="grid grid-cols-2 gap-4 mt-3 pl-6 text-xs">
                            <div>
                                <label className="font-semibold mb-1 block">{t('basicStatsTab.currentElephPrice')}</label>
                                <select
                                    value={plan.eligmaInfo?.price || 1}
                                    onChange={e => handlePlanChange('eligmaInfo.price', e.target.value, true)}
                                    className="w-full p-1.5 border rounded bg-white dark:bg-neutral-700 dark:border-neutral-600"
                                >
                                    {[1, 2, 3, 4, 5].map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="font-semibold mb-1 block">{t('basicStatsTab.purchasableEleph')}</label>
                                <input
                                    type="number"
                                    value={plan.eligmaInfo?.stock || 0}
                                    onChange={e => handlePlanChange('eligmaInfo.stock', e.target.value, true)}
                                    className="w-full p-1.5 border rounded bg-white dark:bg-neutral-700 dark:border-neutral-600"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};