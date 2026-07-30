/**
 * 🧠 AI Sales Agent — بوت المبيعات الذكي
 * 
 * هذا الملف يحتوي على دماغ بوت المبيعات. يعالج الرسائل الواردة
 * من أصحاب المطاعم ويرد بأسلوب تسويقي ذكي مستوحى من منهجية Alex Hormozi.
 * 
 * المنهجية:
 * 1. Hook — جذب الانتباه بوعد جريء
 * 2. Value Stack — عرض القيمة المكدسة
 * 3. Risk Reversal — إزالة الخوف (تجربة مجانية)
 * 4. Bonus Stack — مكافآت إضافية
 * 5. Urgency — حصرية/استعجال
 * 6. Clear CTA — خطوة واضحة للإتمام
 */

import type { IncomingMessage } from "./baileys";
import {
  getOrCreate,
  advanceStage,
  updateConversation,
  getConversation,
  updateActiveConversations,
  getActiveCount,
} from "./conversations";

// ── الاختصارات والردود السريعة ──────────────────────────

const SHORT_REPLIES: Record<string, string> = {
  "السلام عليكم": "وعليكم السلام ورحمة الله وبركاته! 🌟",
  "سلام": "وعليكم السلام! كيف أقدر أخدمك؟",
  "مرحبا": "أهلاً وسهلاً! 👋",
  "هلا": "هلا والله! نورت ☺️",
  "اهلا": "أهلاً بك! تفضل، كيف أقدر أساعدك؟",
  "كيف الحال": "الحمد لله بخير، شكراً لسؤالك! وأنت، كيف أحوالك؟",
  "شكرا": "العفو! على الرحب والسعة 🤝",
  "يعطيك العافية": "الله يعافيك! 🌹",
  "تمام": "ممتاز! إذا عندك أي سؤال أنا موجود.",
  "طيب": "تمام 👍 خذ راحتك، أنا موجود إذا احتجت شي.",
  "ok": "👍 موجود إذا احتجت أي شي!",
  "okay": "تمام! أنا بالخدمة 🤝",
  "شلونك": "الحمد لله بخير! شلونك أنت؟",
};

// ── اكتشاف النية ────────────────────────────────────────

function detectIntent(text: string): string {
  const t = text.toLowerCase().trim();

  if (/كم.*سعر|كم.*تكلف|كم.*قيمة|بكم|السعر|التكلفة|غالي|التسعير|رسوم|اشتراك|شهري/i.test(t))
    return "price";
  if (/مجان|ببلاش|بدون.*فلوس|تكلفة.*صفر/i.test(t))
    return "free";
  if (/تجرب|تجربة|بدون.*دفع|بدون.*التزام/i.test(t))
    return "trial";
  if (/كيف.*يعمل|كيف.*تشتغل|كيف.*شغال|طريقة.*العمل|شرح|كيفية/i.test(t))
    return "how_it_works";
  if (/مطعم|كافيه|كافي|بوفيه|مشروع|عندي.*محل/i.test(t))
    return "i_have_restaurant";
  if (/منيو|قائمة|menu|طلب|طلبات/i.test(t))
    return "menu";
  if (/وقت|كم.*يحتاج|سرعة|بسرعة|متى.*جاهز/i.test(t))
    return "time";
  if (/اربح|ربح|دخل|مبيعات|زيادة|ارباح/i.test(t))
    return "profit";
  if (/نعم|ايوه|أيوا|ايوة|yes|OK|موافق|تمام.*موافق/i.test(t))
    return "yes";
  if (/لا|مش.*مهتم|مش.*مقتنع|لأ|no/i.test(t))
    return "no";
  if (/منافس|غيرك|شركات|بديل|غير.*عندكم/i.test(t))
    return "competitors";
  if (/ضمان|دعم.*فني|مساعدة|مشاكل|تعطل/i.test(t))
    return "support";
  if (/ارقام|تواصل|اتصال|كلمني|مكالمة/i.test(t))
    return "call_me";
  if (/فيس|فيسبوك|facebook|إعلان|اعلان/i.test(t))
    return "ad";
  if (/جاهز|ابدا|نبدأ|أسجل|سجل|اشتراك/i.test(t))
    return "ready";

  return "other";
}

// ── الكلمات المفتاحية للجودة ─────────────────────────────

