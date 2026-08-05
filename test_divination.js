// 综合排盘测试 — 验证快捷标签用神识别 + 纳甲/六亲/世应/旺衰/动爻变卦
// 从 liuyao-coin-divination.html 提取核心逻辑

// ===== 基础常量 =====
var TIAN_GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
var DI_ZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
var DI_ZHI_WU_XING = {'子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水'};
var WU_XING_KB = {
  sheng: {'木':'火','火':'土','土':'金','金':'水','水':'木'},
  ke: {'木':'土','土':'水','水':'火','火':'金','金':'木'}
};

var BA_GUA = {
  '111': { name: '乾', nature: '天', attr: '金' },
  '000': { name: '坤', nature: '地', attr: '土' },
  '100': { name: '震', nature: '雷', attr: '木' },
  '011': { name: '巽', nature: '风', attr: '木' },
  '010': { name: '坎', nature: '水', attr: '水' },
  '101': { name: '离', nature: '火', attr: '火' },
  '001': { name: '艮', nature: '山', attr: '土' },
  '110': { name: '兑', nature: '泽', attr: '金' }
};

var NA_JIA_TIAN_GAN = {
  '乾': { nei: '甲', wai: '壬' },
  '坤': { nei: '乙', wai: '癸' },
  '坎': { nei: '戊', wai: '戊' },
  '离': { nei: '己', wai: '己' },
  '震': { nei: '庚', wai: '庚' },
  '巽': { nei: '辛', wai: '辛' },
  '艮': { nei: '丙', wai: '丙' },
  '兑': { nei: '丁', wai: '丁' }
};

var HUN_TIAN_JIA_ZI = {
  '乾': { nei: ['子水','寅木','辰土'], wai: ['午火','申金','戌土'] },
  '坤': { nei: ['未土','巳火','卯木'], wai: ['丑土','亥水','酉金'] },
  '坎': { nei: ['寅木','辰土','午火'], wai: ['申金','戌土','子水'] },
  '离': { nei: ['卯木','丑土','亥水'], wai: ['酉金','未土','巳火'] },
  '震': { nei: ['子水','寅木','辰土'], wai: ['午火','申金','戌土'] },
  '巽': { nei: ['丑土','亥水','酉金'], wai: ['未土','巳火','卯木'] },
  '艮': { nei: ['辰土','午火','申金'], wai: ['戌土','子水','寅木'] },
  '兑': { nei: ['巳火','卯木','丑土'], wai: ['亥水','酉金','未土'] }
};

var LIU_QIN_RULE = {
  '金': { shengWo: '土', woSheng: '水', tong: '金', woKe: '木', keWo: '火' },
  '木': { shengWo: '水', woSheng: '火', tong: '木', woKe: '土', keWo: '金' },
  '水': { shengWo: '金', woSheng: '木', tong: '水', woKe: '火', keWo: '土' },
  '火': { shengWo: '木', woSheng: '土', tong: '火', woKe: '金', keWo: '水' },
  '土': { shengWo: '火', woSheng: '金', tong: '土', woKe: '水', keWo: '木' }
};

// 八宫卦序 (乾宫)
var GONG_GUA_XU = {
  '乾': ['111111','011111','001111','000111','000011','000001','000101','111101'],
  '坤': ['000000','100000','110000','111000','111100','111110','111010','000010'],
  '坎': ['010010','110010','100010','101010','101110','101100','101000','010000'],
  '离': ['101101','001101','011101','010101','010001','010011','010111','101111'],
  '震': ['100100','000100','010100','011100','011000','011010','011110','100110'],
  '巽': ['011011','111011','101011','100011','100111','100101','100001','011001'],
  '艮': ['001001','101001','111001','110001','110101','110111','110011','001011'],
  '兑': ['110110','010110','000110','001110','001010','001000','001100','110100']
};

