// src/routes/EventPage.tsx
import { useState, useMemo, useEffect, useRef } from 'react';
import { data, useLoaderData, useParams, type LoaderFunctionArgs, type MetaFunction } from 'react-router';
import { ApCalculator } from '~/components/planner/ApCalculator';
import { BonusSelector, type TotalBonusMap } from '~/components/planner/BonusSelector';
import { EventInfo } from '~/components/planner/EventInfo';
import ExportImportPanel from '~/components/planner/ExportImportPanel';
import { FarmingPlanner, type FarmingResult } from '~/components/planner/FarmingPlanner';
import { FloatingCurrencyStatus } from '~/components/planner/FloatingCurrencyStatus';
import { BoxGachaPlanner, type BoxGachaResult } from '~/components/planner/minigame/BoxGachaPlanner';
import { CardShopPlanner, type CardShopRates } from '~/components/planner/minigame/CardShopPlanner';
import { CustomGamePlanner, type CustomGameResult } from '~/components/planner/minigame/CustomGamePlanner';
import { DiceRacePlanner, type DiceRaceResult } from '~/components/planner/minigame/DiceRacePlanner';
import { FortuneGachaPlanner, type FortuneGachaResult } from '~/components/planner/minigame/FortuneGachaPlanner';
import { TreasurePlanner, type TreasureResult } from '~/components/planner/minigame/TreasurePlanner';
import { MissionPlanner, type MissionResult } from '~/components/planner/MissionPlanner';
import { ShopPlanner, type ShopResult } from '~/components/planner/ShopPlanner';
import { StudentGrowthPlanner } from '~/components/planner/StudentGrowth/StudentGrowthPlanner';
import { TotalBonusDisplay } from '~/components/planner/TotalBonusDisplay';
import { TotalRewardPlanner, type TotalRewardResult } from '~/components/planner/TotalRewardPlanner';
import type { EventData, IconData, StudentData, StudentPortraitData, TransactionEntry } from '~/types/plannerData';
import iconDataInfoModule from "~/data/event/icon_info.json"
import iconDataAllModule from "~/data/event/icon_img.json"
import { useTranslation } from 'react-i18next';

import { type Locale } from '~/utils/i18n/config';
import type { loader as rootLorder } from "~/root";
import { createLinkHreflang, createMetaDescriptor } from '~/components/head';
import eventList from "~/data/jp/eventList.json";
import { getlocaleMethond } from '~/components/planner/common/locale';
import { DreamMakerPlanner } from '~/components/planner/minigame/MinigameDreamPlanner';
import type { DreamMakerResult } from '~/components/planner/minigame/dreamMaker/type';
import { usePlanForEvent } from '~/store/planner/useEventPlanStore';
import type { Route } from './+types/EventPage';
import { getInstance } from '~/middleware/i18next';
import type { AppHandle } from '~/types/link';

// Increase management efficiency by integrating all stage info and assigning types beforehand
const getAllStages = (eventData: EventData) => [
  ...(eventData.stage.stage || []).map(s => ({ ...s, type: 'stage' as const })),
  ...(eventData.stage.story || []).map(s => ({ ...s, type: 'story' as const })),
  ...(eventData.stage.challenge || []).map(s => ({ ...s, type: 'challenge' as const })),
];

// --- Type definitions ---
type MainTabId = 'bonus' | 'goals' | 'minigame' | 'farming' | 'ap';
type SubTabId = 'shop' | 'growth' | 'mission' | 'stages' | 'custom' | 'box' | 'card' | 'treasure' | 'fortune' | 'total_reward' | 'dice_race' | 'minigame_dream';

export async function loader({ context, params, request }: LoaderFunctionArgs) {
  let i18n = getInstance(context);
  const locale = i18n.language as Locale
  return data({
    locale,
    siteTitle: i18n.t("home:title"),
    // title: i18n.t("dashboardIndex:title"),
    description: i18n.t("planner:page.plannerescription"),
    rerun: i18n.t("planner:common.rerun"),
  })
}

export function meta({ loaderData, params }: Route.MetaArgs) {

  const { eventId: eventIdStr } = params
  const eventId = Number(eventIdStr)
  const locale_key = getlocaleMethond('', 'Jp', loaderData.locale) as 'Jp' | 'Kr' | 'En'
  const format_name = (eventId > 10000 ? `[${loaderData.rerun}] ` : '') + ((eventList[String(eventId % 10000) as keyof typeof eventList][locale_key]) || (eventList[String(eventId % 10000) as keyof typeof eventList]['Jp']) || name || 'No event information');


  return createMetaDescriptor(
    format_name + ' - ' + loaderData.siteTitle,
    loaderData.description,
    "/img/p.webp"
  )
}

