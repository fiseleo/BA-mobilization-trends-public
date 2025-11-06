import React from 'react';
import { TIER_OPTIONS, TIER_TO_LEVEL } from './StudentGrowthPlanCard';
import type { GrowthPlan } from '~/store/planner/useGlobalStore';
import type { Student } from '~/types/plannerData';
import { useTranslation } from 'react-i18next';

export const EquipmentTab = ({ plan, studentInfo, handleEquipmentChange }: {
    plan: GrowthPlan;
    studentInfo: Student;
    handleEquipmentChange: (type: "current" | "target", slotIndex: number, value: number) => void

}) => {
    const { t, i18n } = useTranslation("planner");

    if (!studentInfo) return <div className="text-center p-4">Please choose the student first.</div>;

    return (
        <div className="space-y-2 text-sm">

            <div className="space-y-4 text-sm">
                {studentInfo.Equipment.map((equipmentName, i) => {
                    const isEnabledCurrent = plan.current.level >= (i === 1 ? 10 : i === 2 ? 20 : 1);
                    const isEnabledTarget = plan.target.level >= (i === 1 ? 10 : i === 2 ? 20 : 1);
                    const currentTier = plan.current.equipment[i] || 0;
                    const targetTier = plan.target.equipment[i] || 0;

                    return (
                        <div key={`equipment-row-${i}`} className=" ">

                            <div className="flex justify-center items-center gap-2 sm:gap-4">

                                <div className="w-20 font-bold text-sm mr-2 text-gray-800 dark:text-neutral-200">
                                    {t(`common.${equipmentName}`)}:
                                </div>

                                <div className={`flex-1 space-y-1 ${!isEnabledCurrent ? 'opacity-50' : ''}`}>
                                    <label className="font-semibold text-gray-600 dark:text-gray-300">{t('common.current')}</label>
                                    <select
                                        value={currentTier}
                                        onChange={e => handleEquipmentChange('current', i, Number(e.target.value))}
                                        disabled={!isEnabledCurrent}
                                        className={`w-full p-1.5 border rounded bg-white dark:bg-neutral-700 dark:border-neutral-600 focus:ring-2 focus:ring-blue-500 transition ${!isEnabledCurrent ? 'cursor-not-allowed' : ''}`}
                                    >
                                        <option value={0}>{t('common.tierNone')}</option>
                                        {TIER_OPTIONS.map(tier =>
                                            <option key={tier} value={tier}>{t('common.tierPrefix', { tier })}</option>
                                        )}
                                    </select>
                                    <div className="text-right text-xs text-gray-500 dark:text-gray-400 h-4">
                                        {currentTier > 0 && t('common.levelDisplay', { level: TIER_TO_LEVEL[currentTier] })}
                                    </div>
                                </div>

                                <div className="pb-0 shrink-0">
                                    <span className="text-center text-gray-400 font-bold text-xl">→</span>
                                </div>

                                <div className={`flex-1 space-y-1 ${!isEnabledTarget ? 'opacity-50' : ''}`}>
                                    <label className="font-semibold text-blue-600 dark:text-blue-400">{t('common.target')}</label>
                                    <select
                                        value={targetTier}
                                        onChange={e => handleEquipmentChange('target', i, Number(e.target.value))}
                                        disabled={!isEnabledTarget}
                                        className={`w-full p-1.5 border rounded bg-white dark:bg-neutral-700 dark:border-neutral-600 focus:ring-2 focus:ring-blue-500 transition ${!isEnabledTarget ? 'cursor-not-allowed' : ''}`}
                                    >
                                        <option value={0}>{t('common.tierNone')}</option>
                                        {TIER_OPTIONS.map(tier => {
                                            if (tier < currentTier) return null;
                                            return <option key={tier} value={tier}>{t('common.tierPrefix', { tier })}</option>;
                                        })}
                                    </select>
                                    <div className="text-right text-xs text-blue-600 dark:text-blue-400 font-semibold h-4">
                                        {targetTier > 0 && t('common.levelDisplay', { level: TIER_TO_LEVEL[targetTier] })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

        </div>
    );
};