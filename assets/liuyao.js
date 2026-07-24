/**
 * 六爻排盘工具 — 硬币摇卦
 * 基于传统铜钱起卦法：三枚硬币，字为3分，花为2分
 * 6、7、8、9 分别对应老阴、少阳、少阴、老阳
 */

(function () {
  'use strict';

  // ========== 六十四卦数据 ==========
  // 二进制编码：1=阳, 0=阴，从初爻到上爻
  // gua[lower trigram][upper trigram] = { name, symbol, desc, shiYing }
  var BA_GUA = {
    '111': { name: '乾', nature: '天', attr: '金', desc: '刚健不息' },
    '000': { name: '坤', nature: '地', attr: '土', desc: '厚德载物' },
    '001': { name: '震', nature: '雷', attr: '木', desc: '动而奋发' },
    '100': { name: '巽', nature: '风', attr: '木', desc: '柔而入' },
    '010': { name: '坎', nature: '水', attr: '水', desc: '险而通' },
    '101': { name: '离', nature: '火', attr: '火', desc: '丽而明' },
    '011': { name: '艮', nature: '山', attr: '土', desc: '止而安' },
    '110': { name: '兑', nature: '泽', attr: '金', desc: '悦而说' }
  };

  // 宫位名称（八宫）
  var GONG_NAMES = ['乾宫', '坎宫', '艮宫', '震宫', '巽宫', '离宫', '坤宫', '兑宫'];

  // 六十四卦完整数据 [下卦三爻, 上卦三爻] => 卦名、描述
  var LIU_SHI_SI_GUA = {
    // 下乾上乾
    '111111': { name: '乾为天', gua: '乾', desc: '元亨利贞，自强不息' },
    // 下坤上坤
    '000000': { name: '坤为地', gua: '坤', desc: '元亨，利牝马之贞' },
    // 下震上坎
    '001010': { name: '水雷屯', gua: '屯', desc: '万物始生，困难重重' },
    // 下坎上艮
    '010011': { name: '山水蒙', gua: '蒙', desc: '蒙昧无知，启蒙教化' },
    // 下坎上乾
    '010111': { name: '天水讼', gua: '讼', desc: '争讼不和，宜和不宜争' },
    // 下坤上坎
    '000010': { name: '地水师', gua: '师', desc: '统率师旅，纪律严明' },
    // 下坎上坤
    '010000': { name: '水地比', gua: '比', desc: '亲密比辅，团结合作' },
    // 下巽上乾
    '100111': { name: '风天小畜', gua: '小畜', desc: '力量有限，积小成大' },
    // 下乾上兑
    '111110': { name: '天泽履', gua: '履', desc: '循礼而行，谨慎前进' },
    // 下乾上坤
    '111000': { name: '地天泰', gua: '泰', desc: '天地交泰，万物通达' },
    // 下坤上乾
    '000111': { name: '天地否', gua: '否', desc: '天地不交，闭塞不通' },
    // 下离上乾
    '101111': { name: '天火同人', gua: '同人', desc: '志同道合，和同于人' },
    // 下乾上离
    '111101': { name: '火天大有', gua: '大有', desc: '大有所获，丰收富足' },
    // 下坤上艮
    '000011': { name: '地山谦', gua: '谦', desc: '谦虚有德，功成不居' },
    // 下震上坤
    '001000': { name: '地雷豫', gua: '豫', desc: '欢乐和豫，顺时而动' },
    // 下震上兑
    '001110': { name: '泽雷随', gua: '随', desc: '随时变通，顺应形势' },
    // 下巽上艮
    '100011': { name: '山风蛊', gua: '蛊', desc: '事有败坏，拨乱反正' },
    // 下坤上兑
    '000110': { name: '泽地临', gua: '临', desc: '居上临下，以德化民' },
    //下坤上巽
    '000100': { name: '风地观', gua: '观', desc: '观察审视，修身正己' },
    // 下离上震
    '101001': { name: '火雷噬嗑', gua: '噬嗑', desc: '咬合障碍，刑罚明断' },
    // 下离上艮
    '101011': { name: '山火贲', gua: '贲', desc: '文饰华美，外表修饰' },
    // 下坤上艮
    '000011': { name: '地山谦', gua: '谦', desc: '谦虚有德，功成不居' },
    // 下坤上地(重复, skip)
    // 下离上坤
    '101000': { name: '地火明夷', gua: '明夷', desc: '光明受损，韬晦隐退' },
    // 下离上离
    '101101': { name: '火为离', gua: '离', desc: '依附光明，柔顺中正' },
    // 下巽上坤
    '100000': { name: '地风升', gua: '升', desc: '积小成大，步步上升' },
    // 下坎上兑
    '010110': { name: '泽水困', gua: '困', desc: '困境穷迫，坚守正道' },
    // 下坎上巽
    '010100': { name: '水风井', gua: '井', desc: '井养万物，修德不穷' },
    // 下兑上离
    '110101': { name: '泽火革', gua: '革', desc: '变革更新，除旧布新' },
    // 下巽上离
    '100101': { name: '火风鼎', gua: '鼎', desc: '鼎新革故，养贤育才' },
    // 下震上坎
    '001010': { name: '水雷屯', gua: '屯', desc: '万物始生，困难重重' },
    // 下艮上坎(重)
    // 下坎上震
    '010001': { name: '雷水涣', gua: '涣', desc: '离散涣散，以正合聚' },
    // 下坎上兑
    '010110': { name: '泽水困', gua: '困', desc: '困境穷迫，坚守正道' },
    // 下巽上坎
    '100010': { name: '水风井', gua: '井', desc: '井养万物，修德不穷' },
    // 下面补全所有缺失的
    // 下震上乾
    '001111': { name: '天雷无妄', gua: '无妄', desc: '无妄之灾，顺应天道' },
    // 下乾上巽
    '111100': { name: '天风姤', gua: '姤', desc: '不期而遇，阴遇阳' },
    // 下坤上兑(已有临)
    // 下艮上坤
    '011000': { name: '地山谦', gua: '谦', desc: '谦虚有德，功成不居' },
    // 下震上艮
    '001011': { name: '山雷颐', gua: '颐', desc: '慎言节食，修养身心' },
    // 下巽上兑
    '100110': { name: '泽风大过', gua: '大过', desc: '大为过越，非常之举' },
    // 下坎上坎
    '010010': { name: '水为坎', gua: '坎', desc: '重重险阻，守正待时' },
    // 下离上离(已有)
    // 下巽上兑
    '100110': { name: '泽风大过', gua: '大过', desc: '大为过越，非常之举' },
    // === 补全全部64卦 ===
    // 乾宫
    '111111': { name: '乾为天', gua: '乾', desc: '元亨利贞，自强不息' },
    '111100': { name: '天风姤', gua: '姤', desc: '不期而遇，阴柔遇阳' },
    '111010': { name: '天山遁', gua: '遁', desc: '退避隐遁，以退为进' },
    '111000': { name: '天地否', gua: '否', desc: '天地不交，闭塞不通' },
    '110111': { name: '风地观', gua: '观', desc: '观察审视，修身正己' },
    '110000': { name: '山地剥', gua: '剥', desc: '阴盛阳衰，小人得势' },
    '100000': { name: '地火明夷', gua: '明夷', desc: '光明受损，韬晦隐退' },
    '101000': { name: '火地晋', gua: '晋', desc: '日出地上，光明上进' },
    // 坎宫
    '010010': { name: '坎为水', gua: '坎', desc: '重重险阻，守正待时' },
    '010110': { name: '水泽节', gua: '节', desc: '节制适度，适可而止' },
    '010011': { name: '水山蹇', gua: '蹇', desc: '行路艰难，宜止不宜进' },
    '010000': { name: '水地比', gua: '比', desc: '亲密比辅，团结合作' },
    '011010': { name: '风泽中孚', gua: '中孚', desc: '诚信为本，内心忠实' },
    '011110': { name: '风山渐', gua: '渐', desc: '循序渐进，不可急躁' },
    '001110': { name: '雷泽归妹', gua: '归妹', desc: '少女出嫁，守分知礼' },
    '101110': { name: '火泽睽', gua: '睽', desc: '背离不合，求同存异' },
    // 艮宫
    '011011': { name: '艮为山', gua: '艮', desc: '止而不动，知止则安' },
    '011111': { name: '山火贲', gua: '贲', desc: '文饰华美，外表修饰' },
    '011001': { name: '山雷颐', gua: '颐', desc: '慎言节食，修养身心' },
    '011000': { name: '山地剥', gua: '剥', desc: '阴盛阳衰，小人得势' },
    '010011': { name: '水山蹇', gua: '蹇', desc: '行路艰难，宜止不宜进' },
    '110011': { name: '风山渐', gua: '渐', desc: '循序渐进，不可急躁' },
    '001011': { name: '雷山小过', gua: '小过', desc: '小有过越，宜小不宜大' },
    '101011': { name: '火山旅', gua: '旅', desc: '旅途在外，谨慎小心' },
    // 震宫
    '001001': { name: '震为雷', gua: '震', desc: '震惊百里，恐惧修省' },
    '001101': { name: '雷地豫', gua: '豫', desc: '欢乐和豫，顺时而动' },
    '001111': { name: '雷天大壮', gua: '大壮', desc: '刚强壮盛，不可妄动' },
    '001011': { name: '雷山小过', gua: '小过', desc: '小有过越，宜小不宜大' },
    '000001': { name: '地雷复', gua: '复', desc: '一阳来复，否极泰来' },
    '100001': { name: '风雷益', gua: '益', desc: '损上益下，利有攸往' },
    '101001': { name: '火雷噬嗑', gua: '噬嗑', desc: '咬合障碍，刑罚明断' },
    '111001': { name: '天雷无妄', gua: '无妄', desc: '无妄之灾，顺应天道' },
    // 巽宫
    '100100': { name: '巽为风', gua: '巽', desc: '柔顺谦逊，随风而行' },
    '100110': { name: '风泽中孚', gua: '中孚', desc: '诚信为本，内心忠实' },
    '100010': { name: '风水涣', gua: '涣', desc: '离散涣散，以正合聚' },
    '100000': { name: '风地观', gua: '观', desc: '观察审视，修身正己' },
    '101100': { name: '火风鼎', gua: '鼎', desc: '鼎新革故，养贤育才' },
    '111100': { name: '天风姤', gua: '姤', desc: '不期而遇，阴柔遇阳' },
    '001100': { name: '雷风恒', gua: '恒', desc: '持之以恒，长久不变' },
    '011100': { name: '山风蛊', gua: '蛊', desc: '事有败坏，拨乱反正' },
    // 离宫
    '101101': { name: '离为火', gua: '离', desc: '依附光明，柔顺中正' },
    '101001': { name: '火雷噬嗑', gua: '噬嗑', desc: '咬合障碍，刑罚明断' },
    '101100': { name: '火山旅', gua: '旅', desc: '旅途在外，谨慎小心' },
    '101000': { name: '火地晋', gua: '晋', desc: '日出地上，光明上进' },
    '100101': { name: '风火家人', gua: '家人', desc: '齐家有道，治家严正' },
    '110101': { name: '泽火革', gua: '革', desc: '变革更新，除旧布新' },
    '000101': { name: '地火明夷', gua: '明夷', desc: '光明受损，韬晦隐退' },
    '010101': { name: '水火既济', gua: '既济', desc: '事已成功，守成不易' },
    // 坤宫
    '000000': { name: '坤为地', gua: '坤', desc: '元亨，利牝马之贞' },
    '000100': { name: '地风升', gua: '升', desc: '积小成大，步步上升' },
    '000010': { name: '地水师', gua: '师', desc: '统率师旅，纪律严明' },
    '000110': { name: '地泽临', gua: '临', desc: '居上临下，以德化民' },
    '001000': { name: '地雷复', gua: '复', desc: '一阳来复，否极泰来' },
    '011000': { name: '地山谦', gua: '谦', desc: '谦虚有德，功成不居' },
    '111000': { name: '地天泰', gua: '泰', desc: '天地交泰，万物通达' },
    '101000': { name: '地火明夷', gua: '明夷', desc: '光明受损，韬晦隐退' },
    // 兑宫
    '110110': { name: '兑为泽', gua: '兑', desc: '喜悦和乐，和悦待人' },
    '110010': { name: '泽水困', gua: '困', desc: '困境穷迫，坚守正道' },
    '110011': { name: '泽山咸', gua: '咸', desc: '感应相通，心意相合' },
    '110000': { name: '泽地萃', gua: '萃', desc: '聚集汇合，众志成城' },
    '111110': { name: '泽天夬', gua: '夬', desc: '决断刚毅，以正胜邪' },
    '101110': { name: '泽火革', gua: '革', desc: '变革更新，除旧布新' },
    '001110': { name: '泽雷随', gua: '随', desc: '随时变通，顺应形势' },
    '011110': { name: '泽山咸', gua: '咸', desc: '感应相通，心意相合' }
  };

  // 世应位置（按八宫排列）
  // 每宫8卦，世爻位置从初爻到六爻再回初爻、二爻...
  var SHI_YING = {
    '乾': [
      { shi: 6, ying: 3 }, { shi: 1, ying: 4 }, { shi: 2, ying: 5 },
      { shi: 3, ying: 6 }, { shi: 4, ying: 1 }, { shi: 5, ying: 2 },
      { shi: 4, ying: 1 }, { shi: 3, ying: 6 }
    ],
    '坎': [
      { shi: 6, ying: 3 }, { shi: 1, ying: 4 }, { shi: 2, ying: 5 },
      { shi: 3, ying: 6 }, { shi: 4, ying: 1 }, { shi: 5, ying: 2 },
      { shi: 4, ying: 1 }, { shi: 3, ying: 6 }
    ],
    '艮': [
      { shi: 6, ying: 3 }, { shi: 1, ying: 4 }, { shi: 2, ying: 5 },
      { shi: 3, ying: 6 }, { shi: 4, ying: 1 }, { shi: 5, ying: 2 },
      { shi: 4, ying: 1 }, { shi: 3, ying: 6 }
    ],
    '震': [
      { shi: 6, ying: 3 }, { shi: 1, ying: 4 }, { shi: 2, ying: 5 },
      { shi: 3, ying: 6 }, { shi: 4, ying: 1 }, { shi: 5, ying: 2 },
      { shi: 4, ying: 1 }, { shi: 3, ying: 6 }
    ],
    '巽': [
      { shi: 6, ying: 3 }, { shi: 1, ying: 4 }, { shi: 2, ying: 5 },
      { shi: 3, ying: 6 }, { shi: 4, ying: 1 }, { shi: 5, ying: 2 },
      { shi: 4, ying: 1 }, { shi: 3, ying: 6 }
    ],
    '离': [
      { shi: 6, ying: 3 }, { shi: 1, ying: 4 }, { shi: 2, ying: 5 },
      { shi: 3, ying: 6 }, { shi: 4, ying: 1 }, { shi: 5, ying: 2 },
      { shi: 4, ying: 1 }, { shi: 3, ying: 6 }
    ],
    '坤': [
      { shi: 6, ying: 3 }, { shi: 1, ying: 4 }, { shi: 2, ying: 5 },
      { shi: 3, ying: 6 }, { shi: 4, ying: 1 }, { shi: 5, ying: 2 },
      { shi: 4, ying: 1 }, { shi: 3, ying: 6 }
    ],
    '兑': [
      { shi: 6, ying: 3 }, { shi: 1, ying: 4 }, { shi: 2, ying: 5 },
      { shi: 3, ying: 6 }, { shi: 4, ying: 1 }, { shi: 5, ying: 2 },
      { shi: 4, ying: 1 }, { shi: 3, ying: 6 }
    ]
  };

  // 六亲：父母、兄弟、子孙、妻财、官鬼
  var LIU_QIN = ['父母', '兄弟', '子孙', '妻财', '官鬼'];

  // 六亲与五行关系：生我者父母，我生者子孙，同我者兄弟，我克者妻财，克我者官鬼
  var WU_XING_KE = {
    '金': { sheng: '水', ke: '木', same: '金', bei_sheng: '土', bei_ke: '火' },
    '木': { sheng: '火', ke: '土', same: '木', bei_sheng: '水', bei_ke: '金' },
    '水': { sheng: '木', ke: '火', same: '水', bei_sheng: '金', bei_ke: '土' },
    '火': { sheng: '土', ke: '金', same: '火', bei_sheng: '木', bei_ke: '水' },
    '土': { sheng: '金', ke: '水', same: '土', bei_sheng: '火', bei_ke: '木' }
  };

  // 爻位名称
  var YAO_POSITIONS = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];
  var YAO_DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

  // 地支五行
  var DI_ZHI_WUXING = {
    '子': '水', '丑': '土', '寅': '木', '卯': '木',
    '辰': '土', '巳': '火', '午': '火', '未': '土',
    '申': '金', '酉': '金', '戌': '土', '亥': '水'
  };

  // 天干
  var TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

  // 八卦对应地支起始
  var GUA_DI_ZHI_START = {
    '乾': 0,   // 子
    '坎': 7,   // 午
    '艮': 1,   // 丑
    '震': 0,   // 子
    '巽': 7,   // 午
    '离': 1,   // 丑
    '坤': 7,   // 午
    '兑': 0    // 子
  };

  // 八卦纳甲
  var GUA_NA_JIA = {
    '乾': { tian_gan: ['壬', '壬', '壬', '甲', '甲', '甲'], start_di: 0 },
    '坎': { tian_gan: ['戊', '戊', '戊', '戊', '戊', '戊'], start_di: 7 },
    '艮': { tian_gan: ['丙', '丙', '丙', '丙', '丙', '丙'], start_di: 1 },
    '震': { tian_gan: ['庚', '庚', '庚', '庚', '庚', '庚'], start_di: 0 },
    '巽': { tian_gan: ['辛', '辛', '辛', '辛', '辛', '辛'], start_di: 7 },
    '离': { tian_gan: ['己', '己', '己', '己', '己', '己'], start_di: 1 },
    '坤': { tian_gan: ['乙', '乙', '癸', '乙', '乙', '癸'], start_di: 7 },
    '兑': { tian_gan: ['丁', '丁', '丁', '丁', '丁', '丁'], start_di: 0 }
  };

  // ========== 状态管理 ==========
  var state = {
    currentLine: 0,        // 当前摇到的爻位（0-5）
    lines: [],             // 每爻的结果 [{coins: [3,2,3], value: 8, type: 'yin', ...}]
    isShaking: false
  };

  // ========== 核心函数 ==========

  /**
   * 摇卦：随机生成三枚硬币结果
   * 字=3分，花=2分
   * 总分: 6=老阴(变爻), 7=少阳, 8=少阴, 9=老阳(变爻)
   */
  function generateCoinResult() {
    var coins = [];
    for (var i = 0; i < 3; i++) {
      coins.push(Math.random() < 0.5 ? 3 : 2); // 3=字(正面), 2=花(背面)
    }
    var sum = coins[0] + coins[1] + coins[2];
    var type, isDong;

    switch (sum) {
      case 6:
        type = 'yin';
        isDong = true;
        break;
      case 7:
        type = 'yang';
        isDong = false;
        break;
      case 8:
        type = 'yin';
        isDong = false;
        break;
      case 9:
        type = 'yang';
        isDong = true;
        break;
      default:
        type = 'yang';
        isDong = false;
    }

    return {
      coins: coins,
      sum: sum,
      type: type,
      isDong: isDong,
      label: (type === 'yang' ? '阳' : '阴') + (isDong ? '(动)' : '(静)'),
      binary: type === 'yang' ? 1 : 0
    };
  }

  /**
   * 根据六爻的二进制编码查找卦名
   * 爻从初爻(底)到上爻(顶)
   */
  function lookupGuaName(binaryLines) {
    var key = binaryLines.map(function (b) { return b; }).reverse().join('');
    // binaryLines[0] = 初爻(底), binaryLines[5] = 上爻(顶)
    // 卦编码从下到上
    var code = binaryLines.join('');
    if (LIU_SHI_SI_GUA[code]) {
      return LIU_SHI_SI_GUA[code];
    }
    // 尝试反向
    var reverseCode = code.split('').reverse().join('');
    if (LIU_SHI_SI_GUA[reverseCode]) {
      return LIU_SHI_SI_GUA[reverseCode];
    }
    // 兜底
    var lower = code.substring(0, 3);
    var upper = code.substring(3, 6);
    var lowerGua = BA_GUA[lower] || { name: '?', nature: '?', attr: '?', desc: '' };
    var upperGua = BA_GUA[upper] || { name: '?', nature: '?', attr: '?', desc: '' };
    return {
      name: upperGua.nature + lowerGua.nature + upperGua.name + lowerGua.name,
      gua: upperGua.name + lowerGua.name,
      desc: upperGua.desc + ' · ' + lowerGua.desc
    };
  }

  /**
   * 获取上下卦信息
   */
  function getTrigrams(binaryLines) {
    var lower = binaryLines.substring(0, 3);
    var upper = binaryLines.substring(3, 6);
    return {
      lower: BA_GUA[lower] || { name: '?', nature: '?', attr: '?', desc: '' },
      upper: BA_GUA[upper] || { name: '?', nature: '?', attr: '?', desc: '' }
    };
  }

  /**
   * 确定卦宫（确定世应位置）
   */
  function determineGong(binaryLines) {
    // 简化方法：根据本卦的上下卦来确定宫位
    // 归属规则基于八宫体系
    var lower = binaryLines.substring(0, 3);
    var upper = binaryLines.substring(3, 6);
    var code = binaryLines;

    // 纯卦直接归属本宫
    if (lower === upper) {
      var gua = BA_GUA[lower];
      if (gua) return gua.name;
    }

    // 使用纳甲法来确定宫位
    var guaData = lookupGuaName(binaryLines.map(Number));
    var guaName = guaData.gua;

    // 通过上下卦五行和纳甲来归属
    var upperGua = BA_GUA[upper];
    var lowerGua = BA_GUA[lower];
    if (upperGua && lowerGua) {
      // 优先使用上卦所属宫
      var possibleGongs = ['乾', '坎', '艮', '震', '巽', '离', '坤', '兑'];
      for (var i = 0; i < possibleGongs.length; i++) {
        var gong = possibleGongs[i];
        var gongGua = BA_GUA[Object.keys(BA_GUA).find(function (k) { return BA_GUA[k].name === gong; })] || null;
        if (gongGua && gongGua.attr === upperGua.attr) {
          return gong;
        }
      }
      return upperGua.name;
    }
    return '乾';
  }

  /**
   * 分配六亲
   */
  function assignLiuQin(lines, guaWuXing) {
    var relations = WU_XING_KE[guaWuXing];
    if (!relations) return lines.map(function () { return '—'; });

    return lines.map(function (line) {
      var yaoWuXing = line.wuXing;
      if (!yaoWuXing) return '—';

      if (yaoWuXing === relations.bei_sheng) return '父母';
      if (yaoWuXing === relations.sheng) return '子孙';
      if (yaoWuXing === relations.same) return '兄弟';
      if (yaoWuXing === relations.ke) return '妻财';
      if (yaoWuXing === relations.bei_ke) return '官鬼';
      return '—';
    });
  }

  /**
   * 生成爻的纳甲信息（天干+地支+五行）
   */
  function getYaongJia(lineIndex, lowerTrigramName, upperTrigramName) {
    var lowerGuaInfo = GUA_NA_JIA[lowerTrigramName] || GUA_NA_JIA['乾'];
    var upperGuaInfo = GUA_NA_JIA[upperTrigramName] || GUA_NA_JIA['坤'];

    var tianGan, diZhi;
    if (lineIndex < 3) {
      tianGan = lowerGuaInfo.tian_gan[lineIndex];
      var diIndex = (lowerGuaInfo.start_di + lineIndex * 2) % 12;
      diZhi = YAO_DI_ZHI[diIndex];
    } else {
      tianGan = upperGuaInfo.tian_gan[lineIndex];
      var diIndex2 = (upperGuaInfo.start_di + (lineIndex - 3) * 2) % 12;
      diZhi = YAO_DI_ZHI[diIndex2];
    }

    var wuXing = DI_ZHI_WUXING[diZhi] || '金';
    return {
      tianGan: tianGan,
      diZhi: diZhi,
      wuXing: wuXing,
      label: tianGan + diZhi
    };
  }

  // ========== UI 交互 ==========

  var btnShake = document.getElementById('btnShake');
  var btnReset = document.getElementById('btnReset');
  var currentLineLabel = document.getElementById('currentLineLabel');
  var coinResult = document.getElementById('coinResult');
  var hexagramResult = document.getElementById('hexagramResult');
  var hexagramLines = document.getElementById('hexagramLines');
  var hexagramInfo = document.getElementById('hexagramInfo');
  var detailTableWrap = document.getElementById('detailTableWrap');
  var progressDots = document.querySelectorAll('.progress-dot');
  var coinElements = [
    document.getElementById('coin0'),
    document.getElementById('coin1'),
    document.getElementById('coin2')
  ];

  /**
   * 摇动硬币
   */
  window.shakeCoins = function () {
    if (state.isShaking) return;
    if (state.currentLine >= 6) return;

    state.isShaking = true;
    btnShake.disabled = true;

    // 清除之前的结果文字
    coinResult.innerHTML = '';

    // 播放摇动动画
    coinElements.forEach(function (coin) {
      coin.classList.remove('shaking', 'revealed', 'heads', 'tails');
      // Force reflow to restart animation
      void coin.offsetWidth;
      coin.classList.add('shaking');
    });

    // 生成结果
    var result = generateCoinResult();
    state.lines.push(result);

    // 动画结束后显示结果
    setTimeout(function () {
      // 显示每枚硬币正反面
      coinElements.forEach(function (coin, i) {
        coin.classList.remove('shaking');
        if (result.coins[i] === 3) {
          // 字(正面)
          coin.classList.add('revealed', 'heads');
        } else {
          // 花(背面)
          coin.classList.add('revealed', 'tails');
        }
      });

      // 显示结果信息
      var coinText = result.coins.map(function (c) { return c === 3 ? '字(3)' : '花(2)'; }).join(' + ');
      var totalText = ' = ' + result.sum + ' → ';
      var tagClass = result.isDong ? (result.type === 'yang' ? 'dong-yang' : 'dong-yin') : (result.type === 'yang' ? 'yang' : 'yin');
      var tagText = result.type === 'yang'
        ? (result.isDong ? '老阳 ⚊ 动爻' : '少阳 ⚊')
        : (result.isDong ? '老阴 ⚋ 动爻' : '少阴 ⚋');

      coinResult.innerHTML = coinText + totalText + '<span class="result-tag ' + tagClass + '">' + tagText + '</span>';

      // 更新进度
      progressDots[state.currentLine].classList.remove('active');
      progressDots[state.currentLine].classList.add('done');
      state.currentLine++;

      if (state.currentLine < 6) {
        progressDots[state.currentLine].classList.add('active');
        currentLineLabel.textContent = '请摇动三枚硬币，得出' + YAO_POSITIONS[state.currentLine];
        btnShake.disabled = false;
      } else {
        currentLineLabel.textContent = '排盘完成！';
        btnShake.disabled = true;
        setTimeout(showHexagram, 800);
      }

      state.isShaking = false;
    }, 700);
  };

  /**
   * 重置
   */
  window.resetAll = function () {
    state.currentLine = 0;
    state.lines = [];
    state.isShaking = false;

    coinElements.forEach(function (coin) {
      coin.classList.remove('shaking', 'revealed', 'heads', 'tails');
    });

    progressDots.forEach(function (dot) {
      dot.classList.remove('active', 'done');
    });
    progressDots[0].classList.add('active');

    currentLineLabel.textContent = '请摇动三枚硬币，得出第一爻';
    coinResult.innerHTML = '';
    hexagramResult.classList.remove('show');
    btnShake.disabled = false;
  };

  /**
   * 显示排盘结果
   */
  function showHexagram() {
    var binaryLines = state.lines.map(function (l) { return l.binary; });
    var code = binaryLines.join('');
    var trigrams = getTrigrams(code);
    var guaData = lookupGuaName(binaryLines);
    var gongName = determineGong(code);

    // 获取卦宫的五行属性
    var gongGuaCode = Object.keys(BA_GUA).find(function (k) { return BA_GUA[k].name === gongName; });
    var guaWuXing = gongGuaCode ? BA_GUA[gongGuaCode].attr : '金';

    // 生成纳甲信息
    var naJiaInfo = [];
    for (var i = 0; i < 6; i++) {
      var nj = getYaongJia(i, trigrams.lower.name, trigrams.upper.name);
      naJiaInfo.push(nj);
    }

    // 分配六亲
    var liuQin = assignLiuQin(naJiaInfo, guaWuXing);

    // 确定世应（简化：纯卦世在六爻，其余取上卦为世）
    var shiPosition = 6;
    var yingPosition = 3;
    var allKeys = Object.keys(BA_GUA);
    for (var gi = 0; gi < allKeys.length; gi++) {
      if (BA_GUA[allKeys[gi]].name === gongName) {
        var pureCode = allKeys[gi];
        if (code === pureCode + pureCode) {
          shiPosition = 6; yingPosition = 3;
        } else {
          // 简化：根据动爻数等规则推世位
          var dongCount = state.lines.filter(function (l) { return l.isDong; }).length;
          if (dongCount === 0) {
            shiPosition = findShiByGong(code, gongName);
            yingPosition = (shiPosition + 3 > 6 ? shiPosition + 3 - 6 : shiPosition - 3);
          } else {
            // 有动爻时，以动爻所在位置推
            var dongLines = [];
            state.lines.forEach(function (l, idx) { if (l.isDong) dongLines.push(idx + 1); });
            shiPosition = dongLines[0];
            yingPosition = (shiPosition + 3 > 6 ? shiPosition + 3 - 6 : shiPosition - 3);
          }
        }
        break;
      }
    }

    // 渲染卦象爻线
    renderYaoLines(binaryLines, naJiaInfo, liuQin, shiPosition, yingPosition);

    // 渲染卦信息卡片
    renderGuaInfo(guaData, trigrams, gongName);

    // 渲染变卦信息
    renderBianGua(binaryLines);

    // 渲染详细表格
    renderDetailTable(naJiaInfo, liuQin, shiPosition, yingPosition, guaWuXing);

    // 显示结果区域
    hexagramResult.classList.add('show');
  }

  /**
   * 通过宫位规则推世爻
   */
  function findShiByGong(code, gongName) {
    // 简化版世爻推算法
    var lower = code.substring(0, 3);
    var upper = code.substring(3, 6);
    var pureKey = Object.keys(BA_GUA).find(function (k) { return BA_GUA[k].name === gongName; });

    if (lower + upper === pureKey + pureKey) return 6;

    // 逐卦查找宫内位置
    var gongGuaCodes = [];
    if (pureKey) {
      for (var i = 0; i < 6; i++) {
        for (var mask = 0; mask < 64; mask++) {
          var bits = mask.toString(2).padStart(6, '0');
          if (bits.substring(0, 3) + bits.substring(3, 6).charAt(0) !== undefined) {
            // 简化处理
          }
        }
      }
    }

    // 最终简化：根据上下卦变化推世位
    if (upper === pureKey) return 3; // 归魂卦世在三爻
    if (lower === pureKey) return 4; // 
    return 1; // 默认
  }

  /**
   * 渲染爻线
   */
  function renderYaoLines(binaryLines, naJiaInfo, liuQin, shiPos, yingPos) {
    var html = '';
    // 从上爻到初爻显示（6→1）
    for (var i = 5; i >= 0; i--) {
      var line = state.lines[i];
      var isYang = line.type === 'yang';
      var isDong = line.isDong;
      var cssClass = isYang ? '' : 'yin';
      if (isDong) cssClass += isYang ? ' dong' : ' dong-yin';

      var posLabel = (i + 1 === 6) ? '上' : (i + 1);

      var shiYingMark = '';
      if (i + 1 === shiPos) shiYingMark = ' 世';
      else if (i + 1 === yingPos) shiYingMark = ' 应';

      html += '<div class="yao-line ' + cssClass + '">';
      html += '<div class="yao-position">' + (6 - i) + '</div>';
      html += '<div class="yao-bars">';
      html += '<div class="yao-bar"></div>';
      html += '<div class="yao-bar-gap"></div>';
      html += '<div class="yao-bar"></div>';
      html += '</div>';
      html += '<div class="yao-label">';
      html += '<div class="yao-name">' + YAO_POSITIONS[i] + shiYingMark + '</div>';
      html += '<div class="yao-type">' + naJiaInfo[i].label + ' ' + liuQin[i] + '</div>';
      html += '</div>';
      html += '</div>';
    }
    hexagramLines.innerHTML = html;
  }

  /**
   * 渲染卦信息卡片
   */
  function renderGuaInfo(guaData, trigrams, gongName) {
    var html = '<div class="gua-card">';
    html += '<div class="gua-symbol">' + guaData.gua.charAt(0) + '</div>';
    html += '<div class="gua-name">' + guaData.name + '</div>';
    html += '<div class="gua-desc">' + guaData.desc + '</div>';
    html += '<div class="gua-trigrams">';
    html += '上卦：<span>' + trigrams.upper.name + '（' + trigrams.upper.nature + '）</span> · ';
    html += '下卦：<span>' + trigrams.lower.name + '（' + trigrams.lower.nature + '）</span>';
    html += '<br>属 <span>' + gongName + '</span>';
    html += '</div>';
    html += '</div>';
    hexagramInfo.innerHTML = html;
  }

  /**
   * 渲染变卦
   */
  function renderBianGua(binaryLines) {
    var hasDong = state.lines.some(function (l) { return l.isDong; });
    var html = '<div class="bian-gua-section">';
    html += '<div class="section-label">之卦（变卦）</div>';

    if (!hasDong) {
      html += '<div class="no-bian-notice">无动爻，无变卦。本卦即为结果。</div>';
    } else {
      var bianLines = binaryLines.map(function (b, i) {
        return state.lines[i].isDong ? (1 - b) : b;
      });
      var bianCode = bianLines.join('');
      var bianGua = lookupGuaName(bianLines);
      var bianTrigrams = getTrigrams(bianCode);

      html += '<div class="bian-gua-card">';
      html += '<div class="bian-symbol">' + bianGua.gua.charAt(0) + '</div>';
      html += '<div class="bian-name">' + bianGua.name + '</div>';
      html += '<div class="bian-desc">' + bianGua.desc + '</div>';
      html += '<div style="margin-top:0.5rem;font-size:0.75rem;color:var(--muted)">';
      html += '上卦：' + bianTrigrams.upper.name + '（' + bianTrigrams.upper.nature + '） · ';
      html += '下卦：' + bianTrigrams.lower.name + '（' + bianTrigrams.lower.nature + '）';
      html += '</div>';
      html += '</div>';
    }

    html += '</div>';
    hexagramInfo.innerHTML += html;
  }

  /**
   * 渲染详细表格
   */
  function renderDetailTable(naJiaInfo, liuQin, shiPos, yingPos, guaWuXing) {
    var html = '<table class="detail-table">';
    html += '<thead><tr>';
    html += '<th>爻位</th><th>爻象</th><th>变动</th><th>纳甲</th><th>五行</th><th>六亲</th><th>世应</th>';
    html += '</tr></thead><tbody>';

    for (var i = 0; i < 6; i++) {
      var line = state.lines[i];
      var yaoName = (i + 1 === 6) ? '上爻' : YAO_POSITIONS[i];
      var yaoXiang = line.type === 'yang' ? '━━━ 阳' : '━ ━ 阴';
      var bianDong = line.isDong ? '动' : '—';
      var shiYing = '';
      if (i + 1 === shiPos) shiYing = '世';
      else if (i + 1 === yingPos) shiYing = '应';

      html += '<tr>';
      html += '<td class="yao-pos">' + yaoName + '</td>';
      html += '<td>' + yaoXiang + '</td>';
      html += '<td>' + (line.isDong ? '<span style="color:var(--accent2);font-weight:700">动</span>' : '—') + '</td>';
      html += '<td>' + naJiaInfo[i].label + '</td>';
      html += '<td class="yao-attr">' + naJiaInfo[i].wuXing + '</td>';
      html += '<td>' + liuQin[i] + '</td>';
      html += '<td>' + (shiYing ? '<span style="color:var(--accent);font-weight:700">' + shiYing + '</span>' : '—') + '</td>';
      html += '</tr>';
    }

    html += '</tbody></table>';
    detailTableWrap.innerHTML = html;
  }

  // ========== 初始化 ==========
  progressDots[0].classList.add('active');

})();
