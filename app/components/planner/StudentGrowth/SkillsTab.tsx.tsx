// SkillsTab.tsx

import React from 'react';
import type { GrowthPlan } from '~/store/planner/useGlobalStore';
import type { Student } from '~/types/plannerData';
import { SkillDisplay } from './StudentGrowthPlanCard';
import { useTranslation } from 'react-i18next';

export const SKILL_CONFIG = [
    { id: 'ex', labelKey: 'common.ex', skillKey: 'Ex', maxLevel: 5 },
    { id: 'normal', labelKey: 'common.normal', skillKey: 'Public', maxLevel: 10 },
    { id: 'passive', labelKey: 'common.passive', skillKey: 'Passive', maxLevel: 10 },
    { id: 'sub', labelKey: 'common.sub', skillKey: 'ExtraPassive', maxLevel: 10 }
] as const;

// --- Type definitions ---
interface SkillsTabProps {
    plan: GrowthPlan;
    studentInfo: Student | null;
    handlePlanChange: (field: string, value: any, isNumeric?: boolean) => void;
}

export const SkillsTab = ({ plan, studentInfo, handlePlanChange }: SkillsTabProps) => {
    const { t } = useTranslation("planner");
    if (!studentInfo) return <div className="text-center p-4">Please choose the student first.</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-sm">

            <div className="space-y-2 md:col-span-6">

                <div className="flex items-center gap-2 mb-2 text-center font-semibold">
                    <span className="w-24 shrink-0"></span>
                    <h3 className="flex-1 text-gray-700 dark:text-neutral-300">{t('common.current')}</h3>
                    <span className="w-8 shrink-0"></span>
                    <h3 className="flex-1 text-blue-600 dark:text-blue-400">{t('common.target')}</h3>
                </div>

                {SKILL_CONFIG.map(({ id, labelKey, skillKey, maxLevel }) => (
                    <div key={`skill-row-${id}`} className="flex items-center gap-2">
                        <label className="w-16 shrink-0 font-semibold">{t(labelKey)}:</label>

                        {/* Current level select */}
                        <div className="flex-1">
                            <select
                                value={plan.current[id]}
                                onChange={e => handlePlanChange(`current.${id}`, e.target.value, true)}
                                className="w-full p-1 border rounded bg-white dark:bg-neutral-700 dark:border-neutral-600"
                            >
                                {Array.from({ length: maxLevel }, (_, i) => i + 1).map(level => (
                                    <option key={level} value={level}>Lv.{level}</option>
                                ))}
                            </select>
                        </div>

                        <span className="w-8 text-center text-gray-400 font-bold text-lg shrink-0">→</span>

                        {/* Target level select */}
                        <div className="flex-1">
                            <select
                                value={plan.target[id]}
                                onChange={e => handlePlanChange(`target.${id}`, e.target.value, true)}
                                className="w-full p-1 border rounded bg-white dark:bg-neutral-700 dark:border-neutral-600"
                            >
                                {Array.from({ length: maxLevel }, (_, i) => i + 1).map(level => {
                                    if (level < plan.current[id]) return null;
                                    return <option key={level} value={level}>Lv.{level} {level === maxLevel ? 'MAX' : ''}</option>;
                                })}
                            </select>
                        </div>
                    </div>
                ))}
            </div>

            {studentInfo && (
                <div className="md:col-span-6 space-y-2">
                    {/* <h4 className="font-semibold text-sm mb-2 text-center">Skill Growth Info</h4> */}
                    <div className="space-y-2">
                        {studentInfo.Skills.Ex.ExtraSkills ? studentInfo.Skills.Ex.ExtraSkills.map(s => (
                            <SkillDisplay
                                studentInfo={studentInfo}
                                skillKey="Ex"
                                skillLabel="EX"
                                currentLevel={plan.current.ex}
                                targetLevel={plan.target.ex}
                                currentUW={plan.current.uw}
                                targetUW={plan.target.uw}
                                skillData={s}
                            />
                        )) : <SkillDisplay
                            studentInfo={studentInfo}
                            skillKey="Ex"
                            skillLabel="EX"
                            currentLevel={plan.current.ex}
                            targetLevel={plan.target.ex}
                            currentUW={plan.current.uw}
                            targetUW={plan.target.uw}
                            skillData={studentInfo.Skills.Ex}
                        />}
                        <SkillDisplay
                            studentInfo={studentInfo}
                            skillKey="Public"
                            skillLabel={t("common.normal")}
                            currentLevel={plan.current.normal}
                            targetLevel={plan.target.normal}
                            currentUW={plan.current.uw}
                            targetUW={plan.target.uw}
                            skillData={studentInfo.Skills.Public}
                        />
                        <SkillDisplay
                            studentInfo={studentInfo}
                            skillKey="Passive"
                            skillLabel={t("common.passive")}
                            currentLevel={plan.current.passive}
                            targetLevel={plan.target.passive}
                            currentUW={plan.current.uw}
                            targetUW={plan.target.uw}
                            skillData={studentInfo.Skills.Passive}
                        />
                        <SkillDisplay
                            studentInfo={studentInfo}
                            skillKey="ExtraPassive"
                            skillLabel={t("common.sub")}
                            currentLevel={plan.current.sub}
                            targetLevel={plan.target.sub}
                            currentUW={plan.current.uw}
                            targetUW={plan.target.uw}
                            skillData={studentInfo.Skills.ExtraPassive}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};