var GONG_SHI_YING = {
  '乾': [6,1,2,3,4,5,4,3], '坤': [6,1,2,3,4,5,4,3],
  '坎': [6,1,2,3,4,5,4,3], '离': [6,1,2,3,4,5,4,3],
  '震': [6,1,2,3,4,5,4,3], '巽': [6,1,2,3,4,5,4,3],
  '艮': [6,1,2,3,4,5,4,3], '兑': [6,1,2,3,4,5,4,3]
};

var SI_SHI_KB = {
  '寅': { wang: '木', xiang: '火', xiu: '水', qiu: '金', si: '土' },
  '卯': { wang: '木', xiang: '火', xiu: '水', qiu: '金', si: '土' },
  '辰': { wang: '土', xiang: '金', xiu: '火', qiu: '木', si: '水' },
  '巳': { wang: '火', xiang: '土', xiu: '木', qiu: '水', si: '金' },
  '午': { wang: '火', xiang: '土', xiu: '木', qiu: '水', si: '金' },
  '未': { wang: '土', xiang: '金', xiu: '火', qiu: '木', si: '水' },
  '申': { wang: '金', xiang: '水', xiu: '土', qiu: '火', si: '木' },
  '酉': { wang: '金', xiang: '水', xiu: '土', qiu: '火', si: '木' },
  '戌': { wang: '土', xiang: '金', xiu: '火', qiu: '木', si: '水' },
  '亥': { wang: '水', xiang: '木', xiu: '金', qiu: '土', si: '火' },
  '子': { wang: '水', xiang: '木', xiu: '金', qiu: '土', si: '火' },
  '丑': { wang: '土', xiang: '金', xiu: '火', qiu: '木', si: '水' }
};

var LIU_CHONG_KB = {'子':'午','丑':'未','寅':'申','卯':'酉','辰':'戌','巳':'亥','午':'子','未':'丑','申':'寅','酉':'卯','戌':'辰','亥':'巳'};
var LIU_HE_KB = {'子':'丑','丑':'子','寅':'亥','亥':'寅','卯':'戌','戌':'卯','辰':'酉','酉':'辰','巳':'申','申':'巳','午':'未','未':'午'};

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
      return { gong: gong, gongAttr: BA_GUA[Object.keys(BA_GUA).find(function(k){return BA_GUA[k].name === gong;})].attr, shi: shi, ying: ying };
    }
  }
  return { gong: '乾', gongAttr: '金', shi: 1, ying: 4 };
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

// ===== 测试用例 =====
var allPass = true;
var testCount = 0;

function assert(condition, msg) {
  testCount++;
  if (!condition) allPass = false;
  console.log((condition ? 'PASS' : 'FAIL') + ' | #' + testCount + ' ' + msg);
}

console.log('========================================================');
console.log('  六爻排盘综合测试 — 快捷标签用神识别 + 排盘逻辑验证');
console.log('========================================================\n');

// === 测试1：快捷标签 → 用神映射 ===
console.log('--- 测试1：快捷标签用神识别 ---');
var tagTests = [
  { tag: '求测近期财运', expectedSpirit: '妻财', desc: '财运→妻财' },
  { tag: '求测工作升职', expectedSpirit: '官鬼', desc: '工作升职→官鬼' },
  { tag: '求测婚姻感情', expectedSpirit: '世爻', desc: '婚姻感情→世爻' },
  { tag: '求测身体健康', expectedSpirit: '子孙', desc: '健康疾病→子孙' },
  { tag: '求测考试功名', expectedSpirit: '父母', desc: '考试功名→父母' },
  { tag: '求测出行平安', expectedSpirit: '世爻', desc: '出行安全→世爻' },
  { tag: '求测家宅风水', expectedSpirit: '世爻', desc: '家宅风水→世爻' },
  { tag: '求测行人归期', expectedSpirit: '世爻', desc: '行人归期→世爻' },
  { tag: '求测官司诉讼', expectedSpirit: '官鬼', desc: '官司诉讼→官鬼' },
  { tag: '求测失物寻人', expectedSpirit: '世爻', desc: '失物寻人→世爻' },
  { tag: '求测怀孕生产', expectedSpirit: '子孙', desc: '怀孕生产→子孙' },
  { tag: '求测自身年运', expectedSpirit: '世爻', desc: '自身年运→世爻' }
];

