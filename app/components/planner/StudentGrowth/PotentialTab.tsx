import React from 'react';
import { useTranslation } from 'react-i18next';
import type { GrowthPlan } from '~/store/planner/useGlobalStore';
import type { Student } from '~/types/plannerData';

interface PotentialTabProps {

    plan: GrowthPlan;
    handlePotentialChange: (type: 'current' | 'target', stat: 'hp' | 'atk' | 'heal', value: number) => void;
    canEnablePotentialCurrent: boolean;
    canEnablePotentialTarget: boolean;
}

export const PotentialTab = ({ plan, handlePotentialChange, canEnablePotentialCurrent, canEnablePotentialTarget }: PotentialTabProps) => {
    const potentialStats = [
        { key: 'hp', labelKey: 'common.hp' },
        { key: 'atk', labelKey: 'common.atk' },
        { key: 'heal', labelKey: 'common.heal' }
    ];
    const { t, i18n } = useTranslation("planner");

    return (
        <div className="space-y-3">
            <h4 className={`font-semibold text-sm text-center ${!canEnablePotentialTarget ? 'text-gray-400 dark:text-gray-500' : ''}`}>
                {t('potentialTab.title')} {!canEnablePotentialTarget && t('potentialTab.unlockCondition')}
            </h4>

            <div className="space-y-2 text-sm">
                {/* Header */}
                <div className="flex items-center gap-2 mb-2 text-center font-semibold">
                    <span className="w-16 shrink-0"></span>
                    <h3 className="flex-1 text-gray-700 dark:text-gray-300">{t('common.current')}</h3>
                    <span className="w-8 shrink-0"></span>
                    <h3 className="flex-1 text-blue-600 dark:text-blue-300">{t('common.target')}</h3>
                </div>

                {potentialStats.map(stat => (
                    <div key={`potential-row-${stat.key}`} className="flex items-center gap-2">
                        <label className="w-16 shrink-0 font-semibold">{t(stat.labelKey)}:</label>

                        {/* Enter current status */}
                        <div className={`flex-1 ${!canEnablePotentialCurrent ? 'opacity-50' : ''}`}>
                            <select
                                disabled={!canEnablePotentialCurrent}
                                value={plan.current.potential[stat.key as 'hp']}
                                onChange={e => handlePotentialChange('current', stat.key as 'hp', Number(e.target.value))}
                                className="w-full p-1 border rounded disabled:bg-gray-200 dark:disabled:bg-neutral-600 bg-white dark:bg-neutral-700 dark:border-neutral-600"
                            >
                                {Array.from({ length: 26 }, (_, i) => i).map(level => (
                                    <option key={level} value={level}>
                                        {level === 0 ? '-' : t('common.levelPrefix', { level })}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <span className="w-8 text-center text-gray-400 font-bold text-lg shrink-0">→</span>

                        {/* Target Status */}
                        <div className={`flex-1 ${!canEnablePotentialTarget ? 'opacity-50' : ''}`}>
                            <select
                                disabled={!canEnablePotentialTarget}
                                value={plan.target.potential[stat.key as 'hp']}
                                onChange={e => handlePotentialChange('target', stat.key as 'hp', Number(e.target.value))}
                                className="w-full p-1 border rounded disabled:bg-gray-200 dark:disabled:bg-neutral-600 bg-white dark:bg-neutral-700 dark:border-neutral-600"
                            >
                                {Array.from({ length: 26 }, (_, i) => i).map(level => {
                                    if (level < plan.current.potential[stat.key as 'hp']) {
                                        return null;
                                    }
                                    return (
                                        <option key={level} value={level}>
                                            {level === 0 ? '-' : t('common.levelPrefix', { level })}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
