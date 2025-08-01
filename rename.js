/**
 * 更新日期：2025-08-01 11:53:21
 * 用法：Sub-Store 脚本操作添加
 * rename.js 以下是此脚本支持的参数，必须以 # 为开头多个参数使用"&"连接，参考上述地址为例使用参数。 禁用缓存url#noCache
 *
 *** 主要参数
 * [in=] 自动判断机场节点名类型 优先级 zh(中文) -> flag(国旗) -> quan(英文全称) -> en(英文简写)
 * 如果不准的情况, 可以加参数指定:
 *
 * [nm]    保留没有匹配到的节点
 * [in=zh] 或in=cn识别中文
 * [in=en] 或in=us 识别英文缩写
 * [in=flag] 或in=gq 识别国旗 如果加参数 in=flag 则识别国旗 脚本操作前面不要添加国旗操作 否则移除国旗后面脚本识别不到
 * [in=quan] 识别英文全称

 *
 * [out=]   输出节点名可选参数: (cn或zh ，us或en ，gq或flag ，quan) 对应：(中文，英文缩写 ，国旗 ，英文全称) 默认中文 例如 [out=en] 或 out=us 输出英文缩写
 *** 分隔符参数
 *
 * [fgf=]   节点名前缀或国旗分隔符，默认为空格；
 * [sn=]    设置国家与序号之间的分隔符，默认为空格；
 * 序号参数
 * [one]    清理只有一个节点的地区的01
 * [flag]   给节点前面加国旗
 *
 *** 前缀参数
 * [name=]  节点添加机场名称前缀；
 * [nf]     把 name= 的前缀值放在最前面
 *** 保留参数
 * [blkey=iplc+gpt+NF+IPLC] 用+号添加多个关键词 保留节点名的自定义字段 需要区分大小写!
 * 如果需要修改 保留的关键词 替换成别的 可以用 > 分割 例如 [#blkey=GPT>新名字+其他关键词] 这将把【GPT】替换成【新名字】
 * 例如      https://raw.githubusercontent.com/Keywos/rule/main/rename.js#flag&blkey=GPT>新名字+NF
 * [blgd]   保留: 家宽 IPLC ˣ² 等
 * [bl]     正则匹配保留 [0.1x, x0.2, 6x ,3倍]等标识
 * [nx]     保留1倍率与不显示倍率的
 * [blnx]   只保留高倍率
 * [clear]  清理乱名
 * [blpx]   如果用了上面的bl参数,对保留标识后的名称分组排序,如果没用上面的bl参数单独使用blpx则不起任何作用
 * [blockquic] blockquic=on 阻止; blockquic=off 不阻止
 * 
 * 新增功能: 节点自动按地区排序 (香港、台湾、新加坡、日本、美国、韩国、德国、英国优先，其他地区按字典排序)
 * 新增功能: 服务商后缀自动识别与保留 (支持HK1 Eons和HK Eons两种格式，后缀会被保留并优先排序)
 */

// const inArg = {'blkey':'iplc+GPT>GPTnewName+NF+IPLC', 'flag':true };
const inArg = $arguments; // console.log(inArg)
const nx = inArg.nx || false,
  bl = inArg.bl || false,
  nf = inArg.nf || false,
  key = inArg.key || false,
  blgd = inArg.blgd || false,
  blpx = inArg.blpx || false,
  blnx = inArg.blnx || false,
  numone = inArg.one || false,
  debug = inArg.debug || false,
  clear = inArg.clear || false,
  addflag = inArg.flag || false,
  nm = inArg.nm || false;

const FGF = inArg.fgf == undefined ? " " : decodeURI(inArg.fgf),
  XHFGF = inArg.sn == undefined ? " " : decodeURI(inArg.sn),
  FNAME = inArg.name == undefined ? "" : decodeURI(inArg.name),
  BLKEY = inArg.blkey == undefined ? "" : decodeURI(inArg.blkey),
  blockquic = inArg.blockquic == undefined ? "" : decodeURI(inArg.blockquic),
  nameMap = {
    cn: "cn",
    zh: "cn",
    us: "us",
    en: "us",
    quan: "quan",
    gq: "gq",
    flag: "gq",
  },
  inname = nameMap[inArg.in] || "",
  outputName = nameMap[inArg.out] || "";

