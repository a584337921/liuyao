// ====================================================================
//  六爻排盘综合验证测试 — 从 knowledge.js 加载真实数据
//  运行: node test_cases.js
// ====================================================================

var fs = require('fs');
var path = require('path');

// ===== 加载 knowledge.js =====
var kbContent = fs.readFileSync(path.join(__dirname, 'knowledge.js'), 'utf8');
kbContent = kbContent.replace('window.LIUYAO_KB = {', 'globalThis.LIUYAO_KB = {');
eval(kbContent);
var KB = globalThis.LIUYAO_KB;

// ===== 基础常量 =====
var TIAN_GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
var DI_ZHI_12 = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
var DI_ZHI_WU_XING = KB.DI_ZHI_WU_XING;
var WU_XING_KB = KB.WU_XING_SHENG_KE;
var BA_GUA = KB.BA_GUA;
var NA_JIA_TIAN_GAN = KB.NA_JIA_TIAN_GAN;
var HUN_TIAN_JIA_ZI = KB.HUN_TIAN_JIA_ZI;
var LIU_QIN_RULE = KB.LIU_QIN_RULE;
var GONG_GUA_XU = KB.GONG_GUA_XU;
var GONG_SHI_YING = KB.GONG_SHI_YING;
var SI_SHI_KB = KB.SI_SHI_WANG_XIANG;
var XUN_KONG_KB = KB.XUN_KONG;
var LIU_CHONG_KB = KB.LIU_CHONG;
var LIU_HE_KB = KB.LIU_HE;
var CHANG_SHENG = KB.CHANG_SHENG;
var JIN_TUI_SHEN = KB.JIN_TUI_SHEN;
var MU_KU = KB.MU_KU;
var LIU_SHEN_BY_DAY_STEM = KB.LIU_SHEN.byDayStem;
var LIU_SHI_JIA_ZI_ARR = KB.LIU_SHI_JIA_ZI;

// ===== 生成传统正确的八宫卦序 =====
function generateCorrectGongGuaXu(benGongCode) {
  var lines = benGongCode.split('').map(function(c) { return parseInt(c); });
  var result = [benGongCode];
  var current = lines.slice();
  for (var i = 0; i < 5; i++) {
    current[i] = 1 - current[i];
    result.push(current.join(''));
  }
  current[3] = 1 - current[3];
  result.push(current.join(''));
  current[0] = lines[0];
  current[1] = lines[1];
  current[2] = lines[2];
  result.push(current.join(''));
  return result;
}

var CORRECT_GONG_SHI_YING = [6, 1, 2, 3, 4, 5, 4, 3];

// ===== 核心函数 =====
function getTrigrams(code) {
  return {
    lower: BA_GUA[code.substring(0, 3)],
    upper: BA_GUA[code.substring(3, 6)]
  };
}

function getNaJia(lineIndex, lowerName, upperName) {
  var lowerInfo = HUN_TIAN_JIA_ZI[lowerName];
  var upperInfo = HUN_TIAN_JIA_ZI[upperName];
  var lowerGan = NA_JIA_TIAN_GAN[lowerName];
  var upperGan = NA_JIA_TIAN_GAN[upperName];
  var isInner = lineIndex < 3;
  var naJia = isInner ? lowerInfo.nei[lineIndex] : upperInfo.wai[lineIndex - 3];
  var tianGan = isInner ? lowerGan.nei : upperGan.wai;
  var diZhi = naJia.substring(0, 1);
  return {
    label: naJia,
    tianGan: tianGan,
    fullLabel: tianGan + naJia,
    wuXing: DI_ZHI_WU_XING[diZhi]
  };
}

function assignLiuQin(naJiaArr, gongAttr) {
  var rule = LIU_QIN_RULE[gongAttr];
  return naJiaArr.map(function(nj) {
    var w = nj.wuXing;
    if (w === rule.shengWo) return '父母';
    if (w === rule.woSheng) return '子孙';
    if (w === rule.tong) return '兄弟';
    if (w === rule.woKe) return '妻财';
    if (w === rule.keWo) return '官鬼';
    return '—';
  });
}

function determineGongAndShiYing(code) {
  for (var gong in GONG_GUA_XU) {
    var idx = GONG_GUA_XU[gong].indexOf(code);
    if (idx !== -1) {
      var shi = GONG_SHI_YING[gong][idx];
      var ying = shi + 3 > 6 ? shi - 3 : shi + 3;
      var gongAttr = BA_GUA[Object.keys(BA_GUA).find(function(k){return BA_GUA[k].name === gong;})].attr;
      return { gong: gong, gongAttr: gongAttr, shi: shi, ying: ying, idx: idx };
    }
  }
  return null;
}

function getWangShuai(element, monthBranch) {
  var wxx = SI_SHI_KB[monthBranch];
  if (!wxx) return '未知';
  if (wxx.wang === element) return '旺';
  if (wxx.xiang === element) return '相';
  if (wxx.xiu === element) return '休';
  if (wxx.qiu === element) return '囚';
  if (wxx.si === element) return '死';
  return '未知';
}

function getChangSheng(element, branch) {
  var stageArr = CHANG_SHENG[element];
  if (!stageArr) return '—';
  var stages = ['长生','沐浴','冠带','临官','帝旺','衰','病','死','墓','绝','胎','养'];
  var idx = stageArr.indexOf(branch);
  return idx >= 0 ? stages[idx] : '—';
}

function getXunKong(ganZhi) {
  var idx = LIU_SHI_JIA_ZI_ARR.indexOf(ganZhi);
  if (idx === -1) return [];
  var xunStart = Math.floor(idx / 10) * 10;
  var xunName = LIU_SHI_JIA_ZI_ARR[xunStart];
  return XUN_KONG_KB[xunName] || [];
}

function yearToGanZhi(year, month, day) {
  var y = year;
  if (month < 2 || (month === 2 && day < 4)) y = year - 1;
  var offset = y - 1984;
  var ganIdx = ((offset % 10) + 10) % 10;
  var zhiIdx = ((offset % 12) + 12) % 12;
  return TIAN_GAN[ganIdx] + DI_ZHI_12[zhiIdx];
}