function hasHighIntent(text: string): boolean {
  const highIntent = [
    "مهتم", "عايز", "ابغى", "أبغى", "اريد", "أريد", "متحمس",
    "كلمني", "اتصل", "ارقامكم", "رقمك", "واتسابك",
    "اسجل", "أشارك", "ابدأ", "جرب", "عاوز", "حابب",
    "مستعد", "جاهز", "تمام خلينا", "يلا", "هيا",
    "كم السعر", "بكم", "كم تكلفة", "ابي", "أبي",
  ];
  return highIntent.some(w => text.includes(w));
}

function hasLowIntent(text: string): boolean {
  const lowIntent = [
    "مش مهتم", "مش حابب", "لا شكرا", "مع السلامة",
    "بعدين", "لاحقا", "خليني افكر", "موقتنعش",
    "غالي", "كثير", "ما يحتاج", "عندي حل",
  ];
  return lowIntent.some(w => text.includes(w));
}

// ── اسم المرسل ───────────────────────────────────────────

function extractName(text: string): string | null {
  const patterns = [
    /اسمي\s+(\S+)/i,
    /أنا\s+(\S+)/i,
    /انا\s+(\S+)/i,
    /معاك\s+(\S+)/i,
    /معك\s+(\S+)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1];
  }
  return null;
}

// ── الرد الرئيسي: آلة الحالة ─────────────────────────────

export async function handleIncomingMessage(msg: IncomingMessage): Promise<string | null> {
  recordMessageCounts();
  const conv = getOrCreate(msg.from, msg.fromName);
  conv.messageCount++;
  conv.lastMessageAt = Date.now();

  // استخراج الاسم إن وجد
  const detectedName = extractName(msg.body);
  if (detectedName && !conv.name) {
    updateConversation(msg.from, { name: detectedName });
  }

  const text = msg.body.trim();
  const intent = detectIntent(text);

  // تحقق من الردود القصيرة المباشرة
  if (SHORT_REPLIES[text]) {
    // إذا كانت مرحلة جديدة، تابع للمرحلة التالية
    if (conv.stage === "new") {
      advanceStage(msg.from, "greeting");
      return `${SHORT_REPLIES[text]}\n\n${getStageMessage(conv)}`;
    }
    return SHORT_REPLIES[text];
  }

  // تقييم مستوى الاهتمام
  if (hasHighIntent(text)) {
    updateConversation(msg.from, { interestLevel: "high" });
  } else if (hasLowIntent(text)) {
    updateConversation(msg.from, { interestLevel: "low" });
  }

  // آلة الحالة الرئيسية
  switch (conv.stage) {
    case "new":
      return handleNewStage(conv, text, intent);
    case "greeting":
      return handleGreetingStage(conv, text, intent);
    case "qualifying":
      return handleQualifyingStage(conv, text, intent);
    case "pitching":
      return handlePitchingStage(conv, text, intent);
    case "objections":
      return handleObjectionsStage(conv, text, intent);
    case "closing":
      return handleClosingStage(conv, text, intent);
    case "follow_up":
      return handleFollowUpStage(conv, text, intent);
    default:
      return handleNewStage(conv, text, intent);
  }
}

function recordMessageCounts() {
  updateActiveConversations(getActiveCount());
}

// ── المرحلة 1: أول رسالة ─────────────────────────────────

function handleNewStage(conv: any, text: string, intent: string): string {
  advanceStage(conv.phone, "greeting");

  // إذا أظهر اهتماماً عالياً من أول رسالة
  if (hasHighIntent(text) || intent === "price" || intent === "ready") {
    advanceStage(conv.phone, "pitching");
    return getPitchMessage(conv.name);
  }

  // إذا ذكر أنه صاحب مطعم مباشرة
  if (intent === "i_have_restaurant") {
    advanceStage(conv.phone, "qualifying");
    updateConversation(conv.phone, { answeredQualifying: false });
    return getQualifyingMessage();
  }

  // الرسالة الترحيبية الأولى
  return getGreetingMessage(conv.name);
}

function getGreetingMessage(name: string): string {
  const displayName = name && name !== "زائر" ? ` ${name}` : "";
  return `أهلاً وسهلاً${displayName}! 👋

شكراً لتواصلك معي. اسمي [اسمك]، مؤسس منصة "سفرة ديجيتال" — الحل الذكي لرقمنة مطعمك بالكامل.

📱 منيو رقمي احترافي
📊 تقارير مبيعات
🚀 زيادة أرباح مضمونة

قبل ما أحكي لك التفاصيل، حاب أسألك: هل عندك مطعم أو كافيه حالياً؟ 🍽️`;
}

