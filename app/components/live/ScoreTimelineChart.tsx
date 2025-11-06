import { Scatter, XAxis, YAxis, Label, Tooltip, ResponsiveContainer, Legend, ComposedChart, Line } from 'recharts';
import { type FC, useMemo, useState } from 'react';
import type { ERaidTimelinePoint, RaidTimelinePoint, TimelineData } from '~/types/livetype';
import type { ReportEntry } from '../dashboard/common';
import type { RaidInfo } from '~/types/data';
import { type_translation } from '../raidToString';
import { useTranslation } from 'react-i18next';
import type { Locale } from '~/utils/i18n/config';
import { formatDateToDayString } from './formatDateToDayString';
import React from 'react';

interface ScoreTimelineChartProps {
    isRaid: boolean;
    timelineData: TimelineData;
    ranksToPlot: number[];
    raidInfos: RaidInfo[];
}

const CustomScoreTimelineTooltip = ({ active, payload, label, raidInfos, rankColorMap }: {
    active?: boolean;
    payload?: any[];
    label?: number; // Timestamp
    raidInfos: RaidInfo[];
    rankColorMap: Map<number, string>;
}) => {

    if (active && payload && payload.length && label) {

        const scoreMap = new Map<string, number>();
        payload.forEach(p => {
            if (p.dataKey && p.dataKey.startsWith('Rank ') && p.value !== null) {
                scoreMap.set(p.dataKey, p.value);
            }
        });

        const sortedEntries = Array.from(scoreMap.entries())
            .sort(([keyA], [keyB]) => {
                const rankA = parseInt(keyA.replace('Rank ', ''));
                const rankB = parseInt(keyB.replace('Rank ', ''));
                return rankA - rankB;
            });

        if (sortedEntries.length === 0) return null;

        return (
            <div className="p-2 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-md border border-gray-300 dark:border-neutral-600 shadow-lg text-xs">
                {/* Time label */}
                <p className="font-bold mb-1 text-neutral-800 dark:text-neutral-200">
                    {formatDateToDayString(new Date(label), raidInfos[0])}
                </p>
                {/* Score history by rank */}
                {sortedEntries.map(([key, value]) => {
                    const rankNum = parseInt(key.replace('Rank ', ''));
                    const color = rankColorMap.get(rankNum) || '#8884d8';
                    return (
                        <div key={key} className="flex justify-between items-center gap-2">
                            <span style={{ color: color }}>■ {key}</span>
                            <span className="font-medium text-neutral-700 dark:text-neutral-300">{value.toLocaleString()}</span>
                        </div>
                    );
                })}
            </div>
        );
    }
    return null;
};

const findScoreForRank = (rankEntries: ReportEntry[], targetRank: number): number | null => {
    if (!rankEntries) return null;

    const exactMatch = rankEntries.find(p => p.r === targetRank);

    return exactMatch ? exactMatch.s : null;
};

type GrandAssaultTab = 'total' | 'boss1' | 'boss2' | 'boss3';

const generateDistinctColors = (count: number): string[] => {
    const colors: string[] = [];
    const saturation = 75;
    const lightness = 55;
    for (let i = 0; i < count; i++) {
        const hue = (i * (360 / (count + 1))) % 360;
        colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }
    return colors;
};