// 服务商后缀识别 🎯 - 使用从后往前查找算法，支持各种地区名称

// prettier-ignore
const FG = ['🇭🇰', '🇲🇴', '🇹🇼', '🇯🇵', '🇰🇷', '🇸🇬', '🇺🇸', '🇬🇧', '🇫🇷', '🇩🇪', '🇦🇺', '🇦🇪', '🇦🇫', '🇦🇱', '🇩🇿', '🇦🇴', '🇦🇷', '🇦🇲', '🇦🇹', '🇦🇿', '🇧🇭', '🇧🇩', '🇧🇾', '🇧🇪', '🇧🇿', '🇧🇯', '🇧🇹', '🇧🇴', '🇧🇦', '🇧🇼', '🇧🇷', '🇻🇬', '🇧🇳', '🇧🇬', '🇧🇫', '🇧🇮', '🇰🇭', '🇨🇲', '🇨🇦', '🇨🇻', '🇰🇾', '🇨🇫', '🇹🇩', '🇨🇱', '🇨🇴', '🇰🇲', '🇨🇬', '🇨🇩', '🇨🇷', '🇭🇷', '🇨🇾', '🇨🇿', '🇩🇰', '🇩🇯', '🇩🇴', '🇪🇨', '🇪🇬', '🇸🇻', '🇬🇶', '🇪🇷', '🇪🇪', '🇪🇹', '🇫🇯', '🇫🇮', '🇬🇦', '🇬🇲', '🇬🇪', '🇬🇭', '🇬🇷', '🇬🇱', '🇬🇹', '🇬🇳', '🇬🇾', '🇭🇹', '🇭🇳', '🇭🇺', '🇮🇸', '🇮🇳', '🇮🇩', '🇮🇷', '🇮🇶', '🇮🇪', '🇮🇲', '🇮🇱', '🇮🇹', '🇨🇮', '🇯🇲', '🇯🇴', '🇰🇿', '🇰🇪', '🇰🇼', '🇰🇬', '🇱🇦', '🇱🇻', '🇱🇧', '🇱🇸', '🇱🇷', '🇱🇾', '🇱🇹', '🇱🇺', '🇲🇰', '🇲🇬', '🇲🇼', '🇲🇾', '🇲🇻', '🇲🇱', '🇲🇹', '🇲🇷', '🇲🇺', '🇲🇽', '🇲🇩', '🇲🇨', '🇲🇳', '🇲🇪', '🇲🇦', '🇲🇿', '🇲🇲', '🇳🇦', '🇳🇵', '🇳🇱', '🇳🇿', '🇳🇮', '🇳🇪', '🇳🇬', '🇰🇵', '🇳🇴', '🇴🇲', '🇵🇰', '🇵🇦', '🇵🇾', '🇵🇪', '🇵🇭', '🇵🇹', '🇵🇷', '🇶🇦', '🇷🇴', '🇷🇺', '🇷🇼', '🇸🇲', '🇸🇦', '🇸🇳', '🇷🇸', '🇸🇱', '🇸🇰', '🇸🇮', '🇸🇴', '🇿🇦', '🇪🇸', '🇱🇰', '🇸🇩', '🇸🇷', '🇸🇿', '🇸🇪', '🇨🇭', '🇸🇾', '🇹🇯', '🇹🇿', '🇹🇭', '🇹🇬', '🇹🇴', '🇹🇹', '🇹🇳', '🇹🇷', '🇹🇲', '🇻🇮', '🇺🇬', '🇺🇦', '🇺🇾', '🇺🇿', '🇻🇪', '🇻🇳', '🇾🇪', '🇿🇲', '🇿🇼', '🇦🇩', '🇷🇪', '🇵🇱', '🇬🇺', '🇻🇦', '🇱🇮', '🇨🇼', '🇸🇨', '🇦🇶', '🇬🇮', '🇨🇺', '🇫🇴', '🇦��', '🇧🇲', '🇹🇱']
// prettier-ignore
const EN = ['HK', 'MO', 'TW', 'JP', 'KR', 'SG', 'US', 'GB', 'FR', 'DE', 'AU', 'AE', 'AF', 'AL', 'DZ', 'AO', 'AR', 'AM', 'AT', 'AZ', 'BH', 'BD', 'BY', 'BE', 'BZ', 'BJ', 'BT', 'BO', 'BA', 'BW', 'BR', 'VG', 'BN', 'BG', 'BF', 'BI', 'KH', 'CM', 'CA', 'CV', 'KY', 'CF', 'TD', 'CL', 'CO', 'KM', 'CG', 'CD', 'CR', 'HR', 'CY', 'CZ', 'DK', 'DJ', 'DO', 'EC', 'EG', 'SV', 'GQ', 'ER', 'EE', 'ET', 'FJ', 'FI', 'GA', 'GM', 'GE', 'GH', 'GR', 'GL', 'GT', 'GN', 'GY', 'HT', 'HN', 'HU', 'IS', 'IN', 'ID', 'IR', 'IQ', 'IE', 'IM', 'IL', 'IT', 'CI', 'JM', 'JO', 'KZ', 'KE', 'KW', 'KG', 'LA', 'LV', 'LB', 'LS', 'LR', 'LY', 'LT', 'LU', 'MK', 'MG', 'MW', 'MY', 'MV', 'ML', 'MT', 'MR', 'MU', 'MX', 'MD', 'MC', 'MN', 'ME', 'MA', 'MZ', 'MM', 'NA', 'NP', 'NL', 'NZ', 'NI', 'NE', 'NG', 'KP', 'NO', 'OM', 'PK', 'PA', 'PY', 'PE', 'PH', 'PT', 'PR', 'QA', 'RO', 'RU', 'RW', 'SM', 'SA', 'SN', 'RS', 'SL', 'SK', 'SI', 'SO', 'ZA', 'ES', 'LK', 'SD', 'SR', 'SZ', 'SE', 'CH', 'SY', 'TJ', 'TZ', 'TH', 'TG', 'TO', 'TT', 'TN', 'TR', 'TM', 'VI', 'UG', 'UA', 'UY', 'UZ', 'VE', 'VN', 'YE', 'ZM', 'ZW', 'AD', 'RE', 'PL', 'GU', 'VA', 'LI', 'CW', 'SC', 'AQ', 'GI', 'CU', 'FO', 'AX', 'BM', 'TL'];
// prettier-ignore
const ZH = ['香港', '澳门', '台湾', '日本', '韩国', '新加坡', '美国', '英国', '法国', '德国', '澳大利亚', '阿联酋', '阿富汗', '阿尔巴尼亚', '阿尔及利亚', '安哥拉', '阿根廷', '亚美尼亚', '奥地利', '阿塞拜疆', '巴林', '孟加拉国', '白俄罗斯', '比利时', '伯利兹', '贝宁', '不丹', '玻利维亚', '波斯尼亚和黑塞哥维那', '博茨瓦纳', '巴西', '英属维京群岛', '文莱', '保加利亚', '布基纳法索', '布隆迪', '柬埔寨', '喀麦隆', '加拿大', '佛得角', '开曼群岛', '中非共和国', '乍得', '智利', '哥伦比亚', '科摩罗', '刚果(布)', '刚果(金)', '哥斯达黎加', '克罗地亚', '塞浦路斯', '捷克', '丹麦', '吉布提', '多米尼加共和国', '厄瓜多尔', '埃及', '萨尔瓦多', '赤道几内亚', '厄立特里亚', '爱沙尼亚', '埃塞俄比亚', '斐济', '芬兰', '加蓬', '冈比亚', '格鲁吉亚', '加纳', '希腊', '格陵兰', '危地马拉', '几内亚', '圭亚那', '海地', '洪都拉斯', '匈牙利', '冰岛', '印度', '印尼', '伊朗', '伊拉克', '爱尔兰', '马恩岛', '以色列', '意大利', '科特迪瓦', '牙买加', '约旦', '哈萨克斯坦', '肯尼亚', '科威特', '吉尔吉斯斯坦', '老挝', '拉脱维亚', '黎巴嫩', '莱索托', '利比里亚', '利比亚', '立陶宛', '卢森堡', '马其顿', '马达加斯加', '马拉维', '马来', '马尔代夫', '马里', '马耳他', '毛利塔尼亚', '毛里求斯', '墨西哥', '摩尔多瓦', '摩纳哥', '蒙古', '黑山共和国', '摩洛哥', '莫桑比克', '缅甸', '纳米比亚', '尼泊尔', '荷兰', '新西兰', '尼加拉瓜', '尼日尔', '尼日利亚', '朝鲜', '挪威', '阿曼', '巴基斯坦', '巴拿马', '巴拉圭', '秘鲁', '菲律宾', '葡萄牙', '波多黎各', '卡塔尔', '罗马尼亚', '俄罗斯', '卢旺达', '圣马力诺', '沙特阿拉伯', '塞内加尔', '塞尔维亚', '塞拉利昂', '斯洛伐克', '斯洛文尼亚', '索马里', '南非', '西班牙', '斯里兰卡', '苏丹', '苏里南', '斯威士兰', '瑞典', '瑞士', '叙利亚', '塔吉克斯坦', '坦桑尼亚', '泰国', '多哥', '汤加', '特立尼达和多巴哥', '突尼斯', '土耳其', '土库曼斯坦', '美属维尔京群岛', '乌干达', '乌克兰', '乌拉圭', '乌兹别克斯坦', '委内瑞拉', '越南', '也门', '赞比亚', '津巴布韦', '安道尔', '留尼汪', '波兰', '关岛', '梵蒂冈', '列支敦士登', '库拉索', '塞舌尔', '南极', '直布罗陀', '古巴', '法罗群岛', '奥兰群岛', '百慕达', '东帝汶'];
// prettier-ignore
const QC = ['Hong Kong', 'Macao', 'Taiwan', 'Japan', 'Korea', 'Singapore', 'United States', 'United Kingdom', 'France', 'Germany', 'Australia', 'Dubai', 'Afghanistan', 'Albania', 'Algeria', 'Angola', 'Argentina', 'Armenia', 'Austria', 'Azerbaijan', 'Bahrain', 'Bangladesh', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'British Virgin Islands', 'Brunei', 'Bulgaria', 'Burkina-faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'CapeVerde', 'CaymanIslands', 'Central African Republic', 'Chad', 'Chile', 'Colombia', 'Comoros', 'Congo-Brazzaville', 'Congo-Kinshasa', 'CostaRica', 'Croatia', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominican Republic', 'Ecuador', 'Egypt', 'EISalvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Ethiopia', 'Fiji', 'Finland', 'Gabon', 'Gambia', 'Georgia', 'Ghana', 'Greece', 'Greenland', 'Guatemala', 'Guinea', 'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Isle of Man', 'Israel', 'Italy', 'Ivory Coast', 'Jamaica', 'Jordan', 'Kazakstan', 'Kenya', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Lithuania', 'Luxembourg', 'Macedonia', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Mauritania', 'Mauritius', 'Mexico', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'NorthKorea', 'Norway', 'Oman', 'Pakistan', 'Panama', 'Paraguay', 'Peru', 'Philippines', 'Portugal', 'PuertoRico', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'SanMarino', 'SaudiArabia', 'Senegal', 'Serbia', 'SierraLeone', 'Slovakia', 'Slovenia', 'Somalia', 'South Africa', 'Spain', 'SriLanka', 'Sudan', 'Suriname', 'Swaziland', 'Sweden', 'Switzerland', 'Syria', 'Tajikstan', 'Tanzania', 'Thailand', 'Togo', 'Tonga', 'TrinidadandTobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'U.S.Virgin Islands', 'Uganda', 'Ukraine', 'Uruguay', 'Uzbekistan', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe', 'Andorra', 'Reunion', 'Poland', 'Guam', 'Vatican', 'Liechtensteins', 'Curacao', 'Seychelles', 'Antarctica', 'Gibraltar', 'Cuba', 'Faroe Islands', 'Ahvenanmaa', 'Bermuda', 'Timor-Leste'];
const specialRegex = [
  /(\d\.)?\d+×/,
  /IPLC|IEPL|Kern|Edge|Pro|Std|Exp|Biz|Fam|Game|Buy|Zx|LB|Game/,
];
const nameclear =
  /(套餐|到期|有效|剩余|版本|已用|过期|失联|测试|官方|网址|备用|群|TEST|客服|网站|获取|订阅|流量|机场|下次|官址|联系|邮箱|工单|学术|USE|USED|TOTAL|EXPIRE|EMAIL)/i;