for (var t of tagTests) {
  var detected = autoDetectSpirit(t.tag);
  assert(detected === t.expectedSpirit, t.tag + ' → ' + detected + ' (期望: ' + t.expectedSpirit + ') [' + t.desc + ']');
}

// === 测试2：乾为天卦排盘 ===
console.log('\n--- 测试2：乾为天卦（111111）排盘 ---');
var code1 = '111111';
var trigrams1 = getTrigrams(code1);
assert(trigrams1.lower.name === '乾' && trigrams1.upper.name === '乾', '上下卦均为乾');
var gongInfo1 = determineGongAndShiYing(code1);
assert(gongInfo1.gong === '乾' && gongInfo1.gongAttr === '金', '乾宫属金, 实际: ' + gongInfo1.gong + '/' + gongInfo1.gongAttr);
assert(gongInfo1.shi === 6 && gongInfo1.ying === 3, '世爻6位应爻3位, 实际: 世' + gongInfo1.shi + '应' + gongInfo1.ying);

var naJiaArr1 = [];
for (var i = 0; i < 6; i++) naJiaArr1.push(getNaJia(i, '乾', '乾'));
assert(naJiaArr1[0].fullLabel === '甲子水', '初爻纳甲甲子水, 实际: ' + naJiaArr1[0].fullLabel);
assert(naJiaArr1[5].fullLabel === '壬戌土', '上爻纳甲壬戌土, 实际: ' + naJiaArr1[5].fullLabel);

var liuQin1 = assignLiuQin(naJiaArr1, '金');
assert(liuQin1[0] === '子孙', '初爻六亲子孙(金生水), 实际: ' + liuQin1[0]);
assert(liuQin1[1] === '妻财', '二爻六亲妻财(寅木金克木), 实际: ' + liuQin1[1]);
assert(liuQin1[2] === '父母', '三爻六亲父母(辰土生金), 实际: ' + liuQin1[2]);
assert(liuQin1[3] === '官鬼', '四爻六亲官鬼(午火克金), 实际: ' + liuQin1[3]);
assert(liuQin1[4] === '兄弟', '五爻六亲兄弟(申金同金), 实际: ' + liuQin1[4]);
assert(liuQin1[5] === '父母', '上爻六亲父母(戌土生金), 实际: ' + liuQin1[5]);

// === 测试3：坎为水卦排盘 ===
console.log('\n--- 测试3：坎为水卦（010010）排盘 ---');
var code2 = '010010';
var trigrams2 = getTrigrams(code2);
assert(trigrams2.lower.name === '坎' && trigrams2.upper.name === '坎', '上下卦均为坎');
var gongInfo2 = determineGongAndShiYing(code2);
assert(gongInfo2.gong === '坎' && gongInfo2.gongAttr === '水', '坎宫属水');
assert(gongInfo2.shi === 6 && gongInfo2.ying === 3, '坎为水世6应3');

var naJiaArr2 = [];
for (var i = 0; i < 6; i++) naJiaArr2.push(getNaJia(i, '坎', '坎'));
assert(naJiaArr2[0].fullLabel === '戊寅木', '初爻戊寅木, 实际: ' + naJiaArr2[0].fullLabel);
assert(naJiaArr2[5].fullLabel === '戊子水', '上爻戊子水, 实际: ' + naJiaArr2[5].fullLabel);

var liuQin2 = assignLiuQin(naJiaArr2, '水');
assert(liuQin2[0] === '子孙', '初爻子孙(水生木), 实际: ' + liuQin2[0]);
assert(liuQin2[5] === '兄弟', '上爻兄弟(水同水), 实际: ' + liuQin2[5]);