export const handle: AppHandle = {
  preload: (data) => {
    const { eventId } = useLoaderData<typeof rootLorder>().params
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
      ...createLinkHreflang(`/planner/event/${eventId}`)
    ]
  }
}

export const EventPage = () => {
  const { eventId: eventIdStr } = useParams<{ eventId: string }>(); // Extract event ID from URL
  const eventId = Number(eventIdStr)
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [iconData, setIconData] = useState<IconData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Student-related state
  const [allStudents, setAllStudents] = useState<StudentData>({});
  const [studentPortraits, setStudentPortraits] = useState<StudentPortraitData>({});

  // Farming plan related state
  const [availableAp, setAvailableAp] = useState(10000);
  const [farmingResult, setFarmingResult] = useState<FarmingResult | null>(null);

  // Shop plan related state (Moved to EventPage for central management)
  const [shopResult, setShopResult] = useState<ShopResult | null>(null);

  // Card shop flip count state
  const [cardShopRates, setCardShopRates] = useState<CardShopRates | null>(null);
  const [finalCardFlips, setFinalCardFlips] = useState(0);

  // State to store currently owned materials
  const [ownedCurrency, setOwnedCurrency] = useState<Record<number, number>>({});

  // State to store treasure hunt results
  const [treasureResult, setTreasureResult] = useState<TreasureResult | null>(null);

  // Add state to store FortuneGachaPlanner results
  const [fortuneGachaResult, setFortuneGachaResult] = useState<FortuneGachaResult | null>(null);

  const [diceRaceResult, setDiceRaceResult] = useState<DiceRaceResult | null>(null);


  const [boxGachaResult, setBoxGachaResult] = useState<BoxGachaResult | null>(null);
  const [customGameResult, setCustomGameResult] = useState<CustomGameResult | null>(null);
  const [dreamMakerResult, setDreamMakerResult] = useState<DreamMakerResult | null>(null);

  const [totalRewardResult, setTotalRewardResult] = useState<TotalRewardResult | null>(null);
  const [totalBonus, setTotalBonus] = useState<TotalBonusMap>({});

  // State to receive results from MissionPlanner
  const [missionResult, setMissionResult] = useState<MissionResult | null>(null);


  const [studentGrowthNeeds, setStudentGrowthNeeds] = useState<Record<string, number>>({}); // Student growth requirement state
  // tab
  const [activeMainTab, setActiveMainTab] = useState<MainTabId>('bonus');
  // const [activeSubTab, setActiveSubTab] = useState<SubTabId | null>(null);
  const [activeSubTabs, setActiveSubTabs] = useState<Partial<Record<MainTabId, SubTabId | null>>>({
    'goals': 'shop',
    'minigame': null,
    'farming': 'stages',
  });

  // Misc
  const { purchaseCounts } = usePlanForEvent(eventId)

  const currencyStatusRef = useRef<HTMLDivElement | null>(null);
  const tabNavRef = useRef<HTMLDivElement | null>(null);
  const [isMainCurrencyStatusVisible, setIsMainCurrencyStatusVisible] = useState(true);

  const { t, i18n } = useTranslation("planner");
  const { t: t_c } = useTranslation("common");
  const locale = i18n.language as Locale


  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsMainCurrencyStatusVisible(entry.isIntersecting);
      },
      { threshold: 0.1 } // Considered visible even if only 10% is showing
    );

    const currentRef = currencyStatusRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [currencyStatusRef.current]);


  const TABS: { id: MainTabId, name: string, subTabs?: { id: SubTabId, name: string }[] }[] = useMemo(() => {
    if (!eventData) return []; // Don&#39;t display tabs before data is loaded

    const allTabs: { id: MainTabId, name: string, subTabs?: { id: SubTabId, name: string }[] }[] = [
      { id: 'bonus', name: `1. ${t('ui.studentBonus')}` },
      {
        id: 'goals',
        name: `2. ${t('ui.targetSettings')}`,
        subTabs: [
          { id: 'shop', name: t('common.shop') },
          { id: 'growth', name: t('page.studentGrowth') },
          { id: 'mission', name: t('page.missionList') },
        ]
      },
    ];

    if (eventData.total_reward) {
      allTabs[allTabs.length - 1].subTabs?.push(
        { id: 'total_reward', name: t('label.cumulativeRewards') },
      )
    }



    // --- Create sub-tabs by filtering only existing minigames ---
    const minigameSubTabs: { id: SubTabId, name: string }[] = [];
    if (eventData.box_gacha) {
      minigameSubTabs.push({ id: 'box', name: t("minigame.roulette") });
    }
    if (eventData.season.EventContentTypeStr.includes('Treasure')) {
      minigameSubTabs.push({ id: 'treasure', name: t("minigame.treasureHunt") });
    }
    if (eventData.season.EventContentTypeStr.includes('CardShop')) {
      minigameSubTabs.push({ id: 'card', name: t('placeholder.cardGacha') });
    }
    if (eventData.season.EventContentTypeStr.includes('FortuneGachaShop')) {
      minigameSubTabs.push({ id: 'fortune', name: t("minigame.omikuji") });
    }
    if (eventData.dice_race) {
      minigameSubTabs.push({ id: 'dice_race', name: t("minigame.diceRace") });
    }
    if (eventData.minigame_dream) {
      minigameSubTabs.push({ id: 'minigame_dream', name: t("minigame.minigame_dream") });
    }
    minigameSubTabs.push({ id: 'custom', name: t('placeholder.customExchange') });

    if (minigameSubTabs.length > 0) {
      allTabs.push({
        id: 'minigame',
        name: `3. ${t('ui.minigame')}`,
        subTabs: minigameSubTabs
      });
    }

    allTabs.push({ id: 'ap', name: `4. ${t('ui.apSupply')}` }),

      allTabs.push({
        id: 'farming',
        name: `5. ${t('ui.farmingRun')}`,
        subTabs: [

          { id: 'stages', name: t('ui.stageFarming') },
        ]
      });

    return allTabs;
  }, [eventData]);


  //  dynamic loading useEffect
  useEffect(() => {
    if (!eventId) {
      setError(t('error.eventDataDisplayFailed'));
      setIsLoading(false);
      return;
    };

    const fetchEventData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const eventDataModules = import.meta.glob('/app/data/event/event.*.json');
        const modulePath = `/app/data/event/event.${eventId}.json`;
        const eventDataModule: any = await eventDataModules[modulePath]()

        // const eventDataModule = (await import(/* @vite-ignore */ `/app/data/event/event.${eventId}.json`)).default;
        // const iconDataInfoModule = (await import(`~/data/event/icon_info.json`)).default;
        for (const key in iconDataInfoModule) {
          eventDataModule.icons[key] = {
            ...eventDataModule.icons[key],
            ...iconDataInfoModule[key as keyof typeof iconDataInfoModule],
          }
        }
        setEventData(eventDataModule);

        const data = eventDataModule
        const initialPrio: Record<number, 'include' | 'exclude' | 'priority'> = {};
        // Use the stage.stage array inside event.json
        data.stage.stage.forEach((s: { Name: string; Id: number; }) => {
          // Parse number part from stage name (e.g., 'Stage01' -> 1)
          const stageNumMatch = s.Name.match(/(\d+)$/);
          if (stageNumMatch) {
            const num = parseInt(stageNumMatch[1], 10);
            if (num >= 1 && num <= 8) {
              initialPrio[s.Id] = 'exclude';
            }
          }
        });

      } catch (e) {
        console.error(`${t('error.eventDataDisplayFailed')} (ID: ${eventId})`, e);
        setError(`${t('error.eventDataDisplayFailed')} (ID: ${eventId})`);
      }
    };

    const fetchIconData = async () => {
      try {
        // Use the path format provided by the user
        const iconModules = import.meta.glob('/app/data/event/icon_img.*.json');
        const modulePath = `/app/data/event/icon_img.${eventId}.json`;
        const iconDataModule: any = await iconModules[modulePath]()
        let ext = {
          Item: {},
          Equipment: {},
        }
        for (const key in iconDataModule.default) {
          const baseData = iconDataAllModule[key as keyof typeof iconDataAllModule] as any || {};

          ext[key as keyof typeof ext] = {
            ...iconDataModule.default[key],
            ...baseData,

          }
        }
        setIconData(ext);
      } catch (e) {
        console.error("Failed to fetch icon data:", e);
        setError(prev => prev || `Failed to fetch icon data (ID: ${eventId})`);
      }
    };


    const fetchStudentData = async () => {
      try {
        const [studentRes, portraitRes] = await Promise.all([
          fetch(`/schaledb.com/${locale}.students.min.json`),
          fetch('/w/students_portrait.json')
        ]);
        setAllStudents(await studentRes.json());
        setStudentPortraits(await portraitRes.json());
      } catch (e) {
        console.error(t('error.studentDataLoadFailed'), e);
        setError(t('error.studentDataLoadFailed'));
      }
    };

    Promise.all([fetchEventData(), fetchStudentData(), fetchIconData()]).finally(() => setIsLoading(false));

    // Reset all related states when the event changes
    setShopResult(null)
    setTreasureResult(null);
    setBoxGachaResult(null);
    setCustomGameResult(null);


  }, [eventId]);

  const allStages = useMemo(() => eventData ? getAllStages(eventData) : [], [eventData]);

  useEffect(() => {
    const costs: Record<string, number> = {};
    const rewards: Record<string, number> = {};

    if (!eventData || !purchaseCounts) return
    const onCalculate = setShopResult

    purchaseCounts && Object.entries(purchaseCounts).forEach(([itemIdStr, count]) => {
      if (count <= 0) return;
      const itemId = Number(itemIdStr);
      const allItems = Object.values(eventData.shop).flat();
      const itemInfo = allItems.find(i => i.Id === itemId);

      if (itemInfo && itemInfo.Goods && itemInfo.Goods.length > 0) {
        const goods = itemInfo.Goods[0];
        // Calculate cost
        const costKey = `${goods.ConsumeParcelTypeStr[0]}_${goods.ConsumeParcelId[0]}`;
        costs[costKey] = (costs[costKey] || 0) + goods.ConsumeParcelAmount[0] * count;

        // Calculate reward
        const rewardKey = `${goods.ParcelTypeStr[0]}_${goods.ParcelId[0]}`;
        rewards[rewardKey] = (rewards[rewardKey] || 0) + goods.ParcelAmount[0] * count;
      }
    });

    onCalculate({ costs, rewards });
  }, [purchaseCounts, eventData, setShopResult]);


  const acquiredItemsResult = useMemo(() => {
    const totalItems: Record<string, { amount: number; isBonusApplied: boolean }> = {};
    const transactions: TransactionEntry[] = [];
    let totalApUsed = 0;

    if (!eventData) return { totalItems, transactions, totalApUsed }; // <-- transactions add


    if (shopResult) {
      // Cost
      if (Object.keys(shopResult.costs).length > 0) {
        const costItems: Record<string, { amount: number; isBonusApplied: boolean }> = {};
        for (const [key, amount] of Object.entries(shopResult.costs)) {
          const itemData = { amount: -amount, isBonusApplied: false };
          costItems[key] = itemData;
          totalItems[key] = {
            amount: (totalItems[key]?.amount || 0) + itemData.amount,
            isBonusApplied: false,
          };
        }
        transactions.push({ source: 'shop_cost', items: costItems });
      }

      // Reward
      if (Object.keys(shopResult.rewards).length > 0) {
        const rewardItems: Record<string, { amount: number; isBonusApplied: boolean }> = {};
        for (const [key, amount] of Object.entries(shopResult.rewards)) {
          const itemData = { amount: amount, isBonusApplied: false };
          rewardItems[key] = itemData;
          totalItems[key] = {
            amount: (totalItems[key]?.amount || 0) + itemData.amount,
            isBonusApplied: false,
          };
        }
        transactions.push({ source: 'shop_reward', items: rewardItems });
      }
    }

    // 3. Farming
    if (farmingResult) {
      totalApUsed += farmingResult.totalApUsed;
      if (Object.keys(farmingResult.totalItems).length > 0) {
        transactions.push({ source: 'farming', items: farmingResult.totalItems });

        for (const [key, data] of Object.entries(farmingResult.totalItems)) {
          totalItems[key] = {
            amount: (totalItems[key]?.amount || 0) + data.amount,
            isBonusApplied: (totalItems[key]?.isBonusApplied || false) || data.isBonusApplied,
          };
        }
      }
    }

    // 4. Card Shop
    if (cardShopRates && finalCardFlips > 0) {
      const rounds = finalCardFlips / (cardShopRates.avgFlips || 1);

      // Cost
      const costItems: Record<string, { amount: number; isBonusApplied: boolean }> = {};
      Object.entries(cardShopRates.avgCosts).forEach(([key, avgAmount]) => {
        const compositeKey = `${key}`;
        const amount = -(avgAmount * rounds);
        costItems[compositeKey] = { amount, isBonusApplied: false };

        totalItems[compositeKey] = {
          amount: (totalItems[compositeKey]?.amount || 0) + amount,
          isBonusApplied: false,
        };
      });
      if (Object.keys(costItems).length > 0) {
        transactions.push({ source: 'cardShop_cost', items: costItems });
      }

      // Reward
      const rewardItems: Record<string, { amount: number; isBonusApplied: boolean }> = {};
      Object.entries(cardShopRates.avgRewards).forEach(([key, avgAmount]) => {
        const compositeKey = `${key}`;
        const amount = avgAmount * rounds;
        rewardItems[compositeKey] = { amount, isBonusApplied: false };

        totalItems[compositeKey] = {
          amount: (totalItems[compositeKey]?.amount || 0) + amount,
          isBonusApplied: false,
        };
      });
      if (Object.keys(rewardItems).length > 0) {
        transactions.push({ source: 'cardShop_reward', items: rewardItems });
      }
    }

    // 5. Treasure
    if (treasureResult) {
      // Cost
      const costItems: Record<string, { amount: number; isBonusApplied: boolean }> = {};
      const [costType, costId] = treasureResult.cost.key.split('_');
      const costKey = `${costType}_${costId}`;
      const costAmount = -treasureResult.cost.amount;
      costItems[costKey] = { amount: costAmount, isBonusApplied: false };

      totalItems[costKey] = {
        amount: (totalItems[costKey]?.amount || 0) + costAmount,
        isBonusApplied: false,
      };
      transactions.push({ source: 'treasure_cost', items: costItems });

      // Reward
      const rewardItems: Record<string, { amount: number; isBonusApplied: boolean }> = {};
      for (const [rewardKey, amount] of Object.entries(treasureResult.rewards)) {
        const [rewardType, rewardId] = rewardKey.split('_');
        const finalKey = `${rewardType}_${rewardId}`;
        rewardItems[finalKey] = { amount, isBonusApplied: false };

        totalItems[finalKey] = {
          amount: (totalItems[finalKey]?.amount || 0) + amount,
          isBonusApplied: false,
        };
      }
      if (Object.keys(rewardItems).length > 0) {
        transactions.push({ source: 'treasure_reward', items: rewardItems });
      }
    }

    // 6. Box Gacha
    if (boxGachaResult) {
      // Cost
      const costItems: Record<string, { amount: number; isBonusApplied: boolean }> = {};
      const [costType, costId] = boxGachaResult.cost.key.split('_');
      const costKey = `${costType}_${costId}`;
      const costAmount = -boxGachaResult.cost.amount;
      costItems[costKey] = { amount: costAmount, isBonusApplied: false };

      totalItems[costKey] = {
        amount: (totalItems[costKey]?.amount || 0) + costAmount,
        isBonusApplied: false,
      };
      transactions.push({ source: 'boxGacha_cost', items: costItems });

      // Reward
      const rewardItems: Record<string, { amount: number; isBonusApplied: boolean }> = {};
      for (const [rewardKey, amount] of Object.entries(boxGachaResult.rewards)) {
        const [rewardType, rewardId] = rewardKey.split('_');
        const finalKey = `${rewardType}_${rewardId}`;
        rewardItems[finalKey] = { amount, isBonusApplied: false };

        totalItems[finalKey] = {
          amount: (totalItems[finalKey]?.amount || 0) + amount,
          isBonusApplied: false,
        };
      }
      if (Object.keys(rewardItems).length > 0) {
        transactions.push({ source: 'boxGacha_reward', items: rewardItems });
      }
    }

    // 7. Custom Game
    if (customGameResult) {
      // Cost
      if (customGameResult.cost) {
        const costItems: Record<string, { amount: number; isBonusApplied: boolean }> = {};
        const [costType, costId] = customGameResult.cost.key.split('_');
        const costKey = `${costType}_${costId}`;
        const costAmount = -customGameResult.cost.amount;
        costItems[costKey] = { amount: costAmount, isBonusApplied: false };

        totalItems[costKey] = {
          amount: (totalItems[costKey]?.amount || 0) + costAmount,
          isBonusApplied: false,
        };
        transactions.push({ source: 'customGame_cost', items: costItems });
      }

      // Reward
      const rewardItems: Record<string, { amount: number; isBonusApplied: boolean }> = {};
      for (const [rewardKey, amount] of Object.entries(customGameResult.rewards)) {
        const [rewardType, rewardId] = rewardKey.split('_');
        const finalKey = `${rewardType}_${rewardId}`;
        rewardItems[finalKey] = { amount, isBonusApplied: false };

        totalItems[finalKey] = {
          amount: (totalItems[finalKey]?.amount || 0) + amount,
          isBonusApplied: false,
        };
      }
      if (Object.keys(rewardItems).length > 0) {
        transactions.push({ source: 'customGame_reward', items: rewardItems });
      }
    }

    // 8. Fortune Gacha
    if (fortuneGachaResult) {
      const { cost, rewards } = fortuneGachaResult;

      // Cost
      const costItems: Record<string, { amount: number; isBonusApplied: boolean }> = {};
      const costAmount = -cost.amount;
      costItems[cost.key] = { amount: costAmount, isBonusApplied: false };

      totalItems[cost.key] = {
        amount: (totalItems[cost.key]?.amount || 0) + costAmount,
        isBonusApplied: false,
      };
      transactions.push({ source: 'fortuneGacha_cost', items: costItems });

      // Reward
      const rewardItems: Record<string, { amount: number; isBonusApplied: boolean }> = {};
      for (const [rewardKey, amount] of Object.entries(rewards)) {
        rewardItems[rewardKey] = { amount, isBonusApplied: false };

        totalItems[rewardKey] = {
          amount: (totalItems[rewardKey]?.amount || 0) + amount,
          isBonusApplied: false,
        };
      }
      if (Object.keys(rewardItems).length > 0) {
        transactions.push({ source: 'fortuneGacha_reward', items: rewardItems });
      }
    }

    // 9. Total Reward
    if (totalRewardResult) {
      // Reward
      const rewardItems: Record<string, { amount: number; isBonusApplied: boolean }> = {};
      for (const [key, amount] of Object.entries(totalRewardResult.rewards)) {
        rewardItems[key] = { amount, isBonusApplied: false };

        totalItems[key] = {
          amount: (totalItems[key]?.amount || 0) + amount,
          isBonusApplied: false,
        };
      }
      if (Object.keys(rewardItems).length > 0) {
        transactions.push({ source: 'totalReward_reward', items: rewardItems });
      }

      // Cost (Demand)
      if (totalRewardResult.cost) {
        const costItems: Record<string, { amount: number; isBonusApplied: boolean }> = {};
        const { key, amount } = totalRewardResult.cost;
        const costAmount = -amount;
        costItems[key] = { amount: costAmount, isBonusApplied: false };

        totalItems[key] = {
          amount: (totalItems[key]?.amount || 0) + costAmount,
          isBonusApplied: false,
        };
        transactions.push({ source: 'totalReward_cost', items: costItems });
      }
    }

    // 10. Mission
    if (missionResult) {
      const rewardItems: Record<string, { amount: number; isBonusApplied: boolean }> = {};
      for (const [key, amount] of Object.entries(missionResult.rewards)) {
        rewardItems[key] = { amount, isBonusApplied: false };

        totalItems[key] = {
          amount: (totalItems[key]?.amount || 0) + amount,
          isBonusApplied: false,
        };
      }
      if (Object.keys(rewardItems).length > 0) {
        transactions.push({ source: 'mission_reward', items: rewardItems });
      }
    }

    // 11. Dice Race
    if (diceRaceResult) {
      // Cost
      const costItems: Record<string, { amount: number; isBonusApplied: boolean }> = {};
      for (const [key, amount] of Object.entries(diceRaceResult.cost)) {
        const costAmount = -amount;
        costItems[key] = { amount: costAmount, isBonusApplied: false };

        totalItems[key] = { amount: (totalItems[key]?.amount || 0) + costAmount, isBonusApplied: false };
      }
      if (Object.keys(costItems).length > 0) {
        transactions.push({ source: 'diceRace_cost', items: costItems });
      }

      // Reward
      const rewardItems: Record<string, { amount: number; isBonusApplied: boolean }> = {};
      for (const [key, amount] of Object.entries(diceRaceResult.rewards)) {
        rewardItems[key] = { amount, isBonusApplied: false };

        totalItems[key] = { amount: (totalItems[key]?.amount || 0) + amount, isBonusApplied: false };
      }
      if (Object.keys(rewardItems).length > 0) {
        transactions.push({ source: 'diceRace_reward', items: rewardItems });
      }
    }

    // 12. Dream Maker
    if (dreamMakerResult) {
      // Cost
      const costItems: Record<string, { amount: number; isBonusApplied: boolean }> = {};
      for (const [key, amount] of Object.entries(dreamMakerResult.cost)) {
        const costAmount = -amount;
        costItems[key] = { amount: costAmount, isBonusApplied: false };

        totalItems[key] = { amount: (totalItems[key]?.amount || 0) + costAmount, isBonusApplied: false };
      }
      if (Object.keys(costItems).length > 0) {
        transactions.push({ source: 'dreamMaker_cost', items: costItems });
      }

      // Reward
      const rewardItems: Record<string, { amount: number; isBonusApplied: boolean }> = {};
      for (const [key, amount] of Object.entries(dreamMakerResult.rewards)) {
        rewardItems[key] = { amount, isBonusApplied: false };

        totalItems[key] = { amount: (totalItems[key]?.amount || 0) + amount, isBonusApplied: false };
      }
      if (Object.keys(rewardItems).length > 0) {
        transactions.push({ source: 'dreamMaker_reward', items: rewardItems });
      }
    }

    // 13. Student Growth Needs
    if (studentGrowthNeeds) {
      const costItems: Record<string, { amount: number; isBonusApplied: boolean }> = {};
      for (const [key, amount] of Object.entries(studentGrowthNeeds)) {
        const costAmount = -amount;
        costItems[key] = { amount: costAmount, isBonusApplied: false };

        totalItems[key] = {
          amount: (totalItems[key]?.amount || 0) + costAmount,
          isBonusApplied: false,
        };
      }
      if (Object.keys(costItems).length > 0) {
        transactions.push({ source: 'studentGrowth_cost', items: costItems });
      }
    }

    return { totalItems, transactions, totalApUsed };

  }, [totalBonus, eventData, allStages, finalCardFlips,
    cardShopRates, treasureResult, boxGachaResult, customGameResult,
    farmingResult, fortuneGachaResult, shopResult, totalRewardResult,
    missionResult, diceRaceResult, dreamMakerResult, studentGrowthNeeds]);

  const finalCurrencyBalance = useMemo(() => {
    const balance: Record<string, number> = {};

    // 1. Start with current owned quantity
    for (const [id, amount] of Object.entries(ownedCurrency)) {
      balance[Number(id)] = (balance[Number(id)] || 0) + amount;
    }

    // 2. Sum all acquisition/consumption results
    for (const [key, data] of Object.entries(acquiredItemsResult.totalItems)) {
      const [type, idStr] = key.split('_');
      // Include only materials (Item, Currency) in the balance
      if (type === 'Item' || type === 'Currency') {
        // const id = `${type}_${Number(idStr)}`;
        const id = Number(idStr)
        balance[id] = (balance[id] || 0) + data.amount;
      }
    }
    return balance;
  }, [ownedCurrency, acquiredItemsResult]);


  const handleMainTabClick = (tabId: MainTabId) => {
    setActiveMainTab(tabId);
    // If sub-tabs exist, automatically activate the first one
    const mainTab = TABS.find(t => t.id === tabId);
  };

  if (isLoading) return <div className="text-center p-8">{t_c('loading_txt')}</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;
  if (!eventData) return <div className="text-center p-8">{t('error.eventDataDisplayFailed')}</div>;
  if (!iconData) return <div className="text-center p-8">Unable to display icon data.</div>;

  const mainTabFind = TABS.filter(v => v.id == activeMainTab)[0]
  const activeSubTab = activeSubTabs[activeMainTab] || mainTabFind?.subTabs?.[0]?.id;

  const currentTabIndex = TABS.findIndex(tab => tab.id === activeMainTab);
  const isLastTab = currentTabIndex === -1 || currentTabIndex === TABS.length - 1;
  let nextTab: { id: MainTabId; name: string; } | null = null;
  let nextTabName = '';

  if (!isLastTab) {
    nextTab = TABS[currentTabIndex + 1];
    nextTabName = nextTab.name.replace(/^\d+\.\s*/, ''); // Remove numeric prefixes like "1. ", "2. "
  }

  return (
    <div className="text-gray-800 dark:text-gray-200 min-h-screen p-4 sm:p-6 ">
      <div className="max-w-4xl mx-auto space-y-4">
        <div>
          <EventInfo
            name={eventData.season.Name}
            eventId={Number(eventId) || 0}
            startTime={eventData.season.EventContentOpenTime}
            endTime={eventData.season.EventContentCloseTime || eventData.season.ExtensionTime}
            eventContentTypeStr={eventData.season.EventContentTypeStr}
          />
        </div>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="w-full scroll-mt-15" ref={tabNavRef}>
            {/* Main tab (underline style) */}
            <div className="border-b border-gray-200 dark:border-neutral-700">
              <div className="flex flex-wrap items-center justify-center -mb-px">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => handleMainTabClick(tab.id)}
                    className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeMainTab === tab.id
                      ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-neutral-600'
                      }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </div>
            </div>

            {/* --- Sub-tabs: Text buttons subordinate to the main tab --- */}
            {TABS.find(t => t.id === activeMainTab)?.subTabs && (
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-2">
                {TABS.find(t => t.id === activeMainTab)!.subTabs!.map(subTab => (
                  <button
                    key={subTab.id}
                    onClick={() => setActiveSubTabs(prev => ({ ...prev, [activeMainTab]: subTab.id }))}
                    className={`px-1 py-1 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500 rounded ${activeSubTab === subTab.id
                      ? 'text-sky-600 dark:text-sky-400' // Active sub-tab
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100' // Inactive sub-tab
                      }`}
                  >
                    {subTab.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* --- Tab Content --- */}
          <div className="space-y-6">
            {activeMainTab === 'bonus' && (
              <>
                <TotalBonusDisplay
                  eventData={eventData}
                  iconData={iconData}
                  totalBonus={totalBonus}
                />
                <BonusSelector
                  eventId={eventId}
                  eventData={eventData}
                  iconData={iconData}
                  allStudents={allStudents}
                  studentPortraits={studentPortraits}
                  onBonusCalculate={setTotalBonus}
                />
              </>
            )}
            {activeMainTab === 'goals' && (
              <>
                {activeSubTab === 'shop' &&
                  <ShopPlanner
                    eventId={eventId}
                    eventData={eventData}
                    iconData={iconData}
                    onCalculate={setShopResult}
                    allStages={allStages}
                    totalBonus={totalBonus}
                  />
                }

                {activeSubTab === 'growth' &&
                  <StudentGrowthPlanner
                    eventId={eventId}
                    eventData={eventData}
                    iconData={iconData}
                    allStudents={allStudents}
                    onCalculate={setStudentGrowthNeeds}
                    studentPortraits={studentPortraits}
                  />
                }

                {activeSubTab === 'mission' &&
                  <MissionPlanner
                    eventId={eventId}
                    eventData={eventData}
                    iconData={iconData}
                    allStages={allStages}
                    onCalculate={setMissionResult}
                  />
                }
                {eventData?.total_reward && activeSubTab === 'total_reward' &&
                  <TotalRewardPlanner
                    eventId={eventId}
                    eventData={eventData}
                    iconData={iconData}
                    onCalculate={setTotalRewardResult}
                  />
                }
              </>
            )}
            {activeMainTab === 'minigame' && (
              <>
                {activeSubTab === 'treasure' && eventData?.season.EventContentTypeStr.includes('Treasure') && (
                  <TreasurePlanner
                    eventId={eventId}
                    eventData={eventData}
                    iconData={iconData}
                    onCalculate={setTreasureResult}
                    remainingCurrency={finalCurrencyBalance}
                  />
                )}
                {activeSubTab === 'card' && eventData?.season.EventContentTypeStr.includes('CardShop') && (
                  <CardShopPlanner
                    eventId={eventId}
                    eventData={eventData}
                    iconData={iconData}
                    onRatesCalculated={setCardShopRates}
                    rates={cardShopRates}
                    finalCardFlips={finalCardFlips}
                    setFinalCardFlips={setFinalCardFlips}
                    remainingCurrency={finalCurrencyBalance}
                  />
                )}

                {activeSubTab === 'box' && eventData?.box_gacha &&
                  <BoxGachaPlanner
                    eventId={eventId}
                    eventData={eventData}
                    iconData={iconData}
                    onCalculate={setBoxGachaResult}
                    remainingCurrency={finalCurrencyBalance}
                  />
                }
                {activeSubTab === 'fortune' && eventData?.fortune_gacha &&
                  <FortuneGachaPlanner
                    eventId={eventId}
                    eventData={eventData}
                    iconData={iconData}
                    onCalculate={setFortuneGachaResult}
                    remainingCurrency={finalCurrencyBalance}
                  />
                }
                {activeSubTab === 'dice_race' && eventData?.dice_race && (
                  <DiceRacePlanner
                    eventId={eventId}
                    eventData={eventData}
                    iconData={iconData}
                    onCalculate={setDiceRaceResult}
                    remainingCurrency={finalCurrencyBalance}
                  />
                )}
                {activeSubTab === 'minigame_dream' && eventData?.minigame_dream && (
                  <DreamMakerPlanner
                    eventId={eventId}
                    eventData={eventData}
                    iconData={iconData}
                    onCalculate={setDreamMakerResult}
                    remainingCurrency={finalCurrencyBalance}
                    totalBonus={totalBonus}
                  />
                )}
                {/* Minigame Planner Section */}
                {activeSubTab === 'custom' && <CustomGamePlanner
                  eventId={eventId}
                  eventData={eventData}
                  iconData={iconData}
                  onCalculate={setCustomGameResult}
                  remainingCurrency={finalCurrencyBalance}
                />}
              </>
            )}
            {activeMainTab === 'ap' && (
              <>
                <ApCalculator
                  eventId={eventId}
                  startTime={eventData.season.EventContentOpenTime}
                  endTime={eventData.season.EventContentCloseTime || eventData.season.ExtensionTime}
                  onCalculate={setAvailableAp} // Set the calculation result directly to the availableAp state
                  iconData={iconData} />
              </>
            )}

            {activeMainTab === 'farming' && (
              <>
                {activeSubTab === 'stages' &&
                  <FarmingPlanner
                    eventId={eventId}
                    eventData={eventData}
                    iconData={iconData}
                    allStages={allStages}
                    availableAp={availableAp}
                    setAvailableAp={setAvailableAp}
                    neededItems={finalCurrencyBalance}
                    totalBonus={totalBonus}
                    onCalculate={setFarmingResult}
                  />}
              </>
            )}

            {!isLastTab && nextTab && (
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-neutral-700 flex justify-end">
                <button
                  onClick={() => {
                    console.log('tabNavRef', tabNavRef)
                    tabNavRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    handleMainTabClick(nextTab.id)
                  }}
                  className="px-5 py-2 bg-sky-500 text-white text-sm font-medium rounded-md shadow-sm hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 transition-colors"
                >
                  {/* Use translation key 'ui.continueTo' and pass tabName as a variable (e.g., "Continue to {tabName}") */}
                  {t('ui.continueTo', { tabName: nextTabName })}
                  {' \u2192'} {/* Right arrow */}
                </button>
              </div>
            )}
          </div>
          <ExportImportPanel />
        </div>
        <FloatingCurrencyStatus
          eventId={eventId}
          eventData={eventData}
          iconData={iconData}
          ownedCurrency={ownedCurrency}
          setOwnedCurrency={setOwnedCurrency} // Pass the setter from the store hook
          remainingCurrency={finalCurrencyBalance} // Pass the calculated final balance
          acquiredItemsResult={acquiredItemsResult} // Pass the final calculation result
        />
      </div>
    </div>

  )
};

export default EventPage;