// ── المرحلة 2: الترحيب ───────────────────────────────────

function handleGreetingStage(conv: any, text: string, intent: string): string {
  if (intent === "i_have_restaurant" || intent === "yes") {
    advanceStage(conv.phone, "qualifying");
    return getQualifyingMessage();
  }

  if (intent === "no") {
    return "تمام! إذا كان عندك مشروع مستقبلي أو تعرف أحد عنده مطعم، أنا موجود للمساعدة. تقدر ترجع لي بأي وقت! 🤝";
  }

  if (intent === "price" || hasHighIntent(text)) {
    advanceStage(conv.phone, "pitching");
    return getPitchMessage(conv.name);
  }

  // لم يجب بعد على السؤال
  return "خليني أسألك سؤال سريع: هل تملك مطعماً أو كافيه حالياً؟ 🍽️\n\nسؤالي هذا مهم عشان أقدر أقدم لك العرض المناسب 👌";
}

// ── المرحلة 3: التأهيل ───────────────────────────────────

function getQualifyingMessage(): string {
  return `رائع! 🎉

قبل ما أشاركك العرض الحصري، خليني أسألك 3 أسئلة سريعة:

1️⃣ هل منيو مطعمك ورقي حالياً ولا عندك منيو رقمي؟
2️⃣ كم متوسط عدد زبائنك اليومي تقريباً؟
3️⃣ ما هي أكبر مشكلة تواجهك في إدارة الطلبات حالياً؟

خذ راحتك في الإجابة 🙏`;
}

function handleQualifyingStage(conv: any, text: string, intent: string): string {
  if (conv.answeredQualifying) {
    advanceStage(conv.phone, "pitching");
    return getPitchMessage(conv.name);
  }

  // تحقق إن كان قد جاوب على الأسئلة (رسالة طويلة أو تحتوي على أرقام)
  const hasNumbers = /\d/.test(text);
  const isLong = text.length > 30;

  if (hasNumbers || isLong) {
    updateConversation(conv.phone, { answeredQualifying: true });
    advanceStage(conv.phone, "pitching");
    return getPitchMessage(conv.name);
  }

  // إذا طلب السعر مباشرة
  if (intent === "price") {
    updateConversation(conv.phone, { answeredQualifying: true });
    advanceStage(conv.phone, "pitching");
    return getPitchMessage(conv.name);
  }

  return "خذ راحتك... بس عشان أكون صريح معاك، كل ما شاركتني معلومات أكثر، كل ما قدرت أخصص العرض يناسب احتياجات مطعمك بالضبط 🤝";
}

// ── المرحلة 4: العرض ─────────────────────────────────────

function getPitchMessage(name: string): string {
  const displayName = name && name !== "زائر" ? `أستاذ ${name}` : "صديقي";

  return `👌 ${displayName}، اسمع مني بسرعة:

🎯 **عرضي لك بكل صراحة:**

أقدّم لك **منيو رقمي كامل** لمطعمك يتضمن:
✅ منيو احترافي بالصور والأسعار
✅ نظام طلبات مباشر بدون وسيط
✅ تقارير مبيعات وإحصائيات ذكية
✅ لوحة تحكم كاملة لإدارة كل شي
✅ دعم فني سريع

💰 **طيب، كم يكلف؟**

ولا ريال واحد في البداية!

🔹 **أقدم لك تجربة مجانية كاملة** بدون أي التزام مالي.
🔹 تشوف النظام وتجربه بنفسك قبل ما تدفع فلساً واحداً.

🎁 **وفوقها بونص حصري:**
• استشارة مجانية لتحسين مبيعات مطعمك
• قالب منيو احترافي جاهز

🤔 **السؤال المنطقي: ليش أسوي كذا؟**

لأني واثق 100% إنك لما تشوف النتايج — زيادة الطلبات، تقليل الأخطاء، وتوفير وقت الموظفين — راح تستمر معانا عن قناعة.

📊 **عمالي اللي جرّبوا النظام شافوا زيادة ٣٠-٤٠٪ في متوسط الطلب!**

وش رايك؟ نبدأ بالتجربة المجانية؟ 🚀`;
}

