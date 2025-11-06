import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, LabelList, Label, ReferenceLine } from 'recharts';
import { type FC, useEffect, useMemo, useState } from 'react';
import type { TierData, TimelineData } from '~/types/livetype';
import { DIFFICULTY_COLORS } from '~/data/raidInfo';
import type { RaidInfo } from '~/types/data';
import { type_translation } from '../raidToString';
import { useTranslation } from 'react-i18next';
import type { Locale } from '~/utils/i18n/config';
import { formatDateToDayString } from './formatDateToDayString';
import { useIsDarkState } from '~/store/isDarkState';

interface TierAnalysisDashboardProps {
    isRaid: boolean
    timelineData: TimelineData;
    raidInfos: RaidInfo[];
}
type TierTab = 'boss1' | 'boss2' | 'boss3' | 'total' | 'change' | 'total_change';

// const calculateTotalClearsForBoss = (bossTier: any): number => {
//     return Object.values(bossTier || {}).reduce((sum: number, count: any) => sum + count, 0);
// };

const CustomTotalClearTooltip = ({ active, payload, label }: any) => {
    const { t } = useTranslation('common'); // Or appropriate namespace

    if (active && payload && payload.length) {
        // Find the original data entry for this boss/total
        const bossData = payload[0]?.payload; // Access the data for the hovered bar segment
        if (!bossData) return null;

        // Filter payload to only include actual data points (bars)
        const validPayload = payload.filter((p:any) => p.value > 0);

        return (
            <div className="p-2 bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm rounded-md border border-gray-300 dark:border-neutral-600 shadow-lg text-xs">
                {/* Boss Name (or Total for Raid) */}
                <p className="font-bold mb-1 text-neutral-800 dark:text-neutral-200">
                    {bossData.name === 'total' ? t('total') : t(bossData.name, { ns: 'term', defaultValue: bossData.name })}
                </p>
                {/* Difficulty Breakdown - Sort payload by difficulty order */}
                {validPayload
                    .sort((a: any, b: any) => {
                        const order = ["Lunatic", "Torment", "Insane", "Extreme", "Hardcore", "Veryhard", "Hard", "Normal"];
                        return order.indexOf(a.dataKey) - order.indexOf(b.dataKey);
                    })
                    .map((entry: any) => (
                        <div key={entry.dataKey} className="flex justify-between items-center gap-2">
                            <span style={{ color: entry.color }}>■ {entry.dataKey}</span>
                            <span className="font-medium text-neutral-700 dark:text-neutral-300">{entry.value.toLocaleString()}</span>
                        </div>
                 ))}
                 {/* Total for this boss */}
                 <div className="mt-1 pt-1 border-t dark:border-neutral-600 flex justify-between font-semibold text-neutral-800 dark:text-neutral-200">
                    <span>{t('total')}</span>
                    <span>{bossData.total.toLocaleString()}</span>
                 </div>
            </div>
        );
    }
    return null;
};

const CustomSortedLegend: React.FC = ({ payload }: any) => {
    // Define desired difficulty order *within* the component or pass as prop
    const difficultyOrder = ["Lunatic", "Torment", "Insane", "Extreme", "Hardcore", "Veryhard", "Hard", "Normal"];

    if (!payload) return null;

    // Sort the received payload based on the defined order
    const sortedPayload = [...payload].sort((a, b) => {
        return difficultyOrder.indexOf(a.value) - difficultyOrder.indexOf(b.value);
    });

    return (
        <div className="flex justify-center items-center flex-wrap gap-x-4 gap-y-1 text-xs mt-2">
            {sortedPayload.map((entry, index) => (
                <div key={`item-${index}`} className="flex items-center gap-1.5">
                    <div style={{ width: 10, height: 10, backgroundColor: entry.color }} />
                    <span style={{ color: entry.color }}>{entry.value}</span>
                </div>
            ))}
        </div>
    );
};

