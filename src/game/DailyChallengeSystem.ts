import type {
  DailyChallengeConfig,
  DailyChallengeRule,
  DailyChallengeRuleType,
  DailyChallengeSaveData,
  DailyChallengeRecord,
  DailyChallengeLeaderboardEntry,
} from '../types/game';
import { SeededRandom, dateToSeed, getTodayDateString, isSameDay } from './SeededRandom';

const STORAGE_KEY = 'deepSeaSonar_dailyChallenge';
const MAX_HISTORY = 30;
const MAX_LEADERBOARD = 10;

const CHALLENGE_TITLES = [
  '深渊迷航',
  '声呐大师',
  '极限探测',
  '深海孤胆',
  '宝藏猎人',
  '危机四伏',
  '勇者试炼',
  '光影之间',
  '静默潜行',
  '雷区穿梭',
];

const CHALLENGE_DESCRIPTIONS = [
  '今日深海异常凶险，请谨慎前行',
  '声呐资源有限，每一次发射都至关重要',
  '目标藏匿更深，需要更精准的判断',
  '独自面对未知，相信你的直觉',
  '传说中的宝藏就在前方，快去寻找',
  '危险区域扩大，小心每一步',
  '只有最勇敢的探测员才能完成',
  '迷雾笼罩深海，回波更加微弱',
  '保持安静，使用最少的声呐完成任务',
  '水雷密布，考验你的反应速度',
];

const ALL_RULES: Record<DailyChallengeRuleType, Omit<DailyChallengeRule, 'type'>> = {
  limited_lives: {
    name: '生命有限',
    description: '初始生命值减少为2',
    icon: '❤️',
  },
  limited_sonar: {
    name: '声呐紧缺',
    description: '最大声呐充能减少为3',
    icon: '🔊',
  },
  no_recharge: {
    name: '禁用回充',
    description: '声呐不会自动恢复',
    icon: '🚫',
  },
  speed_sonar: {
    name: '极速声呐',
    description: '声呐传播速度提升50%',
    icon: '⚡',
  },
  more_dangers: {
    name: '危机四伏',
    description: '危险目标数量增加50%',
    icon: '💣',
  },
  bonus_score: {
    name: '双倍奖励',
    description: '所有得分提升50%',
    icon: '✨',
  },
  fog_of_war: {
    name: '战争迷雾',
    description: '声呐探测范围缩小30%',
    icon: '🌫️',
  },
  single_life: {
    name: '一命模式',
    description: '只有1条生命，失误即终',
    icon: '💀',
  },
};

const FAKE_PLAYER_NAMES = [
  '深海探长',
  '声呐达人',
  '海底漫步者',
  '蓝色幽灵',
  '珊瑚守护者',
  '墨鱼骑士',
  '深渊之眼',
  '寂静领航员',
  '潮汐猎手',
  '光之子',
  '暗夜潜水员',
  '水晶鱼人',
  '海螺使者',
];

export class DailyChallengeSystem {
  private saveData: DailyChallengeSaveData;

  constructor() {
    this.saveData = this.load();
  }