function handlePitchingStage(conv: any, text: string, intent: string): string {
  if (intent === "ready" || intent === "yes") {
    advanceStage(conv.phone, "closing");
    return getClosingMessage(conv.name);
  }

  if (intent === "price") {
    return `السعر بعد التجربة المجانية رمزي جداً مقارنة بالعائد اللي راح تشوفه 📈

لكن خلينا نتفق: **جرّب الأول مجاناً**، وشوف النتايج بنفسك. إذا ما عجبك، ما عليك ولا التزام.

متى تبدأ تجربتك المجانية؟ 🎁`;
  }

  if (intent === "trial" || intent === "free") {
    return `بالضبط! التجربة **مجانية ١٠٠٪** وبدون أي التزام.

أنا عندي ثقة كاملة في النظام — وجاهز أخليك تجربه بدون ما تدفع ريال.

فقط أعطيني اسم مطعمك وخلّينا نبدأ 🚀`;
  }

  if (intent === "how_it_works") {
    return `النظام بسيط جداً:

1️⃣ ننشئ لك منيو رقمي احترافي (خلال ٢٤ ساعة)
2️⃣ نعطيك رابط خاص ولينك واتساب مباشر
3️⃣ زباينك يمسحون كود QR ويشوفون المنيو
4️⃣ يطلبون مباشرة، وتوصلك الطلبات فوراً

**كل هذا بدون تطبيق يُحمّل!** زبونك يفتح الرابط ويطلب خلال ١٠ ثواني ⚡

نبدأ؟ جاهز أجهز لك حسابك التجريبي 🎁`;
  }

  if (intent === "time") {
    return "جاهزية منيو مطعمك: **خلال ٢٤ ساعة فقط** ⚡\n\nتبي نبدأ النهاردة؟ 🚀";
  }

  if (intent === "support") {
    return `الدعم الفني **متوفر معاك ٢٤/٧** 🤝

إذا واجهتك أي مشكلة — أنا شخصياً موجود. مش مجرد نظام، هذي شراكة حقيقية.

تبي أبدأ أجهز لك الحساب التجريبي؟ 🎁`;
  }

  if (intent === "no" || conv.interestLevel === "low") {
    advanceStage(conv.phone, "objections");
    return getObjectionReply("not_interested", conv.name);
  }

  // اعتراضات شائعة
  if (intent === "price" || text.includes("غالي") || text.includes("سعر")) {
    advanceStage(conv.phone, "objections");
    return getObjectionReply("price", conv.name);
  }

  // تردد — تعزيز
  return `خليني أكون صريح معاك: أسوأ شي ممكن يصير إنك تجرب النظام مجاناً وما يعجبك، وترجع لوضعك الحالي بدون ما تخسر شي.

أحسن شي ممكن يصير؟ تشوف زيادة ٣٠٪ في مبيعاتك الشهرية 📈

**المخاطرة = صفر**. شنو رأيك نجرب؟ 🚀`;
}

// ── المرحلة 5: الاعتراضات ────────────────────────────────

function getObjectionReply(type: string, name: string): string {
  const displayName = name && name !== "زائر" ? `أستاذ ${name}` : "صديقي";

  const replies: Record<string, string> = {
    not_interested: `${displayName}، أحترم رأيك تماماً 🤝

لكن اسمح لي أسألك: هل السبب إنك مرتاح مع نظامك الحالي؟ ولا إنك مش متأكد من الفكرة؟

لأني أقدّم لك تجربة **مجانية تماماً** — بدون مخاطرة.

إذا النظام ما زاد أرباحك، ما دفعت ريال واحد. هل فيه شي تخسره؟ 🤔`,

    price: `${displayName}، فاهمك تماماً. خليني أوضّح لك الصورة:

📊 **متوسط المطعم يخسر ١٥-٢٠٪ من طلباته بسبب أخطاء الطلب اليدوي.**
📈 النظام الرقمي يقلل الأخطاء لصفر ويزيد متوسط الطلب ٣٠-٤٠٪.

يعني: النظام **يدفع ثمنه بنفسه** من أول شهر — وزيادة!

وعشان أريح بالك: **أول شهر عليّ أنا** — جربه مجاناً وإذا ما شفت نتيجة، ما تدفع شي 🤝

نبدأ التجربة المجانية؟ 🎁`,

    competitors: `${displayName}، السوق مليان خيارات، صح 👍

لكن اللي بيميزني:
✅ لست مجرد شركة — أنا شريك شخصي لك
✅ منيوك جاهز خلال ٢٤ ساعة (مش أيام ولا أسابيع)
✅ تجربة مجانية كاملة بدون إدخال بيانات بطاقة

جرّب وقارن بنفسك — على مسؤوليتي 🚀`,

    no_time: `${displayName}، فاهمك. لكن خليني أسألك:

⌚ **كم دقيقة تضيعها يومياً أنت وموظفينك في استقبال الطلبات يدوياً؟**

النظام الرقمي يوفّر ٧٠٪ من الوقت الضائع. وفي المقابل، تجهيز منيو مطعمك عندي يحتاج ٢٤ ساعة بس — وأنا أسوي كل الشغل.

أنت بس تعطيني الضوء الأخضر 🟢`,
  };

  return replies[type] || replies["not_interested"];
}

