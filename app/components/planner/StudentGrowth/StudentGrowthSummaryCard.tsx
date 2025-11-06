import { useTranslation } from "react-i18next";
import { getCharacterStarValue, type Character } from "~/components/dashboard/common";
import StarIcon from "~/components/StarIcon";
import { StarRating } from "~/components/StarRatingProps";
import type { GrowthPlan } from "~/store/planner/useGlobalStore";
import type { StudentData, StudentPortraitData } from "~/types/plannerData";

interface StudentGrowthSummaryCardProps {
  plan: GrowthPlan;
  allStudents: StudentData;
  studentPortraits: StudentPortraitData;
  isSelected: boolean;
  onClick: () => void;
}

const skillSortName = (data: GrowthPlan['current'] | GrowthPlan['target']) => {
  const ex = data.ex
  const normal = data.normal
  const passive = data.passive
  const sub = data.sub

  return `${ex == 5 ? 'M' : ex}${normal == 10 ? 'M' : normal}${passive == 10 ? 'M' : passive}${sub == 10 ? 'M' : sub}`
}

export const StudentGrowthSummaryCard = ({ plan, allStudents, studentPortraits, isSelected, onClick }: StudentGrowthSummaryCardProps) => {
  const studentInfo = plan.studentId ? allStudents[plan.studentId] : null;

  const { t, i18n } = useTranslation("planner");

  if (!studentInfo) {
    return (
      <div
        onClick={onClick}
        className={`p-4 border rounded-lg cursor-pointer text-center transition-colors hover:bg-gray-200 dark:hover:bg-neutral-700 // [Dark] Hover state background color
    ${isSelected
            ? 'bg-blue-50 border-blue-500 text-blue-800 dark:bg-blue-900 dark:border-blue-500 dark:text-blue-200' // When selected
            : 'bg-white border-gray-200 text-gray-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-gray-400' // When not selected
          }
  `}
      >
        {t('growthCard.selectStudentPlaceholder')}
      </div>
    );
  }

  const currentRankValue = getCharacterStarValue({
    hasWeapon: plan.current.uw > 0,
    star: plan.current.star,
    weaponStar: plan.current.uw,
  } as Character)

  const targetRankValue = getCharacterStarValue({
    hasWeapon: plan.target.uw > 0,
    star: plan.target.star,
    weaponStar: plan.target.uw,
  } as Character)

  // const currentRank = <StarRating n={c}>
  // const targetRank = plan.target.uw > 0 ? `Unique${plan.target.uw}★` : `${plan.target.star}★`;
  const currentRank = plan.current.uw > 0 ? `uw${plan.current.uw}★` : `${plan.current.star}★`;
  const targetRank = plan.target.uw > 0 ? `uw${plan.target.uw}★` : `${plan.target.star}★`;

  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-xl shadow-md hover:shadow-lg border-2 transition-all cursor-pointer ${isSelected
        ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/50'
        : 'border-transparent bg-white dark:bg-neutral-800'
        }`}
    >
      <div className="flex items-center gap-4">
        <img
          src={`data:image/webp;base64,${studentPortraits[plan.studentId!]}`}
          alt={studentInfo.Name}
          className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-neutral-700"
        />
        <div className="grow">
          <p className="font-bold text-lg text-gray-800 dark:text-gray-100">{studentInfo.Name}</p>
          <div className="flex flex-col items-baseline gap-3 text-sm text-gray-600 dark:text-gray-400 mt-1">
            {plan.current.level != plan.target.level && <span>Lv.{plan.current.level} → <span className="font-semibold text-blue-600 dark:text-blue-400">Lv.{plan.target.level}</span></span>}
            {/* {currentRank != targetRank && <span>{currentRank} → <span className="font-semibold text-blue-600 dark:text-blue-400">{targetRank}</span></span>} */}
            {currentRank != targetRank && <span className="flex flex-row gap-x-1"><StarRating n={currentRankValue} /> → <StarRating n={targetRankValue} /> </span>}
            {skillSortName(plan.current) != skillSortName(plan.target) && <span>{skillSortName(plan.current)} → <span className="font-semibold text-blue-600 dark:text-blue-400">{skillSortName(plan.target)}</span></span>}
          </div>
        </div>
        <div className="text-gray-400 dark:text-gray-500 text-2xl hidden sm:block">
          ➔
        </div>
      </div>
    </div>
  );
};

