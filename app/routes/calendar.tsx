import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import Papa from "papaparse";
import { type_translation, typecolor } from "~/components/raidToString";
// Add useParams import
import { Link, useLoaderData, type LoaderFunctionArgs, useParams } from "react-router";
// Add kr EventList import
import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap.css';
import { FaShield } from 'react-icons/fa6';
import { TerrainIconGameStyle, type Terrain } from "~/components/teran";

import type { Student, StudentPortraitData } from "~/types/plannerData";
import { useTranslation } from "react-i18next";
import { getInstance } from "~/middleware/i18next";
import type { Locale } from "~/utils/i18n/config";

import { localeLink } from "~/utils/localeLink";
import { FiArrowRight, FiClock, FiSearch } from "react-icons/fi";
import { loadScheduleData } from "~/utils/calender.data";
import type { GameServer } from "~/types/data";
import { createLinkHreflang, createMetaDescriptor } from "~/components/head";
import type { Route } from "./+types/calendar";
import type { AppHandle } from "~/types/link";
import type { loader as rootLorder } from "~/root";

const PIXELS_PER_HOUR = 1.5
const PREDICTION_STRIPE_CLASS = "bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.1),rgba(255,255,255,0.1)_10px,transparent_10px,transparent_20px)]";


// (Interface and color definitions are the same)
interface PickupStudentInfo { id: number; limited: boolean; rerun: boolean; fast: boolean; }
export interface ScheduleItem {
  id: string; type: string; startTime: string; endTime: string; title: string; link?: string;
  details?: Record<string, any> & { students?: PickupStudentInfo[]; isPointEvent?: boolean; };
}
export const trackColorClass: Record<string, string> = {
  event: "bg-blue-600", raid: "bg-red-700", eraid: "bg-purple-600",
  jointFiringDrill: "bg-cyan-700", multifloor: "bg-yellow-700",
  pickup: "bg-pink-400",
  maintenance: "bg-neutral-500", mainstory: "bg-sky-600", ministory: "bg-teal-600",
  patch: "bg-indigo-500",
  birthday: "bg-yellow-400",
  "shop-reset": "bg-lime-600", // Shop Reset
};
export const campaignColorClass: Record<string, string> = {
  Commission: "bg-green-600", Schedule: "bg-blue-500", Scrimmage: "bg-yellow-600",
  Normal: "bg-red-500", Hard: "bg-purple-500", "default": "bg-neutral-400"
};

const armorTypeColor = typecolor
const armorTypeTranslation = type_translation

// (CSV parsing helper is the same)
function parseCsvString<T extends object>(csvString: string): T[] {
  try {
    const parsed = Papa.parse<T>(csvString, {
      header: true, skipEmptyLines: true, dynamicTyping: true,
    });
    return parsed.data.filter(row => Object.values(row).some(val => val !== null && val !== ''));
  } catch (error) {
    console.error(`[Schedule Loader] Failed to parse CSV string:`, error);
    return [];
  }
}

const MS_PER_HOUR = 1000 * 60 * 60;

export async function loader({ request, context, params }: LoaderFunctionArgs) {
  const server = params.server || 'jp';
  if (server !== 'jp' && server !== 'kr') {
    throw new Response("Not Found: Invalid server parameter.", { status: 404 });
  }

  let i18n = getInstance(context);
  const locale = i18n.language as Locale;

  // Load all tracks in 'all' mode
  const data = await loadScheduleData({
    server: server as GameServer,
    locale,
    i18n,
    tracksToLoad: 'all' // 'full' mode
  });

  return { ...data, server, locale, title: i18n.t("calendar:title"), description: i18n.t("calendar:description.main"), }; // { tracks, timeRange }
}

export function meta({ loaderData }: Route.MetaArgs) {
  return createMetaDescriptor(
    loaderData.title,
    loaderData.description,
  )
}


export const handle: AppHandle = {
  preload: (data) => {
    const { server } = useLoaderData<typeof rootLorder>().params
    return [

      {
        rel: 'preload',
        href: `/schaledb.com/${data?.locale}.students.min.json`,
        as: 'fetch',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'preload',
        href: `/w/students_portrait.json`,
        as: 'fetch',
        crossOrigin: 'anonymous',
      },
      ...createLinkHreflang(`/calendar/${server}`)
    ];
  },
};

// --- Req 4: ArmorIcon component ---
function ArmorIcon({ armorType, difficulty }: { armorType: string, difficulty?: string | null }) {
  const color = (armorTypeColor as any)[armorType] || '#888';

  // R1: Difficulty abbreviation (Torment -> T, Insane -> I, Lunatic -> L)
  const difficultyInitial = difficulty ? difficulty.substring(0, 1).toUpperCase() : null;

  return (
    <span
      className="relative inline-flex items-center justify-center w-5 h-5 bg-white dark:bg-neutral-200 rounded-full align-middle shadow-sm"
      title={(armorTypeTranslation as any)[armorType]?.ko || armorType}
    >
      <FaShield
        style={{ color: color }}
        size={'1.1em'} // Fill shield size
      />
      {/* R1: Difficulty text overlay */}
      {difficultyInitial && (
        <span className="absolute text-[9px] font-bold text-white" style={{ textShadow: '0 0 2px #000, 0 0 2px #000' }}>
          {difficultyInitial}
        </span>
      )}
    </span>
  );
}