function getMonthJianZhi(month, day) {
  var jieqi = [
    {m:2, d:4, z:'寅'}, {m:3, d:6, z:'卯'}, {m:4, d:5, z:'辰'},
    {m:5, d:6, z:'巳'}, {m:6, d:6, z:'午'}, {m:7, d:7, z:'未'},
    {m:8, d:8, z:'申'}, {m:9, d:8, z:'酉'}, {m:10,d:8, z:'戌'},
    {m:11,d:7, z:'亥'}, {m:12,d:7, z:'子'}, {m:1, d:6, z:'丑'}
  ];
  for (var i = 0; i < jieqi.length; i++) {
    var jq = jieqi[i];
    var nextJq = jieqi[(i + 1) % 12];
    var curScore = month * 100 + day;
    var jqScore = jq.m * 100 + jq.d;
    var nextScore = nextJq.m * 100 + nextJq.d;
    if (nextScore > jqScore) {
      if (curScore >= jqScore && curScore < nextScore) return jq.z;
    } else {
      if (curScore >= jqScore || curScore < nextScore) return jq.z;
    }
  }
  return '寅';
}

function dateToDayGanZhi(year, month, day) {
  var baseDate = new Date(1900, 0, 1);
  var targetDate = new Date(year, month - 1, day);
  var diffDays = Math.round((targetDate - baseDate) / 86400000);
  var dayIdx = ((diffDays + 10) % 60 + 60) % 60;
  return LIU_SHI_JIA_ZI_ARR[dayIdx];
}

function hourToGanZhi(hourZhi, dayGanZhi) {
  var dayGan = dayGanZhi.charAt(0);
  var ganIdx = TIAN_GAN.indexOf(dayGan);
  var startOffset = [0, 2, 4, 6, 8][ganIdx % 5];
  var hourZhiIdx = DI_ZHI_12.indexOf(hourZhi);
  var hourGanIdx = (startOffset + hourZhiIdx) % 10;
  return TIAN_GAN[hourGanIdx] + hourZhi;
}

function getDayStemGroup(ganZhi) {
  var stem = ganZhi.charAt(0);
  if (stem === '甲' || stem === '乙') return '甲乙';
  if (stem === '丙' || stem === '丁') return '丙丁';
  if (stem === '戊') return '戊';
  if (stem === '己') return '己';
  if (stem === '庚' || stem === '辛') return '庚辛';
  if (stem === '壬' || stem === '癸') return '壬癸';
  return '甲乙';
}

function calcShenSha(yaoData, dayGanZhi, shiPos) {
  var dayBranch = dayGanZhi.charAt(1);
  var dayStem = dayGanZhi.charAt(0);
  var result = { guaShen: null, yiMa: '—', taoHua: '—', riLu: '—' };

  if (shiPos && yaoData[shiPos - 1]) {
    var shiIsYang = yaoData[shiPos - 1].yaoInfo.type === 'yang';
    var diZhi12 = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    var startIndex = shiIsYang ? 0 : 6;
    var guaShenBranch = diZhi12[(startIndex + shiPos - 1) % 12];
    for (var i = 0; i < 6; i++) {
      if (yaoData[i].branch === guaShenBranch) {
        result.guaShen = { pos: i + 1, yao: yaoData[i], branch: guaShenBranch };
        break;
      }
    }
    if (!result.guaShen) {
      result.guaShen = { pos: 0, yao: null, branch: guaShenBranch };
    }
  }

  var yiMaMap = { '申': '寅', '子': '寅', '辰': '寅', '寅': '申', '午': '申', '戌': '申', '巳': '亥', '酉': '亥', '丑': '亥', '亥': '巳', '卯': '巳', '未': '巳' };
  result.yiMa = yiMaMap[dayBranch] || '—';
  var taoHuaMap = { '申': '酉', '子': '酉', '辰': '酉', '寅': '卯', '午': '卯', '戌': '卯', '巳': '午', '酉': '午', '丑': '午', '亥': '子', '卯': '子', '未': '子' };
  result.taoHua = taoHuaMap[dayBranch] || '—';
  var riLuMap = { '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳', '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子' };
  result.riLu = riLuMap[dayStem] || '—';
  return result;
}

function autoDetectSpirit(topicText) {
  var text = (topicText || '').trim();
  if (!text) return null;
  var keywords = [
    { keys: ['父母','母亲','父亲','妈妈','爸爸','长辈','房屋','文书','合同','考试','成绩','文凭','学历','证件'], spirit: '父母' },
    { keys: ['官鬼','官职','升迁','升职','调动','工作','职位','领导','官司','诉讼','丈夫','男命','男友','老公','考公','考编'], spirit: '官鬼' },
    { keys: ['妻财','妻子','老婆','女命','女友','配偶','收入','工资','钱财','财运','求财','买卖','生意','投资','理财','赚钱','借款','债务','贷款'], spirit: '妻财' },
    { keys: ['子孙','孩子','子女','小孩','儿子','女儿','怀孕','生育','医药','医生','医院','健康','疾病','痊愈','平安','安全','手术'], spirit: '子孙' },
    { keys: ['兄弟','姐妹','手足','同辈','朋友','同事','同学','合伙人','竞争对手','破财','劫财'], spirit: '兄弟' },
    { keys: ['自身','自己','我的','寿命','运气','前程','命运','婚姻','姻缘','感情','恋爱','缘分','出行','搬家','迁移','家宅','风水','坟墓','面试','行人','失物','寻人','归期','平安'], spirit: '世爻' }
  ];
  var scores = {};
  for (var i = 0; i < keywords.length; i++) {
    var grp = keywords[i];
    var score = 0;
    for (var j = 0; j < grp.keys.length; j++) {
      if (text.indexOf(grp.keys[j]) !== -1) score++;
    }
    if (score > 0) scores[grp.spirit] = (scores[grp.spirit] || 0) + score;
  }
  var best = null, bestScore = 0;
  for (var s in scores) {
    if (scores[s] > bestScore) { bestScore = scores[s]; best = s; }
  }
  return best;
}

// ===== 测试框架 =====
var allPass = true;
var testCount = 0;
var passCount = 0;
var failCount = 0;
var failDetails = [];

