import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export interface RankRange {
    id: string;
    name: string;
    min: number;
    max: number;
}

export const RankFilter: React.FC<{
    activeRange: RankRange;
    onRangeChange: (range: RankRange) => void;
    rankRanges: RankRange[];
}> = ({ activeRange, onRangeChange, rankRanges }) => {
    const [minRank, setMinRank] = useState(activeRange.min);
    const [maxRank, setMaxRank] = useState(activeRange.max);
    const { t: t_c } = useTranslation("common");

    useEffect(() => {
        setMinRank(activeRange.min);
        setMaxRank(activeRange.max);
    }, [activeRange]);

    const handleApplyCustomRange = () => {
        const min = Math.max(1, minRank); // min 1
        const max = Math.max(min, maxRank); // sudo max >= min
        onRangeChange({
            id: 'custom', // id indicating custom range
            name: `${min} - ${max}`,
            min: min,
            max: max,
        });
    };

    return (
        <>
            {/* Preset Buttons */}
            <div className='overflow-x-auto flex p-2 items-center space-x-4 '>
                {rankRanges.map(range => (
                    <button
                        key={range.id}
                        onClick={() => onRangeChange(range)}
                        className={`text-sm px-3 py-2 my-1 rounded whitespace-nowrap transition-colors ${activeRange.id === range.id
                            ? 'bg-bluearchive-botton-yellow text-black'
                            : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-500'
                            }`}
                    >
                        {range.name}
                    </button>
                ))}
            </div>

            {/* Custom Range Inputs */}
            <div className="flex items-center space-x-2 mb-2">
                <input
                    type="number"
                    value={minRank}
                    onChange={(e) => setMinRank(Number(e.target.value))}
                    className="w-24 rounded border border-neutral-300 bg-white p-1 text-center text-neutral-900 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                />
                <span className="text-neutral-700 dark:text-white">-</span>
                <input
                    type="number"
                    value={maxRank}
                    onChange={(e) => setMaxRank(Number(e.target.value))}
                    className="w-24 rounded border border-neutral-300 bg-white p-1 text-center text-neutral-900 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                />
                <button
                    onClick={handleApplyCustomRange}
                    className="bg-bluearchive-botton-blue hover:bg-sky-500 text-black px-3 py-1 rounded"
                >
                    {t_c('confirm')}
                </button>
            </div>
        </>

    );
};