// prettier-ignore
const regexArray = [/ˣ²/, /ˣ³/, /ˣ⁴/, /ˣ⁵/, /ˣ⁶/, /ˣ⁷/, /ˣ⁸/, /ˣ⁹/, /ˣ¹⁰/, /ˣ²⁰/, /ˣ³⁰/, /ˣ⁴⁰/, /ˣ⁵⁰/, /IPLC/i, /IEPL/i, /核心/, /边缘/, /高级/, /标准/, /实验/, /商宽/, /家宽/, /游戏|game/i, /购物/, /专线/, /LB/, /cloudflare/i, /\budp\b/i, /\bgpt\b/i, /udpn\b/];
// prettier-ignore
const valueArray = ["2×", "3×", "4×", "5×", "6×", "7×", "8×", "9×", "10×", "20×", "30×", "40×", "50×", "IPLC", "IEPL", "Kern", "Edge", "Pro", "Std", "Exp", "Biz", "Fam", "Game", "Buy", "Zx", "LB", "CF", "UDP", "GPT", "UDPN"];
const nameblnx = /(高倍|(?!1)2+(x|倍)|ˣ²|ˣ³|ˣ⁴|ˣ⁵|ˣ¹⁰)/i;
const namenx = /(高倍|(?!1)(0\.|\d)+(x|倍)|ˣ²|ˣ³|ˣ⁴|ˣ⁵|ˣ¹⁰)/i;
const keya =
  /港|Hong|HK|新加坡|SG|Singapore|日本|Japan|JP|美国|United States|US|韩|土耳其|TR|Turkey|Korea|KR|🇸🇬|🇭🇰|🇯🇵|🇺🇸|🇰🇷|🇹🇷/i;