function assert(condition, msg) {
  testCount++;
  if (condition) {
    passCount++;
    console.log('  PASS | #' + testCount + ' ' + msg);
  } else {
    failCount++;
    allPass = false;
    failDetails.push('#' + testCount + ' ' + msg);
    console.log('  FAIL | #' + testCount + ' ' + msg);
  }
}

function testHeader(title) {
  console.log('\n--- ' + title + ' ---');
}

// ====================================================================
//  测试用例开始
// ====================================================================

console.log('====================================================================');
console.log('  六爻排盘综合验证测试');
console.log('  数据源: knowledge.js (实际运行数据)');
console.log('  对照: 京房八宫 / 增删卜易 传统理论');
console.log('====================================================================');

// ====================================================================
// 测试1: 八宫卦序正确性验证
// ====================================================================
testHeader('测试1: 八宫卦序正确性验证（对照传统理论）');

var palaceBenGong = {
  '乾': '111111', '坤': '000000', '坎': '010010', '离': '101101',
  '震': '100100', '巽': '011011', '艮': '001001', '兑': '110110'
};
var stageNames = ['本宫','一世','二世','三世','四世','五世','游魂','归魂'];

for (var pn in palaceBenGong) {
  var correct = generateCorrectGongGuaXu(palaceBenGong[pn]);
  var actual = GONG_GUA_XU[pn];
  assert(correct.length === 8 && actual.length === 8, pn + '宫8卦');
  for (var i = 0; i < 8; i++) {
    assert(actual[i] === correct[i],
      pn + '宫' + stageNames[i] + ': ' + actual[i] + ' (正确: ' + correct[i] + ')');
  }
}

// 64卦唯一性
var allCodes = [];
for (var pn2 in palaceBenGong) allCodes = allCodes.concat(GONG_GUA_XU[pn2]);
assert(allCodes.length === 64, '八宫总计64卦, 实际: ' + allCodes.length);
var unique = new Set(allCodes);
assert(unique.size === 64, '64卦无重复, 唯一: ' + unique.size);

// ====================================================================
// 测试2: 世应位置正确性验证
// ====================================================================
testHeader('测试2: 世应位置正确性验证');

for (var si = 0; si < 8; si++) {
  // 取乾宫的世应表（八宫统一）
  var actualSY = GONG_SHI_YING['乾'][si];
  assert(actualSY === CORRECT_GONG_SHI_YING[si],
    stageNames[si] + ' 世应: ' + actualSY + ' (正确: ' + CORRECT_GONG_SHI_YING[si] + ')');
}

// 验证各宫世应一致
for (var pn3 in palaceBenGong) {
  for (var si2 = 0; si2 < 8; si2++) {
    assert(GONG_SHI_YING[pn3][si2] === CORRECT_GONG_SHI_YING[si2],
      pn3 + '宫' + stageNames[si2] + ' 世应: ' + GONG_SHI_YING[pn3][si2]);
  }
}

// 具体卦世应验证
var shiYingTests = [
  { code: '111111', desc: '乾为天(本宫)', shi: 6, ying: 3 },
  { code: '011111', desc: '天风姤(一世)', shi: 1, ying: 4 },
  { code: '001111', desc: '天山遁(二世)', shi: 2, ying: 5 },
  { code: '000111', desc: '天地否(三世)', shi: 3, ying: 6 },
  { code: '000011', desc: '风地观(四世)', shi: 4, ying: 1 },
  { code: '000001', desc: '山地剥(五世)', shi: 5, ying: 2 },
  { code: '000101', desc: '火地晋(游魂)', shi: 4, ying: 1 },
  { code: '111101', desc: '火天大有(归魂)', shi: 3, ying: 6 },
  { code: '010010', desc: '坎为水(本宫)', shi: 6, ying: 3 },
  { code: '101010', desc: '水火既济(三世)', shi: 3, ying: 6 },
  { code: '101100', desc: '雷火丰(五世)', shi: 5, ying: 2 },
  { code: '101000', desc: '地火明夷(游魂)', shi: 4, ying: 1 },
  { code: '100100', desc: '震为雷(本宫)', shi: 6, ying: 3 },
  { code: '011100', desc: '雷风恒(三世)', shi: 3, ying: 6 },
  { code: '011110', desc: '泽风大过(游魂)', shi: 4, ying: 1 },
  { code: '100110', desc: '泽雷随(归魂)', shi: 3, ying: 6 },
  { code: '101101', desc: '离为火(本宫)', shi: 6, ying: 3 },
  { code: '010101', desc: '火水未济(三世)', shi: 3, ying: 6 },
  { code: '011011', desc: '巽为风(本宫)', shi: 6, ying: 3 },
  { code: '001001', desc: '艮为山(本宫)', shi: 6, ying: 3 },
  { code: '110110', desc: '兑为泽(本宫)', shi: 6, ying: 3 }
];

for (var t = 0; t < shiYingTests.length; t++) {
  var tt = shiYingTests[t];
  var r = determineGongAndShiYing(tt.code);
  if (r) {
    assert(r.shi === tt.shi && r.ying === tt.ying,
      tt.desc + ' 世' + r.shi + '应' + r.ying + ' (期望: 世' + tt.shi + '应' + tt.ying + ')');
  } else {
    assert(false, tt.desc + ' 无法识别宫位');
  }
}

// ====================================================================
// 测试3: 纳甲验证 — 乾为天
// ====================================================================
testHeader('测试3: 纳甲验证 — 乾为天(111111)');

var naJia_qian = [];
for (var i = 0; i < 6; i++) naJia_qian.push(getNaJia(i, '乾', '乾'));
assert(naJia_qian[0].fullLabel === '甲子水', '初爻甲子水');
assert(naJia_qian[1].fullLabel === '甲寅木', '二爻甲寅木');
assert(naJia_qian[2].fullLabel === '甲辰土', '三爻甲辰土');
assert(naJia_qian[3].fullLabel === '壬午火', '四爻壬午火');
assert(naJia_qian[4].fullLabel === '壬申金', '五爻壬申金');
assert(naJia_qian[5].fullLabel === '壬戌土', '上爻壬戌土');

