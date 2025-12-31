// app/components/dashboard/compositionChart.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import type { Character, PortraitData, ReportEntry, ReportEntryRank, StudentData } from "../common";
import { StudentIcon } from "../studentIcon";
import { useTranslation } from "react-i18next";
import { useIsDarkState } from "~/store/isDarkState";
import { CompositionDetailView } from "./compositionDetailView";
import type { GameServer, RaidInfo } from "~/types/data";

const RankScatterPlot: React.FC<{ ranks: number[], start_rank: number, max_rank: number }> = ({ ranks, start_rank, max_rank }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const MAX_RANK = max_rank;
    const START_RANK = start_rank;
    const { isDark } = useIsDarkState();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#e5e7eb'; // neutral-200
        if (isDark == 'dark') {
            ctx.fillStyle = '#404040'; // neutral-700
        }
        const axisY = rect.height / 2;
        ctx.fillRect(0, axisY - 1.5, rect.width, 3);

        // const opty = 0.05
        const opty = 0.7 - Math.min(0.65, Math.max(0, Math.log(MAX_RANK / 500) / 5))
        ctx.fillStyle = `rgba(14, 165, 233, ${opty})`; // bg-sky-500/70
        if (document.documentElement.classList.contains('dark')) {
            // ctx.fillStyle = `rgba(56, 189, 248, ${`; // dark:bg-sky-400/70
            ctx.fillStyle = `rgba(56, 189, 248, ${opty})`; // dark:bg-sky-400/70
        }

        ranks.forEach(rank => {
            const x = ((rank - START_RANK) / MAX_RANK) * rect.width;
            ctx.beginPath();
            ctx.arc(x, axisY, 2, 0, 2 * Math.PI);
            ctx.fill();
        });

    }, [ranks, isDark]);

    const title = `${ranks.length.toLocaleString()} data points`;

    return (
        <div className="relative w-full h-4" title={title}>
            <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full"
            />
        </div>
    );
};