const keyb =
  /(((1|2|3|4)\d)|(香港|Hong|HK) 0[5-9]|((新加坡|SG|Singapore|日本|Japan|JP|美国|United States|US|韩|土耳其|TR|Turkey|Korea|KR) 0[3-9]))/i;
const rurekey = {
  GB: /UK/g,
  "B-G-P": /BGP/g,
  "Russia Moscow": /Moscow/g,
  "Korea Chuncheon": /Chuncheon|Seoul/g,
  "Hong Kong": /Hongkong|HONG KONG/gi,
  "United Kingdom London": /London|Great Britain/g,
  "Dubai United Arab Emirates": /United Arab Emirates/g,
  "Taiwan TW 台湾 🇹🇼": /(台|Tai\s?wan|TW).*?🇨🇳|🇨🇳.*?(台|Tai\s?wan|TW)/g,
  "United States": /USA|Los Angeles|San Jose|Silicon Valley|Michigan/g,
  澳大利亚: /澳洲|墨尔本|悉尼|土澳|(深|沪|呼|京|广|杭)澳/g,
  德国: /(深|沪|呼|京|广|杭)德(?!.*(I|线))|法兰克福|滬德/g,
  香港: /(深|沪|呼|京|广|杭)港(?!.*(I|线))/g,
  日本: /(深|沪|呼|京|广|杭|中|辽)日(?!.*(I|线))|东京|大坂/g,
  新加坡: /狮城|(深|沪|呼|京|广|杭)新/g,
  美国: /(深|沪|呼|京|广|杭)美|波特兰|芝加哥|哥伦布|纽约|硅谷|俄勒冈|西雅图|芝加哥/g,
  波斯尼亚和黑塞哥维那: /波黑共和国/g,
  印尼: /印度尼西亚|雅加达/g,
  印度: /孟买/g,
  阿联酋: /迪拜|阿拉伯联合酋长国/g,
  孟加拉国: /孟加拉/g,
  捷克: /捷克共和国/g,
  台湾: /新台|新北|台(?!.*线)/g,
  Taiwan: /Taipei/g,
  韩国: /春川|韩|首尔/g,
  Japan: /Tokyo|Osaka/g,
  英国: /伦敦/g,
  India: /Mumbai/g,
  Germany: /Frankfurt/g,
  Switzerland: /Zurich/g,
  俄罗斯: /莫斯科/g,
  土耳其: /伊斯坦布尔/g,
  泰国: /泰國|曼谷/g,
  法国: /巴黎/g,
  G: /\d\s?GB/gi,
  Esnc: /esnc/gi,
};