var liuQin_qian = assignLiuQin(naJia_qian, '金');
assert(liuQin_qian[0] === '子孙', '初爻子孙(金生水)');
assert(liuQin_qian[1] === '妻财', '二爻妻财(金克木)');
assert(liuQin_qian[2] === '父母', '三爻父母(土生金)');
assert(liuQin_qian[3] === '官鬼', '四爻官鬼(火克金)');
assert(liuQin_qian[4] === '兄弟', '五爻兄弟(金同金)');
assert(liuQin_qian[5] === '父母', '上爻父母(土生金)');

// ====================================================================
// 测试4: 纳甲验证 — 坎为水
// ====================================================================
testHeader('测试4: 纳甲验证 — 坎为水(010010)');

var naJia_kan = [];
for (var i = 0; i < 6; i++) naJia_kan.push(getNaJia(i, '坎', '坎'));
assert(naJia_kan[0].fullLabel === '戊寅木', '初爻戊寅木');
assert(naJia_kan[1].fullLabel === '戊辰土', '二爻戊辰土');
assert(naJia_kan[2].fullLabel === '戊午火', '三爻戊午火');
assert(naJia_kan[3].fullLabel === '戊申金', '四爻戊申金');
assert(naJia_kan[4].fullLabel === '戊戌土', '五爻戊戌土');
assert(naJia_kan[5].fullLabel === '戊子水', '上爻戊子水');

var liuQin_kan = assignLiuQin(naJia_kan, '水');
assert(liuQin_kan[0] === '子孙', '初爻子孙(水生木)');
assert(liuQin_kan[3] === '父母', '四爻父母(金生水)');
assert(liuQin_kan[5] === '兄弟', '上爻兄弟(水同水)');

// ====================================================================
// 测试5: 纳甲验证 — 离为火
// ====================================================================
testHeader('测试5: 纳甲验证 — 离为火(101101)');

var naJia_li = [];
for (var i = 0; i < 6; i++) naJia_li.push(getNaJia(i, '离', '离'));
assert(naJia_li[0].fullLabel === '己卯木', '初爻己卯木');
assert(naJia_li[1].fullLabel === '己丑土', '二爻己丑土');
assert(naJia_li[2].fullLabel === '己亥水', '三爻己亥水');
assert(naJia_li[3].fullLabel === '己酉金', '四爻己酉金');
assert(naJia_li[4].fullLabel === '己未土', '五爻己未土');
assert(naJia_li[5].fullLabel === '己巳火', '上爻己巳火');

var liuQin_li = assignLiuQin(naJia_li, '火');
assert(liuQin_li[0] === '父母', '初爻父母(木生火)');
assert(liuQin_li[3] === '妻财', '四爻妻财(火克金)');
assert(liuQin_li[5] === '兄弟', '上爻兄弟(火同火)');

// ====================================================================
// 测试6: 纳甲验证 — 坤为地
// ====================================================================
testHeader('测试6: 纳甲验证 — 坤为地(000000)');

var naJia_kun = [];
for (var i = 0; i < 6; i++) naJia_kun.push(getNaJia(i, '坤', '坤'));
assert(naJia_kun[0].fullLabel === '乙未土', '初爻乙未土');
assert(naJia_kun[1].fullLabel === '乙巳火', '二爻乙巳火');
assert(naJia_kun[2].fullLabel === '乙卯木', '三爻乙卯木');
assert(naJia_kun[3].fullLabel === '癸丑土', '四爻癸丑土');
assert(naJia_kun[4].fullLabel === '癸亥水', '五爻癸亥水');
assert(naJia_kun[5].fullLabel === '癸酉金', '上爻癸酉金');

var liuQin_kun = assignLiuQin(naJia_kun, '土');
assert(liuQin_kun[0] === '兄弟', '初爻兄弟(土同土)');
assert(liuQin_kun[1] === '父母', '二爻父母(火生土)');
assert(liuQin_kun[2] === '官鬼', '三爻官鬼(木克土)');
assert(liuQin_kun[4] === '妻财', '五爻妻财(土克水)');
assert(liuQin_kun[5] === '子孙', '上爻子孙(土生金)');

// ====================================================================
// 测试7: 纳甲验证 — 震为雷 & 巽为风 & 艮为山 & 兑为泽
// ====================================================================
testHeader('测试7: 纳甲验证 — 震巽艮兑');

// 震为雷(100100)
var naJia_zhen = [];
for (var i = 0; i < 6; i++) naJia_zhen.push(getNaJia(i, '震', '震'));
assert(naJia_zhen[0].fullLabel === '庚子水', '震初爻庚子水');
assert(naJia_zhen[3].fullLabel === '庚午火', '震四爻庚午火');
assert(naJia_zhen[5].fullLabel === '庚戌土', '震上爻庚戌土');
var liuQin_zhen = assignLiuQin(naJia_zhen, '木');
assert(liuQin_zhen[0] === '父母', '震初爻父母(水生木)');
assert(liuQin_zhen[3] === '子孙', '震四爻子孙(木生火)');

// 巽为风(011011)
var naJia_xun = [];
for (var i = 0; i < 6; i++) naJia_xun.push(getNaJia(i, '巽', '巽'));
assert(naJia_xun[0].fullLabel === '辛丑土', '巽初爻辛丑土');
assert(naJia_xun[3].fullLabel === '辛未土', '巽四爻辛未土');
assert(naJia_xun[5].fullLabel === '辛卯木', '巽上爻辛卯木');
var liuQin_xun = assignLiuQin(naJia_xun, '木');
assert(liuQin_xun[0] === '妻财', '巽初爻妻财(木克土)');
assert(liuQin_xun[5] === '兄弟', '巽上爻兄弟(木同木)');

// 艮为山(001001)
var naJia_gen = [];
for (var i = 0; i < 6; i++) naJia_gen.push(getNaJia(i, '艮', '艮'));
assert(naJia_gen[0].fullLabel === '丙辰土', '艮初爻丙辰土');
assert(naJia_gen[3].fullLabel === '丙戌土', '艮四爻丙戌土');
assert(naJia_gen[5].fullLabel === '丙寅木', '艮上爻丙寅木');
var liuQin_gen = assignLiuQin(naJia_gen, '土');
assert(liuQin_gen[0] === '兄弟', '艮初爻兄弟(土同土)');
assert(liuQin_gen[5] === '官鬼', '艮上爻官鬼(木克土)');