export const ScoreTimelineChart: FC<ScoreTimelineChartProps> = ({ isRaid, timelineData, ranksToPlot, raidInfos }) => {
    const [activeTab, setActiveTab] = useState<GrandAssaultTab>('total');
    const { t, i18n } = useTranslation("liveDashboard");
    const locale = i18n.language as Locale

    const TABS: { id: GrandAssaultTab, name: string }[] = useMemo(() => isRaid ? [
        { id: 'total', name: t('total_score') },
    ] : [
        { id: 'total', name: t('total_score') },
        { id: 'boss1', name: type_translation[raidInfos?.[0]?.Type as keyof typeof type_translation][locale] || 'Boss 1' },
        { id: 'boss2', name: type_translation[raidInfos?.[1]?.Type as keyof typeof type_translation][locale] || 'Boss 2' },
        { id: 'boss3', name: type_translation[raidInfos?.[2]?.Type as keyof typeof type_translation][locale] || 'Boss 3' },
    ], [raidInfos]);

    const [selectedRanks, setSelectedRanks] = useState<Set<number>>(new Set([1, 5000, 10000, 20000]));
    const rankColorMap = useMemo(() => {
        const colors = generateDistinctColors(ranksToPlot.length);
        const map = new Map<number, string>();
        ranksToPlot.forEach((rank, i) => {
            map.set(rank, colors[i % colors.length]);
        });
        return map;
    }, [ranksToPlot]);


    const timeDomain = useMemo((): [number, number] => {
        // Handle cases with insufficient data by providing a default 7-day range.
        if (!timelineData || timelineData.length < 2) {
            const now = new Date();
            const fallbackStart = new Date();
            fallbackStart.setDate(now.getDate() - 6);
            return [fallbackStart.getTime(), now.getTime()];
        }

        // Use the first and last timestamps from the data array to set the domain.
        const startDate = new Date(timelineData[0].time.replace(" ", "T") + "Z");
        const endDate = new Date(timelineData[timelineData.length - 1].time.replace(" ", "T") + "Z");

        return [startDate.getTime(), endDate.getTime()];
    }, [timelineData]);

    const { chartData, dataKeys } = useMemo(() => {
        const activeRanks = Array.from(selectedRanks);
        const keys = activeRanks.map(r => `Rank ${r}`);

        const data = isRaid ? (timelineData as RaidTimelinePoint[]).map(timePoint => {
            const entry: { time: number;[key: string]: number | null } = {
                time: new Date(timePoint.time.replace(" ", "T") + "Z").getTime()
            };
            const rankEntries = timePoint.data.boss.d as ReportEntry[];
            activeRanks.forEach(rank => {
                entry[`Rank ${rank}`] = findScoreForRank(rankEntries, rank);
            });
            return entry;

        }) : (timelineData as ERaidTimelinePoint[]).map(timePoint => {
            const entry: { time: number;[key: string]: number | null } = {
                time: new Date(timePoint.time.replace(" ", "T") + "Z").getTime()
            };
            let rankEntries: ReportEntry[];
            if (activeTab === 'total') {
                rankEntries = timePoint.data.total as ReportEntry[];
            } else {
                rankEntries = timePoint.data[activeTab]?.d as ReportEntry[];
            }

            activeRanks.forEach(rank => {
                entry[`Rank ${rank}`] = findScoreForRank(rankEntries, rank);
            });
            return entry;
        });
        return { chartData: data, dataKeys: keys };
    }, [timelineData, activeTab, selectedRanks]);

    const colors = ['#e6194B', '#3cb44b', '#4363d8', '#f58231', '#911eb4', '#42d4f4', '#f032e6', '#bfef45', '#fabed4'];

    const toggleRank = (rank: number) => {
        setSelectedRanks(prev => {
            const next = new Set(prev);
            if (next.has(rank)) next.delete(rank);
            else next.add(rank);
            return next;
        });
    };
    return (
        <>
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-neutral-700">
                {/* <h3 className="font-semibold text-lg"></h3> */}
                <nav className="flex flex-wrap gap-2 mb-4">
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600'}`}>
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Rank Selection Checkbox Panel */}
            <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-x-4 gap-y-2 bg-gray-50 dark:bg-neutral-900/50 rounded-lg">
                {ranksToPlot.map(rank => (
                    <label key={rank} className="flex items-center gap-1.5 text-sm cursor-pointer whitespace-nowrap">
                        <input
                            type="checkbox"
                            checked={selectedRanks.has(rank)}
                            onChange={() => toggleRank(rank)}
                            className="w-4 h-4 rounded"
                            style={{ accentColor: rankColorMap.get(rank) }}
                        />
                        <span style={{ color: rankColorMap.get(rank) }}>{rank}</span>
                    </label>
                ))}
            </div>

            <ResponsiveContainer width="100%" height={600}>
                <ComposedChart margin={{ top: 20, right: 20, bottom: 20, left: 30 }}>
                    <XAxis

                        type="number"
                        dataKey="time"
                        fontSize={12}
                        domain={timeDomain}
                        tickFormatter={(timestamp: number) =>
                            formatDateToDayString(new Date(timestamp), raidInfos[0])
                        }

                    />
                    <YAxis
                        type="number"
                        domain={['dataMin - 1000', 'dataMax + 1000']}
                        tickFormatter={(s) => `${(s / 1e6).toFixed(1)}M`}
                        width={30}
                    >
                        <Label value="Score" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fill: '#888' }} />
                    </YAxis>

                    <Tooltip
                        content={<CustomScoreTimelineTooltip raidInfos={raidInfos} rankColorMap={rankColorMap} />}
                        cursor={{ fill: 'rgba(200, 200, 200, 0.1)' }}
                    />
                    <Legend />

                    {dataKeys.map((key, i) => (
                        <React.Fragment key={key}>
                            <Line
                                dataKey={key}
                                data={chartData}
                                name={key}
                                dot={false}
                                stroke={colors[i % colors.length]}
                                strokeWidth={2}
                                connectNulls={true}
                            />

                            <Scatter
                                dataKey={key}
                                data={chartData}
                                name={`${key} Points`}
                                fill={colors[i % colors.length]}
                                shape="circle"
                                legendType="none"
                            />
                        </React.Fragment>
                    ))}
                </ComposedChart>
            </ResponsiveContainer>
        </>
    );
};