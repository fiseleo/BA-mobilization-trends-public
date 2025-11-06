
export const eventConvertor = {
    0: 801, // Cherry Blossom Bonanza!
    1: 802, // Ivan Kupala of the Revolution
    2: 803, // Summer Sky's Wishlist
    3: 804, // Prefect Team Leader Hina's Summer Vacation!
    4: 805, // Tag in Neverland
    5: 806, // Bunny Chasers on Board
    6: 808, // No. 227 Hot Spring Resort Operations Log!
    7: 809, // New Year's Rhapsody No. 68
    8: 810, // Schale's Happy♡Valentine Patrol
    9: 811, // Kosaka Wakamo's Silence and Feast
    10: 812, // The Clumsy Sister and the Magician of the Old Library
    11: 813, // An Unbending Heart
    12: 814, // Abydos Resort Restoration Task Force
    13: 815, // Business Trip! Hyakkiyako Seaside House Franchise Plan
    14: 816, // After-School Sweets Story ~Sweet Secrets and Gunfights~
    15: 817, // ON YOUR MARK ＠ MILLENNIUM
    16: 818, // Get Set, Go! ~Kivotos Halo Games~
    17: 819, // Merry Christmas in the Cathedral ~Gift of the Relief Knights~
    18: 820, // New Year's Aperitif ~New Year's Showdown~
    19: 822, // Atra-Hasis's Ark Occupation
    20: 824, // Restoration Work: D.U. Shiratori District
    22: 824,
    23: 825, // The Pure White Calling Card ~The False Mansion and Where Aesthetics Lie~
    24: 826, // Ryomudongju ~What We Draw in Our Hearts is a Single Future~
    25: 827, // Summer Special Ops! The Rabbit's Chase for the Missing Shrimp
    26: 828, // In Search of the Hidden Heritage ~Trinity's Extracurricular Activities~
    27: 829, // Academy Doujin Story ~The Finale the Two Reached~
    28: 830, // Trip-Trap-Train
    29: 831, // A Certain Scientific Youth Record
    30: 832, // Cyber New Year March
    31: 833, // Their Nocturne Towards the Light
    32: 834, // From Opera 0068 With Love!
    33: 835, // Bustling and Harmoniously
    34: 836, // -ive aLIVE!
    35: 837, // Say-Bing!
    36: 838, // Sheside outside
    37: 839, // Wolhwamongso
    38: 840, // Gentle on the Outside, Strong on the Inside
    39: 841, // Serenade Promenade
    40: 842, // The Secret Midnight Party ~Tag as the Bell Tolls~
    41: 843, // Code: BOX The Shadow Creeping Up on Millennium~ One Question and Two Answers ~
    42: 844, // Pandemic Hazard ~ The Miraculous Pancake ~
    43: 845, // Pray-Ball! ~ Aim for the Grand Slam! ~
    44: 846, // The Highlander Railway Runaway Incident ~And Then There Were No Trains~
    45: 847, // A Single Flower Bloomed from the Sand ~A Fair and Square, Aquatic Showdown~
    46: 848, // Summer Sky's Promise
    47: 849, // We Are the Occult Research Club! ~School Mysteries and Ancient Spells~
    48: 850, // For Whom is This Art? ~The Whereabouts of Forgery and Aesthetics~
    49: 851, // Magical Girl
}