  private load(): DailyChallengeSaveData {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<DailyChallengeSaveData>;
        return {
          bestRecord: parsed.bestRecord ?? null,
          attempts: parsed.attempts ?? 0,
          lastAttemptAt: parsed.lastAttemptAt ?? null,
          completedDates: Array.isArray(parsed.completedDates) ? parsed.completedDates : [],
          history: Array.isArray(parsed.history) ? parsed.history : [],
          playerName: parsed.playerName ?? '探测员',
        };
      }
    } catch (_e) {}
    return {
      bestRecord: null,
      attempts: 0,
      lastAttemptAt: null,
      completedDates: [],
      history: [],
      playerName: '探测员',
    };
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.saveData));
    } catch (_e) {}
  }

  getPlayerName(): string {
    return this.saveData.playerName;
  }

  setPlayerName(name: string) {
    this.saveData.playerName = name.trim() || '探测员';
    this.save();
  }

  getTodayChallenge(): DailyChallengeConfig {
    const dateStr = getTodayDateString();
    const seed = dateToSeed(dateStr);
    const rng = new SeededRandom(seed);

    const ruleTypes = Object.keys(ALL_RULES) as DailyChallengeRuleType[];
    const shuffledRules = rng.shuffle(ruleTypes);
    const ruleCount = rng.nextInt(2, 3);
    const selectedRuleTypes = shuffledRules.slice(0, ruleCount);

    const rules: DailyChallengeRule[] = selectedRuleTypes.map((type) => ({
      type,
      ...ALL_RULES[type],
    }));

    return {
      date: dateStr,
      seed,
      title: rng.pick(CHALLENGE_TITLES),
      description: rng.pick(CHALLENGE_DESCRIPTIONS),
      rules,
      targetLevel: rng.nextInt(3, 6),
    };
  }

  isTodayCompleted(): boolean {
    if (!this.saveData.bestRecord) return false;
    return isSameDay(this.saveData.bestRecord.date);
  }

  getTodayBestRecord(): DailyChallengeRecord | null {
    if (!this.saveData.bestRecord) return null;
    if (!isSameDay(this.saveData.bestRecord.date)) return null;
    return this.saveData.bestRecord;
  }

  getAttemptsToday(): number {
    if (!this.saveData.lastAttemptAt) return 0;
    const lastDate = new Date(this.saveData.lastAttemptAt);
    const today = new Date();
    if (
      lastDate.getFullYear() === today.getFullYear() &&
      lastDate.getMonth() === today.getMonth() &&
      lastDate.getDate() === today.getDate()
    ) {
      return this.saveData.attempts;
    }
    return 0;
  }

  recordAttempt(score: number, level: number, discovered: number): DailyChallengeRecord {
    const dateStr = getTodayDateString();
    const rank = this.calculateRank(score);

    const record: DailyChallengeRecord = {
      date: dateStr,
      score,
      level,
      discovered,
      completedAt: Date.now(),
      rank,
    };

    const todayAttempts = this.getAttemptsToday();
    this.saveData.attempts = todayAttempts + 1;
    this.saveData.lastAttemptAt = Date.now();

    const todayBest = this.getTodayBestRecord();
    if (!todayBest || score > todayBest.score) {
      this.saveData.bestRecord = record;
    }

    if (!this.saveData.completedDates.includes(dateStr)) {
      this.saveData.completedDates.push(dateStr);
    }

    this.saveData.history = this.saveData.history.filter((h) => isSameDay(h.date) || h.date !== dateStr);
    this.saveData.history.push(record);
    if (this.saveData.history.length > MAX_HISTORY) {
      this.saveData.history = this.saveData.history.slice(-MAX_HISTORY);
    }

    this.save();
    return record;
  }

  calculateRank(score: number): string {
    if (score >= 4000) return 'S';
    if (score >= 2500) return 'A';
    if (score >= 1500) return 'B';
    if (score >= 800) return 'C';
    return 'D';
  }

  getLeaderboard(): DailyChallengeLeaderboardEntry[] {
    const challenge = this.getTodayChallenge();
    const rng = new SeededRandom(challenge.seed + 9999);

    const entries: DailyChallengeLeaderboardEntry[] = [];
    const playerCount = rng.nextInt(15, 25);
    const usedNames = new Set<string>();

    for (let i = 0; i < playerCount; i++) {
      let name = rng.pick(FAKE_PLAYER_NAMES);
      while (usedNames.has(name)) {
        name = rng.pick(FAKE_PLAYER_NAMES) + rng.nextInt(1, 99);
      }
      usedNames.add(name);

      const baseScore = rng.nextInt(500, 4500);
      entries.push({
        rank: 0,
        score: baseScore,
        level: Math.max(1, Math.floor(baseScore / 600)),
        playerName: name,
        completedAt: Date.now() - rng.nextInt(60000, 7200000),
        isCurrentPlayer: false,
      });
    }

    const todayBest = this.getTodayBestRecord();
    if (todayBest) {
      entries.push({
        rank: 0,
        score: todayBest.score,
        level: todayBest.level,
        playerName: this.saveData.playerName,
        completedAt: todayBest.completedAt,
        isCurrentPlayer: true,
      });
    }

    entries.sort((a, b) => b.score - a.score);
    entries.forEach((e, i) => {
      e.rank = i + 1;
    });

    return entries.slice(0, MAX_LEADERBOARD);
  }

  getPlayerRank(): number | null {
    const leaderboard = this.getLeaderboard();
    const playerEntry = leaderboard.find((e) => e.isCurrentPlayer);
    return playerEntry ? playerEntry.rank : null;
  }

  getStreakDays(): number {
    if (this.saveData.completedDates.length === 0) return 0;

    const sortedDates = [...this.saveData.completedDates].sort().reverse();
    let streak = 0;
    let currentDate = new Date();

    for (const dateStr of sortedDates) {
      const checkDate = new Date(dateStr);
      const expectedStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

      if (dateStr === expectedStr) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  getHistory(): DailyChallengeRecord[] {
    return [...this.saveData.history].reverse();
  }

  resetAll() {
    this.saveData = {
      bestRecord: null,
      attempts: 0,
      lastAttemptAt: null,
      completedDates: [],
      history: [],
      playerName: this.saveData.playerName,
    };
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_e) {}
  }
}

export function applyChallengeRules(
  challenge: DailyChallengeConfig,
  effects: {
    livesBonus: number;
    livesOverride: number | null;
    maxSonarCharges: number;
    initialSonarBonus: number;
    sonarRadius: number;
    sonarSpeed: number;
    dangerCountMul: number;
    scoreMul: number;
    disableRecharge: boolean;
  }
) {
  for (const rule of challenge.rules) {
    switch (rule.type) {
      case 'limited_lives':
        effects.livesOverride = 2;
        break;
      case 'limited_sonar':
        effects.maxSonarCharges = 3;
        effects.initialSonarBonus = 0;
        break;
      case 'no_recharge':
        effects.disableRecharge = true;
        break;
      case 'speed_sonar':
        effects.sonarSpeed *= 1.5;
        break;
      case 'more_dangers':
        effects.dangerCountMul *= 1.5;
        break;
      case 'bonus_score':
        effects.scoreMul *= 1.5;
        break;
      case 'fog_of_war':
        effects.sonarRadius *= 0.7;
        break;
      case 'single_life':
        effects.livesOverride = 1;
        break;
    }
  }
  return effects;
}
