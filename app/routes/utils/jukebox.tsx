import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { type Locale } from '~/utils/i18n/config';
import eventList from '~/data/jp/eventList.json';
import { useDataCache } from '~/utils/cache';
import type { Student } from '~/types/data';
import bgmData from '~/data/jp/bgm_database_combined.json'
import { AutoplayIcon, eventConvertor, FilterIcon, GENERAL_CATEGORIES, mainStoryChapters, otherStoryTitles, RepeatIcon, StopIcon, TEXTS, XREF_PREFIXES, type OtherStoryData } from './jukeboxMetadata';
import type { loader as rootLorder } from "~/root";
import { data, useLoaderData, type MetaFunction } from 'react-router';
import { createLinkHreflang, createMetaDescriptor } from '~/components/head';
import RubyText from '~/components/RubyText';
import { FaSortAmountUp, FaSortAmountDown } from 'react-icons/fa';
import type { Route } from './+types/jukebox';
import { getInstance } from '~/middleware/i18next';
import type { AppHandle } from '~/types/link';

const PlayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
);

const SoundWaveIcon = () => (
    <div className="flex items-center justify-center w-8 h-8 space-x-1">
        <span className="w-1 h-3 bg-current animate-[wave_1s_ease-in-out_infinite] delay-[-0.4s]"></span>
        <span className="w-1 h-5 bg-current animate-[wave_1s_ease-in-out_infinite] delay-[-0.2s]"></span>
        <span className="w-1 h-2 bg-current animate-[wave_1s_ease-in-out_infinite]"></span>
    </div>
);

const SortAscIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M3 3a1 1 0 000 2h14a1 1 0 100-2H3zM3 7a1 1 0 000 2h14a1 1 0 100-2H3zM3 11a1 1 0 100 2h14a1 1 0 100-2H3zM3 15a1 1 0 100 2h14a1 1 0 100-2H3z" />
        <path fillRule="evenodd" d="M10 18a.5.5 0 01-.5-.5v-6.793l-1.646 1.647a.5.5 0 01-.708-.708l2.5-2.5a.5.5 0 01.708 0l2.5 2.5a.5.5 0 01-.708.708L10.5 10.707V17.5a.5.5 0 01-.5.5z" clipRule="evenodd" />
    </svg>
);
const SortDescIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M3 3a1 1 0 000 2h14a1 1 0 100-2H3zM3 7a1 1 0 000 2h14a1 1 0 100-2H3zM3 11a1 1 0 100 2h14a1 1 0 100-2H3zM3 15a1 1 0 100 2h14a1 1 0 100-2H3z" />
        <path fillRule="evenodd" d="M10 5a.5.5 0 01.5.5v6.793l1.646-1.647a.5.5 0 01.708.708l-2.5 2.5a.5.5 0 01-.708 0l-2.5-2.5a.5.5 0 11.708-.708L9.5 12.207V5.5A.5.5 0 0110 5z" clipRule="evenodd" />
    </svg>
);


// --- TYPE DEFINITIONS ---
type Language = 'en' | 'jp' | 'ko';

interface LocalizedName {
    ja?: string | string[] | null;
    ko?: string | string[] | null;
    en?: string | string[] | null;
}

type XrefType =
    | 'UI'
    | 'Main_Story'
    | 'Favor_Story'
    | 'Event_Story'
    | 'Memorial'
    | 'main_work'
    | 'event_work'
    | 'limitraid'
    | 'raid'
    | string;

interface Xref {
    type: XrefType;
    name?: LocalizedName;
    title?: string | number | null;
    episode?: string | number;
}

interface Bgm {
    id: string;
    title?: string;
    composer?: string;
    youtube_url?: string;
    youtube_title?: string;
    xref: Xref[];
}

type StudentData = Record<string, { Name: string }>;
type EventData = Record<string, { Name: string; Kr?: string; Jp?: string; En?: string; }>;

// --- YouTube IFrame API TYPE DECLARATION ---
declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

type PlaybackMode = 'autoplay' | 'repeat' | 'off';

// --- HELPER FUNCTIONS ---
const getYouTubeId = (url: string): string | null => url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/)?.[2] || null;
const getLocalizedText = (obj: any, lang: Language, fallbackKey: keyof LocalizedName = 'ja'): string => obj?.[lang] || obj?.[fallbackKey] || obj?.['Name'] || '';
const getLocalizedTextArr = (obj: any, lang: Language, fallbackKey: keyof LocalizedName = 'ja'): string|string[] => obj?.[lang] || obj?.[fallbackKey] || obj?.['Name'] || '';



// --- COMPONENTS ---


interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    items: [string, string][];
    selectedItems: Record<string, boolean>;
    language: Language
    onToggleItem: (id: string) => void;
    onToggleAll: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, title, items, selectedItems, language, onToggleItem, onToggleAll }) => {
    if (!isOpen) return null;
    const allSelected = items.length > 0 && items.every(([id]) => selectedItems[id]);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity duration-300" onClick={onClose}>
            <div
                className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-neutral-200 dark:border-neutral-700"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <header className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center shrink-0">
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{title}</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>

                {/* Content */}
                <div className="p-4 overflow-y-auto space-y-4">
                    <button
                        onClick={onToggleAll}
                        className={`w-full px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${allSelected
                            ? 'bg-neutral-500 hover:bg-neutral-600 dark:bg-neutral-600 dark:hover:bg-neutral-500'
                            : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                            }`}
                    >
                        {allSelected ? getLocalizedText(TEXTS.deselectAll, language) : getLocalizedText(TEXTS.selectAll, language)}
                    </button>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {items.sort((a, b) => Number(-a[0]) + Number(b[0])).map(([id, name]) => (
                            <label key={id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-neutral-500/10 dark:hover:bg-neutral-900/40 cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    checked={!!selectedItems[id]}
                                    onChange={() => onToggleItem(id)}
                                    className="form-checkbox h-5 w-5 rounded text-blue-500 dark:text-blue-400 bg-transparent border-neutral-400 dark:border-neutral-500 focus:ring-blue-500/50 focus:ring-offset-0 focus:ring-offset-transparent"
                                />
                                <span className="text-sm text-neutral-700 dark:text-neutral-300 select-none">{name}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <footer className="p-4 border-t border-neutral-200 dark:border-neutral-700 shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
                    >
                        {getLocalizedText(TEXTS.close, language)}
                    </button>
                </footer>
            </div>
        </div>
    );
};
interface StudentFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    // Change items type from [id, name] array to [id, Student object] array.
    items: [string, Student][];
    selectedItems: { [key: string]: boolean };
    language: Language
    onToggleItem: (id: string) => void;
    onToggleAll: (ids: string[]) => void;
}

const StudentFilterModal: React.FC<StudentFilterModalProps> = ({ isOpen, onClose, title, items, selectedItems, language, onToggleItem, onToggleAll }) => {
    const [searchTerm, setSearchTerm] = useState('');
    if (!isOpen) return null;

    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filteredItems = items.filter(([, student]) => {
        if (!searchTerm) return true;
        const nameMatch = student.Name?.toLowerCase().includes(lowerCaseSearchTerm);
        const tagMatch = student.SearchTags?.some(tag => tag.toLowerCase().includes(lowerCaseSearchTerm));
        return nameMatch || tagMatch;
    });

    const allFilteredSelected = filteredItems.length > 0 && filteredItems.every(([id]) => selectedItems[id]);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity duration-300" onClick={onClose}>
            <div
                className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col border border-neutral-200 dark:border-neutral-700"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center shrink-0">
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{title}</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>

                <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 shrink-0">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={getLocalizedText(TEXTS.searchStudentName, language)}
                        className="w-full px-4 py-2 bg-white/50 dark:bg-neutral-900/50 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:placeholder-neutral-400"
                    />
                </div>

                <div className="p-4 overflow-y-auto space-y-4">
                    <button
                        onClick={() => onToggleAll(filteredItems.map(([id]) => id))}
                        className={`w-full px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${allFilteredSelected
                            ? 'bg-neutral-500 hover:bg-neutral-600 dark:bg-neutral-600 dark:hover:bg-neutral-500'
                            : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                            }`}
                    >
                        {allFilteredSelected ? getLocalizedText(TEXTS.deselectAllSearched, language) : getLocalizedText(TEXTS.selectAllSearched, language)}
                    </button>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {filteredItems.map(([id, student]) => (
                            <label key={id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-neutral-500/10 dark:hover:bg-neutral-900/40 cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    checked={!!selectedItems[id]}
                                    onChange={() => onToggleItem(id)}
                                    className="form-checkbox h-5 w-5 rounded text-blue-500 dark:text-blue-400 bg-transparent border-neutral-400 dark:border-neutral-500 focus:ring-blue-500/50 focus:ring-offset-0 focus:ring-offset-transparent"
                                />
                                <span className="text-sm text-neutral-700 dark:text-neutral-300 select-none">{student.Name}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <footer className="p-4 border-t border-neutral-200 dark:border-neutral-700 shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
                    >
                        {getLocalizedText(TEXTS.close, language)}
                    </button>
                </footer>
            </div>
        </div>
    );
};




interface PlayerProps {
    song: Bgm | null;
    onClose: () => void;
    onSongEnd: (player: any) => void; // Change type to receive player instance

}

const Player: React.FC<PlayerProps> = React.memo(({ song, onClose, onSongEnd }) => {
    const playerRef = useRef<any>(null);

    const [isMinimized, setIsMinimized] = useState(false);

    useEffect(() => {
        const videoId = song?.youtube_url ? getYouTubeId(song.youtube_url) : null;
        if (!videoId) {
            if (playerRef.current) { playerRef.current.destroy(); playerRef.current = null; }
            return;
        }

        const initPlayer = () => {
            if (playerRef.current) playerRef.current.destroy();
            playerRef.current = new window.YT.Player('youtube-player', {
                videoId, height: '100%', width: '100%', playerVars: { autoplay: 1, controls: 1 },
                events: {
                    onStateChange: (e: any) => {
                        if (e.data === window.YT.PlayerState.ENDED) {
                            onSongEnd(e.target); // Pass e.target (player instance) when calling onSongEnd
                        }
                    }
                }
            });
        };


        if (window.YT?.Player) {
            initPlayer();
        } else {
            window.onYouTubeIframeAPIReady = initPlayer;
        }
    }, [song, onSongEnd]);

    if (!song) return null;

    return (
        <div
            className={`fixed bottom-4 right-4 w-10/12 max-w-sm transition-transform duration-300 ease-in-out z-50 ${isMinimized ? 'translate-x-[calc(100%-20px)]' : 'translate-x-0'
                }`}
        >
            <div className="relative bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700">

                {/* 3. Add a toggle button that changes the state. */}
                <button
                    onClick={() => { setIsMinimized(!isMinimized) }}
                    className="absolute z-10 top-1/2 -translate-y-1/2 left-0 w-8 h-full flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                    aria-label={isMinimized ? 'Unfold Player': 'Fold Player'}
                >
                    {isMinimized ? (
                        // Expand icon (<)
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    ) : (
                        // Collapse icon (>)
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    )}
                </button>

                {/* 4. Adjust opacity so content fades out smoothly based on isMinimized state. */}
                <div
                    className={`pl-8 p-4 transition-opacity duration-300 ${isMinimized ? 'opacity-0' : 'opacity-100'}`}
                >
                    <div className="flex justify-between items-center mb-3">
                        <div>
                            <h3 className="font-mono text-xl font-bold text-blue-600 dark:text-blue-400 truncate">{song.title ? song.title : `BGM ${song.id}`}</h3>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400" title={song.title || ''}>
                                { `${Number(song.id) < 10000 ? '#'+song.id : ''} ${song.composer?.split('/').map(v=>'#'+v.replace(/\s/gi,'_')).join(' ') || ''}`}
                            </p>
                        </div>
                        <button onClick={onClose} className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="aspect-w-16 aspect-h-9 rounded-md overflow-hidden bg-black/70 dark:bg-black/90">
                        <div id="youtube-player"></div>
                    </div>
                </div>

            </div>
        </div>
    );
});


export async function loader({ context }: Route.LoaderArgs) {
    let i18n = getInstance(context);
    const locale = i18n.language as Locale

    return data({ locale, title: i18n.t("home:title") });
  }

// export const meta: MetaFunction<typeof rootLorder, {
//     "root": typeof rootLorder,
// }> = ({ matches, params }) => {
//     matches.find(m => m.id)
//     const rootMatch = matches.find(m => m.id === "root");
//     const locale_data = rootMatch ? rootMatch.loaderData : null;
//     const locale = locale_data ? locale_data.locale : DEFAULT_LOCALE;

//     const t = i18n.getFixedT(locale, undefined, 'home');

export function meta({ loaderData }: Route.MetaArgs) {

    const language = { ja: 'jp', ko: 'ko', en: 'en' }[loaderData.locale] as Language

    return createMetaDescriptor(
        getLocalizedText(TEXTS.title, language) + ' - ' + loaderData.title,
        getLocalizedText(TEXTS.description, language),
        "/img/j.webp"
    )
}
export const handle: AppHandle = {
    preload: (data) => {
      const { eventId } = useLoaderData<typeof rootLorder>().params
      return [
        {
          rel: 'preload',
          href: `/w/${data?.locale}.students.bin`,
          as: 'fetch',
          crossOrigin: 'anonymous',
        },
        {
          rel: 'preload',
          href: `/w/students_portrait.json`,
          as: 'fetch',
          crossOrigin: 'anonymous',
        },
        ...createLinkHreflang(`/utils/jukebox`)
      ]
    }
  }

export default function JukeboxPage() {
    // const [language, setLanguage] = useState<Language>('ko');
    // const [allBgm, setAllBgm] = useState<Bgm[]>([]);
    const allBgm = bgmData.sort((a,b)=>Number(a.id)-Number(b.id)) as Bgm[]
    const [studentData, setStudentData] = useState<StudentData>({});
    const [eventData, setEventData] = useState<EventData>({});
    const [filteredBgm, setFilteredBgm] = useState<Bgm[]>([]);
    const [currentSong, setCurrentSong] = useState<Bgm | null>(null);
    const playerRef = useRef<any>(null);

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [otherStoryData, setOtherStoryData] = useState<OtherStoryData>(otherStoryTitles); // Load virtual data

    const [searchTerm, setSearchTerm] = useState<string>('');
    const [spoilerFilters, setSpoilerFilters] = useState<{
        general: Record<string, boolean>;
        mainStories: Record<string, boolean>;
        eventStories: Record<string, boolean>;
        favorStudents: Record<string, boolean>; // Favor Story student filter
        memorialStudents: Record<string, boolean>; // Memorial Lobby student filter
    }>({ general: {}, mainStories: {}, eventStories: {}, favorStudents: {}, memorialStudents: {} });
    const [mainStoryList, setMainStoryList] = useState<[string, string][]>([]);
    const [eventStoryList, setEventStoryList] = useState<[string, string][]>([]);
    const [studentFilterList, setStudentFilterList] = useState<[string, Student][]>([]); // Add student list state

    const [isMainStoryModalOpen, setMainStoryModalOpen] = useState<boolean>(false);
    const [isEventStoryModalOpen, setEventStoryModalOpen] = useState<boolean>(false);
    const [expandedBgmIds, setExpandedBgmIds] = useState<Record<string, boolean>>({}); // Individual detail state (changed)
    const [playbackMode, setPlaybackMode] = useState<PlaybackMode>('autoplay'); // Replaces isAutoplayEnabled
    const [isFavorStudentModalOpen, setFavorStudentModalOpen] = useState<boolean>(false); // Favor Story modal state
    const [isMemorialStudentModalOpen, setMemorialStudentModalOpen] = useState<boolean>(false); // Memorial Lobby modal state
    const [showStoryNames, setShowStoryNames] = useState<boolean>(false); // Story title toggle state
    const [sortOrder, setSortOrder] = useState<'ascending' | 'descending'>('ascending'); //Sort order state

    const filterPanelRef = useRef<HTMLDivElement>(null);
    const { i18n } = useTranslation("dashboard");
    const locale = i18n.language as Locale
    const language = { ja: 'jp', ko: 'ko', en: 'en' }[locale] as Language

    const fetchStudents = useDataCache<Record<string, Student>>();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [studentsRes] = await Promise.all([
                    // fetch('/ew/bgm_database_combined.json'),
                    fetchStudents(`/w/${locale}.students.bin`, res => res.json() as Promise<Record<string, Student>>),
                ]);
                // if (!bgmRes.ok) throw new Error('Failed to fetch data files.');

                // const bgmData: Bgm[] = await bgmRes.json();
                const studentJson = studentsRes;
                const eventJson: EventData = eventList as any;

                // setAllBgm(bgmData);
                setStudentData(studentJson);
                setEventData(eventJson);


                const mainStories = new Map<keyof typeof mainStoryChapters, string>();
                const eventStories = new Map<string, string>();
                const students = new Map<string, Student>();

                bgmData.forEach(bgm => bgm.xref.forEach(xref => {
                    if (xref.type === 'Main_Story' && xref.title) {
                        const titleKey = String(xref.title) as keyof typeof mainStoryChapters;
                        if(mainStoryChapters[titleKey]) {
                            mainStories.set(titleKey, getLocalizedText(mainStoryChapters[titleKey], language));
                        } else {
                            mainStories.set(titleKey, titleKey); // If translation info is missing, use the key value as is
                        }
                    }

                    if (xref.type === 'Event_Story' && xref.title) {
                        eventStories.set(
                            String(xref.title),
                            (!Number.isNaN(Number(xref.title)) ? eventJson[eventConvertor[Number(xref.title) as keyof typeof eventConvertor]]?.[{ en: 'En', ja: 'Jp', ko: 'Kr' }[locale] as 'En' | 'Jp' | 'Kr'] : '') || (Number(xref.title) ? eventJson[eventConvertor[Number(xref.title) as keyof typeof eventConvertor]]?.Jp : '') || xref.title.toString()
                        );
                    }
                    if ((xref.type === 'Favor_Story' || xref.type === 'Memorial') && xref.title) {
                        const studentId = String(xref.title);
                        if (studentJson[studentId] && !students.has(studentId)) {
                            students.set(studentId, studentJson[studentId]);
                        }
                    }

                }));


                // setMainStoryList(Array.from(mainStories.entries()).sort());
                // setEventStoryList(Array.from(eventStories.entries()).sort((a, b) => -Number(a[0])+Number(b[0])));
                setEventStoryList(Array.from(eventStories.entries()).sort((a, b) => (Number(isNaN(Number(a[0]))) - Number(isNaN(Number(b[0])))) || (Number(b[0]) - Number(a[0]))))
                setStudentFilterList(Array.from(students.entries()).sort((a, b) => a[1].Name.localeCompare(b[1].Name))); // Set student list state
                setMainStoryList(Array.from(mainStories.entries()).sort((a, b) => - Number(new Date(mainStoryChapters[a[0]].date)) + Number(new Date(mainStoryChapters[b[0]].date))));

                setSpoilerFilters({
                    general: Object.fromEntries(Object.keys(GENERAL_CATEGORIES).map(k => [k, false])),
                    mainStories: Object.fromEntries(Array.from(mainStories.keys()).map(k => [k, false])),
                    eventStories: Object.fromEntries(Array.from(eventStories.keys()).map(k => [k, false])),
                    favorStudents: Object.fromEntries(Array.from(students.keys()).map(k => [k, false])), // Initialize Favor Story filter
                    memorialStudents: Object.fromEntries(Array.from(students.keys()).map(k => [k, false])), // Initialize Memorial Lobby filter
                });


            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (!isLoading && !error) {
            const activeGeneral = Object.entries(spoilerFilters.general).filter(([, v]) => v).map(([k]) => k);
            const activeMain = Object.keys(spoilerFilters.mainStories).filter(k => spoilerFilters.mainStories[k]);
            const activeEvents = Object.keys(spoilerFilters.eventStories).filter(k => spoilerFilters.eventStories[k]);
            const activeFavorStudents = Object.keys(spoilerFilters.favorStudents).filter(k => spoilerFilters.favorStudents[k]);
            const activeMemorialStudents = Object.keys(spoilerFilters.memorialStudents).filter(k => spoilerFilters.memorialStudents[k]);


            let results: Bgm[] = [];
            if ([...activeGeneral, ...activeMain, ...activeEvents, ...activeFavorStudents, ...activeMemorialStudents].length > 0) {

                results = allBgm.filter(bgm => bgm.xref.some(xref => {
                    if (xref.type === 'Favor_Story' && xref.title && activeFavorStudents.includes(String(xref.title))) return true;
                    if (xref.type === 'Memorial' && xref.title && activeMemorialStudents.includes(String(xref.title))) return true;
                    if ((xref.type === 'raid' || xref.type === 'limitraid') && activeGeneral.includes('Raid')) return true;
                    if ((xref.type === 'UI') && activeGeneral.includes('Other')) return true;
                    if ((xref.type === 'main_work' || xref.type === 'event_work') && activeGeneral.includes('Work')) return true;
                    if (xref.type === 'Main_Story' && xref.title && activeMain.includes(String(xref.title))) return true;
                    if (xref.type === 'Event_Story' && xref.title && activeEvents.includes(String(xref.title))) return true;
                    if (xref.type === 'Group_Story' && activeGeneral.includes('GroupStory')) return true;
                    if (xref.type === 'Mini_Story' && activeGeneral.includes('MiniStory')) return true;
                    if ((xref.type === 'Work_Story' ) && activeGeneral.includes('WorkStory')) return true;

                    return false;
                }));
            }
            if (searchTerm) {
                const lowerSearchTerm = searchTerm.toLowerCase();
                results = results.filter(bgm =>
                    bgm.id.includes(lowerSearchTerm) || // Search by ID
                    bgm.title?.toLowerCase().includes(lowerSearchTerm) || // Search by title
                    bgm.composer?.toLowerCase().includes(lowerSearchTerm) // Search by composer
                );
            }

            // Sorting logic based on sortOrder state
            results.sort((a, b) => {
                const idA = Number(a.id);
                const idB = Number(b.id);
                if (sortOrder === 'ascending') {
                    return idA - idB;
                } else {
                    return idB - idA;
                }
            });
            setFilteredBgm(results);
        }
    }, [showStoryNames, searchTerm, spoilerFilters, allBgm, isLoading, error, sortOrder]);

    const playNextRandomSong = useCallback(() => {
        if (filteredBgm.length === 0) return;
        let nextIndex;
        do {
            nextIndex = Math.floor(Math.random() * filteredBgm.length);
        } while (filteredBgm.length > 1 && filteredBgm[nextIndex].id === currentSong?.id);
        setCurrentSong(filteredBgm[nextIndex]);
    }, [filteredBgm, currentSong?.id]); // Remove isAutoplayEnabled dependency


    const playNextRef = useRef(playNextRandomSong);
    useEffect(() => {
        playNextRef.current = playNextRandomSong;
    }, [playNextRandomSong]);

    const stableOnSongEnd = useCallback((player: any) => {
        if (playbackMode === 'autoplay') {
            playNextRef.current();
        } else if (playbackMode === 'repeat' && player) {
            player.seekTo(0);
            player.playVideo();
        }
        // Do nothing if in 'off' mode
    }, [playbackMode]);


    useEffect(() => {
        if (window.YT) return;
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }, []);


    const handleCyclePlaybackMode = () => {
        setPlaybackMode(prev => {
            if (prev === 'autoplay') return 'repeat';
            if (prev === 'repeat') return 'off';
            return 'autoplay';
        });
    };


    // 2. Part for passing a stable callback to the Player component


    // 3. Handler function for "Random Play" button (directly calls playNextRandomSong() instead of the previous handleSongEnd())
    const handlePlayRandom = () => {
        playNextRandomSong();
    };

    const handleFilterToggle = (type: 'general' | 'mainStories' | 'eventStories' | 'favorStudents' | 'memorialStudents', key: string) => setSpoilerFilters(p => ({ ...p, [type]: { ...p[type], [key]: !p[type][key] } }));

    const handleToggleAll = (type: 'mainStories' | 'eventStories', allIds: string[]) => {
        const allSelected = allIds.every(id => spoilerFilters[type][id]);
        const newFilters = { ...spoilerFilters[type] };
        allIds.forEach(id => { newFilters[id] = !allSelected; });
        setSpoilerFilters(p => ({ ...p, [type]: newFilters }));
    };

    const handleStudentToggleAll = (type: 'favorStudents' | 'memorialStudents', filteredIds: string[]) => {
        const allSelected = filteredIds.every(id => spoilerFilters[type][id]);
        const newStudentFilters = { ...spoilerFilters[type] };
        filteredIds.forEach(id => { newStudentFilters[id] = !allSelected; });
        setSpoilerFilters(p => ({ ...p, [type]: newStudentFilters }));
    };


    const handleToggleDetails = (bgmId: string) => {
        setExpandedBgmIds(prev => ({
            ...prev,
            [bgmId]: !prev[bgmId],
        }));
    };

    const handleToggleAllDetails = () => {
        const allAreExpanded = filteredBgm.length > 0 && filteredBgm.every(bgm => !!expandedBgmIds[bgm.id]);
        if (allAreExpanded) {
            setExpandedBgmIds({}); // Collapse all
        } else {
            const allIds = Object.fromEntries(filteredBgm.map(bgm => [bgm.id, true]));
            setExpandedBgmIds(allIds); // Expand all
        }
    };



    const renderXrefLine = (xref: Xref, bgm: Bgm): string => {
        // const name = showStoryNames ? getLocalizedTextArr(xref.name, locale as Language) || getLocalizedTextArr(xref.name, 'ja' as Language) || getLocalizedTextArr(xref.name, 'ko' as Language) : '';
        const name_title = getLocalizedTextArr(xref.name, locale as Language) || getLocalizedTextArr(xref.name, 'ja' as Language) || getLocalizedTextArr(xref.name, 'ko' as Language)
        let name = ((name_title:string|string[])=>{
            if (Array.isArray(name_title)){
                if (showStoryNames) return name_title.join(' - ')
                else return name_title[0] || ''
            }else{
                return name_title
            }
        })(name_title);

        let baseString = '';
        let episodeString = '';

        if (xref.episode) {
            if (xref.type === 'Favor_Story' || xref.type === 'Memorial') {
                episodeString = `${getLocalizedText(TEXTS.rank, language)}${xref.episode}`;
                if (showStoryNames) name = `${episodeString} - ${name}`
                else name = episodeString

            } else {
                episodeString = ` ${getLocalizedText(TEXTS.episode, language).replace('{x}', String(xref.episode))}`;
            }
        }

        switch (xref.type) {
            case 'Main_Story':
                // baseString = `${getLocalizedText(XREF_PREFIXES.Main_Story, language)} ${xref.title} - ${name}`;
                // break;
                const mainTitleKey = String(xref.title) as keyof typeof mainStoryChapters;
                const localizedMainTitle = mainStoryChapters[mainTitleKey] ? getLocalizedText(mainStoryChapters[mainTitleKey], language) : mainTitleKey;
                baseString = `${getLocalizedText(XREF_PREFIXES.Main_Story, language)} ${localizedMainTitle}  ${name}`;
                break;

            case 'Event_Story':
                const eventName = (!Number.isNaN(Number(xref.title)) && eventData[eventConvertor[Number(xref.title) as keyof typeof eventConvertor]]?.[{ en: 'En', ja: 'Jp', ko: 'Kr' }[locale] as 'En' | 'Jp' | 'Kr']) || xref.title?.toString();
                baseString = `${getLocalizedText(XREF_PREFIXES.Event_Story, language)} ${eventName} ${name}`;
                break;
            case 'Favor_Story': case 'Memorial':
                const prefix = xref.type === 'Favor_Story'
                    ? getLocalizedText(XREF_PREFIXES.Favor_Story, language)
                    : getLocalizedText(XREF_PREFIXES.Memorial, language);
                const studentId = xref.title || bgm.xref.find(x => x.type === 'Favor_Story')?.title;
                const studentName = studentId ? studentData[studentId]?.Name || '' : '';
                if (xref.type == 'Favor_Story') baseString = `${prefix} ${studentName} ${name}`;
                else if (xref.type == 'Memorial') baseString = `${prefix} ${studentName}`;
                break;
            case 'event_work': case 'main_work':
                baseString = `${getLocalizedText(XREF_PREFIXES.Work, language)} ${name}`;
                break;
            case 'UI':
                baseString = `${getLocalizedText(XREF_PREFIXES.UI, language)} ${name}`;
                break;

            case 'raid':
                baseString = `${getLocalizedText(XREF_PREFIXES.raid, language)} ${xref.title}`;
                break;
            case 'limitraid':
                baseString = `${getLocalizedText(XREF_PREFIXES.limitraid, language)} ${xref.title}`;
                break;
            case 'Group_Story':
                const groupTitle = xref.title ? getLocalizedText(otherStoryData.Group_Story[String(xref.title) as keyof typeof otherStoryData.Group_Story], language) : '';
                baseString = `${getLocalizedText(XREF_PREFIXES.Group_Story, language)} ${groupTitle} ${name}`;
                break;
            case 'Mini_Story':
                const miniTitle = xref.title ? getLocalizedText(otherStoryData.Mini_Story[String(xref.title) as keyof typeof otherStoryData.Mini_Story], language) : '';
                baseString = `${getLocalizedText(XREF_PREFIXES.Mini_Story, language)} ${miniTitle} ${name}`;
                break;
            case 'Work_Story':
                baseString = `${getLocalizedText(XREF_PREFIXES.Work_Story, language)} ${name}`;
                break;


            default:
                baseString = name.trim() || `${xref.title}`;
        }
        return baseString// + episodeString;
    };


    const pageBackground = "bg-gradient-to-b from-sky-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 text-neutral-800 dark:text-neutral-200";

    if (isLoading) return <div className={`flex items-center justify-center min-h-screen font-sans ${pageBackground}`}>{getLocalizedText(TEXTS.loading, language)}</div>;
    if (error) return <div className={`flex items-center justify-center min-h-screen font-sans ${pageBackground} text-red-500`}>{getLocalizedText(TEXTS.error, language)}: {error}</div>;

    return (
        <div className={`min-h-screen font-sans ${pageBackground}`}>
            <div className="max-w-7xl mx-auto p-2 sm:p-4 lg:p-8">
                {/* Header: Apply gradient title similar to the main page */}
                <header className="mb-8 p-4 sm:p-0 ml-1">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-blue-500 to-cyan-400 mt-3 mb-2 tracking-tight">
                        {getLocalizedText(TEXTS.title, language)}
                    </h1>
                    <p className="text-lg text-neutral-600 dark:text-neutral-300 max-w-3xl">
                        {getLocalizedText(TEXTS.description, language)}
                    </p>
                </header>

                <hr className="mb-6 border-neutral-200 dark:border-neutral-700" />

                <main className="grid grid-cols-1 md:grid-cols-3 gap-8" ref={filterPanelRef}>
                    {/* Filter Sidebar: Apply Glassmorphism style card */}
                    <div className="md:col-span-1 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-md rounded-xl p-6 flex flex-col gap-5 self-start sticky top-6 shadow-lg border border-neutral-200 dark:border-neutral-700">

                        {/* 1. Integrate header and search bar */}
                        <div >
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
                                {getLocalizedText(TEXTS.filter_title, language)}
                            </h2>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                    </svg>
                                </span>
                                <input
                                    type="text"
                                    placeholder={getLocalizedText(TEXTS.search_placeholder, language)}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white/50 dark:bg-neutral-900/50 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:placeholder-neutral-400"
                                />
                            </div>
                        </div>

                        {/* 2. Change story filters to a 2x2 grid */}
                        <div className="grid grid-cols-2 gap-2">
                            {/* Add logic to calculate the number of selected items for each button */}
                            <button onClick={() => setMainStoryModalOpen(true)} className="text-sm text-center py-2 px-3 bg-neutral-100 dark:bg-neutral-700/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors text-neutral-700 dark:text-neutral-200">
                                {getLocalizedText(TEXTS.select_main_story, language)}
                                <span className="block text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                    ({Object.entries(spoilerFilters.mainStories).filter(([, b]) => b).length}/{mainStoryList.length})
                                </span>
                            </button>
                            <button onClick={() => setEventStoryModalOpen(true)} className="text-sm text-center py-2 px-3 bg-neutral-100 dark:bg-neutral-700/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors text-neutral-700 dark:text-neutral-200">
                                {getLocalizedText(TEXTS.select_event_story, language)}
                                <span className="block text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                    ({Object.entries(spoilerFilters.eventStories).filter(([, b]) => b).length}/{eventStoryList.length})
                                </span>
                            </button>
                            <button onClick={() => setFavorStudentModalOpen(true)} className="text-sm text-center py-2 px-3 bg-neutral-100 dark:bg-neutral-700/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors text-neutral-700 dark:text-neutral-200">
                                {getLocalizedText(TEXTS.select_favor_story, language)}
                                <span className="block text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                    ({Object.entries(spoilerFilters.favorStudents).filter(([, b]) => b).length}/{studentFilterList.length})
                                </span>
                            </button>
                            <button onClick={() => setMemorialStudentModalOpen(true)} className="text-sm text-center py-2 px-3 bg-neutral-100 dark:bg-neutral-700/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors text-neutral-700 dark:text-neutral-200">
                                {getLocalizedText(TEXTS.select_memorial, language)}
                                <span className="block text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                    ({Object.entries(spoilerFilters.memorialStudents).filter(([, b]) => b).length}/{studentFilterList.length})
                                </span>
                            </button>
                        </div>

                        {/* 3. Change general filters to horizontal toggle buttons */}
                        <div className="grid grid-cols-3 gap-2">
                            {Object.entries(GENERAL_CATEGORIES).map(([key, value]) => (
                                <button
                                    key={key}
                                    onClick={() => handleFilterToggle('general', key)}
                                    className={`text-sm py-2 px-2 rounded-lg transition-colors ${spoilerFilters.general[key]
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-neutral-100 dark:bg-neutral-700/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                                        }`}
                                >
                                    {getLocalizedText(value, language)}
                                </button>
                            ))}
                        </div>



                        {/* 4. Reconstruct options and action buttons */}
                        <div className="flex flex-col gap-3 pt-2 border-t border-neutral-300 dark:border-neutral-700">
                            {/* Add story title toggle button */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{getLocalizedText(TEXTS.show_story_names, language)}</span>
                                <button onClick={() => setShowStoryNames(prev => !prev)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${showStoryNames ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-600'}`}>
                                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${showStoryNames ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{getLocalizedText(TEXTS.playbackOptions, language)}</span>
                                <button onClick={handleCyclePlaybackMode} className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-neutral-600 dark:text-neutral-300">
                                    {playbackMode === 'autoplay' && <><AutoplayIcon /> <span className="text-sm font-medium">{getLocalizedText(TEXTS.playback_mode_autoplay, language)}</span></>}
                                    {playbackMode === 'repeat' && <><RepeatIcon /> <span className="text-sm font-medium">{getLocalizedText(TEXTS.playback_mode_repeat, language)}</span></>}
                                    {playbackMode === 'off' && <><StopIcon /> <span className="text-sm font-medium">{getLocalizedText(TEXTS.playback_mode_off, language)}</span></>}
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={handleToggleAllDetails} disabled={filteredBgm.length === 0} className="w-full text-sm bg-neutral-500 hover:bg-neutral-600 dark:bg-neutral-600 dark:hover:bg-neutral-500 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 disabled:text-neutral-500 dark:disabled:text-neutral-500 text-white font-bold py-2 px-3 rounded-lg transition-colors">
                                    {filteredBgm.length > 0 && filteredBgm.every(bgm => !!expandedBgmIds[bgm.id])
                                        ? getLocalizedText(TEXTS.hide_all_details, language)
                                        : getLocalizedText(TEXTS.view_all_details, language)}
                                </button>
                                <button onClick={handlePlayRandom} disabled={filteredBgm.length === 0} className="w-full text-sm bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 disabled:text-neutral-500 dark:disabled:text-neutral-500 text-white font-bold py-2 px-3 rounded-lg transition-colors">{getLocalizedText(TEXTS.play_random, language)}</button>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-md rounded-xl p-4 sm:p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
                        <div className="flex justify-between items-center mb-4 px-1">
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                                {getLocalizedText(TEXTS.bgm_list_title, language)} {/* 'BGM List' translation needs to be added */}
                            </h2>
                            <button
                                onClick={() => setSortOrder(prev => prev === 'ascending' ? 'descending' : 'ascending')}
                                className="flex items-center gap-1.5 p-2 rounded-lg bg-neutral-100 dark:bg-neutral-700/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors"
                                aria-label={getLocalizedText(TEXTS.sort_order, language)}
                            >
                                {sortOrder === 'ascending' ? <FaSortAmountDown className="h-4 w-4" /> : <FaSortAmountUp className="h-4 w-4" />}
                            <span className="text-sm font-medium">
                                {sortOrder === 'ascending' ? getLocalizedText(TEXTS.sort_ascending, language) : getLocalizedText(TEXTS.sort_descending, language)}
                            </span>
                            </button>
                        </div>
                        <style>
                            {`@keyframes wave {
                                0%, 100% { transform: scaleY(0.8); }
                                50% { transform: scaleY(1); }
                            }`}
                        </style>
                        <div className="max-h-[80vh] overflow-y-auto">
                            {filteredBgm.length > 0 ? (
                                <ul className="space-y-1">
                                    {filteredBgm.map(bgm => (
                                        <li key={bgm.id} className={`group p-3 px-1 sm:px-3 rounded-xl transition-all duration-300 border ${currentSong?.id === bgm.id ? 'bg-blue-100/50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-500 shadow-md' : 'bg-transparent hover:bg-neutral-100/50 dark:hover:bg-neutral-700/40 border-transparent'}`}>
                                            <div className="cursor-pointer" onClick={() => setCurrentSong(bgm)}>
                                                <div className="flex items-center justify-between"> {/* Justify-between for alignment to both ends */}

                                                    {/* 1. Existing BGM info display area (Left) */}
                                                    <div className="flex items-center min-w-0"> {/* min-w-0 prevents icons from being pushed out when the title is long */}
                                                        <span className="font-mono text-xl font-bold text-blue-500 dark:text-blue-400 w-12 shrink-0">{Number(bgm.id) < 10000 ? bgm.id : 'N/A' }</span>
                                                        <div className="grow pl-2">
                                                            <h3 className="font-bold text-lg text-neutral-800 dark:text-neutral-100 ">{bgm.title || `BGM #${bgm.id}`}</h3>
                                                            <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">{bgm.composer}</p>
                                                        </div>
                                                    </div>

                                                    {/* 2. Playback-related icon display area (Right) */}
                                                    {bgm.youtube_url && <div className="flex items-center justify-center w-12 h-12 shrink-0 ml-4">

                                                        {currentSong?.id === bgm.id ? (
                                                            // When playing: Always show sound wave icon
                                                            <div className="text-blue-500 dark:text-blue-400">
                                                                <SoundWaveIcon />
                                                            </div>
                                                        ) : (
                                                            // When not playing: Show play icon on hover
                                                            <div className="text-blue-500 dark:text-blue-400 ">
                                                                <PlayIcon />
                                                            </div>
                                                        )}
                                                    </div>}
                                                </div>
                                            </div>
                                            <div className="mt-1.5 pt-1.5 border-t border-neutral-400 dark:border-neutral-700/50">
                                                <button onClick={() => handleToggleDetails(bgm.id)} className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-semibold">
                                                    {!!expandedBgmIds[bgm.id] ? getLocalizedText(TEXTS.hide_details, language) : getLocalizedText(TEXTS.view_details, language)}
                                                </button>
                                                {!!expandedBgmIds[bgm.id] && (
                                                    <div className="mt-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 space-y-1.5 pl-3 border-l-2 border-neutral-400 dark:border-neutral-600 ml-2">
                                                        {bgm.xref
                                                            .filter(xref => {
                                                                const { general, mainStories, eventStories, favorStudents, memorialStudents } = spoilerFilters;
                                                                if (xref.type === 'Favor_Story' && favorStudents[String(xref.title)]) return true;
                                                                if (xref.type === 'Memorial' && memorialStudents[String(xref.title)]) return true;
                                                                if ((xref.type === 'UI') && general.Other) return true;
                                                                if ((xref.type === 'raid' || xref.type === 'limitraid') && general.Raid) return true;
                                                                if ((xref.type === 'main_work' || xref.type === 'event_work') && general.Work) return true;
                                                                if (xref.type === 'Main_Story' && xref.title && mainStories[String(xref.title)]) return true;
                                                                if (xref.type === 'Event_Story' && xref.title && eventStories[String(xref.title)]) return true;
                                                                if (xref.type === 'Group_Story' && general.GroupStory) return true;
                                                                if (xref.type === 'Mini_Story' && general.MiniStory) return true;
                                                                if (xref.type === 'Work_Story'  && general.WorkStory) return true;

                                                                return false;
                                                            })
                                                            .map((x, i) => <div key={i}><RubyText>{renderXrefLine(x, bgm)}</RubyText></div>)
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        </li>))}
                                </ul>
                            ) : (<p className="text-center text-neutral-500 dark:text-neutral-400 py-12">{getLocalizedText(TEXTS.no_results, language)}</p>)}
                        </div>
                    </div>
                </main>
            </div>

            <FilterModal isOpen={isMainStoryModalOpen} onClose={() => setMainStoryModalOpen(false)} title={getLocalizedText(TEXTS.select_main_story, language)} items={mainStoryList} selectedItems={spoilerFilters.mainStories} onToggleItem={(id) => handleFilterToggle('mainStories', id)} onToggleAll={() => handleToggleAll('mainStories', mainStoryList.map(([id]) => id))} language={language} />
            <FilterModal isOpen={isEventStoryModalOpen} onClose={() => setEventStoryModalOpen(false)} title={getLocalizedText(TEXTS.select_event_story, language)} items={eventStoryList} selectedItems={spoilerFilters.eventStories} onToggleItem={(id) => handleFilterToggle('eventStories', id)} onToggleAll={() => handleToggleAll('eventStories', eventStoryList.map(([id]) => id))} language={language} />

            {/* Use new StudentFilterModal */}
            <StudentFilterModal isOpen={isFavorStudentModalOpen} onClose={() => setFavorStudentModalOpen(false)} title={getLocalizedText(TEXTS.select_favor_story, language)} items={studentFilterList} selectedItems={spoilerFilters.favorStudents} onToggleItem={(id) => handleFilterToggle('favorStudents', id)} onToggleAll={(filteredIds) => handleStudentToggleAll('favorStudents', filteredIds)} language={language} />
            <StudentFilterModal isOpen={isMemorialStudentModalOpen} onClose={() => setMemorialStudentModalOpen(false)} title={getLocalizedText(TEXTS.select_memorial, language)} items={studentFilterList} selectedItems={spoilerFilters.memorialStudents} onToggleItem={(id) => handleFilterToggle('memorialStudents', id)} onToggleAll={(filteredIds) => handleStudentToggleAll('memorialStudents', filteredIds)} language={language} />


            <button
                onClick={() => {
                    if (filterPanelRef.current) {
                        window.scrollTo({
                            top: filterPanelRef.current.offsetTop - 60, // 24px (sticky top-6) margin/space
                            behavior: 'smooth'
                        });
                    }
                }}
                className="md:hidden fixed bottom-4 left-4 z-51 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Scroll to Filter"
            >
                <FilterIcon />
            </button>

            <Player
                song={currentSong}
                onClose={() => setCurrentSong(null)}
                onSongEnd={stableOnSongEnd}
            />
            <style>{`@keyframes slide-in-right{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}.animate-slide-in-right{animation:slide-in-right .3s ease-out forwards}`}</style>
        </div>
    );
}