// --- Req 2: GanttChartDisplayProps interface ---
export interface GanttChartDisplayProps {
  tracks: Record<string, ScheduleItem[]>;
  timeRange: { min: number; max: number };
  studentData: Record<number, Student> | null;
  studentPortraits: StudentPortraitData | null;
  calculateLeftPx: (startTime: string) => number;
  calculateWidthPx: (startTime: string, endTime: string) => number;
  scrollLeft: number;
  viewportWidth: number;
  nowMarkerLeft: number | null;
  monthlyMarkers: any[];
  weeklyMarkers: any[];
  birthdayTrackItems: ScheduleItem[];
  mode: 'full' | 'widget';
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  server?: GameServer; // To receive as prop from widget
}

export function GanttChartDisplay({
  tracks, timeRange, studentData, studentPortraits,
  calculateLeftPx, calculateWidthPx, scrollLeft, viewportWidth,
  nowMarkerLeft, monthlyMarkers, weeklyMarkers, birthdayTrackItems,
  mode, scrollContainerRef,
  server: serverProp // Receive server as prop
}: GanttChartDisplayProps) {

  const { t: t_cal } = useTranslation("calendar");
  const locale = useTranslation().i18n.language as Locale

  // If prop is absent, fallback to URL parameter
  const params = useParams();
  const server = serverProp || params.server;


  const [hoverTime, setHoverTime] = useState<string | null>(null);
  const [hoverMousePos, setHoverMousePos] = useState<{ x: number, y: number } | null>(null);

  const totalDurationMs = timeRange.max - timeRange.min;
  const totalDurationHours = totalDurationMs / MS_PER_HOUR;
  const totalChartWidth = totalDurationHours * PIXELS_PER_HOUR;

  const formatHoverDate = (locale: Locale, date: Date) => {
    return date.toLocaleString(locale, {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const scrollEl = scrollContainerRef.current;
    if (!scrollEl) return;
    const rect = scrollEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const mousePx = scrollLeft + x;
    const msFromStart = (mousePx / PIXELS_PER_HOUR) * MS_PER_HOUR;
    const hoverTimestamp = timeRange.min + msFromStart;

    setHoverTime(formatHoverDate(locale, new Date(hoverTimestamp)));

    // console.log(e.clientX, e.clientY, e.pageX, e.pageY)
    setHoverMousePos({ x: e.pageX, y: e.pageY });
  };

  const handleMouseLeave = () => {
    setHoverTime(null);
    setHoverMousePos(null);
  };

  const commonTrackProps = {
    calculateLeftPx,
    calculateWidthPx,
    studentData,
    studentPortraits,
    scrollLeft,
    viewportWidth,
  };

  return (
    <>
      {hoverTime && hoverMousePos && (
        <div
          className="absolute z-50 p-2 bg-black/70 dark:bg-black/90 text-white rounded-md text-sm pointer-events-none top-0 left-0"
          style={{ transform: `translate(${hoverMousePos.x + 0}px, ${hoverMousePos.y + 0}px)` }}
        >
          {hoverTime}
        </div>
      )}

      <div
        ref={scrollContainerRef} // Use ref received from props
        className={`gantt-scroll-container w-full overflow-x-auto border border-gray-300 dark:border-gray-700 rounded-lg bg-neutral-50/50 dark:bg-neutral-800/50`}
      >
        <div
          className="relative"
          style={{ width: `${totalChartWidth}px` }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Time markers (Main axis / Sub axis separated) */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {weeklyMarkers.map(marker => (
              <div
                key={marker.date}
                className={`absolute top-0 h-full border-l border-dashed border-gray-200 dark:border-gray-700`}
                style={{ left: `${marker.left}px` }}
              >
                <span className="sticky top-6 -ml-2 text-[10px] p-0.5 bg-white/50 dark:bg-neutral-900/50 text-gray-400 dark:text-gray-500">
                  {marker.label}
                </span>
              </div>
            ))}
            {monthlyMarkers.map(marker => (
              <div
                key={marker.date}
                className={`absolute top-0 h-full border-l-2 ${marker.isYearMarker ? 'border-gray-400 dark:border-gray-500' : 'border-gray-300 dark:border-gray-600'}`}
                style={{ left: `${marker.left}px` }}
              >
                <span className={`sticky top-0 -ml-2 text-xs p-1 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm ${marker.isYearMarker ? 'font-bold text-gray-700 dark:text-gray-300' : 'font-semibold text-gray-500 dark:text-gray-400'}`}>
                  {marker.label}
                </span>
              </div>
            ))}
          </div>

          {/* Current time marker (NOW) */}
          {nowMarkerLeft !== null && (
            <div className="absolute top-0 h-full w-0.5 bg-red-500 z-50" style={{ left: `${nowMarkerLeft}px` }} >
              <div className="sticky top-0 -ml-5 text-xs font-bold text-red-500  p-1 rounded">
                NOW
              </div>
            </div>
          )}

          {/* Track rendering (add || [] as tracks can be undefined) */}
          <div className="my-5"></div>
          <GanttTrack title={t_cal("track.raid", "Raid/GA/JFD")} items={tracks.raid || []} {...commonTrackProps} />
          <GanttTrack title={t_cal("track.event", "Event")} items={tracks.event || []} {...commonTrackProps} />
          <GanttTrack title={t_cal("track.campaign", "Campaign")} items={tracks.campaign || []} colorMap={campaignColorClass} colorKey="campaignType" laneHeight={32} {...commonTrackProps} />
          <GanttTrack title={t_cal("track.pickup", "Pickup")} items={tracks.pickup || []} {...commonTrackProps} />

          {mode === 'full' && (
            <>
              <GanttTrack title={t_cal("track.multifloor", "Goz")} items={tracks.multifloor || []} {...commonTrackProps} />
              <GanttTrack title={t_cal("track.birthday", "Birthday")} items={birthdayTrackItems} laneHeight={32} {...commonTrackProps} />
              <GanttTrack title={t_cal("track.story", "Story")} items={[...(tracks.mainstory || []), ...(tracks.ministory || [])]} {...commonTrackProps} />
              <GanttTrack title={t_cal("track.misc", "Misc")} items={tracks.misc || []} laneHeight={32} {...commonTrackProps} />
              <GanttTrack title={t_cal("track.maintenance", "Maint.")} items={tracks.maintenance || []} {...commonTrackProps} />
              <GanttTrack title={t_cal("track.patch", "Patch")} items={tracks.patch || []} {...commonTrackProps} />
            </>
          )}
        </div>
      </div>

      {mode === 'widget' && (
        <div className="mt-4 flex justify-end">
          <Link
            to={`/${locale}/calendar/${server}`}
            className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {t_cal("widget.view-more", "View Full Schedule")}
            <FiArrowRight />
          </Link>
        </div>
      )}
    </>
  );
}

// --- ( 3. Main Component ) ---
export default function SchedulePageGantt() {
  // Explicitly type useLoaderData
  const { tracks, timeRange } = useLoaderData<typeof loadScheduleData>();
  const { t: t_cal } = useTranslation("calendar");
  const locale = useTranslation().i18n.language as Locale
  const { server } = useParams();

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [studentData, setStudentData] = useState<Record<number, Student> | null>(null);
  const [studentPortraits, setStudentPortraits] = useState<StudentPortraitData | null>(null);
  const [nowMarkerLeft, setNowMarkerLeft] = useState<number | null>(null);

  const [monthlyMarkers, setMonthlyMarkers] = useState<any[]>([]);
  const [weeklyMarkers, setWeeklyMarkers] = useState<any[]>([]);
  const [birthdayTrackItems, setBirthdayTrackItems] = useState<ScheduleItem[]>([]);

  const [scrollLeft, setScrollLeft] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const isScrolling = useRef<boolean>(false);

  useEffect(() => {
    fetch(`/schaledb.com/${locale}.students.min.json`).then(res => res.json()).then(setStudentData).catch(e => console.error(e));
    fetch(`/w/students_portrait.json`).then(res => res.json()).then(setStudentPortraits).catch(e => console.error(e));
  }, [locale]);

  const calculateLeftPx = useCallback((startTime: string) => {
    const startMs = new Date(startTime).getTime();
    const startOffsetMs = startMs - timeRange.min;
    return (startOffsetMs / MS_PER_HOUR) * PIXELS_PER_HOUR;
  }, [timeRange.min]);

  const calculateWidthPx = useCallback((startTime: string, endTime: string) => {
    const startMs = new Date(startTime).getTime();
    const endMs = new Date(endTime).getTime();
    const durationMs = endMs - startMs;
    return Math.max((durationMs / MS_PER_HOUR) * PIXELS_PER_HOUR, 1);
  }, []);

  useEffect(() => {
    const scrollEl = scrollContainerRef.current;
    if (!scrollEl || !timeRange.min) return; // Wait until timeRange.min is loaded

    // --- 1. Scroll and NOW marker setup ---
    setViewportWidth(scrollEl.clientWidth);
    try {
      const now = new Date(); // Client&#39;s current time
      const nowPx = calculateLeftPx(now.toISOString());
      setNowMarkerLeft(nowPx);
      const containerWidth = scrollEl.clientWidth;
      const targetScrollLeft = nowPx - (containerWidth / 3);
      scrollEl.scrollLeft = Math.max(0, targetScrollLeft);
      setScrollLeft(scrollEl.scrollLeft);
    } catch (e) {
      console.error("Failed to scroll or set 'now' marker:", e);
    }

    // --- 2. Main axis (Monthly) calculation ---
    const newMonthlyMarkers = [];
    const startDate = new Date(timeRange.min);
    const endDate = new Date(timeRange.max);
    let currentMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    while (currentMonth <= endDate) {
      const left = calculateLeftPx(currentMonth.toISOString());
      const month = currentMonth.getMonth() + 1;
      const year = currentMonth.getFullYear();
      newMonthlyMarkers.push({ date: currentMonth.toISOString(), label: currentMonth.toLocaleDateString(locale, { year: 'numeric', month: '2-digit' }), isYearMarker: month === 1, left });
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }
    setMonthlyMarkers(newMonthlyMarkers);

    // --- 3. Sub axis (Weekly KST) calculation ---
    const newWeeklyMarkers = [];
    const targetDay = server === 'kr' ? 2 : 3; // KST basis (Tue=2, Wed=3)
    let currentWeek = new Date(timeRange.min);
    currentWeek.setHours(4, 0, 0, 0); // 4:00 KST
    const dayOfWeek = currentWeek.getDay();
    const daysToSubtract = (dayOfWeek - targetDay + 7) % 7;
    currentWeek.setDate(currentWeek.getDate() - daysToSubtract);
    if (currentWeek.getTime() > timeRange.min) {
      currentWeek.setDate(currentWeek.getDate() - 7);
    }
    while (currentWeek <= endDate) {
      if (currentWeek.getTime() >= timeRange.min) {
        const left = calculateLeftPx(currentWeek.toISOString());
        const label = currentWeek.toLocaleDateString(locale, { month: '2-digit', day: '2-digit' });
        newWeeklyMarkers.push({ date: currentWeek.toISOString(), label: label, left, });
      }
      currentWeek.setDate(currentWeek.getDate() + 7);
    }
    setWeeklyMarkers(newWeeklyMarkers);

    // --- Scroll/Resize handler (same as before) ---
    const handleScroll = () => {
      if (!isScrolling.current) {
        isScrolling.current = true;
        requestAnimationFrame(() => {
          if (scrollEl) {
            setScrollLeft(scrollEl.scrollLeft);
          }
          isScrolling.current = false;
        });
      }
    };
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setViewportWidth(entry.contentRect.width);
      }
    });
    scrollEl.addEventListener('scroll', handleScroll);
    resizeObserver.observe(scrollEl);
    return () => {
      scrollEl.removeEventListener('scroll', handleScroll);
      resizeObserver.unobserve(scrollEl);
    };
  }, [calculateLeftPx, timeRange.min, timeRange.max, server]); // dependency


  useEffect(() => {
    if (!studentData || !timeRange.min) return; // Don&#39;t run if student data or time range is missing

    const items: ScheduleItem[] = [];
    const startYear = new Date(timeRange.min).getFullYear();
    const endYear = new Date(timeRange.max).getFullYear();
    Object.values(studentData).forEach(student => {
      if (!student.Name.includes('(') && !student.Name.includes('（') && student.BirthDay) { // "9/13"
        const [month, day] = student.BirthDay.split('/').map(Number);
        for (let year = startYear; year <= endYear; year++) {
          const birthdayDate = new Date(year, month - 1, day);
          const startTimeMs = birthdayDate.getTime();
          if (startTimeMs >= timeRange.min && startTimeMs <= timeRange.max) {
            const startTime = birthdayDate.toISOString();
            const endTime = new Date(startTimeMs + MS_PER_HOUR).toISOString();
            items.push({
              id: `bday-${student.Id}-${year}`,
              type: 'birthday',
              startTime: startTime,
              endTime: endTime,
              title: `${student.Name}`,
              details: { isPointEvent: true }
            });
          }
        }
      }
    });
    setBirthdayTrackItems(items);
  }, [studentData, timeRange.min, timeRange.max]);


  // Scroll and viewport size detection (same)
  useEffect(() => {
    const scrollEl = scrollContainerRef.current; // Use ref
    if (!scrollEl) return;

    setViewportWidth(scrollEl.clientWidth);
    try {
      const now = new Date();
      const nowPx = calculateLeftPx(now.toISOString());
      setNowMarkerLeft(nowPx);
      const containerWidth = scrollEl.clientWidth;
      const targetScrollLeft = nowPx - (containerWidth / 3);
      scrollEl.scrollLeft = Math.max(0, targetScrollLeft);
      setScrollLeft(scrollEl.scrollLeft);
    } catch (e) {
      console.error("Failed to scroll or set 'now' marker:", e);
    }
    const handleScroll = () => {
      if (!isScrolling.current) {
        isScrolling.current = true;
        requestAnimationFrame(() => {
          if (scrollEl) {
            setScrollLeft(scrollEl.scrollLeft);
          }
          isScrolling.current = false;
        });
      }
    };
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setViewportWidth(entry.contentRect.width);
      }
    });
    scrollEl.addEventListener('scroll', handleScroll);
    resizeObserver.observe(scrollEl);
    return () => {
      scrollEl.removeEventListener('scroll', handleScroll);
      resizeObserver.unobserve(scrollEl);
    };
  }, [calculateLeftPx]); // Remove ref dependency

  const scrollToNow = useCallback(() => {
    const scrollEl = scrollContainerRef.current;
    // Get nowMarkerLeft, viewportWidth from state
    if (!scrollEl || nowMarkerLeft === null) return;

    const containerWidth = viewportWidth; // Use state
    const targetScrollLeft = nowMarkerLeft - (containerWidth / 3);

    scrollEl.scrollTo({
      left: Math.max(0, targetScrollLeft),
      behavior: 'smooth' // Smooth scroll
    });
  }, [nowMarkerLeft, viewportWidth]);

  return (
    <div className="w-full max-w-[100vw] bg-white dark:bg-neutral-900 text-gray-900 dark:text-white p-4 sm:p-6 lg:p-8">

      {/* Req 3/4: Header area (Title + Description + Server button) */}
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold">{t_cal("title", "Event Calendar")}</h1>
        <div className="flex gap-2">

          <button
            onClick={scrollToNow}
            title={t_cal("scrollToNow", "Scroll to current time")}
            className="p-2.5 rounded-md font-semibold bg-neutral-200 dark:bg-neutral-700 text-black dark:text-white hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
          >
            <FiClock className="w-5 h-5" />
          </button>

          <Link
            to={`/${locale}/calendar/jp`}
            prefetch="intent"
            className={`px-4 py-2 rounded-md font-semibold ${server === 'jp'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-neutral-200 dark:bg-neutral-700 text-black dark:text-white hover:bg-neutral-300 dark:hover:bg-neutral-600'}`}
          >
            JP
          </Link>
          <Link
            to={`/${locale}/calendar/kr`}
            prefetch="intent"
            className={`px-4 py-2 rounded-md font-semibold ${server === 'kr'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-neutral-200 dark:bg-neutral-700 text-black dark:text-white hover:bg-neutral-300 dark:hover:bg-neutral-600'}`}
          >
            KR
          </Link>
        </div>
      </div>

      {/* Req 4: Add description */}
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
        {t_cal("description.main", "Blue Archive major event schedules displayed in a Gantt chart.")}
      </p>
      <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-8">
        {t_cal("description.prediction", "Striped items are predictions based on precedent.")}
      </p>

      {/* Req 2: Render GanttChartDisplay */}
      <GanttChartDisplay
        tracks={tracks}
        timeRange={timeRange}
        studentData={studentData}
        studentPortraits={studentPortraits}
        calculateLeftPx={calculateLeftPx}
        calculateWidthPx={calculateWidthPx}
        scrollLeft={scrollLeft}
        viewportWidth={viewportWidth}
        nowMarkerLeft={nowMarkerLeft}
        monthlyMarkers={monthlyMarkers} // Pass State
        weeklyMarkers={weeklyMarkers}   // Pass State
        birthdayTrackItems={birthdayTrackItems} // Pass State
        mode="full"
        scrollContainerRef={scrollContainerRef}
        server={server as 'jp' | 'kr'}
      />
    </div>
  );
}