const CustomAreaChartTooltip = ({ active, payload, label, raidInfos }: {
    active?: boolean;
    payload?: any[];
    label?: number;
    raidInfos: RaidInfo[];
}) => {
    const difficultyOrder = ["Lunatic", "Torment", "Insane", "Extreme", "Hardcore", "Veryhard", "Hard", "Normal"];

    if (active && payload && payload.length && label) {
        const sortedPayload = [...payload].sort((a, b) => {
            return difficultyOrder.indexOf(a.name) - difficultyOrder.indexOf(b.name);
        });

        const total = sortedPayload.reduce((sum, entry) => sum + (entry.value || 0), 0);

        return (
            <div className="p-2 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-md border border-gray-300 dark:border-neutral-600 shadow-lg text-xs">
                {/* Time label */}
                <p className="font-bold mb-1 text-neutral-800 dark:text-neutral-200">
                    {formatDateToDayString(new Date(label), raidInfos[0])}
                </p>
                {/* Details by Difficulty Level */}
                {sortedPayload.map((entry: any) => (
                    <div key={entry.name} className="flex justify-between items-center gap-2">
                        <span style={{ color: entry.color }}>■ {entry.name}</span>
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">{entry.value.toLocaleString()}</span>
                    </div>
                ))}
                {/* Total */}
                 <div className="mt-1 pt-1 border-t dark:border-neutral-600 flex justify-between font-semibold text-neutral-800 dark:text-neutral-200">
                    <span>Total</span> {/* {t('total')} */}
                    <span>{total.toLocaleString()}</span>
                 </div>
            </div>
        );
    }
    return null;
};

