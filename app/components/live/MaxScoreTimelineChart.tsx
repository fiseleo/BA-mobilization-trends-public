import { LineChart, Line, XAxis, YAxis, Label, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { type FC, useEffect, useMemo, useState } from 'react';
import type { ERaidTimelinePoint, RaidTimelinePoint, TimelineData } from '~/types/livetype';
import { getDifficultyFromScoreAndBoss } from '~/components/Difficulty';
import { calculateTimeFromScore } from '~/utils/calculateTimeFromScore';
import { formatTimeToTimestamp } from '~/utils/time';
import type { GameServer, RaidInfo } from '~/types/data';
import { DIFFICULTY_COLORS } from '~/data/raidInfo';
import type { ReportEntry } from '../dashboard/common';
import { type_translation, typecolor } from '../raidToString';
import { useTranslation } from 'react-i18next';
import type { Locale } from '~/utils/i18n/config';
import { formatDateToDayString } from './formatDateToDayString';

interface MaxScoreTimelineChartProps {
    isRaid: boolean;
    timelineData: TimelineData;
    raidInfos: RaidInfo[];
    server: GameServer;
}

const findMaxScoresByDifficulty = (rankEntries: ReportEntry[], raidInfo: RaidInfo, server: GameServer): Record<string, number> => {
    const maxScores: Record<string, number> = {};
    if (!rankEntries || rankEntries.length === 0) return maxScores;

    const sortedByRank = [...rankEntries].sort((a, b) => a.r - b.r);

    // 1. Rank 1st place is definitely the highest score for that level of difficulty
    if (sortedByRank[0]?.r === 1) {
        const diff = getDifficultyFromScoreAndBoss(sortedByRank[0].s, server, raidInfo.Id);
        maxScores[diff] = sortedByRank[0].s;
    }

    // 2. Find the difficulty threshold and record the highest score
    for (let i = 1; i < sortedByRank.length; i++) {
        const prev = sortedByRank[i - 1];
        const curr = sortedByRank[i];

        const prevDiff = getDifficultyFromScoreAndBoss(prev.s, server, raidInfo.Id);
        const currDiff = getDifficultyFromScoreAndBoss(curr.s, server, raidInfo.Id);

        // If the difficulty level has changed when the difference from the previous rank is 1, the previous rank is the highest for that difficulty level
        if (curr.r - prev.r === 1 && currDiff !== prevDiff) {
            if (!maxScores[currDiff]) { // Do not overwrite if Rank 1 is already recorded
                maxScores[currDiff] = curr.s;
            }
        }
    }
    return maxScores;
};

export const MaxScoreTimelineChart: FC<MaxScoreTimelineChartProps> = ({ isRaid, timelineData, raidInfos, server }) => {

    const [selectedBoss, setSelectedBoss] = useState<'boss1' | 'boss2' | 'boss3'>('boss1');
    const [selectedDifficulties, setSelectedDifficulties] = useState<Set<string>>(new Set(['Lunatic', 'Torment', 'Insane']));
    const [axisType, setAxisType] = useState<'score' | 'time'>('score');
    const { t, i18n } = useTranslation("dashboard");
    const locale = i18n.language as Locale


    const chartData = useMemo(() => {
        return (timelineData).map(timePoint => {
            const entry: { time: number;[key: string]: number | null } = {
                time: new Date(timePoint.time.replace(" ", "T") + "Z").getTime()
            };

            let bossData: ReportEntry[]
            if (isRaid) bossData = (timePoint as RaidTimelinePoint).data.boss.d as ReportEntry[];
            else bossData = (timePoint as ERaidTimelinePoint).data[selectedBoss]?.d as ReportEntry[];
            const maxScores = findMaxScoresByDifficulty(bossData, raidInfos[0], server)

            selectedDifficulties.forEach(diff => {
                entry[diff] = maxScores[diff] || null;
            });

            return entry;
        });
    }, [timelineData, selectedBoss, selectedDifficulties]);

    const availableDifficulties = useMemo(() => {
        const difficulties = new Set<string>();
        if (!timelineData) return [];

        for (const timePoint of timelineData) {
            let bossData
            if (isRaid) bossData = (timePoint as RaidTimelinePoint).data.boss.d as ReportEntry[];
            else bossData = (timePoint as ERaidTimelinePoint).data[selectedBoss]?.d as ReportEntry[];
            if (bossData) {
                for (const entry of bossData) {
                    if (entry.r <= 2000)
                        difficulties.add(getDifficultyFromScoreAndBoss(entry.s, server, raidInfos[0].Id));
                }
            }
        }

       // Return in a given order
        const difficultyOrder = ["Lunatic", "Torment", "Insane", "Extreme", "Hardcore"]//, "Veryhard", "Hard", "Normal"];
        return difficultyOrder.filter(d => difficulties.has(d));

    }, [timelineData, selectedBoss]);

    useEffect(() => {
        setSelectedDifficulties(prev => {
            const next = new Set(prev);
            for (const diff of next) {
                if (!availableDifficulties.includes(diff)) {
                    next.delete(diff);
                }
            }
           // If nothing is selected after filtering, select the top two difficulties as the default
            if (next.size === 0 && availableDifficulties.length > 0) {
                next.add(availableDifficulties[0]);
                if (availableDifficulties.length > 1) {
                    next.add(availableDifficulties[1]);
                }
            }
            return next;
        });
    }, [availableDifficulties]);

    const toggleDifficulty = (difficulty: string) => {
        setSelectedDifficulties(prev => {
            const next = new Set(prev);
            if (next.has(difficulty)) next.delete(difficulty);
            else next.add(difficulty);
            return next;
        });
    };

    return (
        <>
            {/* Control Panel */}
            <div className="flex flex-wrap gap-4 items-center pb-3 mb-4 border-b border-gray-200 dark:border-neutral-700">
                {/* Select boss */}
                <div className="flex gap-1 rounded-lg bg-gray-100 dark:bg-neutral-700 p-1">
                    {raidInfos.length > 1 && raidInfos.map((info, i) => (
                        <button key={`boss${i + 1}`} onClick={() => setSelectedBoss(`boss${i + 1}` as any)}
                            className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${selectedBoss === `boss${i + 1}` ? 'bg-white dark:bg-neutral-900 shadow-sm opacity-100' : 'opacity-60'}`} style={{
                                backgroundColor: info.Type ? typecolor[info.Type] : undefined,
                                color: info.Type ? 'white' : undefined,
                            }}>
                            {type_translation[info.Type ?? 'LightArmor'][locale]}
                        </button>
                    ))}
                </div>
                {/* Select Difficulty */}
                <div className="flex flex-wrap gap-2">
                    {availableDifficulties.map(diff => (
                        <label key={diff} className="flex items-center gap-1.5 text-sm cursor-pointer">
                            <input type="checkbox" checked={selectedDifficulties.has(diff)} onChange={() => toggleDifficulty(diff)}
                                className="w-4 h-4 rounded" style={{ accentColor: DIFFICULTY_COLORS[diff] }} />
                            <span style={{ color: DIFFICULTY_COLORS[diff] }}>{diff}</span>
                        </label>
                    ))}
                </div>
                {/* Select axis type */}
                <div className="flex gap-1 rounded-lg bg-gray-100 dark:bg-neutral-700 p-1 ml-auto">
                    <button onClick={() => setAxisType('score')} className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${axisType === 'score' ? 'bg-white dark:bg-neutral-900 shadow-sm' : ''}`}>Score</button>
                    <button onClick={() => setAxisType('time')} className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${axisType === 'time' ? 'bg-white dark:bg-neutral-900 shadow-sm' : ''}`}>Time</button>
                </div>
            </div>

            {/* chart */}
            <ResponsiveContainer width="100%" height={500}>
                <LineChart data={chartData}>
                    <XAxis type="number" dataKey="time" scale="time" domain={['dataMin', 'dataMax']}
                        tickFormatter={(ts) => formatDateToDayString(new Date(ts), raidInfos[0])} width={20} />
                    <YAxis
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        tickFormatter={(val) => axisType === 'score' ? `${(val / 1e6).toFixed(1)}M` : formatTimeToTimestamp(val).split('.')[0]}
                        reversed={axisType === 'time'} // On the time axis, zero goes up
                        width={40}
                        fontSize={12}
                    >
                        <Label value={axisType === 'score' ? 'Max Score' : 'Min Time'} angle={-90} position="insideLeft" />
                    </YAxis>
                    <Tooltip
                        content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="p-2 bg-white/80 dark:bg-black/80 backdrop-blur-sm rounded-md border dark:border-neutral-700 text-sm">
                                        <p className="font-bold">{label ? formatDateToDayString(new Date(label), raidInfos[0]) : label}</p>
                                        {payload.map(p => (
                                            <p key={p.name} style={{ color: p.color }}>
                                                <strong>{p.name}:</strong> {axisType === 'score' ? (p.value as number).toLocaleString() : formatTimeToTimestamp(p.value as number)}
                                            </p>
                                        ))}
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Legend />
                    {Array.from(selectedDifficulties).map(diff => (
                        <Line key={diff} type="monotone"
                            dataKey={axisType === 'score' ? diff : (entry) => {
                                const score = entry[diff];
                                const boss = raidInfos[Number(selectedBoss.slice(-1)) - 1]!.Boss
                                const id = raidInfos[0].Id

                                return score ? calculateTimeFromScore(score, boss, server, id) : null;
                            }}
                            name={diff}
                            stroke={DIFFICULTY_COLORS[diff]}
                            strokeWidth={2}
                            dot={{
                                r: 3,
                                fill: DIFFICULTY_COLORS[diff],
                                stroke: 'none'
                            }}
                            connectNulls={false}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </>
    );
};