export const CompositionChart: React.FC<{
    data: ReportEntryRank[], studentData: StudentData, portraitData: PortraitData, raidInfo: RaidInfo
    server: GameServer
}> = ({ data, studentData, portraitData, raidInfo, server }) => {
    const [analysisUnit, setAnalysisUnit] = useState<'report' | 'team'>('team');
    const [selectedCompKey, setSelectedCompKey] = useState<string | null>(null);

    const ITEMS_PER_PAGE = 20;
    const ITEMS_INIT_PAGE = 5;

    const [visibleCount, setVisibleCount] = useState(ITEMS_INIT_PAGE);
    const { t: t_c } = useTranslation("common");

    const { t } = useTranslation("dashboard");

    const total_cnt = data.length;

    const compData = useMemo(() => {
        const comps = new Map<string, { ids: number[]; count: number; ranks: number[] }>();
        let totalEntries = 0;

        if (analysisUnit === 'report') {
            totalEntries = data.length;
            data.forEach(entry => {
                // const charSet = new Set<number>();
                // entry.t.forEach(team => [...team.m, ...team.s].filter(c => c).forEach(char => charSet.add(char.id)));

                // const sortedIds = Array.from(charSet).sort((a, b) => a - b);
                const sortedIds:number[] = []
                for (const team of entry.t){
                    const sortedPartyIds = Array.from([...team.m, ...team.s].filter(c => c).map(c=>c.id)).sort((a, b) => a - b);
                    for (const item of sortedPartyIds) sortedIds.push(item)
                }
                if (sortedIds.length === 0) return;

                const key = JSON.stringify(sortedIds);
                const current = comps.get(key) || { ids: sortedIds, count: 0, ranks: [] };
                current.count++;
                current.ranks.push(entry.typeRanking||entry.r);
                comps.set(key, current);
            });
        } else {
            data.forEach(entry => {
                entry.t.forEach(team => {
                    totalEntries++;
                    const charSet = new Set<number>();
                    [...team.m, ...team.s].filter(c => c).forEach(char => charSet.add(char.id));

                    const sortedIds = Array.from(charSet).sort((a, b) => a - b);
                    if (sortedIds.length === 0) return;

                    const key = JSON.stringify(sortedIds);
                    const current = comps.get(key) || { ids: sortedIds, count: 0, ranks: [] };
                    current.count++;
                    current.ranks.push(entry.typeRanking || entry.r);
                    comps.set(key, current);
                });
            });
        }

        // const validTotal = totalEntries > 0 ? totalEntries : 1;
        return Array.from(comps.entries())
            .sort((a, b) => b[1].count - a[1].count)
            // .filter(([, v]) => v.count > 10)
            .map(([key, c]) => ({ ...c, key, percentage: (c.count / total_cnt) * 100 }));
    }, [data, analysisUnit]);

    const entriesForDetail = useMemo(() => {

        if (!selectedCompKey) return [];

        return data.filter(entry => {
            // 1. If the analysis unit is 'report'
            if (analysisUnit === 'report') {
                //Get student IDs used by all teams in a report without duplication
                const charSet = new Set<number>();
                entry.t.forEach(team => {
                    [...team.m, ...team.s].filter(c => c).forEach(char => charSet.add(char.id));
                });

                // Sort IDs to generate unique keys
                const sortedIds = Array.from(charSet).sort((a, b) => a - b);
                if (sortedIds.length === 0) return false;
                const key = JSON.stringify(sortedIds);

                // cehck that the generated key matches the selected key
                return key === selectedCompKey;
            }

            // 2. If the analysis unit is "tam"
            else {
                // Check to see if any of the multiple teams in a report match the selected party
                return entry.t.some(team => {
                    const charSet = new Set<number>();
                    [...team.m, ...team.s].filter(c => c).forEach(char => charSet.add(char.id));

                    const sortedIds = Array.from(charSet).sort((a, b) => a - b);
                    if (sortedIds.length === 0) return false;
                    const key = JSON.stringify(sortedIds);

                    return key === selectedCompKey;
                });
            }
        });
    }, [data, selectedCompKey, analysisUnit]);

    useEffect(() => {
        setVisibleCount(ITEMS_INIT_PAGE);
    }, [analysisUnit]);


    const handleLoadMore = () => {
        setVisibleCount(prevCount => prevCount + ITEMS_PER_PAGE);
    };

    const handleCollapseAll = () => {
        setVisibleCount(ITEMS_INIT_PAGE);
    };


    return (
        <div className="w-full max-w-4xl mx-auto space-y-1.5 p-1">
            <div className="flex items-center justify-center p-2 mb-4 space-x-2">
                <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-300"></span>
                <button
                    onClick={() => setAnalysisUnit('report')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${analysisUnit === 'report' ? 'bg-teal-500 text-white font-bold' : 'bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600'}`}
                >
                    All
                </button>
                <button
                    onClick={() => setAnalysisUnit('team')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${analysisUnit === 'team' ? 'bg-teal-500 text-white font-bold' : 'bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600'}`}
                >
                    Team
                </button>
            </div>
            <p className="text-center text-xs text-gray-400 mt-1">{t('clickForDetails')}</p> {/* explain Text */}

            {compData.slice(0, visibleCount).map((comp, i) => (
                <div
                    onClick={() => {
                        if (selectedCompKey != comp.key) {
                            setSelectedCompKey(comp.key)
                        }
                    }}
                    key={i}
                    className={"flex flex-col items-center bg-white dark:bg-neutral-800 p-2 rounded-lg  border-neutral-200 border dark:border-neutral-700 hover:border-teal-500 transition-all shadow-md  " + (selectedCompKey === comp.key ? '' : 'hover:scale-101')}
                >
                    <div
                        className="flex flex-col sm:flex-row sm:w-full items-center gap-2 cursor-pointer"
                        onClick={() => setSelectedCompKey(prev => prev === comp.key ? null : comp.key)}
                        title={t('clickForDetails')}
                    >

                        <div className="grid grid-cols-6 gap-1">
                            {comp.ids.map((id, index) => (
                                <StudentIcon
                                    key={id*1e5 + index}
                                    character={{ id } as Character}
                                    student={studentData[id]}
                                    portraitData={portraitData}
                                />
                            ))}
                        </div>

                        <div className="w-full sm:w-60 shrink-0 sm:flex-1">
                            <div className="flex justify-between items-baseline mb-0">
                                <span className="font-bold text-neutral-700 dark:text-neutral-100 text-base">
                                    {comp.percentage.toFixed(1)}%
                                </span>
                                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                    {comp.count.toLocaleString()}
                                </span>
                            </div>
                            <RankScatterPlot ranks={comp.ranks} max_rank={total_cnt} start_rank={data ? data[0].r : 1} />
                        </div>

                    </div>

                    {selectedCompKey === comp.key && (
                        <div className="flex w-full">
                            <CompositionDetailView
                                comp={comp}
                                entries={entriesForDetail}
                                studentData={studentData}
                                boss={raidInfo.Boss} server={server} id={raidInfo.Id}
                                portraitData={portraitData}
                                onClose={() => setSelectedCompKey(null)}

                            />
                        </div>

                    )}

                </div>


            ))}

            <div className="flex justify-center mt-4">
                {visibleCount < compData.length ? (
                    <button
                        onClick={handleLoadMore}
                        className="w-full h-9 px-4 flex items-center justify-center gap-2 text-sm font-medium rounded-md bg-neutral-800 text-white hover:bg-neutral-900 dark:bg-neutral-200 dark:text-neutral-800 dark:hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 dark:focus:ring-offset-neutral-900 transition-all shadow-sm"
                    >
                        {t_c('load_more')}
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1z" />
                        </svg>
                    </button>
                ) : (
                    compData.length > ITEMS_PER_PAGE && (
                        <button
                            onClick={handleCollapseAll}
                            className="w-full h-9 px-4 flex items-center justify-center gap-2 text-sm font-medium rounded-md bg-neutral-800 text-white hover:bg-neutral-900 dark:bg-neutral-200 dark:text-neutral-800 dark:hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 dark:focus:ring-offset-neutral-900 transition-all shadow-sm"
                        >
                            Hide
                        </button>
                    )
                )}
            </div>
        </div>
    );
};