// --- TEXT CONSTANTS ---
export const TEXTS = {
    title: { ko: "BGM 플레이어", jp: "BGMプレーヤー", en: "BGM Player" },
    description: { ko: "\"블루 아카이브\"의 번호가 붙어있는 BGM 조회", jp: "「ブルーアーカイブ」の番号が付いているBGM照会", en: "Search for numbered BGM of \"Blue Archive\"" },
    filter_title: { ko: "스포일러 필터", jp: "ネタバレフィルター", en: "Spoiler Filter" },
    select_main_story: { ko: "메인 스토리 선택", jp: "メインストーリー選択", en: "Select Main Stories" },
    select_event_story: { ko: "이벤트 스토리 선택", jp: "イベントストーリー選択", en: "Select Event Stories" },
    select_favor_story: { ko: "인연 스토리 선택", jp: "絆ストーリー選択", en: "Choose relationship Stories" },
    select_memorial: { ko: "메모리얼 로비 선택", jp: "メモリアルロビー選択", en: "Select Memorial Lobby" },
    view_details: { ko: "상세정보 보기", jp: "詳細表示", en: "View Details" },
    hide_details: { ko: "상세정보 닫기", jp: "詳細非表示", en: "Hide Details" },
    show_story_names: { ko: "스토리 제목 표시", jp: "ストーリータイトル表示", en: "Show Story Titles" },
    hide_story_names: { ko: "스토리 제목 숨김", jp: "ストーリータイトル非表示", en: "Hide Story Titles" },
    view_all_details: { ko: "모든 상세정보 펼치기", jp: "すべての詳細を開く", en: "Expand All Details" },
    hide_all_details: { ko: "모든 상세정보 닫기", jp: "すべての詳細を閉じる", en: "Collapse All Details" },

    search_placeholder: { ko: "제목, 작곡가로 검색...", jp: "タイトル、作曲者で検索...", en: "Search by title, composer..." },
    no_results: { ko: "결과가 없습니다. 스포일러 방지를 위해 필터를 설정해야 결과가 표시됩니다.", jp: "結果はありません。 結果を表示する前に、ネタバレを防止するためのフィルタを設定する必要があります。", en: "No results. Filters must be set to prevent spoilers before the results are displayed." },

    playbackOptions: { ko: "재생 옵션", en: "Playback Options", jp: "再生オプション" },
    selectAll: { ko: "전체 선택", en: "Select All", jp: "すべて選択" },
    deselectAll: { ko: "전체 해제", en: "Deselect All", jp: "すべて選択解除" },
    deselectAllSearched: { ko: "검색된 학생 전체 해제", en: "Deselect All Searched Students", jp: "検索された学生をすべて選択解除" },
    selectAllSearched: { ko: "검색된 학생 전체 선택", en: "Select All Searched Students", jp: "検索された学生をすべて選択" },
    searchStudentName: { ko: "학생 이름 검색...", jp: "生徒名検索...", en: "Search student name..." },

    play_random: { ko: "랜덤 재생", jp: "ランダム再生", en: "Play Random" },
    autoplay: { ko: "다음 곡 자동 재생", jp: "自動再生", en: "Autoplay" }, // Additional
    playback_mode_autoplay: { ko: "다음 곡 자동재생", jp: "次の曲を自動再生", en: "Autoplay Next" },
    playback_mode_repeat: { ko: "현재 곡 반복", jp: "現在の曲をリピート", en: "Repeat Current" },
    playback_mode_off: { ko: "재생 후 정지", jp: "再生後に停止", en: "Stop After" },

    close: { ko: "닫기", jp: "閉じる", en: "Close" },
    loading: { ko: "데이터 로딩 중...", jp: "データ読み込み中...", en: "Loading data..." },
    error: { ko: "오류가 발생했습니다.", jp: "エラーが発生しました。", en: "An error occurred." },
    rank: { ko: "인연랭크_", jp: "絆", en: "rank_" },
    episode: { ko: "({x}화)", jp: "（第{x}話）", en: "(Episode {x})" },
    bgm_list_title: { ja: 'BGMリスト', ko: 'BGM 목록', en: 'BGM List' },
    sort_ascending: { ja: '昇順', ko: '오름차순', en: 'Ascending' },
    sort_descending: { ja: '降順', ko: '내림차순', en: 'Descending' },
    sort_order: { ja: '並び替え', ko: '정렬 순서', en: 'Sort Order' }
};

export const GENERAL_CATEGORIES = {
    Work: { ko: "임무", jp: "任務", en: "Missions" },
    Raid: { ko: "총력전", jp: "総力戦", en: "Raids" },
    GroupStory: { ko: "그룹 스토리", jp: "グループストーリー", en: "Group Story" },
    MiniStory: { ko: "미니 스토리", jp: "ミニストーリー", en: "Mini Story" },
    WorkStory: { ko: "업무 스토리", jp: "業務ストーリー", en: "Work Story" },
    Other: { ko: "기타 (UI, 로비 등)", jp: "その他（UIなど）", en: "Other (UI, etc.)" }
};

export const XREF_PREFIXES = {
    Main_Story: { ko: "[메인]", jp: "[メイン]", en: "[Main]" },
    Event_Story: { ko: "[이벤트]", jp: "[イベント]", en: "[Event]" },
    Favor_Story: { ko: "[인연]", jp: "[絆]", en: "[Favor]" },
    Memorial: { ko: "[메모리얼]", jp: "[メモリアル]", en: "[Memorial]" },
    Work: { ko: "[임무]", jp: "[任務]", en: "[Mission]" },
    UI: { ko: "[UI]", jp: "[UI]", en: "[UI]" },
    raid: { ko: "[총력전]", jp: "[総力戦]", en: "[T. Assault]" },
    limitraid: { ko: "[제약해제결전]", jp: "[制約解除決戦]", en: "[Final Restriction Release]" },
    Group_Story: { ko: "[그룹]", jp: "[グループ]", en: "[Group]" },
    Mini_Story: { ko: "[미니]", jp: "[ミニ]", en: "[Mini]" },
    Work_Story: { ko: "[업무]", jp: "[業務]", en: "[Work]" },

};

// --- ICON COMPONENTS ---
export const AutoplayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
);
export const RepeatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
    </svg>
);
export const StopIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
    </svg>
);