let GetK = false, AMK = []
function ObjKA(i) {
  GetK = true
  AMK = Object.entries(i)
}

function operator(pro) {
  const Allmap = {};
  const outList = getList(outputName);
  let inputList,
    retainKey = "";
  if (inname !== "") {
    inputList = [getList(inname)];
  } else {
    inputList = [ZH, FG, QC, EN];
  }

  inputList.forEach((arr) => {
    arr.forEach((value, valueIndex) => {
      Allmap[value] = outList[valueIndex];
    });
  });

  if (clear || nx || blnx || key) {
    pro = pro.filter((res) => {
      const resname = res.name;
      const shouldKeep =
        !(clear && nameclear.test(resname)) &&
        !(nx && namenx.test(resname)) &&
        !(blnx && !nameblnx.test(resname)) &&
        !(key && !(keya.test(resname) && /2|4|6|7/i.test(resname)));
      return shouldKeep;
    });
  }

  const BLKEYS = BLKEY ? BLKEY.split("+") : "";

  pro.forEach((e) => {
    let bktf = false, ens = e.name;

    // 🎯 提取服务商后缀 - 更可靠的算法
    let providerSuffix = "";

    // 从后往前查找第一个合法的地区名称
    let regionFound = false;
    for (let i = e.name.length; i >= 0; i--) {
      const subStr = e.name.substring(0, i);
      const suffix = e.name.substring(i).trim();

      // 检查子字符串是否是已知地区或地区代码
      if (AMK.some(([key]) => subStr === key)) {
        // 如果是地区，那么剩下的部分就是后缀
        if (suffix) {
          e.providerSuffix = suffix;
        }
        e.name = subStr; // 更新节点名为地区部分
        regionFound = true;
        break; // 找到最长的匹配地区后就跳出循环
      }
    }

    // 预处理 防止预判或遗漏
    Object.keys(rurekey).forEach((ikey) => {
      if (rurekey[ikey].test(e.name)) {
        e.name = e.name.replace(rurekey[ikey], ikey);
        if (BLKEY) {
          bktf = true
          let BLKEY_REPLACE = "",
            re = false;
          BLKEYS.forEach((i) => {
            if (i.includes(">") && ens.includes(i.split(">")[0])) {
              if (rurekey[ikey].test(i.split(">")[0])) {
                e.name += " " + i.split(">")[0]
              }
              if (i.split(">")[1]) {
                BLKEY_REPLACE = i.split(">")[1];
                re = true;
              }
            } else {
              if (ens.includes(i)) {
                e.name += " " + i
              }
            }
            retainKey = re
              ? BLKEY_REPLACE
              : BLKEYS.filter((items) => e.name.includes(items));
          });
        }
      }
    });
    if (blockquic == "on") {
      e["block-quic"] = "on";
    } else if (blockquic == "off") {
      e["block-quic"] = "off";
    } else {
      delete e["block-quic"];
    }

    // 自定义
    if (!bktf && BLKEY) {
      let BLKEY_REPLACE = "",
        re = false;
      BLKEYS.forEach((i) => {
        if (i.includes(">") && e.name.includes(i.split(">")[0])) {
          if (i.split(">")[1]) {
            BLKEY_REPLACE = i.split(">")[1];
            re = true;
          }
        }
      });
      retainKey = re
        ? BLKEY_REPLACE
        : BLKEYS.filter((items) => e.name.includes(items));
    }

    let ikey = "",
      ikeys = "";
    // 保留固定格式 倍率
    if (blgd) {
      regexArray.forEach((regex, index) => {
        if (regex.test(e.name)) {
          ikeys = valueArray[index];
        }
      });
    }

    // 正则 匹配倍率
    if (bl) {
      const match = e.name.match(
        /((倍率|X|x|×)\D?((\d{1,3}\.)?\d+)\D?)|((\d{1,3}\.)?\d+)(倍|X|x|×)/
      );
      if (match) {
        const rev = match[0].match(/(\d[\d.]*)/)[0];
        if (rev !== "1") {
          const newValue = rev + "×";
          ikey = newValue;
        }
      }
    }

    !GetK && ObjKA(Allmap)
    // 匹配 Allkey 地区
    const findKey = AMK.find(([key]) =>
      e.name.includes(key)
    )

    let firstName = "",
      nNames = "";

    if (nf) {
      firstName = FNAME;
    } else {
      nNames = FNAME;
    }
    if (findKey?.[1]) {
      const findKeyValue = findKey[1];
      let keyover = [],
        usflag = "";
      if (addflag) {
        const index = outList.indexOf(findKeyValue);
        if (index !== -1) {
          usflag = FG[index];
          usflag = usflag === "🇹🇼" ? "🇨🇳" : usflag;
        }
      }
      keyover = keyover
        .concat(firstName, usflag, nNames, findKeyValue, retainKey, ikey, ikeys)
        .filter((k) => k !== "");

      // 🎯 重命名时暂不添加服务商后缀，等序号添加完再处理
      e.name = keyover.join(FGF);
    } else {
      if (nm) {
        e.name = FNAME + FGF + e.name;
      } else {
        e.name = null;
      }
    }
  });
  pro = pro.filter((e) => e.name !== null);

  // 🎯 在添加序号之前先排序，确保序号与最终位置对应
  pro = sortByRegion(pro);

  jxh(pro);

  // 🎯 在序号添加完成后，为带后缀的节点添加服务商后缀
  pro.forEach((e) => {
    if (e.providerSuffix) {
      e.name += " " + e.providerSuffix;
    }
  });

  numone && oneP(pro);
  blpx && (pro = fampx(pro));
  key && (pro = pro.filter((e) => !keyb.test(e.name)));
  return pro;
}

