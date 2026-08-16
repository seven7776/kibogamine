/* ============================================================
 * 课程数据 — 江苏南通崇川区五年级上册
 * 语文: 部编版 | 数学: 苏教版 | 英语: 译林版(5A)
 * 结构: 单元 > 课文/课题; v1 三科第一单元完整内容, 其余骨架滚动填充
 * ============================================================ */
(function () {
  'use strict';

  /* 任务类型: read读 recite背 write写 listen听 speak说 quiz练 observe观察 */
  var CURRICULUM = {
    chinese: {
      name: '语文', version: '部编版·五上', icon: '语', color: '#FF6B6B',
      units: [
        {
          title: '第一单元 · 万物有灵', focus: '借助具体事物抒发感情',
          lessons: [
            {
              id: 'yw1-1', title: '1 白鹭', author: '郭沫若',
              focus: '体会"白鹭是一首精巧的诗"，学习作者借白鹭抒发感情的方法',
              preview: [
                { type: 'read', text: '朗读课文2遍，圈出生字词' },
                { type: 'write', text: '查字典：白鹭的"鹭"、镜匣的"匣"' },
                { type: 'observe', text: '标出你觉得最美的一处画面，说说为什么' }
              ],
              words: {
                learn: ['鹭', '嫌', '黛', '嵌', '匣', '嗜'],
                write: ['宜', '鹤', '嫌', '朱', '嵌', '框', '匣', '哨', '恩', '韵'],
                list: ['精巧', '色素', '配合', '身段', '适宜', '白鹤', '生硬', '寻常', '忘却', '镜匣', '孤独', '悠然', '黄昏', '恩惠', '美中不足']
              },
              points: [
                { title: '结构', text: '全文按"总—分—总"写：开头说白鹭是"一首精巧的诗"，结尾说是"一首韵在骨子里的散文诗"。' },
                { title: '写法', text: '用对比突出白鹭身段恰到好处：白鹤太大、朱鹭苍鹭太不寻常。' },
                { title: '三幅画面', text: '清水田钓鱼图、小树绝顶望哨图、黄昏低飞图。' }
              ],
              exercises: [
                { q: '"白鹭是一首精巧的诗"运用了什么修辞？', a: '比喻，把白鹭比作精巧的诗。' },
                { q: '听写：适宜、镜匣、恩惠、韵味、美中不足', a: '对照课本自查，错一个写三遍。' },
                { q: '背诵全文', a: '先分段背：1-5段写身段，6-8段写三幅画，9-11段总结。' }
              ]
            },
            {
              id: 'yw1-2', title: '2 落花生', author: '许地山',
              focus: '学习借物喻人：做有用的人，不做只讲体面而对别人没有好处的人',
              preview: [
                { type: 'read', text: '朗读课文2遍，找出议花生部分' },
                { type: 'write', text: '查字典：榨油的"榨"、吩咐的"咐"' },
                { type: 'observe', text: '想想：花生和桃子石榴苹果比，赢在哪' }
              ],
              words: {
                learn: ['亩', '播', '浇', '吩', '咐', '亭', '慕', '矮'],
                write: ['亩', '播', '浇', '吩', '咐', '亭', '榨', '慕', '矮', '谈'],
                list: ['半亩', '播种', '浇水', '吩咐', '茅亭', '榨油', '爱慕', '矮小', '体面', '深夜']
              },
              points: [
                { title: '写法', text: '借物喻人：借花生"不好看但很有用"，说做人的道理。' },
                { title: '关键句', text: '"人要做有用的人，不要做只讲体面，而对别人没有好处的人。"' }
              ],
              exercises: [
                { q: '花生最可贵的品质是什么？', a: '果实埋在地里，不好看，可是很有用——默默奉献。' },
                { q: '小练笔：用借物喻人写一种事物（路灯/粉笔/竹子）', a: '先写特点，再写它像哪种人。' }
              ]
            },
            {
              id: 'yw1-3', title: '3 桂花雨', author: '琦君',
              focus: '体会作者借桂花雨表达的思乡之情',
              preview: [
                { type: 'read', text: '朗读课文2遍，画出摇桂花的句子' },
                { type: 'write', text: '查字典：箩筐的"箩"、浸在的"浸"' }
              ],
              words: {
                learn: ['箩', '杭'],
                write: ['懂', '兰', '箩', '婆', '糕', '饼', '浸', '缠', '茶', '捡'],
                list: ['桂花', '懂得', '糕饼', '茶叶', '沉浸', '缠住', '捡拾', '姿态', '迷人', '香飘十里']
              },
              points: [
                { title: '线索', text: '以"桂花"为线索：爱桂花—摇桂花—思桂花。' },
                { title: '情感', text: '桂花雨=童年的快乐+对故乡和亲人的思念。' }
              ],
              exercises: [
                { q: '"桂花雨"指什么？', a: '摇桂花时桂花纷纷落下像下雨，也指童年的美好回忆。' },
                { q: '听写：糕饼、沉浸、捡拾、香飘十里', a: '对照课本自查。' }
              ]
            },
            { id: 'yw1-4', title: '4* 珍珠鸟', author: '冯骥才', focus: '信赖，往往创造出美好的境界', skeleton: true },
            { id: 'yw1-5', title: '口语交际·制定班级公约', focus: '发言有条理，公约要具体可行', skeleton: true },
            { id: 'yw1-6', title: '习作·我的心爱之物', focus: '写出心爱之物的样子和喜爱的原因', skeleton: true }
          ]
        },
        {
          title: '第二单元 · 阅读要有一定速度', focus: '学习提高阅读速度的方法',
          lessons: [
            { id: 'yw2-1', title: '5 搭石', focus: '集中注意力、不回读', skeleton: true },
            { id: 'yw2-2', title: '6 将相和', focus: '连词成句地读', skeleton: true },
            { id: 'yw2-3', title: '7 什么比猎豹的速度更快', focus: '带着问题读', skeleton: true },
            { id: 'yw2-4', title: '8 冀中的地道战', focus: '综合运用提速方法', skeleton: true },
            { id: 'yw2-5', title: '习作·"漫画"老师', focus: '用一两件具体的事突出老师特点', skeleton: true }
          ]
        },
        {
          title: '第三单元 · 民间故事', focus: '了解课文内容，创造性地复述故事',
          lessons: [
            { id: 'yw3-1', title: '9 猎人海力布', focus: '变换人称复述', skeleton: true },
            { id: 'yw3-2', title: '10 牛郎织女（一）', focus: '抓住情节复述', skeleton: true },
            { id: 'yw3-3', title: '11* 牛郎织女（二）', focus: '绘制连环画并复述', skeleton: true },
            { id: 'yw3-4', title: '口语交际·讲民间故事', focus: '讲得生动，适当添加动作表情', skeleton: true },
            { id: 'yw3-5', title: '习作·缩写故事', focus: '摘录删减、概括改写', skeleton: true },
            { id: 'yw3-6', title: '快乐读书吧·从前有座山', focus: '读中外民间故事', skeleton: true }
          ]
        },
        {
          title: '第四单元 · 家国情怀', focus: '结合资料，体会课文表达的思想感情',
          lessons: [
            { id: 'yw4-1', title: '12 古诗三首（示儿/题临安邸/己亥杂诗）', focus: '结合注释和资料体会诗人情感', skeleton: true },
            { id: 'yw4-2', title: '13 少年中国说（节选）', focus: '体会少年中国与中国少年的关系', skeleton: true },
            { id: 'yw4-3', title: '14 圆明园的毁灭', focus: '体会作者对圆明园毁灭的痛惜', skeleton: true },
            { id: 'yw4-4', title: '15* 小岛', focus: '将军的口吻讲述小岛故事', skeleton: true },
            { id: 'yw4-5', title: '习作·二十年后的家乡', focus: '大胆想象，分段叙述', skeleton: true }
          ]
        },
        {
          title: '第五单元 · 说明文', focus: '阅读简单的说明性文章，了解基本的说明方法',
          lessons: [
            { id: 'yw5-1', title: '16 太阳', focus: '列数字、作比较、举例子、打比方', skeleton: true },
            { id: 'yw5-2', title: '17 松鼠', focus: '文艺性说明文的语言特点', skeleton: true },
            { id: 'yw5-3', title: '习作·介绍一种事物', focus: '用恰当的说明方法分段介绍', skeleton: true }
          ]
        },
        {
          title: '第六单元 · 舐犊情深', focus: '注意体会作者描写的场景、细节中蕴含的感情',
          lessons: [
            { id: 'yw6-1', title: '18 慈母情深', focus: '场景细节中的母爱', skeleton: true },
            { id: 'yw6-2', title: '19 父爱之舟', focus: '梦中回忆的多个场景', skeleton: true },
            { id: 'yw6-3', title: '20* "精彩极了"和"糟糕透了"', focus: '两种评价中的爱', skeleton: true },
            { id: 'yw6-4', title: '口语交际·父母之爱', focus: '选择恰当的材料支持观点', skeleton: true },
            { id: 'yw6-5', title: '习作·我想对您说', focus: '用恰当的语言表达心里话', skeleton: true }
          ]
        },
        {
          title: '第七单元 · 四时之景', focus: '初步体会景物的静态美和动态美',
          lessons: [
            { id: 'yw7-1', title: '21 古诗词三首（山居秋暝/枫桥夜泊/长相思）', focus: '想象诗句描绘的画面', skeleton: true },
            { id: 'yw7-2', title: '22 四季之美', focus: '动态描写的韵味', skeleton: true },
            { id: 'yw7-3', title: '23 鸟的天堂', focus: '静态与动态描写对比', skeleton: true },
            { id: 'yw7-4', title: '24* 月迹', focus: '追寻月亮的足迹', skeleton: true },
            { id: 'yw7-5', title: '习作·____即景', focus: '按一定顺序写出景物变化', skeleton: true }
          ]
        },
        {
          title: '第八单元 · 读书明智', focus: '根据要求梳理信息，把握内容要点',
          lessons: [
            { id: 'yw8-1', title: '25 古人谈读书', focus: '古人读书的方法和态度', skeleton: true },
            { id: 'yw8-2', title: '26 忆读书', focus: '梳理冰心奶奶的读书经历', skeleton: true },
            { id: 'yw8-3', title: '27* 我的"长生果"', focus: '梳理作者的读书类型和收获', skeleton: true },
            { id: 'yw8-4', title: '口语交际·我最喜欢的人物形象', focus: '分条讲述，说清理由', skeleton: true },
            { id: 'yw8-5', title: '习作·推荐一本书', focus: '分段写清推荐理由', skeleton: true }
          ]
        }
      ]
    },

    math: {
      name: '数学', version: '苏教版·五上', icon: '数', color: '#4CC9F0',
      units: [
        {
          title: '第一单元 · 负数的初步认识', focus: '用正负数表示相反意义的量',
          lessons: [
            {
              id: 'sx1-1', title: '认识负数（一）',
              focus: '结合温度认识正负数，会读会写；0既不是正数也不是负数',
              preview: [
                { type: 'read', text: '看课本例1：温度计上的零上和零下' },
                { type: 'observe', text: '今晚看天气预报，记下3个城市的最低气温，找找有没有负数' }
              ],
              words: null,
              points: [
                { title: '读写', text: '+5读作"正五"，-5读作"负五"；写负数时前面的"-"不能丢。' },
                { title: '0的规定', text: '0既不是正数，也不是负数，它是正负数的分界。' }
              ],
              exercises: [
                { q: '零上12℃写作（ ），零下7℃写作（ ）', a: '+12℃（或12℃）；-7℃' },
                { q: '读出：-8  +15  -100', a: '负八、正十五、负一百' },
                { q: '判断：0是正数。（ ）', a: '×。0既不是正数也不是负数。' },
                { q: '比一比：-3 ○ +1；-5 ○ -2', a: '-3 < +1；-5 < -2（负数比较，数字越大值越小）' }
              ]
            },
            {
              id: 'sx1-2', title: '认识负数（二）',
              focus: '用正负数表示海拔、收支、盈亏等生活中的量',
              preview: [
                { type: 'read', text: '看课本例3例4：海拔和收支怎么用正负数' },
                { type: 'observe', text: '找找家里的存单/缴费单，有没有正负数' }
              ],
              words: null,
              points: [
                { title: '约定', text: '海平面以上为正、以下为负；收入为正、支出为负；盈利为正、亏损为负。' },
                { title: '关键', text: '先规定哪个方向为正，相反方向就是负。' }
              ],
              exercises: [
                { q: '珠穆朗玛峰高于海平面8848.86米记作（ ），吐鲁番盆地低于海平面155米记作（ ）', a: '+8848.86米；-155米' },
                { q: '妈妈收入5000元记作+5000元，交电费230元记作（ ）', a: '-230元' },
                { q: '公交车上车8人记作+8人，下车5人记作（ ）', a: '-5人' }
              ]
            }
          ]
        },
        {
          title: '第二单元 · 多边形的面积', focus: '平行四边形、三角形、梯形面积公式；公顷和平方千米',
          lessons: [
            { id: 'sx2-1', title: '平行四边形的面积', focus: '面积=底×高，割补法推导', skeleton: true },
            { id: 'sx2-2', title: '三角形的面积', focus: '面积=底×高÷2，两个完全一样的三角形拼平行四边形', skeleton: true },
            { id: 'sx2-3', title: '梯形的面积', focus: '面积=(上底+下底)×高÷2', skeleton: true },
            { id: 'sx2-4', title: '公顷和平方千米', focus: '1公顷=10000平方米，1平方千米=100公顷', skeleton: true },
            { id: 'sx2-5', title: '组合图形的面积', focus: '分割法、添补法', skeleton: true }
          ]
        },
        {
          title: '第三单元 · 小数的意义和性质', focus: '小数的意义、读写、性质、大小比较、改写求近似数',
          lessons: [
            { id: 'sx3-1', title: '小数的意义和读写', focus: '十分之几=0.几，百分之几=0.几几', skeleton: true },
            { id: 'sx3-2', title: '小数的性质和大小比较', focus: '末尾添0去0大小不变', skeleton: true },
            { id: 'sx3-3', title: '小数的改写和近似数', focus: '改写成"万""亿"作单位；四舍五入', skeleton: true }
          ]
        },
        { title: '第四单元 · 小数加法和减法', focus: '小数点对齐', lessons: [
          { id: 'sx4-1', title: '小数加减法（一）', focus: '小数点对齐，从低位算起', skeleton: true },
          { id: 'sx4-2', title: '小数加减法（二）', focus: '被减数位数不够要补0', skeleton: true },
          { id: 'sx4-3', title: '用计算器计算', focus: '验算与探索规律', skeleton: true }
        ]},
        { title: '第五单元 · 小数乘法和除法', focus: '小数点位置移动规律', lessons: [
          { id: 'sx5-1', title: '小数乘整数', focus: '先按整数乘，再点小数点', skeleton: true },
          { id: 'sx5-2', title: '小数点右移规律', focus: '×10、×100、×1000', skeleton: true },
          { id: 'sx5-3', title: '除数是整数的小数除法', focus: '商的小数点与被除数对齐', skeleton: true },
          { id: 'sx5-4', title: '小数点左移规律', focus: '÷10、÷100、÷1000', skeleton: true },
          { id: 'sx5-5', title: '小数乘小数', focus: '积的小数位数=因数小数位数之和', skeleton: true },
          { id: 'sx5-6', title: '除数是小数的除法', focus: '转化成除数是整数', skeleton: true }
        ]},
        { title: '第六单元 · 统计表和条形统计图（二）', focus: '复式统计表和复式条形统计图', lessons: [
          { id: 'sx6-1', title: '复式统计表', focus: '看懂并填写复式统计表', skeleton: true },
          { id: 'sx6-2', title: '复式条形统计图', focus: '两种直条并排比较', skeleton: true }
        ]},
        { title: '第七单元 · 解决问题的策略', focus: '一一列举', lessons: [
          { id: 'sx7-1', title: '列举的策略', focus: '按顺序列举，不重复不遗漏', skeleton: true }
        ]},
        { title: '第八单元 · 用字母表示数', focus: '字母表示数和数量关系', lessons: [
          { id: 'sx8-1', title: '用字母表示数（一）', focus: 'a×3写作3a', skeleton: true },
          { id: 'sx8-2', title: '用字母表示数（二）', focus: '用字母表示公式：C=4a，S=a²', skeleton: true }
        ]},
        { title: '第九单元 · 整理与复习', focus: '全册复习', lessons: [
          { id: 'sx9-1', title: '数的世界', focus: '负数、小数复习', skeleton: true },
          { id: 'sx9-2', title: '图形王国', focus: '多边形面积复习', skeleton: true },
          { id: 'sx9-3', title: '统计天地', focus: '统计复习', skeleton: true }
        ]}
      ]
    },

    english: {
      name: '英语', version: '译林版·5A', icon: '英', color: '#7FB069',
      units: [
        {
          title: 'Unit 1 Goldilocks and the three bears', focus: 'There be句型；too+形容词',
          lessons: [
            {
              id: 'yy1-1', title: 'Story time: Goldilocks in the forest',
              focus: '听懂读熟故事；会用 There is/are ... 描述存在',
              preview: [
                { type: 'listen', text: '听课文录音2遍，指着图跟读' },
                { type: 'speak', text: '跟读：This soup is too hot! 读出感情' }
              ],
              words: {
                list: ['forest', 'soup', 'hungry', 'hard', 'soft', 'afraid', 'really', 'then', 'find', 'their'],
                phrases: ['just right', 'in front of', 'too hot', 'too cold', 'too hard', 'too soft']
              },
              points: [
                { title: 'There be', text: 'There is + 单数/不可数；There are + 复数。There is some soup. / There are three bears.' },
                { title: 'too的用法', text: 'too + 形容词 = 太……。The bed is too hard.' }
              ],
              exercises: [
                { q: '用There is/There are填空：___ some soup on the table. / ___ three bears in the room.', a: 'There is（soup不可数）；There are（bears复数）' },
                { q: '造句：这杯牛奶太烫了。', a: 'This milk is too hot.' },
                { q: '背诵Story time', a: '分段背：森林→房子→三碗汤→三把椅子→三张床→逃跑。' }
              ]
            },
            {
              id: 'yy1-2', title: 'Grammar & Fun time',
              focus: 'There be句型操练；方位介词 in front of / behind / between',
              preview: [
                { type: 'listen', text: '听Grammar time例句，跟读模仿' },
                { type: 'speak', text: '用in front of说一说教室里物品的位置' }
              ],
              words: {
                list: ['beside', 'behind', 'between', 'in front of'],
                phrases: ['beside the house', 'behind the door', 'between the two bears']
              },
              points: [
                { title: '方位介词', text: 'in在…里 on在…上 under在…下 beside在…旁 behind在…后 between在…之间 in front of在…前面' }
              ],
              exercises: [
                { q: 'Goldilocks坐在三只熊前面。', a: 'Goldilocks sits in front of the three bears.' }
              ]
            },
            { id: 'yy1-3', title: 'Sound & Cartoon time', focus: '字母c的发音 /k/ 和 /s/', skeleton: true },
            { id: 'yy1-4', title: 'Checkout & Ticking time', focus: '单元自测与复习', skeleton: true }
          ]
        },
        { title: 'Unit 2 A new student', focus: 'Is there...? / How many...are there?；序数词', lessons: [
          { id: 'yy2-1', title: 'Story time', focus: '介绍学校设施', skeleton: true },
          { id: 'yy2-2', title: 'Grammar & Fun time', focus: 'first/second/third 序数词', skeleton: true }
        ]},
        { title: 'Unit 3 Our animal friends', focus: 'have/has；can', lessons: [
          { id: 'yy3-1', title: 'Story time', focus: '描述动物特征：It has...', skeleton: true },
          { id: 'yy3-2', title: 'Grammar & Fun time', focus: 'have/has用法', skeleton: true }
        ]},
        { title: 'Unit 4 Hobbies', focus: 'like doing', lessons: [
          { id: 'yy4-1', title: 'Story time', focus: '谈论爱好：I like reading.', skeleton: true },
          { id: 'yy4-2', title: 'Grammar & Fun time', focus: 'like+动词ing', skeleton: true }
        ]},
        { title: 'Unit 5 What do they do?', focus: '职业；第三人称单数', lessons: [
          { id: 'yy5-1', title: 'Story time', focus: 'He/She is a ...', skeleton: true },
          { id: 'yy5-2', title: 'Grammar & Fun time', focus: '动词三单变化', skeleton: true }
        ]},
        { title: 'Unit 6 My e-friend', focus: 'Does...? 一般疑问句', lessons: [
          { id: 'yy6-1', title: 'Story time', focus: '网友信息问答', skeleton: true },
          { id: 'yy6-2', title: 'Grammar & Fun time', focus: 'Does he/she...?', skeleton: true }
        ]},
        { title: 'Unit 7 At weekends', focus: '频率副词', lessons: [
          { id: 'yy7-1', title: 'Story time', focus: 'always/usually/often/sometimes', skeleton: true },
          { id: 'yy7-2', title: 'Grammar & Fun time', focus: '频率副词位置', skeleton: true }
        ]},
        { title: 'Unit 8 At Christmas', focus: '顺序词 first/next/then/finally', lessons: [
          { id: 'yy8-1', title: 'Story time', focus: '圣诞活动顺序表达', skeleton: true },
          { id: 'yy8-2', title: 'Grammar & Fun time', focus: 'first/next/then/finally', skeleton: true }
        ]}
      ]
    }
  };

  /* 四年级(8)班课表转录（南通市崇川小学 2025-2026第一学期），作五年级开学前的占位模板 */
  var DEFAULT_SCHEDULE = {
    1: ['语文', '数学', '体育与健康', '音乐', '美术', '道德与法治'],
    2: ['语文', '体育与健康', '道德与法治', '科学', '英语', '劳动'],
    3: ['数学', '语文', '美术', '作文', '作文', '体育与健康'],
    4: ['语文', '数学', '综合实践', '信息科技', '体育与健康', '科学'],
    5: ['英语', '数学', '语文(书法)', '音乐', '体育与健康', '少先队活动/心理健康']
  };

  var DEFAULT_CHECKINS = [
    { id: 'piano',   name: '练钢琴',   icon: '🎹', points: 10 },
    { id: 'guitar',  name: '弹吉他',   icon: '🎸', points: 10 },
    { id: 'reading', name: '课外阅读', icon: '📖', points: 10 },
    { id: 'chores',  name: '做家务',   icon: '🧹', points: 10 },
    { id: 'sports',  name: '运动',     icon: '🏃', points: 10 }
  ];

  window.KBG_DATA = {
    CURRICULUM: CURRICULUM,
    DEFAULT_SCHEDULE: DEFAULT_SCHEDULE,
    DEFAULT_CHECKINS: DEFAULT_CHECKINS
  };
})();