function handleObjectionsStage(conv: any, text: string, intent: string): string {
  if (intent === "yes" || intent === "ready" || intent === "call_me" || intent === "trial") {
    advanceStage(conv.phone, "closing");
    return getClosingMessage(conv.name);
  }

  if (intent === "no" || hasLowIntent(text)) {
    return `تمام ${conv.name}، أحترم قرارك 🤝

إذا احتجت أي شيء بالمستقبل — أنا موجود. وخلي هالرسالة عندك، يمكن تحتاجني بعدين.

بالتوفيق! 🌟`;
  }

  if (intent === "price") {
    return getObjectionReply("price", conv.name);
  }

  // محاولة أخيرة
  return `${conv.name}، سؤال أخير بكل صراحة:

**إيه اللي يخلّيك تجرب النظام اليوم؟** 🤔

لأني متأكد إنه راح يفيد مطعمك، وكل اللي أحتاجه منك فرصة وحدة — التجربة مجانية ومافيها أي مخاطرة 🤝`;
}

// ── المرحلة 6: الإغلاق ───────────────────────────────────

function getClosingMessage(name: string): string {
  const displayName = name && name !== "زائر" ? `أستاذ ${name}` : "صديقي";

  return `🔥 ${displayName}، **قرار ممتاز!** 

خليني أجهز لك كل شي. فقط أحتاج منك:

1️⃣ **اسم المطعم** بالكامل
2️⃣ **رقم واتساب المطعم** (إذا مختلف عن هالرقم)

وهذي خطوتين بسيطة وبعدها:
✅ منيو مطعمك الرقمي جاهز خلال ٢٤ ساعة
✅ تجربة مجانية كاملة بدون أي التزام
✅ بونص الاستشارة المجانية لتحسين المبيعات

جاهز تشاركني التفاصيل؟ 🚀✨`;
}

function handleClosingStage(conv: any, text: string, intent: string): string {
  if (text.length > 20 && /\d/.test(text)) {
    // يبدو أنه شارك تفاصيل
    conv.notes.push(`تفاصيل: ${text}`);
    return `تم استلام التفاصيل! 🎉

راح أتواصل معاك قريباً جداً لتأكيد كل شي والبدء في تجهيز منيو مطعمك الرقمي.

📱 **ملاحظة:** خلّصت كل شي من عندي — خلال ٢٤ ساعة منيو مطعمك هيكون جاهز.

أي سؤال قبل ما أبدأ؟ 🌟`;
  }

  if (intent === "yes" || intent === "ready") {
    return getClosingMessage(conv.name);
  }

  return `خلينا نمشي خطوة خطوة 👌

عشان أبدأ: **إيه اسم مطعمك؟** 🍽️

وسيبه عليّ الباقي! 💪`;
}

// ── المرحلة 7: متابعة ────────────────────────────────────

function handleFollowUpStage(conv: any, text: string, intent: string): string {
  if (intent === "yes" || intent === "ready" || hasHighIntent(text)) {
    advanceStage(conv.phone, "closing");
    return getClosingMessage(conv.name);
  }
  return "سعيد إني سمعت منك! إذا حبيت نكمل أو عندك سؤال، أنا دايم موجود 🤝";
}

function getStageMessage(conv: any): string {
  return "\n\nبالمناسبة، حاب أسألك: هل عندك مطعم أو كافيه؟ 🍽️";
}