/**
 * Conversation State Store
 * 
 * يتتبع حالة كل محادثة مع صاحب مطعم، لتقديم ردود ذكية
 * ومتسلسلة حسب مرحلة البيع التي وصل إليها.
 */

export type ConversationStage =
  | "new"          // أول رسالة
  | "greeting"     // بعد التحية الأولى
  | "qualifying"   // أسئلة تأهيلية
  | "pitching"     // عرض القيمة
  | "objections"   // معالجة الاعتراضات
  | "closing"      // الإغلاق
  | "follow_up";   // متابعة لاحقة

export interface Conversation {
  phone: string;
  name: string;
  stage: ConversationStage;
  lastMessageAt: number;
  messageCount: number;
  answeredQualifying: boolean;
  sawOffer: boolean;
  restaurantName?: string;
  interestLevel: "low" | "medium" | "high";
  notes: string[];
}

const conversations = new Map<string, Conversation>();

function normalizePhone(jid: string): string {
  return jid.split("@")[0];
}

export function getConversation(jid: string): Conversation | undefined {
  return conversations.get(normalizePhone(jid));
}

export function getOrCreate(jid: string, name: string): Conversation {
  const phone = normalizePhone(jid);
  if (!conversations.has(phone)) {
    conversations.set(phone, {
      phone,
      name,
      stage: "new",
      lastMessageAt: Date.now(),
      messageCount: 0,
      answeredQualifying: false,
      sawOffer: false,
      interestLevel: "medium",
      notes: [],
    });
  }
  return conversations.get(phone)!;
}

export function updateConversation(jid: string, updates: Partial<Conversation>) {
  const phone = normalizePhone(jid);
  const conv = conversations.get(phone);
  if (conv) {
    Object.assign(conv, updates, { lastMessageAt: Date.now() });
  }
}

export function advanceStage(jid: string, stage: ConversationStage) {
  updateConversation(jid, { stage });
}

export function recordMessage(jid: string, name: string) {
  const conv = getOrCreate(jid, name);
  conv.messageCount++;
  conv.lastMessageAt = Date.now();
}

export function getAllConversations(): Conversation[] {
  return Array.from(conversations.values()).sort((a, b) => b.lastMessageAt - a.lastMessageAt);
}

export function getActiveCount(): number {
  return conversations.size;
}

export function getRecentLogs(limit = 20): { phone: string; name: string; stage: string; lastMessageAt: string }[] {
  return getAllConversations().slice(0, limit).map(c => ({
    phone: c.phone,
    name: c.name,
    stage: c.stage,
    lastMessageAt: new Date(c.lastMessageAt).toISOString(),
  }));
}