// === 测试4：旺衰验证（未月） ===
console.log('\n--- 测试4：旺衰验证（未月） ---');
assert(getWangShuai('土', '未') === '旺', '未月土旺');
assert(getWangShuai('金', '未') === '相', '未月金相(土生金)');
assert(getWangShuai('火', '未') === '休', '未月火休');
assert(getWangShuai('木', '未') === '囚', '未月木囚');
assert(getWangShuai('水', '未') === '死', '未月水死(土克水)');

// === 测试5：旺衰验证（子月） ===
console.log('\n--- 测试5：旺衰验证（子月） ---');
assert(getWangShuai('水', '子') === '旺', '子月水旺');
assert(getWangShuai('木', '子') === '相', '子月木相(水生木)');
assert(getWangShuai('金', '子') === '休', '子月金休');
assert(getWangShuai('火', '子') === '死', '子月火死(水克火)');
assert(getWangShuai('土', '子') === '囚', '子月土囚');

// === 测试6：六冲六合 ===
console.log('\n--- 测试6：六冲六合 ---');
assert(LIU_CHONG_KB['子'] === '午', '子午冲');
assert(LIU_CHONG_KB['卯'] === '酉', '卯酉冲');
assert(LIU_HE_KB['子'] === '丑', '子丑合');
assert(LIU_HE_KB['寅'] === '亥', '寅亥合');

// === 测试7：动爻变卦 ===
console.log('\n--- 测试7：动爻变卦（乾为天初爻动） ---');
// 乾为天 111111, 初爻动 → 011111 = 天风姤
var bianCode1 = '011111';
var bianTrigrams1 = getTrigrams(bianCode1);
assert(bianTrigrams1.lower.name === '巽' && bianTrigrams1.upper.name === '乾', '变卦天风姤(下巽上乾)');
var bianNaJia1 = getNaJia(0, '巽', '乾');
assert(bianNaJia1.fullLabel === '辛丑土', '变爻初爻辛丑土, 实际: ' + bianNaJia1.fullLabel);
// 原爻甲子水 → 变爻辛丑土: 土克水 = 化回头克
assert(WU_XING_KB.ke['土'] === '水', '丑土克子水=化回头克');

// === 测试8：坤为地卦排盘 ===
console.log('\n--- 测试8：坤为地卦（000000）排盘 ---');
var code3 = '000000';
var gongInfo3 = determineGongAndShiYing(code3);
assert(gongInfo3.gong === '坤' && gongInfo3.gongAttr === '土', '坤宫属土');
assert(gongInfo3.shi === 6 && gongInfo3.ying === 3, '坤为地世6应3');
var naJiaArr3 = [];
for (var i = 0; i < 6; i++) naJiaArr3.push(getNaJia(i, '坤', '坤'));
assert(naJiaArr3[0].fullLabel === '乙未土', '初爻乙未土, 实际: ' + naJiaArr3[0].fullLabel);
assert(naJiaArr3[2].fullLabel === '乙卯木', '三爻乙卯木, 实际: ' + naJiaArr3[2].fullLabel);
var liuQin3 = assignLiuQin(naJiaArr3, '土');
assert(liuQin3[0] === '兄弟', '初爻兄弟(未土同土), 实际: ' + liuQin3[0]);
assert(liuQin3[2] === '官鬼', '三爻官鬼(木克土), 实际: ' + liuQin3[2]);