export const TierAnalysisDashboard: FC<TierAnalysisDashboardProps> = ({ isRaid, timelineData, raidInfos }) => {
    const { t, i18n } = useTranslation("liveDashboard");
    const { t:t_c } = useTranslation("common");
    const locale = i18n.language as Locale

    const TABS: { id: TierTab, name: string }[] = useMemo(() => isRaid ? [
        { id: 'total', name: t('total_clear') },
        { id: 'change', name: t('hourly_change') },
        { id: 'boss1', name: 'Timeline' },
    ] : [
        { id: 'total', name: t('total_clear') },
        { id: 'change', name: t('hourly_change') },
        { id: 'boss1', name: type_translation[raidInfos?.[0]?.Type as keyof typeof type_translation][locale] || 'Boss 1' },
        { id: 'boss2', name: type_translation[raidInfos?.[1]?.Type as keyof typeof type_translation][locale] || 'Boss 2' },
        { id: 'boss3', name: type_translation[raidInfos?.[2]?.Type as keyof typeof type_translation][locale] || 'Boss 3' },
    ], [raidInfos, isRaid]);
    const [activeTab, setActiveTab] = useState<TierTab>('total');
    const [selectedDifficulties, setSelectedDifficulties] = useState<Set<string>>(new Set(['Lunatic', 'Torment', 'Insane']));
    const { isDark } = useIsDarkState();

    const availableDifficulties = useMemo(() => {
        const difficulties = new Set<string>();
        if (!timelineData || !activeTab.startsWith('boss')) return [];

        for (const timePoint of timelineData) {

            const bossTierData = isRaid ? timePoint.data.tier : timePoint.data.tier[activeTab as keyof typeof timePoint.data.tier];
            if (bossTierData) {
                for (const diff of Object.keys(bossTierData)) {
                    difficulties.add(diff);
                }
            }
        }

        const difficultyOrder = ["Lunatic", "Torment", "Insane", "Extreme", "Hardcore", "Veryhard", "Hard", "Normal"];
        return difficultyOrder.filter(d => difficulties.has(d));
    }, [timelineData, activeTab]);
    useEffect(() => {
        setSelectedDifficulties(new Set(availableDifficulties));
    }, [availableDifficulties]);

    const analysisData = useMemo(() => {
        if (!timelineData || timelineData.length === 0) return null;

        // Change time to numeric timestamp
        const clearsOverTime = timelineData.map(point => {
            const time = new Date(point.time.replace(" ", "T") + "Z").getTime(); // toLocaleString() -> getTime()
            const bossTiers = point.data.tier;
            const entry = { time } as any;

            if (isRaid)
                Object.entries(bossTiers).forEach(([diff, count]) => {
                    entry[`${diff}`] = count;
                });
            else
                Object.entries(bossTiers).forEach(([bossId, tiers]) => {
                    Object.entries(tiers).forEach(([diff, count]) => {
                        entry[`${bossId}_${diff}`] = count;
                    });
                });
            return entry;
        });


        const clearsChangeOverTime = timelineData.slice(1).map((point, i) => {
            const prevPoint = timelineData[i];

            const currentTimeMs = new Date(point.time.replace(" ", "T") + "Z").getTime();
            const prevTimeMs = new Date(prevPoint.time.replace(" ", "T") + "Z").getTime();

            const durationMs = currentTimeMs - prevTimeMs;
            const durationHours = durationMs / (1000 * 60 * 60); // milliseconds -> hours

            let currentTotal, prevTotal, change;

            if (isRaid) {
                currentTotal = Object.values(point.data.tier).flat().reduce((sum, t) => sum + (t as number), 0);
                prevTotal = Object.values(prevPoint.data.tier).flat().reduce((sum, t) => sum + (t as number), 0);
                change = currentTotal - prevTotal;
            } else {
                currentTotal = Object.values(point.data.tier as TierData).flat().reduce((sum, t) => sum + Object.values(t).reduce((s, c) => s + c, 0), 0);
                prevTotal = Object.values(prevPoint.data.tier as TierData).flat().reduce((sum, t) => sum + Object.values(t).reduce((s, c) => s + c, 0), 0);
                change = currentTotal - prevTotal;
            }

            const changePerHour = durationHours > 0 ? (change / durationHours) : 0;

            return {
                time: currentTimeMs,
                changePerHour: changePerHour,
                originalChange: change,
                durationHours: durationHours
            };
        });

        const latestTierData = timelineData[timelineData.length - 1].data.tier;
        const bossNameMap = isRaid ? {} : {
            boss1: raidInfos?.[0]?.Type || 'Boss 1',
            boss2: raidInfos?.[1]?.Type || 'Boss 2',
            boss3: raidInfos?.[2]?.Type || 'Boss 3'
        };

        const latestClearsByBoss = isRaid ? [{
            name: 'total',
            ...latestTierData,
            total: Object.values(latestTierData).reduce((s: number, c: any) => s + c, 0)

        }] : Object.entries(latestTierData).map(([bossId, tiers]) => {
            const total = Object.values(tiers).reduce((s: number, c: any) => s + c, 0);
            return {
                name: bossNameMap[bossId as keyof typeof bossNameMap],
                ...tiers,
                total: total
            };
        });

        return { clearsOverTime, clearsChangeOverTime, latestClearsByBoss };
    }, [timelineData]);

    const toggleDifficulty = (difficulty: string) => {
        setSelectedDifficulties(prev => {
            const next = new Set(prev);
            if (next.has(difficulty)) {
                next.delete(difficulty);
            } else {
                next.add(difficulty);
            }
            return next;
        });
    };


    if (!analysisData) return <div className="p-4 text-center">Tier data is loading...</div>;


    // const difficultyOrder = useMemo(() => ["Lunatic", "Torment", "Insane", "Extreme", "Hardcore", "Veryhard", "Hard", "Normal"], []);
    // const totalLegendPayload = useMemo(() => {
    //     if (!analysisData || analysisData.latestClearsByBoss.length === 0) return [];
    //     const existingDifficulties = new Set(
    //         Object.keys(analysisData.latestClearsByBoss[0]).filter(key => key !== 'name' && key !== 'total')
    //     );
    //     return difficultyOrder
    //         .filter(diff => existingDifficulties.has(diff))
    //         .map(diff => ({
    //             value: diff,
    //             type: 'rect', // Or 'square' etc.
    //             color: DIFFICULTY_COLORS[diff] || '#8884d8'
    //         }));
    // }, [analysisData, difficultyOrder]);

    return (
        <>
            <nav className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-neutral-700 pb-3 mb-4">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600'}`}>
                        {tab.name}
                    </button>
                ))}
            </nav>
            <div className="min-h-[500px]">
                {/* Full Clear Count Tab */}
                {activeTab === 'total' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                        <ResponsiveContainer width="100%" height={isRaid ? 200 : 500}>
                                <BarChart data={analysisData.latestClearsByBoss} layout="vertical"
                                    barCategoryGap={isRaid ? '20%' : '10%'}
                                >
                                    <XAxis type="number" tickFormatter={(val) => val.toLocaleString()} />
                                    <YAxis type="category" dataKey="name" width={isRaid ? 0 : 80} tickFormatter={(name) => isRaid ? '' : name === 'total' ? t_c('total') : t(name, { ns: 'term', defaultValue: name })} />

                                    <Legend content={<CustomSortedLegend />} />
                                    <Tooltip content={<CustomTotalClearTooltip />} cursor={{ fill: 'rgba(200, 200, 200, 0.1)' }}/>
                                    {Object.keys(DIFFICULTY_COLORS).map(diff => (
                                        <Bar key={diff} dataKey={diff} stackId="a" fill={DIFFICULTY_COLORS[diff]} >
                                            <LabelList
                                                dataKey={diff}
                                                position="center"
                                                fill="#fff"
                                                fontSize={10}
                                                formatter={(value: any) => {
                                                    if (value / analysisData.latestClearsByBoss[0].total * 100 < 15) {
                                                        return null;
                                                    }
                                                    return diff + '\n' + value.toLocaleString();
                                                }}
                                            />
                                        </Bar>
                                    ))}

                                    <ReferenceLine x={20000} stroke={isDark=='dark' ? "white" : "black"} strokeDasharray="3 3" />
                                    <ReferenceLine x={120000} stroke={isDark=='dark' ? "white" : "black"} strokeDasharray="3 3" />
                                    <ReferenceLine x={240000} stroke={isDark=='dark' ? "white" : "black"} strokeDasharray="3 3" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-col gap-4">
                            {analysisData.latestClearsByBoss.map(boss => (
                                <div key={boss.name} className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-lg text-center h-full">
                                    {!isRaid && <h3 className="font-semibold text-lg mb-1">{type_translation[boss.name as keyof typeof type_translation][locale]} Clear</h3>
                                    }                                    <p className="text-4xl font-bold text-sky-500">{boss.total.toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Change per hour tab */}
                {activeTab === 'change' && (

                    <ResponsiveContainer width="100%" height={500}>
                        <LineChart data={analysisData.clearsChangeOverTime}>
                            <XAxis
                                type="number"
                                dataKey="time"
                                scale="time"
                                domain={['dataMin', 'dataMax']}
                                tickFormatter={(ts) => formatDateToDayString(new Date(ts), raidInfos[0])}
                                fontSize={12}
                            />
                            <YAxis yAxisId="left">
                                <Label
                                    value={t('changePerHourLabel')}
                                    angle={-90}
                                    position="insideLeft"
                                    style={{ textAnchor: 'middle', fill: '#888' }}
                                />
                            </YAxis>
                            <Tooltip
                                labelFormatter={(label: number) => formatDateToDayString(new Date(label), raidInfos[0])}
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="p-2 bg-white/80 dark:bg-black/80 backdrop-blur-sm rounded-md border dark:border-neutral-700 text-sm">
                                                <p className="font-bold mb-1">{label && formatDateToDayString(new Date(label), raidInfos[0])}</p>
                                                <p>
                                                    <strong>{t('hourly_change')}:</strong>
                                                    <span className="text-green-500 font-semibold ml-1">
                                                        {data.changePerHour.toLocaleString(undefined, { maximumFractionDigits: 1 })} {t('playersPerHourUnit')}
                                                    </span>
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-neutral-400">
                                                    ({data.originalChange.toLocaleString()} {t('playersUnit')} / {data.durationHours.toFixed(1)} {t('hoursUnit')})
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="changePerHour"
                                name={t('hourly_change')}
                                yAxisId="left"
                                stroke="#82ca9d"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}

                {/* Tabs by Boss */}
                {(activeTab === 'boss1' || activeTab === 'boss2' || activeTab === 'boss3') && (
                    <>
                        {/* Difficulty Selection Filter UI */}
                        <div className="flex flex-wrap gap-x-4 gap-y-2 p-3 mb-4 bg-gray-50 dark:bg-neutral-900/50 rounded-lg">
                            {availableDifficulties.map(diff => (
                                <label key={diff} className="flex items-center gap-1.5 text-sm cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedDifficulties.has(diff)}
                                        onChange={() => toggleDifficulty(diff)}
                                        className="w-4 h-4 rounded"
                                        style={{ accentColor: DIFFICULTY_COLORS[diff] }}
                                    />
                                    <span style={{ color: DIFFICULTY_COLORS[diff] }}>{diff}</span>
                                </label>
                            ))}
                        </div>

                        <ResponsiveContainer width="100%" height={500}>
                            <AreaChart data={analysisData.clearsOverTime}>
                                <XAxis
                                    type="number" dataKey="time" scale="time" domain={['dataMin', 'dataMax']}
                                    tickFormatter={(ts) => formatDateToDayString(new Date(ts), raidInfos[0])}
                                    fontSize={12}
                                />
                                <YAxis tickFormatter={(val) => val.toLocaleString()} />

                                <Tooltip
                                    content={<CustomAreaChartTooltip raidInfos={raidInfos} />}
                                    cursor={{ fill: 'rgba(200, 200, 200, 0.1)' }}
                                />
                                <Legend content={<CustomSortedLegend />} />

                                {/* Only the selected difficulty is dynamically rendered */}
                                {Array.from(selectedDifficulties).map(diff => (
                                    <Area
                                        key={diff}
                                        type="monotone"
                                        dataKey={isRaid ? diff : `${activeTab}_${diff}`}
                                        name={diff}
                                        stackId="1"
                                        stroke={DIFFICULTY_COLORS[diff]}
                                        fill={DIFFICULTY_COLORS[diff]}
                                    />
                                ))}
                            </AreaChart>
                        </ResponsiveContainer>
                    </>
                )}
            </div>
        </>
    );
};