// 兑为泽(110110)
var naJia_dui = [];
for (var i = 0; i < 6; i++) naJia_dui.push(getNaJia(i, '兑', '兑'));
assert(naJia_dui[0].fullLabel === '丁巳火', '兑初爻丁巳火');
assert(naJia_dui[3].fullLabel === '丁亥水', '兑四爻丁亥水');
assert(naJia_dui[5].fullLabel === '丁未土', '兑上爻丁未土');
var liuQin_dui = assignLiuQin(naJia_dui, '金');
assert(liuQin_dui[0] === '官鬼', '兑初爻官鬼(火克金)');
assert(liuQin_dui[3] === '子孙', '兑四爻子孙(金生水)');

// ====================================================================
// 测试8: 六合卦验证 — 山火贲 & 火山旅
// ====================================================================
testHeader('测试8: 六合卦验证');

// 山火贲(101001): 下离上艮
var naJia_ben = [];
for (var i = 0; i < 6; i++) naJia_ben.push(getNaJia(i, '离', '艮'));
assert(LIU_HE_KB[naJia_ben[0].label.charAt(0)] === naJia_ben[3].label.charAt(0),
  '山火贲 初' + naJia_ben[0].label.charAt(0) + '+四' + naJia_ben[3].label.charAt(0) + ' 合');
assert(LIU_HE_KB[naJia_ben[1].label.charAt(0)] === naJia_ben[4].label.charAt(0),
  '山火贲 二' + naJia_ben[1].label.charAt(0) + '+五' + naJia_ben[4].label.charAt(0) + ' 合');
assert(LIU_HE_KB[naJia_ben[2].label.charAt(0)] === naJia_ben[5].label.charAt(0),
  '山火贲 三' + naJia_ben[2].label.charAt(0) + '+上' + naJia_ben[5].label.charAt(0) + ' 合');

// 火山旅(001101): 下艮上离
var naJia_lv = [];
for (var i = 0; i < 6; i++) naJia_lv.push(getNaJia(i, '艮', '离'));
assert(LIU_HE_KB[naJia_lv[0].label.charAt(0)] === naJia_lv[3].label.charAt(0),
  '火山旅 初' + naJia_lv[0].label.charAt(0) + '+四' + naJia_lv[3].label.charAt(0) + ' 合');
assert(LIU_HE_KB[naJia_lv[1].label.charAt(0)] === naJia_lv[4].label.charAt(0),
  '火山旅 二' + naJia_lv[1].label.charAt(0) + '+五' + naJia_lv[4].label.charAt(0) + ' 合');
assert(LIU_HE_KB[naJia_lv[2].label.charAt(0)] === naJia_lv[5].label.charAt(0),
  '火山旅 三' + naJia_lv[2].label.charAt(0) + '+上' + naJia_lv[5].label.charAt(0) + ' 合');

// ====================================================================
// 测试9: 六冲卦验证 — 乾为天 & 坎为水
// ====================================================================
testHeader('测试9: 六冲卦验证');

assert(LIU_CHONG_KB[naJia_qian[0].label.charAt(0)] === naJia_qian[3].label.charAt(0),
  '乾为天 初' + naJia_qian[0].label.charAt(0) + '+四' + naJia_qian[3].label.charAt(0) + ' 冲');
assert(LIU_CHONG_KB[naJia_qian[1].label.charAt(0)] === naJia_qian[4].label.charAt(0),
  '乾为天 二' + naJia_qian[1].label.charAt(0) + '+五' + naJia_qian[4].label.charAt(0) + ' 冲');
assert(LIU_CHONG_KB[naJia_qian[2].label.charAt(0)] === naJia_qian[5].label.charAt(0),
  '乾为天 三' + naJia_qian[2].label.charAt(0) + '+上' + naJia_qian[5].label.charAt(0) + ' 冲');

assert(LIU_CHONG_KB[naJia_kan[0].label.charAt(0)] === naJia_kan[3].label.charAt(0),
  '坎为水 初' + naJia_kan[0].label.charAt(0) + '+四' + naJia_kan[3].label.charAt(0) + ' 冲');
assert(LIU_CHONG_KB[naJia_kan[2].label.charAt(0)] === naJia_kan[5].label.charAt(0),
  '坎为水 三' + naJia_kan[2].label.charAt(0) + '+上' + naJia_kan[5].label.charAt(0) + ' 冲');

// ====================================================================
// 测试10: 旬空验证
// ====================================================================
testHeader('测试10: 旬空验证');

var xunKongTests = [
  { ganZhi: '甲子', expected: ['戌','亥'] },
  { ganZhi: '乙丑', expected: ['戌','亥'] },
  { ganZhi: '甲戌', expected: ['申','酉'] },
  { ganZhi: '癸未', expected: ['申','酉'] },
  { ganZhi: '甲申', expected: ['午','未'] },
  { ganZhi: '甲午', expected: ['辰','巳'] },
  { ganZhi: '甲辰', expected: ['寅','卯'] },
  { ganZhi: '甲寅', expected: ['子','丑'] },
  { ganZhi: '癸亥', expected: ['子','丑'] }
];
for (var xt = 0; xt < xunKongTests.length; xt++) {
  var xkt = xunKongTests[xt];
  var r = getXunKong(xkt.ganZhi);
  assert(r[0] === xkt.expected[0] && r[1] === xkt.expected[1],
    xkt.ganZhi + '旬空=' + r.join('') + ' (期望: ' + xkt.expected.join('') + ')');
}

// ====================================================================
// 测试11: 六神起法验证
// ====================================================================
testHeader('测试11: 六神起法验证');