// === 测试9：离为火卦排盘 ===
console.log('\n--- 测试9：离为火卦（101101）排盘 ---');
var code4 = '101101';
var gongInfo4 = determineGongAndShiYing(code4);
assert(gongInfo4.gong === '离' && gongInfo4.gongAttr === '火', '离宫属火');
var naJiaArr4 = [];
for (var i = 0; i < 6; i++) naJiaArr4.push(getNaJia(i, '离', '离'));
assert(naJiaArr4[0].fullLabel === '己卯木', '初爻己卯木, 实际: ' + naJiaArr4[0].fullLabel);
assert(naJiaArr4[3].fullLabel === '己酉金', '四爻己酉金, 实际: ' + naJiaArr4[3].fullLabel);
var liuQin4 = assignLiuQin(naJiaArr4, '火');
assert(liuQin4[0] === '父母', '初爻父母(木生火), 实际: ' + liuQin4[0]);
assert(liuQin4[3] === '妻财', '四爻妻财(火克金), 实际: ' + liuQin4[3]);

// === 测试10：用神查找（求测财运 + 乾为天） ===
console.log('\n--- 测试10：用神查找（求测财运 + 乾为天） ---');
var yongShen1 = autoDetectSpirit('求测近期财运');
assert(yongShen1 === '妻财', '财运→妻财');
// 乾为天中妻财在二爻(寅木)和四爻(午火? 不对, 午火是官鬼)
// 重新看: liuQin1 = [兄弟, 妻财, 父母, 官鬼, 兄弟, 父母]
// 妻财在二爻(寅木)
assert(liuQin1[1] === '妻财', '乾为天二爻为妻财(寅木)');

// === 测试11：用神查找（求测工作 + 乾为天） ===
console.log('\n--- 测试11：用神查找（求测工作升职 + 乾为天） ---');
var yongShen2 = autoDetectSpirit('求测工作升职');
assert(yongShen2 === '官鬼', '工作→官鬼');
// 乾为天中官鬼在四爻(午火)
assert(liuQin1[3] === '官鬼', '乾为天四爻为官鬼(午火)');

// === 测试12：五行生克关系 ===
console.log('\n--- 测试12：五行生克关系 ---');
assert(WU_XING_KB.sheng['木'] === '火', '木生火');
assert(WU_XING_KB.sheng['火'] === '土', '火生土');
assert(WU_XING_KB.sheng['土'] === '金', '土生金');
assert(WU_XING_KB.sheng['金'] === '水', '金生水');
assert(WU_XING_KB.sheng['水'] === '木', '水生木');
assert(WU_XING_KB.ke['木'] === '土', '木克土');
assert(WU_XING_KB.ke['土'] === '水', '土克水');
assert(WU_XING_KB.ke['水'] === '火', '水克火');
assert(WU_XING_KB.ke['火'] === '金', '火克金');
assert(WU_XING_KB.ke['金'] === '木', '金克木');

// === 测试13：八宫卦序完整性 ===
console.log('\n--- 测试13：八宫卦序完整性 ---');
var totalGua = 0;
for (var g in GONG_GUA_XU) {
  totalGua += GONG_GUA_XU[g].length;
  assert(GONG_GUA_XU[g].length === 8, g + '宫8卦, 实际: ' + GONG_GUA_XU[g].length);
}
assert(totalGua === 64, '八宫总计64卦, 实际: ' + totalGua);

// === 测试14：世应关系（应爻 = 世爻 ± 3） ===
console.log('\n--- 测试14：世应关系验证 ---');
for (var gongName in GONG_GUA_XU) {
  for (var idx = 0; idx < 8; idx++) {
    var code = GONG_GUA_XU[gongName][idx];
    var gInfo = determineGongAndShiYing(code);
    var expectedYing = gInfo.shi + 3 > 6 ? gInfo.shi - 3 : gInfo.shi + 3;
    assert(gInfo.ying === expectedYing, gongName + '宫第' + (idx+1) + '卦 世' + gInfo.shi + '应' + gInfo.ying + ' (期望应' + expectedYing + ')');
  }
}

// === 结果汇总 ===
console.log('\n========================================================');
console.log('  测试结果：' + (allPass ? '全部通过 (' + testCount + '项)' : '存在失败 (' + testCount + '项)'));
console.log('========================================================');