export const mainStoryChapters = {
    '1부 1장': { ko: 'Vol.1 1장 대책위원회의 기묘한 하루', jp: 'Vol.1 第1章 対策委員会の奇妙な一日', en: 'Vol.1 Ch.1', date:'2021/02/04'},
    '1부 2장': { ko: 'Vol.1 2장 잃은 것과 놓지 않은 것', jp: 'Vol.1 第2章 失ったもの、手放さなかったもの', en: 'Vol.1 Ch.2', date:'2021/03/11'},
    '1부 3장': { ko: 'Vol.1 3장 그 꿈이 남기고 간 흔적들', jp: 'Vol.1 第3章 夢が残した足跡', en: 'Vol.1 Ch.3', date:'2024/2/7'},
    '2부 1장': { ko: 'Vol.2 1장 레트로의 로망', jp: 'Vol.2 第1章 レトロチック・ロマン', en: 'Vol.2 Ch.1', date:'2021/03/25'},
    '2부 2장': { ko: 'Vol.2 2장 우정과 용기와 빛의 로망', jp: 'Vol.2 第2章 友情と勇気と光のロマン', en: 'Vol.2 Ch.2', date:'2022/11/23'},
    '3부 1장': { ko: 'Vol.3 1장 보충수업, 시작합니다!', jp: 'Vol.3 第1章 補習授業、スタート！', en: 'Vol.3 Ch.1', date:'2021/05/27'},
    '3부 2장': { ko: 'Vol.3 2장 증명 불가능한 문제', jp: 'Vol.3 第2章 不可能な証明', en: 'Vol.3 Ch.2', date:'2021/10/27'},
    '3부 3장': { ko: 'Vol.3 3장 우리들의 이야기를', jp: 'Vol.3 第3章 私たちの物語', en: 'Vol.3 Ch.3', date:'2021/12/15'},
    '3부 4장': { ko: 'Vol.3 4장 잊혀진 신들을 위한 키리에', jp: 'Vol.3 第4章 忘れられた神々のためのキリエ', en: 'Vol.3 Ch.4', date:'2022/5/24'},
    '4부 1장': { ko: 'Vol.4 1장 RABBIT 소대, 작전 개시!', jp: 'Vol.4 第1章 RABBIT小隊始動！', en: 'Vol.4 Ch.1', date:'2022/03/23'},
    '4부 2장': { ko: 'Vol.4 2장 We Were RABBITs!', jp: 'Vol.4 第2章 We Were RABBITs!', en: 'Vol.4 Ch.2', date:'2023/06/07'},
    '5부 1장': { ko: 'Vol.5 1장 피어나길 바라는 꽃망울처럼', jp: 'Vol.5 第1章 いつかの芽吹きを待ち侘びて', en: 'Vol.5 Ch.1', date:'2023/11/08'},
    '5부 2장': { ko: 'Vol.5 2장', jp: 'Vol.5 第2章 孤独に花を咲かせんとする君へ', en: 'Vol.5 Ch.2', date:'2025/05/21'},
    '6부 1장': { ko: 'Vol.6 1장', jp: 'Vol.6 第1章 見えない私たちの境界線 ', en: 'Vol.6 Ch.1', date:'2025/09/17'},
    '6부 2장': { ko: 'Vol.6 2장', jp: 'Vol.6 第2章 あの刻に告げし決別', en: 'Vol.6 Ch.2', date:'2025/10/08'},
    'Ex. 데카그라마톤 편 0장': { ko: 'Ex. 데카그라마톤 편 0장 지혜의 뱀', jp: 'Ex. デカグラマトン編 第1章 知恵の蛇', en: 'Ex. Decagrammaton Ch.0', date:'2021/11/09'},
    'Ex. 데카그라마톤 편 1장': { ko: 'Ex. 데카그라마톤 편 1장 불타는 검', jp: 'Ex. デカグラマトン編 第2章 炎の剣', en: 'Ex. Decagrammaton Ch.1', date:'2024/11/6'},
    'Final. 그리고 모든 기적이 시작되는 곳 편 1장': { ko: 'Final. 1장 샬레 탈환 작전', jp: 'Final. 第1章 シャーレ奪還作戦', en: 'Final Vol. Ch.1', date:'2023/01/22'},
    'Final. 그리고 모든 기적이 시작되는 곳 편 2장': { ko: 'Final. 2장 거짓된 성소 공략전', jp: 'Final. 第2章 虚妄のサンクトゥム攻略戦', en: 'Final Vol. Ch.2', date:'2023/01/24'},
    'Final. 그리고 모든 기적이 시작되는 곳 편 3장': { ko: 'Final. 3장 아트라하시스의 방주 점령전', jp: 'Final. 第3章 アトラ・ハシースの箱舟占領戦', en: 'Final Vol. Ch.3' , date:'2023/02/22'},
    'Final. 그리고 모든 기적이 시작되는 곳 편 4장': { ko: 'Final. 4장 프레나파테스 결전', jp: 'Final. 第4章 プレナパテス決戦', en: 'Final Vol. Ch.4', date:'2023/03/08'},
};

export const otherStoryTitles = {
    Group_Story: {
        '1': { ko: '게임개발부', jp: 'ゲーム開発部', en: 'Game Development Department' },
        // ... other group story titles
    },
    Mini_Story: {
        '1': { ko: '미니 스토리 예시', jp: 'ミニストーリーの例', en: 'Mini Story Example' },
        // ... other mini story titles
    },
};


export type OtherStoryData = typeof otherStoryTitles;

export const FilterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
);