var liuShenTests = [
  { dayGz: '甲子', group: '甲乙', first: '青龙' },
  { dayGz: '乙丑', group: '甲乙', first: '青龙' },
  { dayGz: '丙寅', group: '丙丁', first: '朱雀' },
  { dayGz: '丁卯', group: '丙丁', first: '朱雀' },
  { dayGz: '戊辰', group: '戊', first: '勾陈' },
  { dayGz: '己巳', group: '己', first: '螣蛇' },
  { dayGz: '庚午', group: '庚辛', first: '白虎' },
  { dayGz: '辛未', group: '庚辛', first: '白虎' },
  { dayGz: '壬申', group: '壬癸', first: '玄武' },
  { dayGz: '癸酉', group: '壬癸', first: '玄武' }
];
for (var lt = 0; lt < liuShenTests.length; lt++) {
  var ltt = liuShenTests[lt];
  var g = getDayStemGroup(ltt.dayGz);
  var ls = LIU_SHEN_BY_DAY_STEM[g];
  assert(g === ltt.group, ltt.dayGz + '日干组=' + g + ' (期望: ' + ltt.group + ')');
  assert(ls[0] === ltt.first, ltt.dayGz + '初爻=' + ls[0] + ' (期望: ' + ltt.first + ')');
}
var lsOrder = LIU_SHEN_BY_DAY_STEM['甲乙'];
assert(lsOrder.join('→') === '青龙→朱雀→勾陈→螣蛇→白虎→玄武', '甲乙日六神顺序正确');

// ====================================================================
// 测试12: 神煞验证 — 驿马/桃花/日禄
// ====================================================================
testHeader('测试12: 神煞验证 — 驿马/桃花/日禄');

var shenShaTests = [
  { dayGz: '甲子', yiMa: '寅', taoHua: '酉', riLu: '寅' },
  { dayGz: '壬申', yiMa: '寅', taoHua: '酉', riLu: '亥' },
  { dayGz: '丙寅', yiMa: '申', taoHua: '卯', riLu: '巳' },
  { dayGz: '戊午', yiMa: '申', taoHua: '卯', riLu: '巳' },
  { dayGz: '庚巳', yiMa: '亥', taoHua: '午', riLu: '申' },
  { dayGz: '乙酉', yiMa: '亥', taoHua: '午', riLu: '卯' },
  { dayGz: '丁亥', yiMa: '巳', taoHua: '子', riLu: '午' },
  { dayGz: '癸卯', yiMa: '巳', taoHua: '子', riLu: '子' }
];
for (var st = 0; st < shenShaTests.length; st++) {
  var stt = shenShaTests[st];
  var ss = calcShenSha([], stt.dayGz, null);
  assert(ss.yiMa === stt.yiMa, stt.dayGz + '驿马=' + ss.yiMa + ' (期望: ' + stt.yiMa + ')');
  assert(ss.taoHua === stt.taoHua, stt.dayGz + '桃花=' + ss.taoHua + ' (期望: ' + stt.taoHua + ')');
  assert(ss.riLu === stt.riLu, stt.dayGz + '日禄=' + ss.riLu + ' (期望: ' + stt.riLu + ')');
}

// ====================================================================
// 测试13: 卦身验证（增删卜易法）
// ====================================================================
testHeader('测试13: 卦身验证');

// 乾为天: 世6(阳), 从子起数到6=巳, 巳不在乾纳甲中
var yaoData_qian = [];
for (var i = 0; i < 6; i++) {
  yaoData_qian.push({ yaoInfo: { type: 'yang' }, branch: naJia_qian[i].label.charAt(0) });
}
var ss_qian = calcShenSha(yaoData_qian, '甲子', 6);
assert(ss_qian.guaShen.branch === '巳', '乾为天卦身=巳(阳世从子数到6)');
assert(ss_qian.guaShen.pos === 0, '乾为天卦身不上卦');

// 天风姤: 世1(阴), 从午起数到1=午, 四爻壬午火
var naJia_gou = [];
for (var i = 0; i < 6; i++) naJia_gou.push(getNaJia(i, '巽', '乾'));
var yaoData_gou = [];
for (var i = 0; i < 6; i++) {
  yaoData_gou.push({ yaoInfo: { type: i === 0 ? 'yin' : 'yang' }, branch: naJia_gou[i].label.charAt(0) });
}
var ss_gou = calcShenSha(yaoData_gou, '甲子', 1);
assert(ss_gou.guaShen.branch === '午', '天风姤卦身=午(阴世从午数到1)');
assert(ss_gou.guaShen.pos === 4, '天风姤卦身在四爻(壬午火)');

// ====================================================================
// 测试14: 干支计算验证
// ====================================================================
testHeader('测试14: 干支计算验证');

assert(yearToGanZhi(2024, 3, 1) === '甲辰', '2024年甲辰');
assert(yearToGanZhi(2025, 6, 1) === '乙巳', '2025年乙巳');
assert(yearToGanZhi(2026, 8, 5) === '丙午', '2026年丙午');
assert(yearToGanZhi(1984, 6, 1) === '甲子', '1984年甲子');
assert(yearToGanZhi(2024, 2, 3) === '癸卯', '2024.2.3立春前属癸卯');
assert(yearToGanZhi(2024, 2, 4) === '甲辰', '2024.2.4立春后属甲辰');

assert(getMonthJianZhi(2, 4) === '寅', '2月4日月建寅');
assert(getMonthJianZhi(3, 6) === '卯', '3月6日月建卯');
assert(getMonthJianZhi(8, 5) === '未', '8月5日月建未');
assert(getMonthJianZhi(8, 8) === '申', '8月8日月建申');
assert(getMonthJianZhi(12, 7) === '子', '12月7日月建子');
assert(getMonthJianZhi(1, 6) === '丑', '1月6日月建丑');

assert(dateToDayGanZhi(1900, 1, 1) === '甲戌', '1900-01-01甲戌日');

// 五鼠遁时干支
assert(hourToGanZhi('子', '甲戌') === '甲子', '甲日子时甲子');
assert(hourToGanZhi('丑', '甲戌') === '乙丑', '甲日丑时乙丑');
assert(hourToGanZhi('子', '乙亥') === '丙子', '乙日子时丙子');
assert(hourToGanZhi('子', '丙寅') === '戊子', '丙日子时戊子');
assert(hourToGanZhi('子', '丁卯') === '庚子', '丁日子时庚子');
assert(hourToGanZhi('子', '戊辰') === '壬子', '戊日子时壬子');