// --- ( 4. Sub-component Props Definition ) ---
type CalcLeftFunc = (start: string) => number;
type CalcWidthFunc = (start: string, end: string) => number;
export interface GanttBaseBarProps {
  item: ScheduleItem;
  calculateLeftPx: CalcLeftFunc;
  calculateWidthPx: CalcWidthFunc;
  studentData: Record<number, Student> | null;
  studentPortraits: StudentPortraitData | null;
  lane: number;
  laneHeight: number;
}
// Add export (for widget import)
export interface GanttBarProps extends GanttBaseBarProps {
  colorMap?: Record<string, string>;
  colorKey?: string;
}
// Add export (for widget import)
export interface GanttTrackProps {
  title: string;
  items: ScheduleItem[];
  calculateLeftPx: CalcLeftFunc;
  calculateWidthPx: CalcWidthFunc;
  studentData: Record<number, Student> | null;
  studentPortraits: StudentPortraitData | null;
  colorMap?: Record<string, string>;
  colorKey?: string;
  scrollLeft: number;
  viewportWidth: number;
  laneHeight?: number;
}

// --- ( 5. GanttTrack  ) ---
export function GanttTrack({ title, items, scrollLeft, viewportWidth, laneHeight, ...rest }: GanttTrackProps) {
  const effectiveLaneHeight = laneHeight || 44;

  const itemsWithLanes = useMemo(() => {
    const MARKER_COLLISION_WIDTH_MS = (50 / PIXELS_PER_HOUR) * MS_PER_HOUR;
    const sortedItems = [...items].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    const lanes: number[] = [];
    const scheduledItems = sortedItems.map(item => {
      const startTime = new Date(item.startTime).getTime();
      const endTime = item.details?.isPointEvent
        ? startTime + MARKER_COLLISION_WIDTH_MS
        : new Date(item.endTime).getTime();
      let assignedLane = -1;
      for (let i = 0; i < lanes.length; i++) {
        if (startTime >= lanes[i]) { lanes[i] = endTime; assignedLane = i; break; }
      }
      if (assignedLane === -1) { assignedLane = lanes.length; lanes.push(endTime); }
      return { ...item, lane: assignedLane };
    });
    return { scheduledItems, maxLanes: lanes.length };
  }, [items]);

  const { scheduledItems, maxLanes } = itemsWithLanes;
  const trackMinHeight = maxLanes === 0 ? 44 : maxLanes * effectiveLaneHeight;

  const buffer = viewportWidth * 1.5;
  const viewportStartPx = scrollLeft;
  const viewportEndPx = scrollLeft + viewportWidth;
  const visibleStart = viewportStartPx - buffer;
  const visibleEnd = viewportEndPx + buffer;

  const visibleItems = scheduledItems.filter(item => {
    const itemLeft = rest.calculateLeftPx(item.startTime);
    let itemWidth;
    if (item.details?.isPointEvent) {
      itemWidth = 200;
    } else {
      const calculatedWidth = rest.calculateWidthPx(item.startTime, item.endTime);
      itemWidth = Math.max(calculatedWidth, 50);
    }
    const itemRight = itemLeft + itemWidth;
    return itemRight > visibleStart && itemLeft < visibleEnd;
  });

  return (
    <div className="relative mb-2">
      <h3
        className="text-sm font-semibold sticky left-0 z-20 w-max bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-2 py-1 rounded-r-md text-gray-800 dark:text-gray-200 mb-1"
      >
        {title}
      </h3>
      <div className="relative w-full py-1" style={{ minHeight: `${trackMinHeight}px` }}>
        {visibleItems.map(item => (
          item.details?.isPointEvent ? (
            <GanttMarker key={item.id} item={item} lane={item.lane} laneHeight={effectiveLaneHeight} {...rest} />
          ) : item.type === 'pickup' ? (
            <GanttPickupBar key={item.id} item={item} lane={item.lane} laneHeight={effectiveLaneHeight} {...rest} />
          ) : (
            <GanttBar key={item.id} item={item} lane={item.lane} laneHeight={effectiveLaneHeight} {...rest} />
          )
        ))}
      </div>
    </div>
  );
}