// prettier-ignore
function getList(arg) { switch (arg) { case 'us': return EN; case 'gq': return FG; case 'quan': return QC; default: return ZH; } }
// prettier-ignore
function jxh(e) { const n = e.reduce((e, n) => { const t = e.find((e) => e.name === n.name); if (t) { t.count++; t.items.push({ ...n, name: `${n.name}${XHFGF}${t.count.toString().padStart(2, "0")}`, }); } else { e.push({ name: n.name, count: 1, items: [{ ...n, name: `${n.name}${XHFGF}01` }], }); } return e; }, []); const t = (typeof Array.prototype.flatMap === 'function' ? n.flatMap((e) => e.items) : n.reduce((acc, e) => acc.concat(e.items), [])); e.splice(0, e.length, ...t); return e; }
// prettier-ignore
function oneP(e) { const t = e.reduce((e, t) => { const n = t.name.replace(/[^A-Za-z0-9\u00C0-\u017F\u4E00-\u9FFF]+\d+$/, ""); if (!e[n]) { e[n] = []; } e[n].push(t); return e; }, {}); for (const e in t) { if (t[e].length === 1 && t[e][0].name.endsWith("01")) {/* const n = t[e][0]; n.name = e;*/ t[e][0].name = t[e][0].name.replace(/[^.]01/, "") } } return e; }
// prettier-ignore
function fampx(pro) { const wis = []; const wnout = []; for (const proxy of pro) { const fan = specialRegex.some((regex) => regex.test(proxy.name)); if (fan) { wis.push(proxy); } else { wnout.push(proxy); } } const sps = wis.map((proxy) => specialRegex.findIndex((regex) => regex.test(proxy.name))); wis.sort((a, b) => sps[wis.indexOf(a)] - sps[wis.indexOf(b)] || a.name.localeCompare(b.name)); wnout.sort((a, b) => pro.indexOf(a) - pro.indexOf(b)); return wnout.concat(wis); }