// ====================================================================
// 测试15: 旺衰验证 — 四季
// ====================================================================
testHeader('测试15: 旺衰验证 — 四季');

// 寅月(春)
assert(getWangShuai('木', '寅') === '旺', '寅月木旺');
assert(getWangShuai('火', '寅') === '相', '寅月火相');
assert(getWangShuai('水', '寅') === '休', '寅月水休');
assert(getWangShuai('金', '寅') === '囚', '寅月金囚');
assert(getWangShuai('土', '寅') === '死', '寅月土死');
// 巳月(夏)
assert(getWangShuai('火', '巳') === '旺', '巳月火旺');
assert(getWangShuai('土', '巳') === '相', '巳月土相');
assert(getWangShuai('金', '巳') === '死', '巳月金死');
// 申月(秋)
assert(getWangShuai('金', '申') === '旺', '申月金旺');
assert(getWangShuai('水', '申') === '相', '申月水相');
assert(getWangShuai('木', '申') === '死', '申月木死');
// 亥月(冬)
assert(getWangShuai('水', '亥') === '旺', '亥月水旺');
assert(getWangShuai('木', '亥') === '相', '亥月木相');
assert(getWangShuai('火', '亥') === '死', '亥月火死');

// ====================================================================
// 测试16: 十二长生验证
// ====================================================================
testHeader('测试16: 十二长生验证');

assert(getChangSheng('木', '亥') === '长生', '木长生在亥');
assert(getChangSheng('木', '卯') === '帝旺', '木帝旺在卯');
assert(getChangSheng('木', '未') === '墓', '木墓在未');
assert(getChangSheng('火', '寅') === '长生', '火长生在寅');
assert(getChangSheng('火', '午') === '帝旺', '火帝旺在午');
assert(getChangSheng('金', '巳') === '长生', '金长生在巳');
assert(getChangSheng('金', '酉') === '帝旺', '金帝旺在酉');
assert(getChangSheng('水', '申') === '长生', '水长生在申');
assert(getChangSheng('水', '子') === '帝旺', '水帝旺在子');

// ====================================================================
// 测试17: 进退神 + 墓库验证
// ====================================================================
testHeader('测试17: 进退神 + 墓库验证');

assert(JIN_TUI_SHEN.jin['水']['亥'] === '子', '水进神 亥→子');
assert(JIN_TUI_SHEN.jin['木']['寅'] === '卯', '木进神 寅→卯');
assert(JIN_TUI_SHEN.jin['土']['丑'] === '辰', '土进神 丑→辰');
assert(JIN_TUI_SHEN.tui['水']['子'] === '亥', '水退神 子→亥');
assert(JIN_TUI_SHEN.tui['金']['酉'] === '申', '金退神 酉→申');
assert(MU_KU['木'] === '未', '木墓在未');
assert(MU_KU['火'] === '戌', '火墓在戌');
assert(MU_KU['金'] === '丑', '金墓在丑');
assert(MU_KU['水'] === '辰', '水墓在辰');

// ====================================================================
// 测试18: 变卦纳甲验证
// ====================================================================
testHeader('测试18: 变卦纳甲验证');

// 乾初爻动→天风姤: 甲子水→辛丑土(化回头克)
var bian_gou = getNaJia(0, '巽', '乾');
assert(bian_gou.fullLabel === '辛丑土', '乾初爻动变辛丑土');
assert(WU_XING_KB.ke['土'] === '水', '丑土克子水=化回头克');

// 乾三爻动→天地否: 甲辰土→乙卯木(化回头克)
var bian_pi = getNaJia(2, '坤', '乾');
assert(bian_pi.fullLabel === '乙卯木', '乾三爻动变乙卯木');
assert(WU_XING_KB.ke['木'] === '土', '卯木克辰土=化回头克');

// 坎初爻动→水泽节: 戊寅木→丁巳火(化泄)
var bian_jie = getNaJia(0, '兑', '坎');
assert(bian_jie.fullLabel === '丁巳火', '坎初爻动变丁巳火');
assert(WU_XING_KB.sheng['木'] === '火', '寅木生巳火=化泄');

// 离初爻动→火山旅: 己卯木→丙辰土
var bian_lv = getNaJia(0, '艮', '离');
assert(bian_lv.fullLabel === '丙辰土', '离初爻动变丙辰土');

// ====================================================================
// 测试19: 用神识别验证
// ====================================================================
testHeader('测试19: 用神识别验证');

var spiritTests = [
  { text: '求测近期财运', expected: '妻财' },
  { text: '求测工作升职', expected: '官鬼' },
  { text: '求测婚姻感情', expected: '世爻' },
  { text: '求测身体健康', expected: '子孙' },
  { text: '求测考试功名', expected: '父母' },
  { text: '求测出行平安', expected: '世爻' },
  { text: '求测家宅风水', expected: '世爻' },
  { text: '求测行人归期', expected: '世爻' },
  { text: '求测官司诉讼', expected: '官鬼' },
  { text: '求测失物寻人', expected: '世爻' },
  { text: '求测怀孕生产', expected: '子孙' },
  { text: '求测自身年运', expected: '世爻' }
];
for (var sp = 0; sp < spiritTests.length; sp++) {
  var spt = spiritTests[sp];
  var detected = autoDetectSpirit(spt.text);
  assert(detected === spt.expected, spt.text + ' → ' + detected + ' (期望: ' + spt.expected + ')');
}

// ====================================================================
// 测试20: 完整排盘场景 — 乾为天 + 未月(2026-08-05)
// ====================================================================
testHeader('测试20: 完整排盘场景 — 乾为天 + 2026-08-05');

var scYear = yearToGanZhi(2026, 8, 5);
var scMonth = getMonthJianZhi(8, 5);
var scDay = dateToDayGanZhi(2026, 8, 5);
console.log('  INFO | 2026-08-05: 年=' + scYear + ' 月建=' + scMonth + ' 日=' + scDay);

assert(scYear === '丙午', '2026年丙午');
assert(scMonth === '未', '8月5日月建未');