// --- ( 6. GanttBar  ) ---
export function GanttBar({
  item,
  calculateLeftPx,
  calculateWidthPx,
  studentData,
  studentPortraits,
  lane,
  laneHeight,
  colorMap,
  colorKey,
}: GanttBarProps) {
  const { t: t_c } = useTranslation("common");
  const { t: t_cal } = useTranslation("calendar");
  const locale = useTranslation().i18n.language as Locale
  const left = calculateLeftPx(item.startTime);
  const width = calculateWidthPx(item.startTime, item.endTime);
  const top = lane * laneHeight;
  const barHeight = laneHeight - 4;

  const barStyle: React.CSSProperties = {};

  const isPrediction = item.details?.prediction === true;

  let barClass = `relative z-10 rounded-md border border-black/20 text-white text-xs font-medium
                  ${isPrediction ? `opacity-70 ${PREDICTION_STRIPE_CLASS}` : ''}`;

  if (colorMap && colorKey && item.details?.[colorKey]) {
    const key = item.details[colorKey];
    barClass += ` ${colorMap[key] || colorMap['default'] || 'bg-neutral-400'}`;
  } else if (item.type === 'multifloor' && item.details?.armorType) {
    barStyle.backgroundColor = (armorTypeColor as any)[item.details.armorType] || '#888';
  } else {
    barClass += ` ${trackColorClass[item.type] || 'bg-neutral-400'}`;
  }

  const formatShort = (dateStr: string) => new Date(dateStr).toLocaleString(locale, { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
  const studentId = item.details?.studentId;
  let studentName: string | null = null;
  let studentImageSrc: string | null = null;

  let title = item.title;
  if (item.type === 'campaign' && item.details?.campaignType) {
    const campaignType = item.details.campaignType;
    const multiplier = item.title.split(' x')[1] ? ` x${item.title.split(' x')[1]}` : '';
    const translatedType = t_cal(`campaign.${campaignType.toLowerCase()}`, campaignType);
    title = `${translatedType}${multiplier}`;
  } else if (item.type === 'jointFiringDrill' && item.details?.jfdType) {
    const season = item.title;
    const jfdType = item.details.jfdType;
    const translatedType = t_cal(`jfd.${jfdType}`, jfdType);
    title = `${season} ${translatedType}`;
  }

  if (studentId && studentData && studentPortraits) {
    studentName = studentData[studentId]?.Name || null;
    const base64Image = studentPortraits[studentId];
    if (base64Image) studentImageSrc = `data:image/webp;base64,${base64Image}`;
  }

  const stickyLabelStyle = { ...barStyle };
  const stickyLabelClass = barClass
    .split(' ')
    .filter(c => c.startsWith('bg-') || c.startsWith('border-') || c.startsWith('shadow-') || c.startsWith('rounded-') || c.startsWith('bg-['))
    .join(' ');

  return (
    <div
      className="absolute"
      style={{ left: `${left}px`, width: `${width}px`, top: `${top}px`, height: `${barHeight}px` }}
    >
      <div
        style={barStyle}
        className={`${barClass} absolute top-0 left-0
                    flex items-center min-w-[50px] whitespace-nowrap h-full`}
      >
        <div
          className={`flex items-center gap-2 sticky left-0 z-10 p-2 h-full ${stickyLabelClass}`}
          style={{ ...stickyLabelStyle, maxWidth: `${width - 35}px` }}
        >
          {studentImageSrc && (
            <img src={studentImageSrc} alt={studentName || 'student'} className="w-15 h-15 rounded-full border-2 border-white/50 shrink-0" />
          )}
          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold truncate">{title}</h3>

              {(item.type === 'raid' || item.type === 'jointFiringDrill' || item.type === 'multifloor') && item.details?.terrain && (
                <TerrainIconGameStyle terrain={item.details.terrain as Terrain} size={'1.2em'} />
              )}
              {(item.type === 'raid') && item.details?.armorType && (
                <ArmorIcon armorType={item.details.armorType} difficulty={item.details.maxDifficulty} />
              )}
              {(item.type === 'jointFiringDrill' || item.type === 'multifloor') && item.details?.armorType && (
                <ArmorIcon armorType={item.details.armorType} />
              )}
              {item.type === 'eraid' && item.details?.terrain && (
                <TerrainIconGameStyle terrain={item.details.terrain as Terrain} size={'1.2em'} />
              )}
              {item.type === 'eraid' && item.details?.bosses && (
                <div className="flex gap-1.5 ml-1">
                  {item.details.bosses.map((boss: any, index: number) => (
                    <span
                      key={index}
                      className="flex items-center gap-1 text-xs"
                      title={`${boss.armorName} (${boss.difficulty})`}
                    >
                      <ArmorIcon armorType={boss.armorType} difficulty={boss.difficulty} />
                    </span>
                  ))}
                </div>
              )}
              {item.type === 'event' && item.details?.rerun === true && (
                <span className="ml-2 px-1.5 py-0.5 text-xs font-bold bg-white/30 text-white rounded-md shrink-0">
                  {t_c("rerun")}
                </span>
              )}
              {item.type === 'event' && studentName && width > 300 && (
                <span className="font-normal opacity-90 ml-2 truncate shrink-0">
                  {t_cal("distribute", { name: studentName })}
                </span>
              )}
            </div>
            {item.type !== 'campaign' && (
              <p className="text-white/80 text-[10px]">{formatShort(item.startTime)} ~ {formatShort(item.endTime)}</p>
            )}
          </div>
        </div>

        <div className="grow"></div>
        {item.link && (
          <Link to={localeLink(locale, item.link)} className=" p-1.5 rounded-md text-xs font-semibold bg-white/20 hover:bg-white/40 dark:bg-black/20 dark:hover:bg-black/40 shrink-0 z-0 sticky right-2 mr-2">
            <FiSearch className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  );
}

// --- ( 7. GanttPickupBar  ) ---
function GanttPickupBar({
  item,
  calculateLeftPx,
  calculateWidthPx,
  studentData,
  studentPortraits,
  lane,
  laneHeight,
}: GanttBaseBarProps) {
  // Add i18n hook
  const { t: t_cal } = useTranslation("calendar");
  const { t: t_c, i18n } = useTranslation("common");
  const locale = i18n.language as Locale

  const left = calculateLeftPx(item.startTime);
  const width = calculateWidthPx(item.startTime, item.endTime);
  const top = lane * laneHeight;
  const barHeight = laneHeight - 4; // 4px padding

  // R1: Fix missing barStyle variable definition
  const barStyle: React.CSSProperties = {};

  const TooltipComponent = (Tooltip as any).default || Tooltip;

  // Check Prediction flag
  const isPrediction = item.details?.prediction === true;

  // Changed prediction class: 'bg-prediction-stripe' -> PREDICTION_STRIPE_CLASS
  const barClass = `relative z-10 rounded-md border border-black/20 text-white text-xs font-medium ${trackColorClass.pickup}
                  ${isPrediction ? `opacity-70 ${PREDICTION_STRIPE_CLASS}` : ''}`;

  const formatShort = (locale: Locale, dateStr: string) => new Date(dateStr).toLocaleString(locale, { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });

  const students = item.details?.students || [];

  // Changed prediction class: 'bg-prediction-stripe' -> PREDICTION_STRIPE_CLASS
  const stickyLabelStyle: React.CSSProperties = {};
  const barBgColor = trackColorClass.pickup;
  const stickyLabelClass = barBgColor
    ? `${barBgColor} border-black/20 shadow-md rounded-md ${isPrediction ? PREDICTION_STRIPE_CLASS : ''}`
    : `bg-pink-400 border-black/20 shadow-md rounded-md ${isPrediction ? PREDICTION_STRIPE_CLASS : ''}`;

  // R1/R4: Max width of the scroll area, excluding the date area (approx. 75px)
  // Use the JS-calculated `width` prop (e.g., 150px)
  const scrollerMaxWidth = width > 300 ? width - 75 : width;

  return (
    <div
      className="absolute"
      style={{ left: `${left}px`, width: `${width}px`, top: `${top}px`, height: `${barHeight}px`, zIndex: 11 }}
    >
      <div
        style={barStyle}
        className={`${barClass} absolute top-0 left-0
                    flex items-center justify-between min-w-[50px] whitespace-nowrap h-full bg-[#0000]`}
      >
        {/* (Wrapper/Scroller/Content structure is same as before) */}
        <div
          className={`sticky left-0 z-20 h-full flex items-center`}
          style={{ maxWidth: `${Math.max(scrollerMaxWidth, 50)}px` }}
        >
          <div
            className={`overflow-x-auto overflow-y-visible h-16`}
            style={stickyLabelStyle}
          >
            <div className="flex items-center gap-2 p-2 h-full">
              {students.map(student => {
                // ... (studentId, studentName, studentImageSrc calculation ... no change)
                const studentId = student.id;
                let studentName: string | null = null;
                let studentImageSrc: string | null = null;
                if (studentId && studentData && studentPortraits) {
                  studentName = studentData[studentId]?.Name || null;
                  const base64Image = studentPortraits[studentId];
                  if (base64Image) studentImageSrc = `data:image/webp;base64,${base64Image}`;
                }
                return (
                  <TooltipComponent
                    key={studentId}
                    placement="top"
                    overlay={<span>{studentName || `ID: ${studentId}`}</span>}
                    mouseEnterDelay={0.1}
                  >
                    <div className="relative shrink-0 w-13 h-13">
                      {studentImageSrc && (
                        <img
                          src={studentImageSrc}
                          alt={studentName || 'student'}
                          className="w-13 h-13 rounded-full border-2 border-white/50"
                        />
                      )}
                      {/* Apply "Rerun" translation key */}
                      {student.rerun && (
                        <span className="absolute -top-1 -left-1 z-10 px-1 py-0.5 text-[9px] font-bold text-white bg-blue-500 rounded-md shadow-sm">
                          {t_c("rerun", "Rerun")}
                        </span>
                      )}
                      {/* Apply "Fast", "Limited" translation keys */}
                      {student.fast ? (
                        <span className="absolute -top-1 -right-1 z-10 px-1 py-0.5 text-[9px] font-bold text-black bg-yellow-400 rounded-md shadow-sm">
                          {t_c("fast", "Fast")}
                        </span>
                      ) : student.limited ? (
                        <span className="absolute -top-1 -right-1 z-10 px-1 py-0.5 text-[9px] font-bold text-white bg-pink-500 rounded-md shadow-sm">
                          {t_c("limited", "Limited")}
                        </span>
                      ) : null}
                    </div>
                  </TooltipComponent>
                );
              })}
            </div>
          </div>
        </div>

        {width > 300 && <div className="ml-4 shrink-0 text-right z-10 sticky right-2 mr-2 overflow-hidden">
          <p className="text-white/80 text-[8px]">
            {formatShort(locale, item.startTime)} ~
          </p>
          <p className="text-white/80 text-[8px]">
            {formatShort(locale, item.endTime)}
          </p>
        </div>}
      </div>
    </div>
  );
}

// --- ( 8. GanttMarker  ) ---
export function GanttMarker({
  item,
  calculateLeftPx,
  lane,
  laneHeight,
}: {
  item: ScheduleItem;
  calculateLeftPx: CalcLeftFunc;
  lane: number;
  laneHeight: number;
}) {
  const { t: t_p } = useTranslation("planner");
  const { t: t_cal } = useTranslation("calendar");

  const left = calculateLeftPx(item.startTime);
  const top = lane * laneHeight;
  const barHeight = laneHeight - 4;

  const isPrediction = item.details?.prediction === true;

  const colorClass = trackColorClass[item.type] || 'bg-neutral-400';
  const predictionClass = isPrediction ? `opacity-70 ${PREDICTION_STRIPE_CLASS}` : '';

  const textColor = item.type === 'birthday' ? 'text-black' : 'text-white';

  const formatShort = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ko-KR', {
      month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
    });
  };

  // Req 1: Translate i18n keys
  let title = item.title;
  if (item.type === 'ministory') {
    title = (t_cal as any)(item.title, { title: item.details?.title }); // 'calendar.story.mini'
  } else if (item.type === 'shop-reset') {
    title = t_cal(item.title, "Shop Reset");
  }

  return (
    <div
      className="absolute z-10 flex flex-col items-center"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        height: `${barHeight}px`,
        transform: 'translateX(-50%)'
      }}
      title={`${title}\n${formatShort(item.startTime)}`}
    >
      <div className={`px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap ${colorClass} ${textColor} ${predictionClass} shadow-sm`}>
        {title}
      </div>

      <div className={`grow w-0.5 ${colorClass} ${predictionClass} opacity-60`}></div>

      <div className={`w-1.5 h-1.5 rounded-full ${colorClass} ${predictionClass} border-white dark:border-neutral-900`}></div>
    </div>
  );
}
