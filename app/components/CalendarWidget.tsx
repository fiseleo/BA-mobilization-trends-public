import { type LoaderFunctionArgs } from "react-router";
import { useTranslation } from "react-i18next";
import { getInstance } from "~/middleware/i18next";
import { getLocaleShortName, type Locale } from "~/utils/i18n/config";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";

// Import UI components and data loader from the calendar page

import type { Student, StudentPortraitData } from "~/types/plannerData";
import { loadScheduleData, type ScheduleItem, type ScheduleTrack } from "~/utils/calender.data";
import { GanttChartDisplay } from "~/routes/calendar";
import type { GameServer } from "~/types/data";
import { cdn } from "~/utils/cdn";

// --- Constants (Keep consistent with calendar file) ---
const PIXELS_PER_HOUR = 1.5;
const MS_PER_HOUR = 1000 * 60 * 60;

/**
 * Loader for the widget.
 * This loader must be called from the loader of the *parent route* (e.g., dashboard) that includes the widget.
 * * @example
 * // app/routes/dashboard.tsx
 * import { loadCalendarWidgetData } from '~/components/widgets/CalendarWidget.tsx';
 * export async function loader(args: LoaderFunctionArgs) {
 * const calendarData = await loadCalendarWidgetData(args);
 * return json({ calendarData });
 * }
 */
export async function loadCalendarWidgetData(
  context: LoaderFunctionArgs["context"],
  server: GameServer
) {
  if (server !== 'jp' && server !== 'kr') {
    throw new Response("Not Found: Invalid server parameter.", { status: 404 });
  }

  let i18n = getInstance(context);
  const locale = i18n.language as Locale;

  // Widget mode: Load only 4 tracks
  const widgetTracks: ScheduleTrack[] = ['raid', 'event', 'campaign', 'pickup'];

  const data = await loadScheduleData({
    server: server as 'jp' | 'kr',
    locale,
    i18n,
    tracksToLoad: widgetTracks
  });

  return data; // { tracks, timeRange }
}

// --- Widget Component ---
interface CalendarWidgetProps {
  loaderData: Awaited<ReturnType<typeof loadCalendarWidgetData>>;
  server: GameServer; // Receive server info from parent
}

export function CalendarWidget({ loaderData, server }: CalendarWidgetProps) { // Receive server prop
  const { tracks, timeRange } = loaderData;
  const locale = useTranslation().i18n.language as Locale;

  // (Same hooks as calendar page)
  const [studentData, setStudentData] = useState<Record<number, Student> | null>(null);
  const [studentPortraits, setStudentPortraits] = useState<StudentPortraitData | null>(null);
  const [nowMarkerLeft, setNowMarkerLeft] = useState<number | null>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const isScrolling = useRef<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null); // ref specific to the widget

  useEffect(() => {
    fetch(cdn(`/schaledb.com/${getLocaleShortName(locale)}.students.min.json`)).then(res => res.json()).then(setStudentData).catch(e => console.error(e));
    fetch(cdn(`/w/students_portrait.json`)).then(res => res.json()).then(setStudentPortraits).catch(e => console.error(e));
  }, [locale]);

  const calculateLeftPx = useCallback((startTime: string) => {
    if (!timeRange.min) return 0;
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

  // (Same useEffect, useMemo hooks as calendar page)
  useEffect(() => {
    const scrollEl = scrollContainerRef.current; // Use widget ref
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
    } catch (e) { }

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
  }, [calculateLeftPx]);

  const monthlyMarkers = useMemo(() => {
    if (!timeRange.min) return [];
    // ... (Monthly marker calculation is the same)
    const markers = [];
    const startDate = new Date(timeRange.min);
    const endDate = new Date(timeRange.max);
    let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    while (currentDate <= endDate) {
      const left = calculateLeftPx(currentDate.toISOString());
      const month = currentDate.getMonth() + 1;
      // const year = currentDate.getFullYear();
      markers.push({ date: currentDate.toISOString(), label: currentDate.toLocaleDateString(locale, { year: 'numeric', month: '2-digit' }), isYearMarker: month === 1, left });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return markers;
  }, [calculateLeftPx, timeRange.min, timeRange.max, server]); // Depends on server prop

  const weeklyMarkers = useMemo(() => {
    if (!timeRange.min) return [];
    // ... (Weekly marker calculation is the same)
    const markers = [];
    // const startDate = new Date(timeRange.min);
    const endDate = new Date(timeRange.max);
    const targetDay = server === 'kr' ? 2 : 3;
    let currentDate = new Date(timeRange.min);
    currentDate.setHours(4, 0, 0, 0);
    const dayOfWeek = currentDate.getDay();
    const daysToSubtract = (dayOfWeek - targetDay + 7) % 7;
    currentDate.setDate(currentDate.getDate() - daysToSubtract);
    if (currentDate.getTime() > timeRange.min) {
      currentDate.setDate(currentDate.getDate() - 7);
    }
    while (currentDate <= endDate) {
      if (currentDate.getTime() >= timeRange.min) {
        const left = calculateLeftPx(currentDate.toISOString());
        const label = currentDate.toLocaleDateString(locale, { month: '2-digit', day: '2-digit' });
        markers.push({ date: currentDate.toISOString(), label: label, left, });
      }
      currentDate.setDate(currentDate.getDate() + 7);
    }
    return markers;
  }, [calculateLeftPx, timeRange.min, timeRange.max, server]);

  // (Birthday track is not needed in the widget)
  const birthdayTrackItems: ScheduleItem[] = [];

  return (
    <div className="w-full">
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
        monthlyMarkers={monthlyMarkers}
        weeklyMarkers={weeklyMarkers}
        birthdayTrackItems={birthdayTrackItems}
        mode="widget"
        scrollContainerRef={scrollContainerRef}
        server={server} // Pass server prop
      />
    </div>
  );
}