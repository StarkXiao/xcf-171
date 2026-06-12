import type { OceanTheme, OceanThemeId } from '../types/game';

export const OCEAN_THEMES: Record<OceanThemeId, OceanTheme> = {
  shallow: {
    id: 'shallow',
    name: '浅海大陆架',
    subtitle: 'Shallow Continental Shelf',
    description: '阳光充足的浅海区域，生物丰富，危险较低，适合新手探索。',
    icon: '🌊',
    difficulty: 'easy',
    colors: {
      background: 0x001a33,
      grid: 0x004466,
      sonar: 0x00ffcc,
      creature: 0x00ffff,
      wreck: 0xffdd44,
      danger: 0xff5566,
      player: 0x00ff88,
      combo: {
        LOW: 0x00ffaa,
        MEDIUM: 0xffdd44,
        HIGH: 0xff9944,
        EXTREME: 0xff5566,
        LEGENDARY: 0xff00ff,
      },
    },
    targetPool: {
      creatureNames: ['热带鱼群', '珊瑚海星', '彩色海蛞蝓', '小丑鱼', '海龟', '海豚群', '海马', '蝠鲼'],
      wreckNames: ['近代沉船', '废弃渔网', '沉底货箱', '小型游艇残骸', '海底光缆'],
      dangerNames: ['海底礁石', '水母群', '海胆区域', '暗流带', '废弃渔网'],
    },
    scoreCoefficients: {
      creature: 0.9,
      wreck: 0.9,
      danger: 0.8,
      global: 1.0,
    },
    riskRules: [
      { type: 'danger_count', value: 0.7, description: '危险目标数量减少30%' },
      { type: 'danger_damage', value: 0.7, description: '危险伤害降低30%' },
      { type: 'lives_initial', value: 1, description: '额外初始生命+1' },
    ],
    instructions: [
      '🔊 点击地图释放声呐波，探测隐藏目标',
      '🐟 点击回波，收集色彩斑斓的浅海生物',
      '📦 收集近代沉船和废弃货物获得额外分数',
      '⚠️ 注意避开海底礁石和水母群',
    ],
    rankThresholds: {
      S: 2500,
      A: 1600,
      B: 800,
      C: 400,
    },
    settlementComments: {
      S: ['你是浅海之王！完美的探索之旅！', '令人惊叹的声呐操控技术！', '浅海的宝藏已被你尽收眼底！'],
      A: ['出色的探索者！继续保持！', '浅海区域已被你熟练掌握！', '非常稳健的探测表现！'],
      B: ['不错的探索，还有提升空间！', '浅海的秘密等待你继续发掘！', '稳扎稳打，继续努力！'],
      C: ['初涉浅海，继续加油！', '多练习声呐技巧会更好！', '熟悉浅海环境是成功的第一步！'],
      D: ['浅海探索需要更多练习哦！', '不要灰心，再试一次吧！', '仔细观察回波会有帮助！'],
    },
  },
  abyss: {
    id: 'abyss',
    name: '深渊海沟',
    subtitle: 'Abyssal Trench',
    description: '黑暗的深海区域，压力巨大，隐藏着未知的危险和珍稀的古代遗迹。',
    icon: '🌑',
    difficulty: 'normal',
    colors: {
      background: 0x000814,
      grid: 0x003344,
      sonar: 0x00ffaa,
      creature: 0x00e5ff,
      wreck: 0xffcc00,
      danger: 0xff3355,
      player: 0x00ff88,
      combo: {
        LOW: 0x00ffaa,
        MEDIUM: 0xffcc00,
        HIGH: 0xff8800,
        EXTREME: 0xff3355,
        LEGENDARY: 0xff00ff,
      },
    },
    targetPool: {
      creatureNames: ['深海灯笼鱼', '巨型章鱼', '透明水母', '深海剑鱼', '发光乌贼', '吞噬鳗', '尖牙鱼', '深海龙鱼'],
      wreckNames: ['古代沉船', '飞机残骸', '海底遗迹', '废弃潜艇', '货物集装箱'],
      dangerNames: ['危险水雷', '深海漩涡', '毒刺水母群', '海底火山口', '高压电流区'],
    },
    scoreCoefficients: {
      creature: 1.0,
      wreck: 1.0,
      danger: 1.0,
      global: 1.0,
    },
    riskRules: [
      { type: 'target_density', value: 1.0, description: '标准目标密度' },
      { type: 'sonar_recharge', value: 1.0, description: '标准声呐充能速度' },
    ],
    instructions: [
      '🔊 点击地图释放声呐波，探测隐藏目标',
      '🐟 点击回波，收集生物和残骸获得分数',
      '⚠️ 避开红色危险水雷，否则损失生命',
      '💎 深渊中的古代遗迹价值连城！',
    ],
    rankThresholds: {
      S: 3000,
      A: 2000,
      B: 1000,
      C: 500,
    },
    settlementComments: {
      S: ['深渊征服者！无人能及的探索大师！', '你让深渊的秘密无所遁形！', '传奇级别的深渊探索！'],
      A: ['出色的深渊探索者！', '深渊的挑战已被你战胜！', '优秀的声呐技术令人印象深刻！'],
      B: ['成功征服了深渊！', '在黑暗中前行，勇气可嘉！', '不错的深渊探索成绩！'],
      C: ['深渊探索初体验，继续努力！', '黑暗中的探索需要更多技巧！', '你已经迈出了勇敢的一步！'],
      D: ['深渊的黑暗吞噬了一切...', '不要放弃，光明就在前方！', '多练习，深渊终将被你征服！'],
    },
  },
  polar: {
    id: 'polar',
    name: '极地冰海',
    subtitle: 'Polar Ice Ocean',
    description: '寒冷的极地海域，冰层覆盖，生物稀有但价值极高，声呐传播速度较慢。',
    icon: '❄️',
    difficulty: 'hard',
    colors: {
      background: 0x001a2e,
      grid: 0x224466,
      sonar: 0x88ddff,
      creature: 0xaaffff,
      wreck: 0xffeebb,
      danger: 0xff8899,
      player: 0xaaffcc,
      combo: {
        LOW: 0x88ffcc,
        MEDIUM: 0xffeeaa,
        HIGH: 0xffbb88,
        EXTREME: 0xff8899,
        LEGENDARY: 0xdd88ff,
      },
    },
    targetPool: {
      creatureNames: ['帝企鹅群', '北极鳕鱼', '独角鲸', '白鲸', '北极熊', '海豹群', '北极水母', '南极磷虾群'],
      wreckNames: ['极地科考站', '破冰船残骸', '冰川沉积物', '北极空运残骸', '冰封货船'],
      dangerNames: ['浮冰区', '冰裂隙', '暴风雪带', '极地寒流', '冰下暗礁'],
    },
    scoreCoefficients: {
      creature: 1.3,
      wreck: 1.2,
      danger: 1.1,
      global: 1.15,
    },
    riskRules: [
      { type: 'danger_count', value: 1.2, description: '危险目标增加20%' },
      { type: 'sonar_recharge', value: 0.8, description: '声呐充能减慢20%' },
      { type: 'target_density', value: 0.85, description: '目标密度降低15%' },
    ],
    instructions: [
      '🔊 点击释放声呐，寒冷会减慢声呐速度',
      '🐋 极地生物稀有但分数极高',
      '🚢 寻找冰封的科考站和沉船残骸',
      '🧊 小心浮冰区和冰裂隙！',
    ],
    rankThresholds: {
      S: 3600,
      A: 2400,
      B: 1200,
      C: 600,
    },
    settlementComments: {
      S: ['极地传奇！你征服了冰雪世界！', '冰海之王的荣耀属于你！', '完美的极地探索，载入史册！'],
      A: ['出色的极地探险家！', '在严寒中展现了卓越的技巧！', '极地的秘密已被你揭开！'],
      B: ['成功穿越了极地冰海！', '寒冷没有阻挡你的探索之路！', '不错的极地探险成绩！'],
      C: ['极地探险需要更多勇气和技巧！', '冰雪世界的挑战才刚刚开始！', '坚持下去，极地宝藏在等待！'],
      D: ['被极地的严寒击败了...', '不要气馁，温暖后再出发！', '极地探索需要更多准备！'],
    },
  },
  volcanic: {
    id: 'volcanic',
    name: '火山热泉',
    subtitle: 'Volcanic Hot Springs',
    description: '海底火山活动区域，高温热泉喷涌，危险四伏，但蕴含着丰富的稀有矿物和独特生态。',
    icon: '🌋',
    difficulty: 'extreme',
    colors: {
      background: 0x1a0505,
      grid: 0x442211,
      sonar: 0xff8844,
      creature: 0xffaa66,
      wreck: 0xffdd88,
      danger: 0xff2222,
      player: 0xffcc88,
      combo: {
        LOW: 0xffaa44,
        MEDIUM: 0xffdd44,
        HIGH: 0xff6622,
        EXTREME: 0xff2222,
        LEGENDARY: 0xff44ff,
      },
    },
    targetPool: {
      creatureNames: ['管水母群', '庞贝蠕虫', '热泉蟹', '深海章鱼', '热泉虾群', '白色盲蟹', '热泉贻贝', '火山蜗牛'],
      wreckNames: ['火山矿脉', '地热探测器', '深海采矿设备', '火山研究站', '熔岩包裹体'],
      dangerNames: ['熔岩流', '热泉喷口', '有毒气体区', '海底地震带', '火山碎屑流'],
    },
    scoreCoefficients: {
      creature: 1.5,
      wreck: 1.6,
      danger: 1.3,
      global: 1.4,
    },
    riskRules: [
      { type: 'danger_count', value: 1.5, description: '危险目标增加50%' },
      { type: 'danger_damage', value: 1.5, description: '危险伤害提高50%' },
      { type: 'lives_initial', value: -1, description: '初始生命-1' },
      { type: 'target_density', value: 1.3, description: '目标密度提高30%' },
    ],
    instructions: [
      '🔊 声呐在高温环境中传播不稳定',
      '🦀 热泉生态系统中的生物极其珍贵',
      '💎 火山矿脉和稀有矿物价值连城',
      '🔥 熔岩流和热泉喷口极其危险！',
    ],
    rankThresholds: {
      S: 4500,
      A: 3000,
      B: 1500,
      C: 750,
    },
    settlementComments: {
      S: ['火山之主！你驯服了地狱！', '在烈焰中永生的探索传奇！', '不可能完成的任务被你征服了！'],
      A: ['杰出的火山探险家！', '在炼狱般的环境中表现出色！', '你的勇气令人敬佩！'],
      B: ['成功在火山区域生存下来！', '烈焰中的探索者，干得好！', '火山的危险没有吓倒你！'],
      C: ['火山探索极其危险，你很勇敢！', '在地狱边缘走了一遭！', '继续磨练技巧，挑战火山！'],
      D: ['火山的怒火太过强大...', '这是最危险的海域，不要灰心！', '先从其他海域积累经验吧！'],
    },
  },
  coral: {
    id: 'coral',
    name: '珊瑚礁海',
    subtitle: 'Coral Reef Sea',
    description: '生机勃勃的珊瑚礁生态系统，生物多样性极高，目标密集但需要精准识别。',
    icon: '🪸',
    difficulty: 'normal',
    colors: {
      background: 0x002233,
      grid: 0x005566,
      sonar: 0x66ffcc,
      creature: 0x88ffee,
      wreck: 0xffee88,
      danger: 0xff6688,
      player: 0x88ffaa,
      combo: {
        LOW: 0x66ffaa,
        MEDIUM: 0xffee66,
        HIGH: 0xffaa66,
        EXTREME: 0xff6688,
        LEGENDARY: 0xff66ff,
      },
    },
    targetPool: {
      creatureNames: ['珊瑚虫群', '蝴蝶鱼', '神仙鱼', '狮子鱼', '海龟', '海葵虾', '彩色海蛞蝓', '鹦嘴鱼', '鳐鱼', '鲨鱼幼崽'],
      wreckNames: ['古代珊瑚祭坛', '沉没的神庙', '海盗宝藏', '珊瑚包裹的宝箱', '海底雕像'],
      dangerNames: ['刺冠海星', '毒鲉', '海蛇', '蓝环章鱼', '箱形水母'],
    },
    scoreCoefficients: {
      creature: 0.85,
      wreck: 1.3,
      danger: 1.0,
      global: 1.05,
    },
    riskRules: [
      { type: 'target_density', value: 1.4, description: '目标密度提高40%' },
      { type: 'sonar_recharge', value: 1.2, description: '声呐充能加快20%' },
    ],
    instructions: [
      '🔊 密集的目标需要精准的声呐定位',
      '🐠 珊瑚礁生物种类繁多，令人目不暇接',
      '🏛️ 寻找沉没的古代神庙和海盗宝藏',
      '☠️ 小心伪装的危险生物！',
    ],
    rankThresholds: {
      S: 3300,
      A: 2200,
      B: 1100,
      C: 550,
    },
    settlementComments: {
      S: ['珊瑚礁的守护神！完美的探索！', '五彩斑斓的世界因你更精彩！', '珊瑚礁的秘密已被你完全掌握！'],
      A: ['出色的珊瑚礁探险家！', '在多彩的世界中游刃有余！', '精准的识别令人赞叹！'],
      B: ['成功探索了绚丽的珊瑚礁！', '缤纷的世界让人流连忘返！', '不错的珊瑚礁探索成绩！'],
      C: ['珊瑚礁的多样性令人眼花缭乱！', '提高识别速度会更有帮助！', '继续探索这片神奇的海域！'],
      D: ['被珊瑚礁的复杂性难住了...', '慢慢来，仔细分辨每个目标！', '珊瑚礁需要更多耐心和练习！'],
    },
  },
};

export const DEFAULT_OCEAN_THEME_ID: OceanThemeId = 'abyss';

export const getOceanTheme = (id: OceanThemeId): OceanTheme => {
  return OCEAN_THEMES[id] || OCEAN_THEMES[DEFAULT_OCEAN_THEME_ID];
};

export const getAllOceanThemes = (): OceanTheme[] => {
  return Object.values(OCEAN_THEMES);
};

export const getDifficultyColor = (difficulty: string): string => {
  const colors: Record<string, string> = {
    easy: '#00ff88',
    normal: '#00aaff',
    hard: '#ffaa00',
    extreme: '#ff3355',
  };
  return colors[difficulty] || colors.normal;
};

export const getDifficultyLabel = (difficulty: string): string => {
  const labels: Record<string, string> = {
    easy: '简单',
    normal: '普通',
    hard: '困难',
    extreme: '极难',
  };
  return labels[difficulty] || labels.normal;
};