var gInfo = determineGongAndShiYing('111111');
assert(gInfo.gong === '乾' && gInfo.gongAttr === '金', '乾为天属乾宫金');
assert(gInfo.shi === 6 && gInfo.ying === 3, '乾为天世6应3');

assert(getWangShuai('金', '未') === '相', '未月金相');
assert(getWangShuai('木', '未') === '囚', '未月木囚');

var xk = getXunKong(scDay);
console.log('  INFO | 日' + scDay + '旬空: ' + xk.join(','));

var dg = getDayStemGroup(scDay);
var ls = LIU_SHEN_BY_DAY_STEM[dg];
console.log('  INFO | 日干组' + dg + ' 六神: ' + ls.join('→'));

// ====================================================================
// 测试21: 完整排盘场景 — 雷火丰 + 未月
// ====================================================================
testHeader('测试21: 完整排盘场景 — 雷火丰');

var code_feng = '101100';
var tr_feng = getTrigrams(code_feng);
assert(tr_feng.lower.name === '离', '雷火丰下卦离');
assert(tr_feng.upper.name === '震', '雷火丰上卦震');

var gInfo_feng = determineGongAndShiYing(code_feng);
assert(gInfo_feng !== null, '雷火丰可识别');
assert(gInfo_feng.gong === '坎', '雷火丰属坎宫');
assert(gInfo_feng.gongAttr === '水', '坎宫属水');
assert(gInfo_feng.shi === 5 && gInfo_feng.ying === 2, '雷火丰世5应2');
assert(gInfo_feng.idx === 5, '雷火丰为五世卦(idx=5)');

var naJia_feng = [];
for (var i = 0; i < 6; i++) naJia_feng.push(getNaJia(i, '离', '震'));
assert(naJia_feng[0].fullLabel === '己卯木', '初爻己卯木');
assert(naJia_feng[3].fullLabel === '庚午火', '四爻庚午火');
assert(naJia_feng[5].fullLabel === '庚戌土', '上爻庚戌土');

var liuQin_feng = assignLiuQin(naJia_feng, '水');
assert(liuQin_feng[0] === '子孙', '初爻子孙(水生木)');
assert(liuQin_feng[3] === '妻财', '四爻妻财(水克火)');
assert(liuQin_feng[4] === '父母', '五爻父母(金生水)');
assert(getWangShuai('金', '未') === '相', '未月世爻申金为相');

// ====================================================================
// 测试22: 完整排盘场景 — 雷风恒 + 未月
// ====================================================================
testHeader('测试22: 完整排盘场景 — 雷风恒');

var code_heng = '011100';
var tr_heng = getTrigrams(code_heng);
assert(tr_heng.lower.name === '巽', '雷风恒下卦巽');
assert(tr_heng.upper.name === '震', '雷风恒上卦震');

var gInfo_heng = determineGongAndShiYing(code_heng);
assert(gInfo_heng !== null, '雷风恒可识别');
assert(gInfo_heng.gong === '震', '雷风恒属震宫');
assert(gInfo_heng.gongAttr === '木', '震宫属木');
assert(gInfo_heng.shi === 3 && gInfo_heng.ying === 6, '雷风恒世3应6');

var naJia_heng = [];
for (var i = 0; i < 6; i++) naJia_heng.push(getNaJia(i, '巽', '震'));
assert(naJia_heng[0].fullLabel === '辛丑土', '初爻辛丑土');
assert(naJia_heng[2].fullLabel === '辛酉金', '三爻辛酉金');
assert(naJia_heng[5].fullLabel === '庚戌土', '上爻庚戌土');

var liuQin_heng = assignLiuQin(naJia_heng, '木');
assert(liuQin_heng[0] === '妻财', '初爻妻财(木克土)');
assert(liuQin_heng[1] === '父母', '二爻父母(水生木)');
assert(liuQin_heng[2] === '官鬼', '三爻官鬼(金克木)');
assert(liuQin_heng[4] === '官鬼', '五爻官鬼(金克木)');

// ====================================================================
// 测试23: 完整排盘场景 — 水火既济 + 子月
// ====================================================================
testHeader('测试23: 完整排盘场景 — 水火既济 + 子月');

var code_jj = '101010';
var tr_jj = getTrigrams(code_jj);
assert(tr_jj.lower.name === '离', '水火既济下卦离');
assert(tr_jj.upper.name === '坎', '水火既济上卦坎');

var gInfo_jj = determineGongAndShiYing(code_jj);
assert(gInfo_jj !== null, '水火既济可识别');
assert(gInfo_jj.gong === '坎', '水火既济属坎宫');
assert(gInfo_jj.shi === 3 && gInfo_jj.ying === 6, '水火既济世3应6');

var naJia_jj = [];
for (var i = 0; i < 6; i++) naJia_jj.push(getNaJia(i, '离', '坎'));
var liuQin_jj = assignLiuQin(naJia_jj, '水');
// 离内卦: 己卯木(子孙), 己丑土(官鬼), 己亥水(兄弟)
// 坎外卦: 戊申金(父母), 戊戌土(官鬼), 戊子水(兄弟)
assert(liuQin_jj[0] === '子孙', '初爻子孙(水生木)');
assert(liuQin_jj[1] === '官鬼', '二爻官鬼(土克水)');
assert(liuQin_jj[3] === '父母', '四爻父母(金生水)');

// 子月旺衰
assert(getWangShuai('水', '子') === '旺', '子月水旺');
assert(getWangShuai('木', '子') === '相', '子月木相');

// ====================================================================
// 结果汇总
// ====================================================================
console.log('\n====================================================================');
console.log('  测试结果汇总');
console.log('====================================================================');
console.log('  总测试项: ' + testCount);
console.log('  通过: ' + passCount);
console.log('  失败: ' + failCount);
console.log('  通过率: ' + (testCount > 0 ? Math.round(passCount / testCount * 100) : 0) + '%');
if (failDetails.length > 0) {
  console.log('\n  失败项明细:');
  for (var f = 0; f < failDetails.length; f++) {
    console.log('    ' + failDetails[f]);
  }
}
console.log('====================================================================');
console.log('  ' + (allPass ? 'ALL PASS' : 'HAS FAILURES'));
console.log('====================================================================');
