/**
 * Server Bot Initializer
 * يهيئ البوت ويدير المحادثات
 */

import { startBot, setMessageHandler, updateActiveConversations, IncomingMessage } from "./baileys";

// ── تخزين المحادثات النشطة ──
const activeConversations = new Map<string, Conversation>();

interface Conversation {
  phone: string;
  name: string;
  stage: string;
  lastMessage: string;
  lastActivity: number;
}

const recentLogs: Conversation[] = [];

export async function initSalesBot(): Promise<void> {
  // تعيين معالج الرسائل
  setMessageHandler(async (msg: IncomingMessage) => {
    return handleIncomingMessage(msg);
  });

  // بدء البوت
  await startBot();
}

function handleIncomingMessage(msg: IncomingMessage): string | null {
  const phone = msg.from;
  
  // تحديث أو إنشاء محادثة
  let conv = activeConversations.get(phone);
  if (!conv) {
    conv = {
      phone,
      name: msg.fromName,
      stage: "greeting",
      lastMessage: "",
      lastActivity: Date.now(),
    };
    activeConversations.set(phone, conv);
  }

  conv.lastMessage = msg.body;
  conv.lastActivity = Date.now();
  updateActiveConversations(activeConversations.size);

  // تسجيل في السجل
  recentLogs.unshift({ ...conv });
  if (recentLogs.length > 50) recentLogs.pop();

  // الردود الآلية
  const text = msg.body.toLowerCase().trim();

  if (conv.stage === "greeting") {
    conv.stage = "menu";
    return `👋 مرحباً ${msg.fromName}!\n\nأنا البوت المساعد لمطعم سفرة.\n\n📋 *القائمة:*\n1️⃣ عرض المنيو\n2️⃣ طلب أكل\n3️⃣ موقع المطعم\n4️⃣ ساعات العمل\n\nاكتب رقم الخيار أو اسمه 👇`;
  }

  if (text.includes("1") || text.includes("منيو") || text.includes("menu")) {
    conv.stage = "ordering";
    return `📋 *المنيو:*\n\n🥩 *المقبلات*\n- بريوات بالدجاج واللوز (45 درهم)\n- سلطة زعلوك مغربية (38 درهم)\n\n🍖 *الأطباق الرئيسية*\n- طاجين لحم بالبرقوق (95 درهم)\n- كسكس ملكي (85 درهم)\n\n🥤 *مشروبات*\n- شاي نعناع (15 درهم)\n- عصير برتقال (20 درهم)\n\nللطلب، اكتب: *طلب [اسم الطبق]*`;
  }

  if (text.includes("2") || text.includes("طلب")) {
    conv.stage = "ordering";
    return `🍽️ ممتاز! اكتب اسم الطبق اللي تريد تطلبه وسنتواصل معك فوراً.\n\nمثال: *طلب طاجين لحم*`;
  }

  if (text.includes("3") || text.includes("موقع") || text.includes("maps")) {
    return `📍 *موقع المطعم:*\n\nhttps://maps.google.com/?q=Chez+Nous+Restaurant\n\n🏠 العنوان: شارع محمد الخامس، الدار البيضاء`;
  }

  if (text.includes("4") || text.includes("ساعات") || text.includes("horaire")) {
    return `🕐 *ساعات العمل:*\n\nيومياً من 12:00 ظهراً حتى 11:00 مساءً\n\nللحجز المسبق: 0699954816`;
  }

  return `👍 تم تسجيل طلبك!\n\nسنتواصل معك على الرقم ${msg.fromName} قريباً لتأكيد الطلب.\n\nللرجوع للقائمة الرئيسية اكتب *قائمة*`;
}

export function getRecentLogs(limit: number = 20) {
  return recentLogs.slice(0, limit).map(c => ({
    phone: c.phone,
    name: c.name,
    stage: c.stage,
    lastMessage: c.lastMessage.substring(0, 50),
    lastActivity: new Date(c.lastActivity).toISOString(),
  }));
}

export function getActiveCount(): number {
  return activeConversations.size;
}