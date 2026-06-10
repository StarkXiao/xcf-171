<template>
  <div class="va">
    <div class="va-h">
      <div class="va-hl">
        <button class="bb" @click="$emit('close')"><span>←</span> 返回</button>
        <h2 class="va-t"><span>📁</span> 航次档案室</h2>
      </div>
      <div class="va-ha">
        <button class="ab dng" @click="handleClearAll" :disabled="records.length === 0">清空档案</button>
      </div>
    </div>

    <div class="va-sb" v-if="stats.totalVoyages > 0">
      <div class="sc"><div class="sv">{{ stats.totalVoyages }}</div><div class="sl">总航次</div></div>
      <div class="sc"><div class="sv">{{ ft(stats.totalPlayTime) }}</div><div class="sl">总时长</div></div>
      <div class="sc hi"><div class="sv">{{ stats.highScore.toLocaleString() }}</div><div class="sl">最高分</div></div>
      <div class="sc"><div class="sv">{{ stats.avgScore.toLocaleString() }}</div><div class="sl">均得分</div></div>
      <div class="sc"><div class="sv">Lv.{{ stats.highestLevel }}</div><div class="sl">最高关</div></div>
      <div class="sc"><div class="sv">{{ stats.winRate }}%</div><div class="sl">胜率</div></div>
      <div class="sc wn"><div class="sv">{{ stats.totalAnomalies }}</div><div class="sl">异常总数</div></div>
    </div>

    <div class="va-e" v-if="records.length === 0">
      <div class="ei">🌊</div><h3>暂无航次档案</h3><p>完成一次探险后，数据将自动归档于此</p>
    </div>

    <div class="va-m" v-else>
      <div class="lp">
        <div class="fs">
          <h3 class="st">筛选条件</h3>
          <div class="fg"><label class="fl">模式</label>
            <div class="mt">
              <button v-for="m in modeOpts" :key="m.v" class="tb" :class="{a:filters.modes.includes(m.v)}" @click="togM(m.v)">
                <span>{{ m.i }}</span>{{ m.l }}
              </button>
            </div>
          </div>
          <div class="fr">
            <div class="fg hf"><label class="fl">最低分</label><input type="number" class="fi" v-model.number="filters.scoreRange.min" placeholder="不限" /></div>
            <div class="fg hf"><label class="fl">最高分</label><input type="number" class="fi" v-model.number="filters.scoreRange.max" placeholder="不限" /></div>
          </div>
          <div class="fr">
            <div class="fg hf"><label class="fl">最低级</label><input type="number" class="fi" v-model.number="filters.levelRange.min" placeholder="不限" min="1" /></div>
            <div class="fg hf"><label class="fl">最高级</label><input type="number" class="fi" v-model.number="filters.levelRange.max" placeholder="不限" min="1" /></div>
          </div>
          <div class="fg"><label class="fl">异常类型</label>
            <div class="ac">
              <button v-for="t in aOpts" :key="t.v" class="cp" :class="[t.s,{a:filters.anomalyTypes.includes(t.v)}]" @click="togA(t.v)">{{ t.l }}</button>
            </div>
          </div>
          <div class="fg cg"><label class="cb"><input type="checkbox" v-model="filters.hasAnomaliesOnly" /><span>仅显示含异常航次</span></label></div>
          <div class="fg"><label class="fl">搜索</label><input type="text" class="fi" v-model="filters.searchText" placeholder="搜索..." /></div>
          <div class="fa">
            <button class="ab gh" @click="resetF">重置</button>
            <div class="rc">结果：<strong>{{ fRecs.length }}</strong> / {{ records.length }}</div>
          </div>
        </div>

        <div class="ds">
          <h3 class="st"><span>⚙️</span>难度调优建议<span class="bd" v-if="recs.length>0">{{ recs.length }}</span></h3>
          <div v-if="recs.length === 0" class="nr"><p>数据不足，完成更多航次后生成建议</p></div>
          <div v-else class="rl">
            <div v-for="r in recs" :key="r.id" class="rcd" :class="r.severity">
              <div class="rch"><span class="rcg">{{ gCatL(r.category) }}</span><span class="rsv">{{ gSevL(r.severity) }}</span></div>
              <div class="rct">{{ r.title }}</div>
              <div class="rcd2">{{ r.description }}</div>
              <div class="rcv">
                <div><span>当前</span><b>{{ r.currentValue }}</b></div><div class="arr">→</div>
                <div><span>建议</span><b class="sug">{{ r.suggestedValue }}</b></div>
              </div>
              <div class="rci">📌 {{ r.impact }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="cp">
        <div class="ph">
          <h3 class="st">航次记录 <small class="md">(按时间倒序)</small></h3>
          <div class="cts" v-if="cmpIds.length > 0">
            <span>已选 {{ cmpIds.length }} / 4</span>
            <button class="ab pr" :disabled="cmpIds.length < 2" @click="shCmp = true">对比</button>
            <button class="ab gh" @click="cmpIds = []">清空</button>
          </div>
        </div>
        <div class="vl">
          <div v-for="r in fRecs" :key="r.id" class="vc"
            :class="{a:sId===r.id,s:cmpIds.includes(r.id),v:r.isVictory,nr:r.isNewRecord}"
            @click="selV(r.id)">
            <div class="ccb" @click.stop="togC(r.id)">
              <input type="checkbox" :checked="cmpIds.includes(r.id)" :disabled="cmpIds.length>=4 && !cmpIds.includes(r.id)" />
            </div>
            <div class="vcm">
              <div class="vch">
                <div class="vcmode"><span>{{ gModeI(r.mode) }}</span><span>{{ r.modeLabel }}</span><span class="rb" v-if="r.rank">{{ r.rank }}</span></div>
                <div class="vct">{{ fDT(r.startedAt) }}</div>
              </div>
              <div class="vcbody">
                <div class="ss">
                  <div class="ms">{{ r.finalScore.toLocaleString() }}</div>
                  <div class="sb"><span>Lv.{{ r.finalLevel }}</span><span>·</span><span>{{ fD(r.duration) }}</span></div>
                </div>
                <div class="mg">
                  <div class="mm"><span>🔊</span><span class="mv">{{ Math.round(r.hitRate.discoveryRate*100) }}%</span><span class="mn">发现率</span></div>
                  <div class="mm"><span>🎯</span><span class="mv">{{ Math.round(r.hitRate.tapAccuracy*100) }}%</span><span class="mn">准确率</span></div>
                  <div class="mm"><span>📦</span><span class="mv">{{ r.hitRate.collectedTargets }}/{{ r.hitRate.totalTargets }}</span><span class="mn">收集</span></div>
                </div>
              </div>
              <div class="vcf">
                <div class="tg">
                  <span class="t v" v-if="r.isVictory">✓ 成功</span>
                  <span class="t f" v-else>✗ 失败</span>
                  <span class="t rc" v-if="r.isNewRecord">🏆 新纪录</span>
                  <span class="t a" v-if="r.anomalies.length>0">⚠ {{ r.anomalies.length }} 异常</span>
                  <span class="t dy" v-if="r.mode==='daily_challenge'">{{ r.dailyChallengeTitle }}</span>
                  <span class="t rs" v-if="r.mode==='rescue'">关卡 {{ r.rescueLevel }}</span>
                </div>
                <button class="dbtn" @click.stop="delV(r.id)">🗑</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="rp" v-if="sVoy">
        <div class="dh">
          <h3 class="st">航次详情</h3>
          <div class="ds2">{{ gModeI(sVoy.mode) }} {{ sVoy.modeLabel }} <span class="dv">·</span> {{ fDT(sVoy.startedAt) }}</div>
        </div>
        <div class="dts">
          <button v-for="t in dTabs" :key="t.v" class="dtb" :class="{a:aTab===t.v}" @click="aTab=t.v">
            <span>{{ t.i }}</span>{{ t.l }}
          </button>
        </div>
        <div class="dc">
          <div v-if="aTab==='score'" class="tp">
            <h4 class="pt">得分结构分析</h4>
            <div class="sov">
              <div class="oi tot"><div>最终得分</div><div class="bg">{{ sVoy.finalScore.toLocaleString() }}</div></div>
              <div class="oi pk"><div>峰值</div><div class="bg">{{ sVoy.peakScore.toLocaleString() }}</div></div>
            </div>
            <div class="sch">
              <div class="ct">得分来源分布</div>
              <div class="bch">
                <div v-for="c in sCats" :key="c.k" class="bi">
                  <div class="bl"><span class="dt" :style="{background:c.c}"></span>{{ c.l }}</div>
                  <div class="bt"><div class="bf" :style="{width:gp(sBr[c.k],sVoy.finalScore)+'%',background:c.c}"></div></div>
                  <div class="bv">{{ sBr[c.k]>=0?'+':'' }}{{ sBr[c.k] }}</div>
                </div>
              </div>
            </div>
            <div class="itw">
              <div class="ps">明细项目</div>
              <div class="ita">
                <div class="ir hd"><span>类别</span><span>名称</span><span class="tr">次</span><span class="tr">均</span><span class="tr">合</span></div>
                <div v-for="it in sVoy.scoreBreakdown.items" :key="it.name+it.category" class="ir">
                  <span class="cch" :class="it.category">{{ gCatS(it.category) }}</span>
                  <span class="tct">{{ it.name }}</span>
                  <span class="tr">{{ it.count }}</span>
                  <span class="tr">{{ it.avgPoints }}</span>
                  <span class="tr" :class="{neg:it.totalPoints<0}">{{ it.totalPoints>=0?'+':'' }}{{ it.totalPoints }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="aTab==='hitrate'" class="tp">
            <h4 class="pt">命中率统计</h4>
            <div class="hrg">
              <div class="rcl">
                <div class="rw">
                  <svg viewBox="0 0 100 100" class="rg">
                    <circle cx="50" cy="50" r="42" class="rbg" />
                    <circle cx="50" cy="50" r="42" class="rfl" :style="{'--p':sVoy.hitRate.discoveryRate}" />
                  </svg>
                  <div class="rt"><div class="bg">{{ Math.round(sVoy.hitRate.discoveryRate*100) }}%</div><div class="sm">发现率</div></div>
                </div>
                <div class="rrs">
                  <div class="rr"><span>声呐使用</span><b>{{ sVoy.hitRate.totalSonarFired }}</b></div>
                  <div class="rr"><span>发现次数</span><b>{{ sVoy.hitRate.sonarWithDiscovery }}</b></div>
                  <div class="rr"><span>每次发现耗</span><b>{{ sVoy.hitRate.avgSonarPerDiscovery.toFixed(1) }}次</b></div>
                </div>
              </div>
              <div class="rcl">
                <div class="rw">
                  <svg viewBox="0 0 100 100" class="rg">
                    <circle cx="50" cy="50" r="42" class="rbg" />
                    <circle cx="50" cy="50" r="42" class="rfl ac" :style="{'--p':sVoy.hitRate.tapAccuracy}" />
                  </svg>
                  <div class="rt"><div class="bg">{{ Math.round(sVoy.hitRate.tapAccuracy*100) }}%</div><div class="sm">准确率</div></div>
                </div>
                <div class="rrs">
                  <div class="rr"><span>点击总数</span><b>{{ sVoy.hitRate.totalTaps }}</b></div>
                  <div class="rr"><span>命中次数</span><b>{{ sVoy.hitRate.tapsWithHit }}</b></div>
                  <div class="rr"><span>未命中</span><b>{{ sVoy.hitRate.tapsWithMiss }}</b></div>
                </div>
              </div>
              <div class="rsm"><div class="la">目标覆盖率</div><div class="lv">{{ Math.round(sVoy.hitRate.discoveryCoverage*100) }}%</div><div class="lsb">{{ sVoy.hitRate.discoveredTargets }}/{{ sVoy.hitRate.totalTargets }}</div></div>
              <div class="rsm"><div class="la">收集率</div><div class="lv">{{ Math.round(sVoy.hitRate.collectionRate*100) }}%</div><div class="lsb">{{ sVoy.hitRate.collectedTargets }}/{{ sVoy.hitRate.totalTargets }}</div></div>
            </div>
            <div class="rss" v-if="sVoy.rescueDetails">
              <div class="ps">救援模式数据</div>
              <div class="rsgg">
                <div class="rsi"><div class="l">救援</div><div class="v">{{ sVoy.rescueDetails.capsulesRescued }}/{{ sVoy.rescueDetails.totalRealCapsules }}</div></div>
                <div class="rsi"><div class="l">误报</div><div class="v" :class="{dng:sVoy.rescueDetails.falseReports>0}">{{ sVoy.rescueDetails.falseReports }}</div></div>
                <div class="rsi"><div class="l">航线完成率</div><div class="v">{{ sVoy.rescueDetails.pathCompletionRate }}%</div></div>
                <div class="rsi"><div class="l">偏航</div><div class="v" :class="{dng:sVoy.rescueDetails.offtrackCount>0}">{{ sVoy.rescueDetails.offtrackCount }}</div></div>
                <div class="rsi"><div class="l">高危入侵</div><div class="v" :class="{dng:sVoy.rescueDetails.highRiskIncursions>0}">{{ sVoy.rescueDetails.highRiskIncursions }}</div></div>
                <div class="rsi"><div class="l">阻断碰撞</div><div class="v" :class="{dng:sVoy.rescueDetails.blockerCollisions>0}">{{ sVoy.rescueDetails.blockerCollisions }}</div></div>
                <div class="rsi w"><div class="l">安全距离</div><div class="v">{{ Math.round(sVoy.rescueDetails.safeTravelDistance) }}px</div></div>
                <div class="rsi w"><div class="l">完美航线</div><div class="v" :class="{ok:sVoy.rescueDetails.perfectPathBonus}">{{ sVoy.rescueDetails.perfectPathBonus?'✓ 获得':'未获得' }}</div></div>
              </div>
            </div>
          </div>

          <div v-if="aTab==='trajectory'" class="tp">
            <h4 class="pt">运动轨迹回放</h4>
            <div class="tv">
              <svg :viewBox="`0 0 ${mW} ${mH}`" class="ts">
                <defs>
                  <linearGradient id="tgr" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#00d4ff" stop-opacity="0.2" />
                    <stop offset="100%" stop-color="#00d4ff" stop-opacity="0.9" />
                  </linearGradient>
                  <filter id="gf"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                </defs>
                <rect :width="mW" :height="mH" fill="#001020" rx="8" />
                <polyline v-if="tLine.length>1" :points="tLine" fill="none" stroke="url(#tgr)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" />
                <g v-for="(p,i) in tEvs" :key="i">
                  <circle :cx="p.x" :cy="p.y" :r="p.r" :fill="p.c" filter="url(#gf)" />
                  <text :x="p.x" :y="p.y-10" fill="#fff" font-size="10" text-anchor="middle">{{ p.e }}</text>
                </g>
                <circle :cx="sP.x" :cy="sP.y" r="7" fill="#00ff88" filter="url(#gf)" />
                <text :x="sP.x" :y="sP.y+3" fill="#000" font-size="8" text-anchor="middle" font-weight="bold">起</text>
                <circle :cx="eP.x" :cy="eP.y" r="7" :fill="sVoy.isVictory?'#00ff88':'#ff4444'" filter="url(#gf)" />
                <text :x="eP.x" :y="eP.y+3" fill="#000" font-size="8" text-anchor="middle" font-weight="bold">终</text>
              </svg>
            </div>
            <div class="tlg">
              <div class="lg"><span class="ld s"></span>起点</div>
              <div class="lg"><span class="ld e"></span>终点</div>
              <div class="lg"><span class="ld son"></span>声呐</div>
              <div class="lg"><span class="ld col"></span>收集</div>
              <div class="lg"><span class="ld dmg"></span>异常</div>
            </div>
            <div class="tst">
              <div class="tsi"><div>采样点</div><b>{{ sVoy.trajectory.length }}</b></div>
              <div class="tsi"><div>声呐</div><b>{{ cntEv('sonar') }}</b></div>
              <div class="tsi"><div>收集</div><b>{{ cntEv('collect') }}</b></div>
            </div>
          </div>

          <div v-if="aTab==='anomaly'" class="tp">
            <h4 class="pt">异常事件时间线</h4>
            <div v-if="sVoy.anomalies.length===0" class="na">
              <div class="ck">✓</div><p>本次航次无异常，航行平稳！</p>
            </div>
            <div v-else class="tml">
              <div v-for="(ev,i) in sAn" :key="ev.id" class="ti" :class="ev.severity">
                <div class="tm"><span>{{ i+1 }}</span></div>
                <div class="tc">
                  <div class="th">
                    <span class="svb" :class="ev.severity">{{ gSevL(ev.severity) }}</span>
                    <span class="ty">{{ gAL(ev.type) }}</span>
                    <span class="ttm">{{ fD(ev.timestamp - sVoy.startedAt) }}</span>
                  </div>
                  <div class="td">{{ ev.description }}</div>
                  <div class="tp2">📍 ({{ Math.round(ev.position.x) }}, {{ Math.round(ev.position.y) }})</div>
                </div>
              </div>
            </div>
            <div class="as" v-if="sVoy.anomalies.length>0">
              <div class="ps">异常分类</div>
              <div class="ag">
                <div v-for="g in aGrps" :key="g.type" class="agi" :class="g.severity">
                  <div class="acn">{{ g.count }}</div><div class="anm">{{ g.label }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="cm" v-if="shCmp" @click.self="shCmp=false">
      <div class="cc">
        <div class="ch">
          <h3>📊 航次对比分析</h3>
          <button class="cx" @click="shCmp=false">✕</button>
        </div>
        <div class="cmx">
          <div class="mh">
            <div class="mc hd">指标</div>
            <div v-for="(r,i) in cmp.records" :key="r.id" class="mc vh">
              <div class="vm">{{ gModeI(r.mode) }} 航次{{ i+1 }}</div>
              <div class="vs">{{ r.finalScore.toLocaleString() }}分</div>
              <div class="vt">{{ fDT(r.startedAt) }}</div>
            </div>
          </div>
          <div v-for="grp in cGrps" :key="grp.name" class="mgr">
            <div class="gt">{{ grp.name }}</div>
            <div v-for="m in grp.metrics" :key="m.k" class="mr">
              <div class="mc mn"><div class="mnn">{{ m.l }}</div><div class="mhi">{{ m.h }}</div></div>
              <div v-for="r in cmp.records" :key="r.id+m.k" class="mc mv"
                :class="{best:isBest(m.k,r,cmp.records,m.ib),worst:isWorst(m.k,r,cmp.records,m.ib)}">
                {{ m.g(r) }}
                <span v-if="cmp.records.length>1 && m.ib!==undefined" class="dtt"
                  :class="dCls(m.k,r,cmp.records,m.ib)">{{ dSym(m.k,r,cmp.records,m.ib) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import type {
  VoyageRecord, VoyageFilters, VoyageArchiveStats,
  DifficultyRecommendation, AnomalyEventType, VoyageMode,
} from '../types/game';
import type { VoyageArchiveSystem } from '../game/VoyageArchiveSystem';

const props = defineProps<{ system: VoyageArchiveSystem }>();
defineEmits<{ (e: 'close'): void }>();

const sId = ref<string | null>(null);
const aTab = ref<'score' | 'hitrate' | 'trajectory' | 'anomaly'>('score');
const cmpIds = ref<string[]>([]);
const shCmp = ref(false);

const filters = reactive<VoyageFilters>({
  modes: [], dateRange: { start: null, end: null },
  scoreRange: { min: null, max: null }, levelRange: { min: null, max: null },
  anomalyTypes: [], hasAnomaliesOnly: false, searchText: '',
});

const modeOpts: Array<{ v: VoyageMode; l: string; i: string }> = [
  { v: 'normal', l: '常规', i: '🌊' },
  { v: 'daily_challenge', l: '每日', i: '📅' },
  { v: 'rescue', l: '救援', i: '🆘' },
  { v: 'custom', l: '自定义', i: '🛠️' },
];
const aOpts: Array<{ v: AnomalyEventType; l: string; s: string }> = [
  { v: 'danger_hit', l: '危险碰撞', s: 'high' },
  { v: 'sonar_empty', l: '空放声呐', s: 'low' },
  { v: 'target_missed', l: '错过目标', s: 'medium' },
  { v: 'false_report', l: '误报', s: 'medium' },
  { v: 'path_offtrack', l: '偏航', s: 'medium' },
  { v: 'high_risk_enter', l: '高危入侵', s: 'high' },
  { v: 'blocker_collision', l: '阻断碰撞', s: 'critical' },
  { v: 'yaw_warning', l: '偏航警告', s: 'high' },
  { v: 'yaw_failure', l: '偏航超限', s: 'critical' },
];
const dTabs = [
  { v: 'score' as const, l: '得分结构', i: '💎' },
  { v: 'hitrate' as const, l: '命中率', i: '🎯' },
  { v: 'trajectory' as const, l: '轨迹', i: '🛤️' },
  { v: 'anomaly' as const, l: '异常事件', i: '⚠️' },
];
const sCats = [
  { k: 'fromCreatures', l: '生物收集', c: '#00d4ff' },
  { k: 'fromWrecks', l: '残骸发现', c: '#ffaa00' },
  { k: 'fromBonus', l: '奖励加成', c: '#00ff88' },
  { k: 'fromLevelUp', l: '升级奖励', c: '#cc66ff' },
  { k: 'fromCombo', l: '连击加成', c: '#ff66aa' },
  { k: 'fromDanger', l: '危险损失', c: '#ff4444' },
];
const mW = 800, mH = 1200;

const records = computed(() => props.system.getRecords());
const fRecs = computed(() => props.system.getRecords(filters));
const stats = computed<VoyageArchiveStats>(() => props.system.getStats(filters));
const recs = computed<DifficultyRecommendation[]>(() => props.system.getDifficultyRecommendations(filters));
const sVoy = computed<VoyageRecord | null>(() => sId.value ? props.system.getRecordById(sId.value) : null);
const cmp = computed(() => props.system.compareRecords(cmpIds.value));

function togM(m: VoyageMode) { const i = filters.modes.indexOf(m); if (i >= 0) filters.modes.splice(i, 1); else filters.modes.push(m); }
function togA(t: AnomalyEventType) { const i = filters.anomalyTypes.indexOf(t); if (i >= 0) filters.anomalyTypes.splice(i, 1); else filters.anomalyTypes.push(t); }
function resetF() { filters.modes = []; filters.scoreRange = { min: null, max: null }; filters.levelRange = { min: null, max: null }; filters.anomalyTypes = []; filters.hasAnomaliesOnly = false; filters.searchText = ''; }
function selV(id: string) { sId.value = id; }
function togC(id: string) { const i = cmpIds.value.indexOf(id); if (i >= 0) cmpIds.value.splice(i, 1); else if (cmpIds.value.length < 4) cmpIds.value.push(id); }
function delV(id: string) { if (!confirm('确定删除？')) return; props.system.deleteRecord(id); if (sId.value === id) sId.value = null; cmpIds.value = cmpIds.value.filter(x => x !== id); }
function handleClearAll() { if (!confirm('清空所有档案？不可撤销！')) return; props.system.clearAll(); sId.value = null; cmpIds.value = []; }

const sBr = computed(() => sVoy.value ? sVoy.value.scoreBreakdown : {} as any);
const tLine = computed(() => !sVoy.value?.trajectory.length ? '' : sVoy.value.trajectory.map(p => `${p.position.x},${p.position.y}`).join(' '));
const tEvs = computed(() => {
  if (!sVoy.value) return [];
  const r: any[] = [];
  for (const p of sVoy.value.trajectory) {
    if (!p.event) continue;
    if (p.event === 'sonar') r.push({ x: p.position.x, y: p.position.y, r: 5, c: '#00d4ff', e: '🔊' });
    else if (p.event === 'collect') r.push({ x: p.position.x, y: p.position.y, r: 6, c: '#ffaa00', e: '📦' });
    else if (p.event === 'damage') r.push({ x: p.position.x, y: p.position.y, r: 7, c: '#ff4444', e: '💥' });
  }
  return r;
});
const sP = computed(() => sVoy.value?.trajectory[0]?.position || { x: 400, y: 80 });
const eP = computed(() => { const t = sVoy.value?.trajectory; return t && t.length ? t[t.length - 1].position : { x: 400, y: 800 }; });
const sAn = computed(() => sVoy.value ? [...sVoy.value.anomalies].sort((a, b) => a.timestamp - b.timestamp) : []);
const aGrps = computed(() => {
  if (!sVoy.value) return [];
  const m: Record<string, any> = {};
  for (const a of sVoy.value.anomalies) {
    if (!m[a.type]) { const o = aOpts.find(x => x.v === a.type); m[a.type] = { type: a.type, label: o?.l || a.type, count: 0, severity: o?.s || a.severity }; }
    m[a.type].count++;
  }
  return Object.values(m).sort((a, b) => b.count - a.count);
});
function cntEv(e: string) { return sVoy.value?.trajectory.filter(t => t.event === e).length || 0; }

const cGrps = [
  { name: '核心指标', metrics: [
    { k: 'finalScore', l: '最终得分', h: '航次总分', ib: true, g: (r: VoyageRecord) => r.finalScore.toLocaleString() },
    { k: 'peakScore', l: '峰值得分', h: '最高得分点', ib: true, g: (r: VoyageRecord) => r.peakScore.toLocaleString() },
    { k: 'finalLevel', l: '最终等级', h: '到达关卡', ib: true, g: (r: VoyageRecord) => `Lv.${r.finalLevel}` },
    { k: 'duration', l: '游戏时长', h: '总耗时', ib: false, g: (r: VoyageRecord) => fD(r.duration) },
    { k: 'isVictory', l: '是否胜利', h: '最终状态', ib: true, g: (r: VoyageRecord) => (r.isVictory ? '✓ 成功' : '✗ 失败') },
  ]},
  { name: '命中率与效率', metrics: [
    { k: 'discoveryRate', l: '声呐发现率', h: '声呐发现目标比', ib: true, g: (r: VoyageRecord) => `${Math.round(r.hitRate.discoveryRate * 100)}%` },
    { k: 'tapAccuracy', l: '点击准确率', h: '点击命中比例', ib: true, g: (r: VoyageRecord) => `${Math.round(r.hitRate.tapAccuracy * 100)}%` },
    { k: 'collectionRate', l: '收集率', h: '已收集占比', ib: true, g: (r: VoyageRecord) => `${Math.round(r.hitRate.collectionRate * 100)}%` },
    { k: 'totalSonarFired', l: '声呐次数', h: '总声呐消耗', ib: false, g: (r: VoyageRecord) => `${r.hitRate.totalSonarFired}次` },
    { k: 'avgSonarPerDiscovery', l: '每次发现耗', h: '平均每次发现', ib: false, g: (r: VoyageRecord) => r.hitRate.avgSonarPerDiscovery.toFixed(1) },
  ]},
  { name: '异常与风险', metrics: [
    { k: 'anomalyCount', l: '异常总数', h: '异常事件次数', ib: false, g: (r: VoyageRecord) => `${r.anomalies.length}次` },
    { k: 'dangerHits', l: '危险碰撞', h: '进入危险区次数', ib: false, g: (r: VoyageRecord) => `${r.anomalies.filter(a => a.type === 'danger_hit').length}次` },
    { k: 'emptySonar', l: '空放声呐', h: '未发现目标次数', ib: false, g: (r: VoyageRecord) => `${r.anomalies.filter(a => a.type === 'sonar_empty').length}次` },
  ]},
];

function rv(k: string, r: VoyageRecord): number {
  switch (k) {
    case 'finalScore': return r.finalScore;
    case 'peakScore': return r.peakScore;
    case 'finalLevel': return r.finalLevel;
    case 'duration': return r.duration;
    case 'isVictory': return r.isVictory ? 1 : 0;
    case 'discoveryRate': return r.hitRate.discoveryRate;
    case 'tapAccuracy': return r.hitRate.tapAccuracy;
    case 'collectionRate': return r.hitRate.collectionRate;
    case 'totalSonarFired': return r.hitRate.totalSonarFired;
    case 'avgSonarPerDiscovery': return r.hitRate.avgSonarPerDiscovery;
    case 'anomalyCount': return r.anomalies.length;
    case 'dangerHits': return r.anomalies.filter(a => a.type === 'danger_hit').length;
    case 'emptySonar': return r.anomalies.filter(a => a.type === 'sonar_empty').length;
    default: return 0;
  }
}
function isBest(k: string, r: VoyageRecord, all: VoyageRecord[], ib: boolean | undefined) {
  if (ib === undefined || all.length < 2) return false;
  const vs = all.map(x => rv(k, x));
  const b = ib ? Math.max(...vs) : Math.min(...vs);
  return rv(k, r) === b;
}
function isWorst(k: string, r: VoyageRecord, all: VoyageRecord[], ib: boolean | undefined) {
  if (ib === undefined || all.length < 2) return false;
  const vs = all.map(x => rv(k, x));
  const w = ib ? Math.min(...vs) : Math.max(...vs);
  return rv(k, r) === w && !isBest(k, r, all, ib);
}
function dCls(k: string, r: VoyageRecord, all: VoyageRecord[], ib: boolean | undefined) { return isBest(k, r, all, ib) ? 'best' : isWorst(k, r, all, ib) ? 'worst' : ''; }
function dSym(k: string, r: VoyageRecord, all: VoyageRecord[], ib: boolean | undefined) { return isBest(k, r, all, ib) ? '★' : isWorst(k, r, all, ib) ? '▼' : ''; }
function gp(p: number, t: number) { return t === 0 ? 0 : Math.max(0, Math.min(100, Math.abs(p) / Math.abs(t) * 100)); }
function fDT(ts: number) { const d = new Date(ts); const p = (n: number) => n.toString().padStart(2, '0'); return `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`; }
function fD(ms: number) { const s = Math.floor(ms / 1000); const m = Math.floor(s / 60); return m > 0 ? `${m}分${s % 60}秒` : `${s}秒`; }
function ft(ms: number) { const t = Math.floor(ms / 1000); const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60; if (h > 0) return `${h}时${m}分`; if (m > 0) return `${m}分${s}秒`; return `${s}秒`; }
function gModeI(m: VoyageMode) { return modeOpts.find(o => o.v === m)?.i || '🌊'; }
function gCatL(c: string) { const m: Record<string, string> = { sonar: '声呐系统', target: '目标系统', danger: '危险系统', lives: '生命系统', level_progression: '关卡进阶', rescue: '救援模式' }; return m[c] || c; }
function gSevL(s: string) { const m: Record<string, string> = { suggestion: '建议', adjustment: '调整', warning: '警告', low: '轻微', medium: '中等', high: '严重', critical: '危急' }; return m[s] || s; }
function gCatS(c: string) { const m: Record<string, string> = { creature: '生物', wreck: '残骸', danger: '危险', bonus: '奖励', level_up: '升级', combo: '连击', rescue: '救援', path_bonus: '航线' }; return m[c] || c; }
function gAL(t: AnomalyEventType) { return aOpts.find(o => o.v === t)?.l || t; }
</script>

<style scoped>
.va { position: fixed; inset: 0; z-index: 100; background: linear-gradient(135deg, #000814 0%, #001a33 50%, #000814 100%); color: #e0f0ff; display: flex; flex-direction: column; overflow: hidden; font-size: 13px; }
.va-h { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; border-bottom: 1px solid rgba(0, 212, 255, 0.15); background: rgba(0, 20, 40, 0.8); backdrop-filter: blur(10px); flex-shrink: 0; }
.va-hl { display: flex; align-items: center; gap: 16px; }
.bb { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px; background: rgba(0, 212, 255, 0.08); border: 1px solid rgba(0, 212, 255, 0.2); color: #00d4ff; font-size: 13px; cursor: pointer; }
.bb:hover { background: rgba(0, 212, 255, 0.15); }
.va-t { margin: 0; font-size: 20px; font-weight: 600; background: linear-gradient(90deg, #00d4ff, #00ff88); -webkit-background-clip: text; -webkit-text-fill-color: transparent; display: flex; align-items: center; gap: 8px; }
.va-ha { display: flex; gap: 8px; }
.ab { padding: 6px 14px; border-radius: 8px; border: none; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
.ab.pr { background: linear-gradient(135deg, #00d4ff, #0088cc); color: #fff; box-shadow: 0 2px 12px rgba(0, 212, 255, 0.3); }
.ab.pr:hover:not(:disabled) { transform: translateY(-1px); }
.ab.pr:disabled { opacity: 0.5; cursor: not-allowed; }
.ab.dng { background: rgba(255, 68, 68, 0.15); color: #ff8888; border: 1px solid rgba(255, 68, 68, 0.3); }
.ab.dng:hover:not(:disabled) { background: rgba(255, 68, 68, 0.25); }
.ab.dng:disabled { opacity: 0.3; cursor: not-allowed; }
.ab.gh { background: transparent; color: #88aacc; border: 1px solid rgba(136, 170, 204, 0.2); }
.ab.gh:hover { background: rgba(136, 170, 204, 0.08); }

.va-sb { display: flex; gap: 10px; padding: 12px 20px; overflow-x: auto; flex-shrink: 0; background: rgba(0, 12, 25, 0.5); border-bottom: 1px solid rgba(0, 212, 255, 0.08); }
.sc { min-width: 95px; padding: 10px 14px; border-radius: 10px; background: rgba(0, 30, 60, 0.6); border: 1px solid rgba(0, 212, 255, 0.12); text-align: center; }
.sc.hi { background: linear-gradient(135deg, rgba(0, 212, 255, 0.15), rgba(0, 255, 136, 0.1)); border-color: rgba(0, 212, 255, 0.3); }
.sc.wn { border-color: rgba(255, 170, 0, 0.3); }
.sv { font-size: 18px; font-weight: 700; color: #00d4ff; margin-bottom: 2px; }
.sc.wn .sv { color: #ffaa00; }
.sc.hi .sv { background: linear-gradient(90deg, #00d4ff, #00ff88); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.sl { font-size: 11px; color: #6688aa; }

.va-e { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; color: #6688aa; }
.ei { font-size: 64px; margin-bottom: 16px; opacity: 0.6; }
.va-e h3 { color: #aaccff; margin-bottom: 6px; }

.va-m { flex: 1; display: grid; grid-template-columns: 270px 1fr 390px; gap: 12px; padding: 12px 20px 20px; overflow: hidden; }
.lp, .cp, .rp { display: flex; flex-direction: column; overflow: hidden; min-height: 0; }
.st { font-size: 14px; font-weight: 600; color: #aaccff; margin: 0 0 10px; display: flex; align-items: center; gap: 6px; }
.md { color: #557799; font-weight: 400; font-size: 11px; }
.bd { background: linear-gradient(135deg, #ff6600, #ff3300); color: #fff; font-size: 10px; font-weight: 700; padding: 1px 7px; border-radius: 10px; margin-left: auto; }

.fs, .ds { background: rgba(0, 25, 50, 0.5); border: 1px solid rgba(0, 212, 255, 0.12); border-radius: 10px; padding: 12px; margin-bottom: 12px; overflow-y: auto; }
.ds { flex: 1; min-height: 0; }
.fg { margin-bottom: 12px; }
.fl { display: block; font-size: 11px; color: #6688aa; margin-bottom: 5px; font-weight: 500; }
.fr { display: flex; gap: 6px; }
.fr .fg { flex: 1; }
.fi { width: 100%; padding: 6px 8px; border-radius: 6px; background: rgba(0, 10, 25, 0.8); border: 1px solid rgba(0, 212, 255, 0.15); color: #e0f0ff; font-size: 12px; outline: none; box-sizing: border-box; }
.fi:focus { border-color: rgba(0, 212, 255, 0.5); }
.mt { display: flex; flex-wrap: wrap; gap: 5px; }
.tb { padding: 5px 8px; border-radius: 6px; background: rgba(0, 20, 40, 0.6); border: 1px solid rgba(0, 212, 255, 0.15); color: #88aacc; font-size: 11px; cursor: pointer; display: flex; align-items: center; gap: 3px; flex: 1; justify-content: center; min-width: 55px; }
.tb:hover { border-color: rgba(0, 212, 255, 0.3); }
.tb.a { background: rgba(0, 212, 255, 0.15); border-color: rgba(0, 212, 255, 0.5); color: #00d4ff; }
.ac { display: flex; flex-wrap: wrap; gap: 4px; }
.cp { padding: 3px 8px; border-radius: 10px; background: rgba(0, 20, 40, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); color: #88aacc; font-size: 10px; cursor: pointer; }
.cp:hover { border-color: rgba(255, 255, 255, 0.2); }
.cp.a { color: #fff; }
.cp.a.low { background: rgba(0, 212, 255, 0.2); border-color: rgba(0, 212, 255, 0.5); }
.cp.a.medium { background: rgba(255, 170, 0, 0.2); border-color: rgba(255, 170, 0, 0.5); }
.cp.a.high { background: rgba(255, 68, 68, 0.2); border-color: rgba(255, 68, 68, 0.5); }
.cp.a.critical { background: rgba(255, 0, 102, 0.25); border-color: rgba(255, 0, 102, 0.6); }
.cb { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #aaccff; cursor: pointer; }
.cb input { width: 14px; height: 14px; accent-color: #00d4ff; }
.fa { display: flex; align-items: center; justify-content: space-between; padding-top: 8px; border-top: 1px solid rgba(0, 212, 255, 0.08); }
.rc { font-size: 11px; color: #6688aa; }
.rc strong { color: #00d4ff; font-size: 13px; }

.nr { color: #557799; font-size: 12px; padding: 12px; text-align: center; background: rgba(0, 15, 30, 0.4); border-radius: 8px; }
.rl { display: flex; flex-direction: column; gap: 8px; }
.rcd { padding: 10px; border-radius: 8px; background: rgba(0, 15, 30, 0.6); border-left: 3px solid; border-top: 1px solid rgba(255, 255, 255, 0.05); border-right: 1px solid rgba(255, 255, 255, 0.05); border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
.rcd.suggestion { border-left-color: #00d4ff; }
.rcd.adjustment { border-left-color: #ffaa00; }
.rcd.warning { border-left-color: #ff4444; }
.rch { display: flex; justify-content: space-between; margin-bottom: 4px; }
.rcg { font-size: 10px; color: #00d4ff; font-weight: 600; background: rgba(0, 212, 255, 0.1); padding: 1px 6px; border-radius: 4px; }
.rsv { font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 4px; }
.rcd.suggestion .rsv { color: #00d4ff; background: rgba(0, 212, 255, 0.1); }
.rcd.adjustment .rsv { color: #ffaa00; background: rgba(255, 170, 0, 0.1); }
.rcd.warning .rsv { color: #ff4444; background: rgba(255, 68, 68, 0.1); }
.rct { font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 3px; }
.rcd2 { font-size: 11px; color: #88aacc; margin-bottom: 8px; line-height: 1.5; }
.rcv { display: flex; align-items: center; justify-content: space-around; padding: 6px 8px; background: rgba(0, 10, 25, 0.6); border-radius: 6px; margin-bottom: 6px; }
.rcv > div { text-align: center; }
.rcv span { display: block; font-size: 10px; color: #557799; margin-bottom: 2px; }
.rcv strong { font-size: 13px; color: #e0f0ff; }
.rcv .sug { color: #00ff88; }
.rcv .arr { color: #557799; font-weight: 700; }
.rci { font-size: 11px; color: #ffaa00; }

.ph { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.cts { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #00d4ff; }

.vl { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 4px; }
.vc { display: flex; gap: 10px; padding: 10px 12px; border-radius: 10px; background: rgba(0, 25, 50, 0.5); border: 1px solid rgba(0, 212, 255, 0.1); cursor: pointer; transition: all 0.2s; position: relative; }
.vc:hover { border-color: rgba(0, 212, 255, 0.3); background: rgba(0, 35, 65, 0.6); }
.vc.a { border-color: rgba(0, 212, 255, 0.6); background: rgba(0, 40, 70, 0.7); box-shadow: 0 0 20px rgba(0, 212, 255, 0.1); }
.vc.v::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: linear-gradient(180deg, #00ff88, #00aa55); border-radius: 10px 0 0 10px; }
.vc.s::after { content: '✓'; position: absolute; right: 8px; top: 8px; width: 18px; height: 18px; background: rgba(0, 212, 255, 0.8); color: #fff; border-radius: 50%; font-size: 11px; display: flex; align-items: center; justify-content: center; font-weight: 700; }
.ccb { padding-top: 4px; }
.ccb input { width: 16px; height: 16px; accent-color: #00d4ff; cursor: pointer; }
.vcm { flex: 1; min-width: 0; }
.vch { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
.vcmode { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #aaccff; }
.vct { font-size: 11px; color: #557799; }
.rb { padding: 1px 6px; border-radius: 4px; font-size: 11px; font-weight: 700; background: linear-gradient(135deg, #ffd700, #ff8c00); color: #331800; }
.ss { margin-bottom: 8px; }
.ms { font-size: 22px; font-weight: 700; color: #fff; line-height: 1.1; }
.vc.v .ms { background: linear-gradient(90deg, #00ff88, #00d4ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.vc.nr .ms { background: linear-gradient(90deg, #ffd700, #ff8c00); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.sb { font-size: 11px; color: #6688aa; display: flex; gap: 5px; }
.mg { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 8px; }
.mm { display: flex; flex-direction: column; align-items: center; padding: 5px; background: rgba(0, 10, 25, 0.5); border-radius: 6px; gap: 1px; }
.mv { font-size: 12px; font-weight: 600; color: #00d4ff; }
.mn { font-size: 9px; color: #557799; }
.vcf { display: flex; justify-content: space-between; align-items: center; }
.tg { display: flex; flex-wrap: wrap; gap: 4px; }
.t { padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 500; }
.t.v { background: rgba(0, 255, 136, 0.15); color: #00ff88; }
.t.f { background: rgba(255, 68, 68, 0.15); color: #ff6666; }
.t.rc { background: rgba(255, 215, 0, 0.2); color: #ffd700; }
.t.a { background: rgba(255, 170, 0, 0.15); color: #ffaa00; }
.t.dy { background: rgba(204, 102, 255, 0.15); color: #cc66ff; }
.t.rs { background: rgba(255, 102, 170, 0.15); color: #ff66aa; }
.dbtn { padding: 4px 6px; border-radius: 6px; background: transparent; border: none; color: #557799; cursor: pointer; opacity: 0.5; }
.dbtn:hover { background: rgba(255, 68, 68, 0.15); color: #ff6666; opacity: 1; }

.dh { margin-bottom: 10px; }
.ds2 { font-size: 12px; color: #6688aa; margin-top: 2px; }
.dv { color: #446688; margin: 0 4px; }
.dts { display: flex; gap: 4px; margin-bottom: 10px; padding: 3px; background: rgba(0, 15, 30, 0.6); border-radius: 8px; }
.dtb { flex: 1; padding: 7px 4px; border-radius: 6px; background: transparent; border: none; color: #6688aa; font-size: 11px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.dtb:hover { color: #aaccff; }
.dtb.a { background: rgba(0, 212, 255, 0.15); color: #00d4ff; }
.dc { flex: 1; overflow-y: auto; padding-right: 4px; }
.tp { padding-bottom: 20px; }
.pt { font-size: 13px; font-weight: 600; color: #fff; margin: 0 0 10px; }
.ps { font-size: 11px; color: #6688aa; margin: 12px 0 6px; font-weight: 500; }

.sov { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
.oi { padding: 10px; border-radius: 8px; background: rgba(0, 20, 40, 0.6); text-align: center; border: 1px solid rgba(0, 212, 255, 0.1); }
.oi > div:first-child { font-size: 11px; color: #6688aa; margin-bottom: 3px; }
.oi .bg { font-size: 18px; font-weight: 700; color: #fff; }
.oi.tot .bg { background: linear-gradient(90deg, #00d4ff, #00ff88); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.oi.pk { border-color: rgba(255, 215, 0, 0.2); }
.oi.pk .bg { color: #ffd700; }

.sch { padding: 10px; background: rgba(0, 15, 30, 0.5); border-radius: 8px; margin-bottom: 12px; }
.ct { font-size: 12px; font-weight: 600; color: #aaccff; margin-bottom: 8px; }
.bch { display: flex; flex-direction: column; gap: 6px; }
.bi { display: grid; grid-template-columns: 70px 1fr 60px; gap: 8px; align-items: center; }
.bl { font-size: 11px; color: #88aacc; display: flex; align-items: center; gap: 5px; }
.dt { width: 8px; height: 8px; border-radius: 50%; }
.bt { height: 14px; background: rgba(0, 10, 25, 0.8); border-radius: 7px; overflow: hidden; }
.bf { height: 100%; border-radius: 7px; transition: width 0.4s; }
.bv { font-size: 11px; text-align: right; color: #e0f0ff; font-weight: 500; }

.itw {}
.ita { background: rgba(0, 10, 25, 0.4); border-radius: 8px; overflow: hidden; }
.ir { display: grid; grid-template-columns: 40px 1fr 36px 40px 50px; gap: 4px; padding: 6px 8px; font-size: 11px; align-items: center; border-bottom: 1px solid rgba(0, 212, 255, 0.05); }
.ir:last-child { border-bottom: none; }
.ir.hd { background: rgba(0, 20, 40, 0.6); color: #6688aa; font-weight: 600; }
.ir:not(.hd):hover { background: rgba(0, 30, 60, 0.4); }
.tr { text-align: right; }
.tct { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cch { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; text-align: center; background: rgba(0, 212, 255, 0.15); color: #00d4ff; }
.cch.creature { background: rgba(0, 212, 255, 0.15); color: #00d4ff; }
.cch.wreck { background: rgba(255, 170, 0, 0.15); color: #ffaa00; }
.cch.danger { background: rgba(255, 68, 68, 0.15); color: #ff6666; }
.cch.bonus { background: rgba(0, 255, 136, 0.15); color: #00ff88; }
.cch.level_up { background: rgba(204, 102, 255, 0.15); color: #cc66ff; }
.cch.combo { background: rgba(255, 102, 170, 0.15); color: #ff66aa; }
.cch.rescue { background: rgba(255, 102, 170, 0.15); color: #ff66aa; }
.cch.path_bonus { background: rgba(0, 255, 136, 0.15); color: #00ff88; }
.neg { color: #ff6666 !important; }

.hrg { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 10px; }
.rcl { padding: 10px; background: rgba(0, 15, 30, 0.5); border-radius: 10px; text-align: center; }
.rw { position: relative; width: 90px; height: 90px; margin: 0 auto 8px; }
.rg { width: 90px; height: 90px; transform: rotate(-90deg); }
.rbg { fill: none; stroke: rgba(0, 212, 255, 0.1); stroke-width: 8; }
.rfl { fill: none; stroke: #00d4ff; stroke-width: 8; stroke-linecap: round; stroke-dasharray: calc(264 * var(--p, 0)) 264; transition: stroke-dasharray 0.6s; }
.rfl.ac { stroke: #00ff88; }
.rt { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; }
.rt .bg { font-size: 16px; font-weight: 700; color: #fff; }
.rt .sm { font-size: 9px; color: #6688aa; }
.rrs { display: flex; flex-direction: column; gap: 3px; }
.rr { display: flex; justify-content: space-between; font-size: 11px; padding: 3px 0; border-bottom: 1px solid rgba(0, 212, 255, 0.05); }
.rr:last-child { border-bottom: none; }
.rr span { color: #6688aa; }
.rr b { color: #e0f0ff; font-weight: 600; }
.rsm { background: rgba(0, 15, 30, 0.5); border-radius: 8px; padding: 8px; margin-bottom: 6px; display: grid; grid-template-columns: auto 1fr auto; gap: 10px; align-items: center; }
.la { font-size: 11px; color: #88aacc; }
.lv { font-size: 16px; font-weight: 700; color: #00ff88; text-align: center; }
.lsb { font-size: 10px; color: #557799; text-align: right; }
.rsgg { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
.rsi { background: rgba(0, 20, 40, 0.6); border-radius: 6px; padding: 8px; text-align: center; border: 1px solid rgba(0, 212, 255, 0.1); }
.rsi.w { grid-column: span 1; }
.rsi .l { font-size: 10px; color: #6688aa; margin-bottom: 3px; }
.rsi .v { font-size: 14px; font-weight: 700; color: #00d4ff; }
.rsi .v.dng { color: #ff6666; }
.rsi .v.ok { color: #00ff88; }

.tv { background: #000814; border-radius: 10px; overflow: hidden; padding: 8px; border: 1px solid rgba(0, 212, 255, 0.15); }
.ts { width: 100%; height: 450px; display: block; }
.tlg { display: flex; justify-content: center; gap: 12px; margin-top: 10px; flex-wrap: wrap; }
.lg { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #88aacc; }
.ld { width: 10px; height: 10px; border-radius: 50%; }
.ld.s { background: #00ff88; }
.ld.e { background: #ff4444; }
.ld.son { background: #00d4ff; }
.ld.col { background: #ffaa00; }
.ld.dmg { background: #ff4444; }
.tst { display: flex; justify-content: center; gap: 20px; margin-top: 10px; }
.tsi { text-align: center; }
.tsi > div { font-size: 10px; color: #6688aa; margin-bottom: 2px; }
.tsi b { font-size: 14px; color: #00d4ff; font-weight: 700; }

.na { text-align: center; padding: 30px 20px; background: rgba(0, 255, 136, 0.05); border-radius: 10px; border: 1px solid rgba(0, 255, 136, 0.15); }
.ck { width: 50px; height: 50px; margin: 0 auto 10px; background: linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 255, 136, 0.05)); border: 2px solid #00ff88; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; color: #00ff88; }
.na p { color: #88ccaa; margin: 0; }
.tml { position: relative; padding-left: 24px; }
.tml::before { content: ''; position: absolute; left: 8px; top: 8px; bottom: 8px; width: 2px; background: linear-gradient(180deg, rgba(0, 212, 255, 0.3), rgba(0, 212, 255, 0.05)); }
.ti { position: relative; margin-bottom: 10px; }
.tm { position: absolute; left: -24px; top: 0; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; background: rgba(0, 20, 40, 0.8); border: 2px solid #00d4ff; color: #00d4ff; z-index: 1; }
.ti.low .tm { border-color: #00d4ff; color: #00d4ff; }
.ti.medium .tm { border-color: #ffaa00; color: #ffaa00; }
.ti.high .tm { border-color: #ff4444; color: #ff4444; }
.ti.critical .tm { border-color: #ff0066; color: #ff0066; animation: pulse 1.5s infinite; }
.tc { padding: 8px 10px; background: rgba(0, 15, 30, 0.6); border-radius: 8px; border-left: 3px solid #00d4ff; }
.ti.low .tc { border-left-color: #00d4ff; }
.ti.medium .tc { border-left-color: #ffaa00; }
.ti.high .tc { border-left-color: #ff4444; }
.ti.critical .tc { border-left-color: #ff0066; background: rgba(255, 0, 102, 0.05); }
.th { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 4px; }
.svb { font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 4px; }
.svb.low { background: rgba(0, 212, 255, 0.2); color: #00d4ff; }
.svb.medium { background: rgba(255, 170, 0, 0.2); color: #ffaa00; }
.svb.high { background: rgba(255, 68, 68, 0.2); color: #ff6666; }
.svb.critical { background: rgba(255, 0, 102, 0.2); color: #ff66aa; }
.ty { font-size: 11px; font-weight: 600; color: #e0f0ff; }
.ttm { font-size: 10px; color: #6688aa; margin-left: auto; }
.td { font-size: 11px; color: #aaccff; line-height: 1.5; margin-bottom: 4px; }
.tp2 { font-size: 10px; color: #557799; }
.ag { display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 6px; }
.agi { padding: 8px; border-radius: 8px; text-align: center; background: rgba(0, 15, 30, 0.6); border: 1px solid rgba(0, 212, 255, 0.1); }
.agi.low { border-color: rgba(0, 212, 255, 0.2); }
.agi.medium { border-color: rgba(255, 170, 0, 0.2); }
.agi.high { border-color: rgba(255, 68, 68, 0.2); }
.agi.critical { border-color: rgba(255, 0, 102, 0.3); background: rgba(255, 0, 102, 0.05); }
.acn { font-size: 20px; font-weight: 700; color: #00d4ff; line-height: 1; }
.agi.medium .acn { color: #ffaa00; }
.agi.high .acn { color: #ff6666; }
.agi.critical .acn { color: #ff66aa; }
.anm { font-size: 10px; color: #88aacc; margin-top: 4px; }

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 0, 102, 0.4); }
  50% { box-shadow: 0 0 0 6px rgba(255, 0, 102, 0); }
}

.cm { position: fixed; inset: 0; z-index: 200; background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; padding: 20px; }
.cc { width: 100%; max-width: 900px; max-height: 85vh; background: linear-gradient(135deg, #000814 0%, #001a33 50%, #000814 100%); border-radius: 14px; border: 1px solid rgba(0, 212, 255, 0.2); display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); }
.ch { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-bottom: 1px solid rgba(0, 212, 255, 0.15); }
.ch h3 { margin: 0; color: #00d4ff; font-size: 16px; display: flex; align-items: center; gap: 8px; }
.cx { width: 32px; height: 32px; border-radius: 8px; background: rgba(255, 68, 68, 0.1); border: 1px solid rgba(255, 68, 68, 0.2); color: #ff6666; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; }
.cx:hover { background: rgba(255, 68, 68, 0.2); }
.cmx { flex: 1; overflow-y: auto; padding: 16px 20px; }
.mh { display: grid; gap: 6px; margin-bottom: 14px; padding: 10px; background: rgba(0, 20, 40, 0.6); border-radius: 10px; }
.mh .mc { padding: 6px 8px; }
.mc.hd { color: #6688aa; font-size: 11px; font-weight: 600; }
.vh { display: grid; grid-template-columns: auto 1fr auto; gap: 10px; align-items: center; padding: 4px 8px; border-radius: 6px; background: rgba(0, 212, 255, 0.05); }
.vh .vm { font-size: 11px; color: #aaccff; font-weight: 600; }
.vh .vs { font-size: 14px; color: #00ff88; font-weight: 700; text-align: center; }
.vh .vt { font-size: 10px; color: #557799; text-align: right; }
.mgr { margin-bottom: 16px; }
.gt { font-size: 11px; font-weight: 600; color: #00d4ff; padding-bottom: 6px; margin-bottom: 6px; border-bottom: 1px solid rgba(0, 212, 255, 0.1); letter-spacing: 0.5px; }
.mr { display: grid; gap: 6px; margin-bottom: 4px; }
.mr .mc { padding: 6px 8px; border-radius: 6px; }
.mr:nth-child(odd) .mc:not(.mv) { background: rgba(0, 15, 30, 0.4); }
.mn { display: flex; flex-direction: column; gap: 1px; }
.mnn { font-size: 12px; font-weight: 600; color: #e0f0ff; }
.mhi { font-size: 10px; color: #557799; }
.mv { font-size: 13px; color: #aaccff; text-align: right; font-weight: 500; position: relative; padding-right: 22px; }
.mv.best { background: rgba(0, 255, 136, 0.12); color: #00ff88; font-weight: 700; }
.mv.worst { background: rgba(255, 68, 68, 0.08); color: #ff8888; }
.dtt { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); font-size: 10px; }
.dtt.best { color: #ffd700; }
.dtt.worst { color: #ff6666; }

@media (max-width: 1100px) {
  .va-m { grid-template-columns: 240px 1fr 350px; }
}
@media (max-width: 950px) {
  .va-m { grid-template-columns: 1fr; grid-template-rows: auto auto auto; overflow-y: auto; }
  .lp { flex-direction: row; gap: 12px; }
  .lp .fs, .lp .ds { flex: 1; margin-bottom: 0; max-height: 280px; }
  .cp, .rp { max-height: 500px; }
}
@media (max-width: 600px) {
  .va-h { flex-direction: column; gap: 8px; padding: 10px; }
  .va-m { padding: 10px; }
  .lp { flex-direction: column; }
  .fs, .ds { max-height: none !important; }
  .hrg { grid-template-columns: 1fr; }
  .mg { grid-template-columns: repeat(3, 1fr); }
  .sov { grid-template-columns: 1fr; }
}
</style>
