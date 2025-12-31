// app/routes/dashboard/index.tsx

import { data, Link, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { GAMESERVER_LIST, type GameServer, type RaidInfo } from "~/types/data";
import { useTranslation } from "react-i18next";
import { getMostDifficultLevel, type_translation, typecolor } from "~/components/raidToString";
import { type Locale } from "~/utils/i18n/config";
import { loadRaidInfos } from "~/utils/loadRaidInfo";
import { TerrainIconGameStyle, type Terrain } from "~/components/teran";
import { createLinkHreflang, createMetaDescriptor } from "~/components/head";
import { getLiveRaidInfo } from "~/data/liveRaid";
import { isTotalAssault } from "~/components/dashboard/common";
import type { Route } from "./+types";
import { getInstance } from "~/middleware/i18next";
import { localeLink } from "~/utils/localeLink";

// Define types: Total Assault is RaidInfo, Joint Firing Drill is RaidInfo array.
type GroupedRaidInfo = RaidInfo | RaidInfo[];

export async function loader({ context, params, request }: LoaderFunctionArgs) {
  const { server } = params;
  if (!server || !GAMESERVER_LIST.includes(server as GameServer)) {
    throw new Response("Not Found", { status: 404 });
  }

  // const locale = getLocaleFromHeaders(request);
  let i18n = getInstance(context);
  const locale = i18n.language as Locale
  const raidInfos = loadRaidInfos(server as GameServer, locale);

  const raidGroups = new Map<string, RaidInfo[]>();
  for (const raid of raidInfos) {
    if (!raidGroups.has(raid.Id)) {
      raidGroups.set(raid.Id, []);
    }
    raidGroups.get(raid.Id)!.push(raid);
  }

  const groupedRaidInfos: GroupedRaidInfo[] = Array.from(raidGroups.values()).map(group => {
    return group.length === 1 ? group[0] : group;
  });

  // raid search logic to be fixed
  let pinnedTotalAssault: RaidInfo | null = null;
  let pinnedGrandAssault: RaidInfo[] | null = null;

  if (server === 'jp' && locale !== 'ja') {
    // Sort by current date (latest order)
    const sortedForPin = [...groupedRaidInfos].sort((a, b) => {
      const dateA = Array.isArray(a) ? a[0].Date : a.Date;
      const dateB = Array.isArray(b) ? b[0].Date : b.Date;
      return new Date(dateB.split(' ~ ')[0]).getTime() - new Date(dateA.split(' ~ ')[0]).getTime();
    });

    for (const raidGroup of sortedForPin) {


      if (Array.isArray(raidGroup)) {
        if (raidGroup[0].Id == 'E25') pinnedGrandAssault = raidGroup;
      } else if (raidGroup.Id == 'R81') pinnedTotalAssault = raidGroup

      // Stop scanning if you find both types
      if (pinnedTotalAssault && pinnedGrandAssault) break;
    }
  }

  return data({
    title: i18n.t("dashboardIndex:title"), description: i18n.t("dashboardIndex:description"),
    siteTitle: i18n.t("home:title"),
    groupedRaidInfos,
    server,
    locale,
    pinnedTotalAssault, // Raid Data to Stuck
    pinnedGrandAssault, // Raid Data to Stuck
  });
}



// export const meta: MetaFunction<typeof rootLorder, {
//   "root": typeof rootLorder,
// }> = ({ matches, params }) => {
//   // ... existing meta function code (no changes)
//   matches.find(m => m.id)
//   const rootMatch = matches.find(m => m.id === "root");
//   const locale_data = rootMatch ? rootMatch.loaderData : null;
//   const locale = locale_data ? locale_data.locale : DEFAULT_LOCALE;
//   const {t} = useTranslation("home")
//   // const t_ranking = i18n.getFixedT(locale, undefined, 'dashboardIndex');
//   const {t:t_ranking} = useTranslation("dashboardIndex")//i18n.getFixedT(locale, undefined, 'dashboardIndex');

//   return createMetaDescriptor(
//     t_ranking('title') + ' - ' + t('title'),
//     t_ranking('description'),
//     "/img/3.webp"
//   )
// };

export function meta({ loaderData }: Route.MetaArgs) {
  return createMetaDescriptor(
    loaderData.title + ' | ' + loaderData.siteTitle,
    loaderData.description,
    "/img/3.webp"
  )
}

export function links() {
  return [
    ...createLinkHreflang('/dashboard')
  ]
}

function TotalAssaultCard({ region, raidInfo, locale }: { region: string, raidInfo: RaidInfo, locale: Locale }) {
  const { Id: id, Boss, Date: date, Location: location } = raidInfo;
  const { t } = useTranslation("common");

  return (
    <Link
      to={localeLink(locale, `/dashboard/${region}/${id}`)}
      // to={`/dashboard/${region}/${id}`}
      className="group block rounded-lg shadow-lg bg-white dark:bg-neutral-800 hover:scale-105 transform transition-transform duration-200 overflow-hidden"
    >
      <div className="p-4">
        <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          <span>{t('raid')}</span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span className="relative top-0.5"><TerrainIconGameStyle terrain={location as Terrain} size={'1em'} /></span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span>{getMostDifficultLevel(raidInfo)}</span>
        </div>
        <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 mt-1 truncate">
          <span className="text-xs font-light text-gray-400 mr-1 relative -top-1">S{id.substring(1)}</span>
          {Boss}
        </h3>
        <time className="text-xs text-neutral-500 dark:text-neutral-400 mt-2" dateTime={date}>{date}</time>
      </div>
    </Link>
  );
}

// Joint Firing Drill (multiple bosses) card
function GrandAssaultCard({ region, raidInfos, locale }: { region: string, raidInfos: RaidInfo[], locale: Locale }) {
  const primaryRaid = raidInfos[0]; // Use the first data as representative information
  const { Id: id, Boss, Date: date, Location: location } = primaryRaid;
  const { t } = useTranslation("common");


  return (
    <Link

      to={localeLink(locale, `/dashboard/${region}/${id}`)}
      // to={`/dashboard/${region}/${id}`}
      className="group block rounded-lg shadow-lg bg-white dark:bg-neutral-800 hover:scale-105 transform transition-transform duration-200 overflow-hidden"
    >
      <div className="p-4">
        <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          <span>{t('eraid')}</span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span className="relative top-0.5"><TerrainIconGameStyle terrain={location as Terrain} size={'1em'} /></span>
        </div>
        <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 mt-1 truncate">
          <span className="text-xs font-light text-gray-400 mr-1 relative -top-1">S{id.substring(1)}</span>
          {Boss}
        </h3>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {raidInfos.map(raid => (
            <div key={raid.Type} className="px-2.5 py-1 text-xs font-semibold text-white rounded-full flex items-center gap-1.5" style={{ backgroundColor: typecolor[raid.Type!] }}>
              <span>{type_translation[raid.Type!][locale]}</span>
              <span className="font-normal opacity-80 text-nowrap">{getMostDifficultLevel(raid)}</span>
            </div>
          ))}
        </div>
        <time className="text-xs text-neutral-500 dark:text-neutral-400 mt-2" dateTime={date}>{date}</time>
      </div>
    </Link>
  );
}


function LiveShortcutCard({ raidInfos, locale }: { raidInfos: RaidInfo[], locale: Locale }) {
  const { t: t_common } = useTranslation("common");
  // const { t: t_dashboard } = useTranslation("dashboardIndex");

  // Use the first data entry as the representative info
  const primaryRaid = raidInfos[0];
  const { Id: id, Boss, Date: date, Location: location } = primaryRaid;
  const liveExpired = (Number(new Date(date + 'T02:00:00Z')) /* GMT+9 11:00 */ + 3600_000 * 24 * 7 /* add 7 day */ - 3600_000 * 7) < Date.now()


  const israid = isTotalAssault(primaryRaid)

  return (
    <Link

      to={localeLink(locale, `/live`)}
      // to={`/live`} // Link to live dashboard page
      className="group relative block rounded-lg shadow-lg bg-white dark:bg-neutral-800 hover:scale-105 transform transition-transform duration-200 overflow-hidden"
    >
      <div className="relative p-4">
        {/* Top info: Display live status and raid type/terrain in one line */}
        <div className="flex justify-between items-center text-sm font-semibold">
          {/* Left: Live status display */}
          <div className="text-sky-500 dark:text-sky-400 flex items-center gap-1.5">
            {!liveExpired && <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>}
            <span>LIVE (BETA)</span>
          </div>
          {/* Right: JFD type and terrain */}
          <div className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <span>{israid ? '' : t_common('eraid')}</span>
            {!israid && <span className="text-gray-300 dark:text-gray-600">|</span>}
            <span className="relative top-0.5"><TerrainIconGameStyle terrain={location as Terrain} size={'1em'} /></span>
            {israid && <span className="text-gray-300 dark:text-gray-600">|</span>}
            <span>{israid ? getMostDifficultLevel(primaryRaid) : ''}</span>
          </div>
        </div>

        {/* Boss name and season info */}
        <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 mt-2 truncate">
          <span className="text-xs font-light text-gray-400 mr-1.5 relative -top-1">S{id.substring(1)}</span>
          {Boss}
        </h3>

        {/* <div className="text-gray-500 dark:text-gray-400">
          <span>
            {
              israid &&
            }
          </span>
        </div> */}

        {/* Type badges: Include max difficulty for each attribute */}
        {!israid && <div className="flex flex-wrap gap-1.5 mt-2">
          {raidInfos.map(raid => (
            <div key={raid.Type} className="px-2.5 py-1 text-xs font-semibold text-white rounded-full flex items-center gap-1.5" style={{ backgroundColor: typecolor[raid.Type!] }}>
              <span>{type_translation[raid.Type!][locale]}</span>
              <span className="font-normal opacity-80 text-nowrap">{getMostDifficultLevel(raid)}</span>
            </div>
          ))}
        </div>}

        {/* Date info */}
        <time className={"text-xs text-neutral-500 dark:text-neutral-400 mt-2"} dateTime={date}>{date}</time>
      </div>
    </Link>
  );
}

export default function DashboardIndex() {
  const { groupedRaidInfos, server, locale, pinnedTotalAssault, pinnedGrandAssault } = useLoaderData<typeof loader>();
  const { t } = useTranslation("dashboard");
  const { t: t_index } = useTranslation("dashboardIndex");

  // Sort grouped data by date
  const sortedRaids = groupedRaidInfos.sort((a, b) => {
    const dateA = Array.isArray(a) ? a[0].Date : a.Date;
    const dateB = Array.isArray(b) ? b[0].Date : b.Date;
    return Number(new Date(dateB)) - Number(new Date(dateA));
  });

  const LiveRaidInfos = getLiveRaidInfo(locale)

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen p-4 sm:p-6 lg:p-8 py-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white">
            {t('dashboardList')} ({server.toUpperCase()})
          </h1>
          <p className="text-sm mt-2 text-neutral-600 dark:text-neutral-300">
            {t_index('description')}
          </p>
        </header>



        {(pinnedTotalAssault && pinnedGrandAssault) && (
          <section className="mb-12 p-5 rounded-xl bg-gray-100 dark:bg-neutral-800/60 border border-gray-200 dark:border-neutral-700/80">
            <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-2 px-1">
              <span className="text-sky-500">📌</span>
              <span>{t_index('pinnedGlobalTitle')}</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {/* {pinnedTotalAssault && (
                <TotalAssaultCard region={server} raidInfo={pinnedTotalAssault} locale={locale} />
              )} */}
              {new Date(pinnedTotalAssault?.Date || 0) < new Date(pinnedGrandAssault[0]?.Date) &&
                <TotalAssaultCard region={server} raidInfo={pinnedTotalAssault} locale={locale} />
              }
              {pinnedGrandAssault && (
                <GrandAssaultCard region={server} raidInfos={pinnedGrandAssault} locale={locale} />
              )}
              {new Date(pinnedTotalAssault?.Date || 0) > new Date(pinnedGrandAssault[0]?.Date) &&
                <TotalAssaultCard region={server} raidInfo={pinnedTotalAssault} locale={locale} />
              }
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">


          {server === 'jp' && LiveRaidInfos && LiveRaidInfos.length > 0 && (
            <LiveShortcutCard raidInfos={LiveRaidInfos as RaidInfo[]} locale={locale} />
          )}


          {sortedRaids.map((raidGroup) => {
            if (Array.isArray(raidGroup)) {
              return <GrandAssaultCard key={raidGroup[0].Id} region={server} raidInfos={raidGroup} locale={locale} />
            } else {
              return <TotalAssaultCard key={raidGroup.Id} region={server} raidInfo={raidGroup} locale={locale} />
            }
          })}
        </div>
      </div>
    </div>
  );
}