// 节点地区排序功能 - 支持服务商后缀优先排序 🚀
function sortByRegion(pro) {
  // 定义地区映射表，每个地区只有一个优先级
  const regionMap = {
    // 香港 - 优先级 0
    '香港': 0, 'HK': 0, 'Hong Kong': 0, 'Hongkong': 0,
    // 台湾 - 优先级 1  
    '台湾': 1, 'TW': 1, 'Taiwan': 1, 'Taipei': 1,
    // 新加坡 - 优先级 2
    '新加坡': 2, 'SG': 2, 'Singapore': 2,
    // 日本 - 优先级 3
    '日本': 3, 'JP': 3, 'Japan': 3, 'Tokyo': 3, 'Osaka': 3,
    // 美国 - 优先级 4
    '美国': 4, 'US': 4, 'United States': 4, 'USA': 4,
    // 韩国 - 优先级 5
    '韩国': 5, 'KR': 5, 'Korea': 5, 'Seoul': 5,
    // 德国 - 优先级 6
    '德国': 6, 'DE': 6, 'Germany': 6, 'Frankfurt': 6,
    // 英国 - 优先级 7
    '英国': 7, 'GB': 7, 'UK': 7, 'United Kingdom': 7, 'London': 7
  };

  // 提取并标准化地区信息
  function getRegionIdentifier(nodeName) {
    // 特殊处理原脚本的复合地区格式
    if (nodeName.includes("Taiwan TW 台湾")) return '台湾';
    if (nodeName.includes("Hong Kong") && nodeName.includes("HK")) return '香港';

    // 按优先级顺序检查地区匹配
    const priorityChecks = [
      // 中文地区名优先
      ['香港', '台湾', '新加坡', '日本', '美国', '韩国', '德国', '英国'],
      // 英文简写
      ['HK', 'TW', 'SG', 'JP', 'US', 'KR', 'DE', 'GB', 'UK'],
      // 英文全称和城市名
      ['Hong Kong', 'Taiwan', 'Singapore', 'Japan', 'United States', 'Korea', 'Germany', 'United Kingdom', 'Tokyo', 'Osaka', 'Seoul', 'Frankfurt', 'London']
    ];

    for (const checkList of priorityChecks) {
      for (const region of checkList) {
        if (nodeName.includes(region)) {
          return region;
        }
      }
    }

    // 其他地区识别
    const otherRegions = [
      '澳门', '法国', '澳大利亚', '俄罗斯', '印度', '巴西', '意大利', '西班牙', '瑞士', '瑞典', '挪威', '丹麦', '芬兰', '奥地利', '比利时', '波兰', '捷克', '匈牙利', '葡萄牙', '希腊', '爱尔兰', '卢森堡', '墨西哥', '阿根廷', '智利', '土耳其', '南非', '阿联酋', '沙特阿拉伯', '以色列', '埃及', '泰国', '越南', '菲律宾', '马来', '印尼', '柬埔寨', '老挝', '缅甸', '孟加拉国', '巴基斯坦', '斯里兰卡', '尼泊尔', '哈萨克斯坦', '乌兹别克斯坦', '吉尔吉斯斯坦', '塔吉克斯坦', '蒙古', '乌克兰', '白俄罗斯', '立陶宛', '拉脱维亚', '爱沙尼亚', '摩尔多瓦', '格鲁吉亚', '亚美尼亚', '阿塞拜疆', '保加利亚', '罗马尼亚', '塞尔维亚', '克罗地亚', '斯洛文尼亚', '斯洛伐克', '波斯尼亚和黑塞哥维那', '马其顿', '阿尔巴尼亚', '黑山共和国'
    ];

    for (const region of otherRegions) {
      if (nodeName.includes(region)) {
        return region;
      }
    }

    // 如果都没匹配到，返回第一个词
    const firstWord = nodeName.split(/[\s\-_]+/)[0];
    return firstWord || nodeName;
  }

  // 获取地区优先级
  function getRegionPriority(regionIdentifier) {
    return regionMap[regionIdentifier] !== undefined ? regionMap[regionIdentifier] : 999;
  }

  // 排序函数 - 🎯 支持服务商后缀优先排序
  return pro.sort((a, b) => {
    const regionA = getRegionIdentifier(a.name);
    const regionB = getRegionIdentifier(b.name);

    const priorityA = getRegionPriority(regionA);
    const priorityB = getRegionPriority(regionB);

    // 先按地区优先级排序
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // 🎯 相同优先级地区内，再按具体地区名分组
    const regionSort = regionA.localeCompare(regionB, 'zh-CN');
    if (regionSort !== 0) {
      return regionSort;
    }

    // 🎯 相同具体地区内：有服务商后缀的节点排在前面
    const hasProviderA = !!(a.providerSuffix);
    const hasProviderB = !!(b.providerSuffix);

    if (hasProviderA !== hasProviderB) {
      return hasProviderB - hasProviderA; // A有后缀B没有时返回-1(A排前), B有后缀A没有时返回1(B排前)
    }

    // 最后按节点名排序（同地区同后缀状态）
    return a.name.localeCompare(b.name, 'zh-CN');
  });
}
