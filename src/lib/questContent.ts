/**
 * 会話の中身（質問・助け）。
 * 本番ではサーバー側の会話AIが生成する部分を、MVPでは台本として持つ。
 */

export interface Question {
  en: string // AIが話す質問
  ja: string // 助けLv1：日本語訳
  keywords: string[] // 助けLv1：使える単語
  pattern: string // 助けLv2：文の型
  example: string // 助けLv3：そのまま言える例文
}

export interface QuestTemplate {
  title: string
  goal: string
  emoji: string
  opening: string // 最初のひとこと
  questions: Question[]
}

export const QUEST_TEMPLATES: QuestTemplate[] = [
  {
    title: '自己紹介',
    goal: '留学生に名前・専攻・趣味を30秒で伝える',
    emoji: '👋',
    opening: "Hi! I'm Max, an exchange student. Nice to meet you!",
    questions: [
      {
        en: "What's your name, and what should I call you?",
        ja: '名前は？なんて呼んだらいい？',
        keywords: ['My name is', 'call me', 'nickname'],
        pattern: "My name is ___. Please call me ___.",
        example: 'My name is Yuki Tanaka. Please call me Yuki.',
      },
      {
        en: 'What do you study at university?',
        ja: '大学では何を勉強してるの？',
        keywords: ['major', 'economics', 'engineering', 'literature'],
        pattern: "I'm majoring in ___. I'm a third-year student.",
        example: "I'm majoring in economics. I'm a third-year student.",
      },
      {
        en: 'What do you like to do in your free time?',
        ja: '暇なときは何をするのが好き？',
        keywords: ['I like', 'watching', 'playing', 'hanging out'],
        pattern: 'In my free time, I like ___ because ___.',
        example: 'In my free time, I like watching movies because it helps me relax.',
      },
      {
        en: 'Where are you from? Can you tell me about your hometown?',
        ja: '出身はどこ？地元について教えて。',
        keywords: ["I'm from", 'famous for', 'countryside', 'city'],
        pattern: "I'm from ___. It's famous for ___.",
        example: "I'm from Shizuoka. It's famous for green tea and Mt. Fuji.",
      },
      {
        en: 'What do you want to do after you graduate?',
        ja: '卒業したら何がしたい？',
        keywords: ['I want to', 'work for', 'company', 'not sure yet'],
        pattern: 'After I graduate, I want to ___.',
        example: "After I graduate, I want to work for a company that does business abroad.",
      },
    ],
  },
  {
    title: 'カフェで注文',
    goal: '海外のカフェで迷わず注文してカスタムまで伝える',
    emoji: '☕',
    opening: 'Hi there! Welcome in. What can I get started for you today?',
    questions: [
      {
        en: 'What would you like to drink?',
        ja: '何を飲みますか？',
        keywords: ["I'd like", 'latte', 'iced', 'coffee'],
        pattern: "I'd like a ___, please.",
        example: "I'd like an iced latte, please.",
      },
      {
        en: 'Sure. What size would you like? Small, medium, or large?',
        ja: 'サイズはどうしますか？S・M・L？',
        keywords: ['small', 'medium', 'large', 'please'],
        pattern: '___, please.',
        example: 'Medium, please.',
      },
      {
        en: 'Would you like any milk or sweetener with that?',
        ja: 'ミルクや甘味料はつけますか？',
        keywords: ['oat milk', 'no sugar', 'a little', 'without'],
        pattern: 'Can I get it with ___?',
        example: 'Can I get it with oat milk and no sugar?',
      },
      {
        en: 'Is that for here or to go?',
        ja: '店内で飲みますか？持ち帰りですか？',
        keywords: ['for here', 'to go'],
        pattern: "It's ___, please.",
        example: "To go, please. Actually, can I also get a croissant?",
      },
      {
        en: 'Great. Can I get a name for the order?',
        ja: '注文のお名前を伺えますか？',
        keywords: ["It's", 'spell', 'name'],
        pattern: "It's ___. That's spelled ___.",
        example: "It's Yuki. That's Y-U-K-I.",
      },
    ],
  },
  {
    title: '道を聞かれたら',
    goal: '駅で困っている観光客に行き方を案内する',
    emoji: '🗺️',
    opening: 'Excuse me, sorry to bother you. Do you speak English?',
    questions: [
      {
        en: "I'm trying to get to Shibuya Station. Do you know how to get there?",
        ja: '渋谷駅に行きたいんだけど、行き方わかる？',
        keywords: ['Yes', 'take the', 'line', 'train'],
        pattern: 'Sure. You can take the ___ line.',
        example: 'Sure. You can take the Yamanote line from here.',
      },
      {
        en: 'Which platform should I go to?',
        ja: 'どのホームに行けばいい？',
        keywords: ['platform', 'number', 'over there', 'stairs'],
        pattern: "Go to platform ___. It's ___.",
        example: "Go to platform two. It's up those stairs over there.",
      },
      {
        en: 'How long does it take to get there?',
        ja: 'どれくらいかかる？',
        keywords: ['about', 'minutes', 'stops'],
        pattern: 'It takes about ___ minutes.',
        example: "It takes about fifteen minutes. It's six stops from here.",
      },
      {
        en: 'Do I need to buy a ticket, or can I use a card?',
        ja: '切符を買う必要がある？カードは使える？',
        keywords: ['IC card', 'ticket machine', 'credit card', 'touch'],
        pattern: 'You can ___.',
        example: 'You can use an IC card like Suica. Just touch it at the gate.',
      },
      {
        en: 'Thank you so much! Is there anything good to see near Shibuya?',
        ja: 'ありがとう！渋谷の近くでおすすめの場所はある？',
        keywords: ['recommend', 'crossing', 'shopping', 'You should'],
        pattern: 'You should visit ___. It is ___.',
        example: "You should see the Shibuya crossing. It's really famous and fun to watch.",
      },
    ],
  },
  {
    title: '大学生活の話',
    goal: '授業・サークル・バイトについて理由つきで話す',
    emoji: '🎓',
    opening: "So, how's university life going for you?",
    questions: [
      {
        en: "What's your favorite class this semester?",
        ja: '今学期いちばん好きな授業は？',
        keywords: ['favorite', 'class', 'because', 'interesting'],
        pattern: 'My favorite class is ___ because ___.',
        example: 'My favorite class is marketing because the professor uses real examples.',
      },
      {
        en: 'Are you in any clubs or circles?',
        ja: 'サークルや部活には入ってる？',
        keywords: ["I'm in", 'club', 'circle', 'tennis'],
        pattern: "I'm in a ___ circle. We ___.",
        example: "I'm in a tennis circle. We practice twice a week.",
      },
      {
        en: 'Do you have a part-time job? What do you do?',
        ja: 'バイトしてる？何をしてるの？',
        keywords: ['part-time job', 'work at', 'restaurant', 'tutor'],
        pattern: 'I work at ___ as a ___.',
        example: 'I work at a ramen shop as a server three days a week.',
      },
      {
        en: "What's the hardest part of being a university student?",
        ja: '大学生でいちばん大変なことは？',
        keywords: ['hardest', 'balance', 'busy', 'job hunting'],
        pattern: 'The hardest part is ___.',
        example: 'The hardest part is balancing classes, my job, and job hunting.',
      },
      {
        en: 'If you could change one thing about your university, what would it be?',
        ja: '大学の何かひとつを変えられるなら何を変える？',
        keywords: ['I would', 'change', 'more', 'cafeteria'],
        pattern: 'I would change ___ because ___.',
        example: 'I would make the library open later because I like studying at night.',
      },
    ],
  },
  {
    title: '好きなことを語る',
    goal: '自分の「好き」を理由とエピソードつきで1分話す',
    emoji: '🎮',
    opening: "I'd love to know more about you. Let's talk about things you like!",
    questions: [
      {
        en: 'What is something you are really into right now?',
        ja: '今ハマってることは何？',
        keywords: ["I'm really into", 'recently', 'anime', 'games'],
        pattern: "I'm really into ___ these days.",
        example: "I'm really into Korean dramas these days.",
      },
      {
        en: 'How did you get into it?',
        ja: 'どうやってハマったの？',
        keywords: ['friend', 'recommended', 'started', 'first time'],
        pattern: 'My friend recommended it, and ___.',
        example: 'My friend recommended one show, and I watched the whole season in two days.',
      },
      {
        en: 'What do you like most about it?',
        ja: 'どこがいちばん好き？',
        keywords: ['I love', 'the story', 'characters', 'because'],
        pattern: 'I love ___ the most because ___.',
        example: 'I love the characters the most because they feel very real.',
      },
      {
        en: 'Would you recommend it to me? Why?',
        ja: '私にもおすすめする？なんで？',
        keywords: ['definitely', 'you should', 'if you like'],
        pattern: 'Yes! If you like ___, you should try ___.',
        example: 'Yes! If you like romance, you should try it. The first episode is great.',
      },
      {
        en: 'Is there anything new you want to try this year?',
        ja: '今年新しく挑戦したいことはある？',
        keywords: ['I want to try', 'this year', 'someday'],
        pattern: 'This year, I want to try ___.',
        example: 'This year, I want to try traveling abroad by myself.',
      },
    ],
  },
]

