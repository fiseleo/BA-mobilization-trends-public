import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ItemIcon } from '~/components/planner/common/Icon';
import { StudentGrowthPlanCard } from '~/components/planner/StudentGrowth/StudentGrowthPlanCard';
import { StudentGrowthSummaryCard } from '~/components/planner/StudentGrowth/StudentGrowthSummaryCard';
import { useGlobalStore } from '~/store/planner/useGlobalStore';
import type { EventData, IconData, StudentData, StudentPortraitData } from '~/types/plannerData';
import { calculatedGrowthNeeds } from '~/utils/calculatedGrowthNeeds';
import iconDataInfoModule from "~/data/event/icon_info.json"
import iconDataAllModule from "~/data/event/icon_img.json"
import { DEFAULT_LOCALE, type Locale } from '~/utils/i18n/config';
import type { loader as rootLorder } from "~/root";
import { data, type LoaderFunctionArgs, type MetaFunction } from 'react-router';
import { createLinkHreflang, createMetaDescriptor } from '~/components/head';
import type { Route } from './+types/StudentPlannerPage';
import { getInstance } from '~/middleware/i18next';


// export const meta: MetaFunction<typeof rootLorder, {
//   "root": typeof rootLorder,
// }> = ({ matches, params }) => {
//   matches.find(m => m.id)
//   const rootMatch = matches.find(m => m.id === "root");
//   const locale_data = rootMatch ? rootMatch.loaderData : null;
//   const locale = locale_data ? locale_data.locale : DEFAULT_LOCALE;

//   const t = i18n.getFixedT(locale, undefined, 'home');
//   const t_ranking = i18n.getFixedT(locale, undefined, 'planner');
//   const t_c = i18n.getFixedT(locale, undefined, 'common');

export async function loader({ context, params, request }: LoaderFunctionArgs) {
  let i18n = getInstance(context);
  return data({
    siteTitle: i18n.t("home:title"),
    title: i18n.t("planner:page.studentGrowthPlanner"),
    description: i18n.t("planner:page.description.studentGrowthPlanner"),
  })
}


export function meta({ loaderData }: Route.MetaArgs) {

  return createMetaDescriptor(
    loaderData.title + ' - ' + loaderData.siteTitle,
    loaderData.description,
    "/img/p.webp"
  )
}

export function links() {
  return [
    ...createLinkHreflang('/planner/students')
  ]
}

export const StudentPlannerPage = () => {
  const [allStudents, setAllStudents] = useState<StudentData>({});
  const [studentPortraits, setStudentPortraits] = useState<StudentPortraitData>({});
  // const [iconData, setIconData] = useState<IconData | null>(null);
  // const [iconInfoData, setIconInfoData] = useState<EventData["icons"] | null>(null);
  const iconInfoData = iconDataInfoModule as any as EventData["icons"]
  const iconData = iconDataAllModule as IconData
  const [loading, setLoading] = useState(true);

  // State to store the uuid of the currently selected (detail view) card
  const [selectedPlanUuid, setSelectedPlanUuid] = useState<string | null>(null);
  const { t, i18n } = useTranslation("planner");
  const { t: t_c } = useTranslation("common");
  const locale = i18n.language as Locale


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, portraitsRes] = await Promise.all([
          fetch(`/schaledb.com/${locale}.students.min.json`),
          fetch('/w/students_portrait.json'),
        ]);
        setAllStudents(await studentsRes.json());
        setStudentPortraits(await portraitsRes.json());
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [locale]);

  const { growthPlans, addPlan } = useGlobalStore();

  const totalNeeds = useMemo(() => {
    return calculatedGrowthNeeds(growthPlans, allStudents)
  }, [growthPlans, allStudents]);

  const studentOptions = useMemo(() =>
    Object.entries(allStudents).sort(([, a], [, b]) => a.Name.localeCompare(b.Name)),
    [allStudents]);

  // Find the Plan object for the selected student
  const selectedPlan = useMemo(() =>
    growthPlans.find(p => p.uuid === selectedPlanUuid),
    [growthPlans, selectedPlanUuid]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>{t_c("loading_txt")}</p>
      </div>
    );
  }


  return (
    <div className="bg-gray-100 dark:bg-neutral-900 min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex justify-between items-center">
          <h1 className="text-3xl font-bold dark:text-gray-100">{t('page.studentGrowthPlanner')}</h1>
          <button onClick={() => addPlan(null)} className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors">
            {t("ui.addNewPlan")}
          </button>
        </header>


        {/* 2-column / fullscreen layout based on screen size */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* --- Left: Student list (hidden on mobile when viewing details) --- */}
          <div className={`lg:col-span-1 space-y-4 ${selectedPlanUuid ? 'hidden lg:block' : 'block'}`}>
            {growthPlans.length > 0 ? (
              growthPlans.map(plan => (
                <StudentGrowthSummaryCard
                  key={plan.uuid}
                  plan={plan}
                  allStudents={allStudents}
                  studentPortraits={studentPortraits}
                  isSelected={plan.uuid === selectedPlanUuid}
                  onClick={() => setSelectedPlanUuid(plan.uuid)}
                />
              ))
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 p-10 bg-white dark:bg-neutral-800 rounded-lg shadow-sm border dark:border-neutral-700">
                <p className="font-semibold dark:text-gray-200">{t("ui.noStudentGrowthPlan")}</p>
                <p className="text-sm mt-1">{t("ui.startByAddingNewPlan")}</p>
              </div>
            )}

            {/* Total required materials */}
            {Object.keys(totalNeeds).length > 0 && iconData && (
              <div className="p-4 bg-white dark:bg-neutral-800 rounded-xl shadow-md sticky top-4">
                <h2 className="text-xl font-bold dark:text-gray-100">Total Requirements</h2>
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t dark:border-neutral-700 max-h-48 overflow-y-auto">
                  {Object.entries(totalNeeds).map(([key, amount]) => {
                    if (amount <= 0) return null;
                    const [type, id] = key.split('_');
                    return <ItemIcon key={key} type={type} itemId={id} amount={amount as number} size={14} eventData={{ icons: iconInfoData } as EventData} iconData={iconData} />;
                  })}
                </div>
              </div>
            )}
          </div>

          {/* --- Right: Detail view (fullscreen on mobile, shown on right on desktop) --- */}
          {selectedPlan && (
            <div className="lg:col-span-2 sticky top-4">
              <StudentGrowthPlanCard
                plan={selectedPlan}
                allStudents={allStudents}
                studentPortraits={studentPortraits}
                studentOptions={studentOptions}
                iconData={iconData}
                eventData={{ icons: iconInfoData } as EventData}
                onClose={() => setSelectedPlanUuid(null)}
              />
            </div>
          )}

          {/* Placeholder when nothing is selected on desktop */}
          {!selectedPlanUuid && (
            <div className="hidden lg:flex lg:col-span-2 items-center justify-center h-96 bg-white dark:bg-neutral-800 rounded-lg shadow-sm border-2 border-dashed dark:border-neutral-700">
              <p className="text-gray-400 dark:text-gray-500">{t("ui.selectStudentForDetails")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


export default StudentPlannerPage