/** 自分で作ったクエスト用の汎用質問（タイトル・目標に合わせて埋める） */
export function genericQuestions(title: string, goal: string): Question[] {
  return [
    {
      en: `Today's topic is "${title}". Why did you choose this topic?`,
      ja: `今日のテーマは「${title}」。なぜこのテーマを選んだの？`,
      keywords: ['I chose', 'because', 'I want to'],
      pattern: 'I chose this topic because ___.',
      example: 'I chose this topic because I want to use English in real life.',
    },
    {
      en: 'When would you need English for this?',
      ja: 'どんな場面でこの英語が必要になりそう？',
      keywords: ['when', 'at work', 'traveling', 'meet'],
      pattern: 'I would need it when ___.',
      example: 'I would need it when I meet international students on campus.',
    },
    {
      en: `Your goal is "${goal}". What makes it difficult for you?`,
      ja: `目標は「${goal}」。何が難しいと感じる？`,
      keywords: ['difficult', 'vocabulary', 'nervous', 'quickly'],
      pattern: 'It is difficult because ___.',
      example: "It's difficult because I get nervous and forget simple words.",
    },
    {
      en: "Let's practice. Say one sentence you would actually use in that situation.",
      ja: '練習しよう。その場面で実際に使いそうな一文を言ってみて。',
      keywords: ['Excuse me', 'Could you', 'I would like'],
      pattern: 'Excuse me, could you ___?',
      example: 'Excuse me, could you say that one more time?',
    },
    {
      en: 'Great. How will you feel when you can do this in English?',
      ja: 'いいね。英語でこれができたらどんな気持ちになる？',
      keywords: ['I will feel', 'confident', 'proud', 'happy'],
      pattern: 'I will feel ___ because ___.',
      example: 'I will feel confident because I can finally talk without a translation app.',
    },
  ]
}

export function contentFor(title: string, goal: string): { opening: string; questions: Question[] } {
  const tpl = QUEST_TEMPLATES.find((t) => t.title === title)
  if (tpl) return { opening: tpl.opening, questions: tpl.questions }
  return {
    opening: `Hi! Let's practice "${title}" together. Take your time, I'm here to help.`,
    questions: genericQuestions(title, goal),
  }
}
