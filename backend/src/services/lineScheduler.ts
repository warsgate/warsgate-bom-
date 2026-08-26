import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface LineSettings {
  channelAccessToken: string;
  targetId: string; // User ID or Group ID
  enabled: boolean;
  times: string[]; // e.g. ["09:00", "14:00"]
  lastTriggeredDate?: string;
  lastTriggeredTimes?: string[];
}

let currentSettings: LineSettings = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  targetId: process.env.LINE_TARGET_ID || '',
  enabled: true,
  times: ['09:00', '14:00'],
  lastTriggeredTimes: []
};

export const getLineSettings = (): LineSettings => {
  return { ...currentSettings };
};

export const updateLineSettings = (newSettings: Partial<LineSettings>): LineSettings => {
  currentSettings = {
    ...currentSettings,
    ...newSettings,
    channelAccessToken: newSettings.channelAccessToken !== undefined ? newSettings.channelAccessToken : currentSettings.channelAccessToken,
    targetId: newSettings.targetId !== undefined ? newSettings.targetId : currentSettings.targetId,
  };
  return { ...currentSettings };
};

/**
 * Builds a rich LINE Flex Message payload for pending parts
 */
export const buildPendingPartsFlexMessage = (
  projectName: string,
  projectCode: string,
  pendingParts: Array<{
    id: string;
    partName: string;
    typeSpec?: string;
    maker?: string;
    supplier?: string;
    qty: number;
    unit: string;
    unitPrice: number;
    totalAmount: number;
    purchaseLink?: string;
  }>
) => {
  const totalItems = pendingParts.length;
  const totalBudget = pendingParts.reduce((sum, p) => sum + (p.totalAmount || (p.qty * p.unitPrice)), 0);

  // Take top 5 items for the card preview
  const previewItems = pendingParts.slice(0, 5);

  const itemBoxes = previewItems.map((item, idx) => ({
    type: 'box',
    layout: 'vertical',
    margin: 'md',
    spacing: 'xs',
    contents: [
      {
        type: 'box',
        layout: 'horizontal',
        contents: [
          {
            type: 'text',
            text: `${idx + 1}. ${item.partName}`,
            size: 'sm',
            color: '#1e293b',
            weight: 'bold',
            flex: 4,
            wrap: true
          },
          {
            type: 'text',
            text: `${item.qty} ${item.unit || 'EA'}`,
            size: 'xs',
            color: '#64748b',
            flex: 2
          }
        ]
      },
      {
        type: 'box',
        layout: 'horizontal',
        contents: [
          {
            type: 'text',
            text: item.typeSpec ? `Spec: ${item.typeSpec}` : (item.maker ? `Maker: ${item.maker}` : 'Standard Part'),
            size: 'xxs',
            color: '#94a3b8',
            flex: 5,
            wrap: true
          },
          {
            type: 'text',
            text: `฿${(item.totalAmount || (item.qty * item.unitPrice)).toLocaleString('th-TH')}`,
            size: 'xs',
            color: '#ef4444',
            weight: 'bold',
            flex: 3
          }
        ]
      },
      ...(item.purchaseLink && (item.purchaseLink.startsWith('http://') || item.purchaseLink.startsWith('https://') || item.purchaseLink.startsWith('www.')) ? [{
        type: 'button',
        style: 'link',
        height: 'sm',
        action: {
          type: 'uri',
          label: 'สั่งซื้อรายการนี้',
          uri: item.purchaseLink.startsWith('www.') ? `https://${item.purchaseLink}` : item.purchaseLink
        }
      }] : [])
    ]
  }));

  const flexMessage = {
    type: 'flex',
    altText: `แจ้งเตือน: มีรายการอะไหล่ค้างสั่งซื้อ ${totalItems} รายการ (${projectName})`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#0f172a',
        paddingAll: 'lg',
        contents: [
          {
            type: 'text',
            text: 'PROCUREMENT ALERT',
            color: '#f59e0b',
            weight: 'bold',
            size: 'xs'
          },
          {
            type: 'text',
            text: 'รายการค้างสั่งซื้อ (Pending BOM)',
            weight: 'bold',
            size: 'lg',
            color: '#ffffff',
            margin: 'sm'
          },
          {
            type: 'text',
            text: `โปรเจกต์: ${projectCode} - ${projectName}`,
            size: 'xs',
            color: '#94a3b8',
            margin: 'xs'
          }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: 'lg',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            backgroundColor: '#fef3c7',
            paddingAll: 'md',
            cornerRadius: 'md',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                flex: 1,
                contents: [
                  {
                    type: 'text',
                    text: 'จำนวนค้างสั่ง',
                    size: 'xxs',
                    color: '#92400e'
                  },
                  {
                    type: 'text',
                    text: `${totalItems} รายการ`,
                    size: 'md',
                    weight: 'bold',
                    color: '#b45309'
                  }
                ]
              },
              {
                type: 'box',
                layout: 'vertical',
                flex: 1,
                contents: [
                  {
                    type: 'text',
                    text: 'งบประมาณรวม',
                    size: 'xxs',
                    color: '#92400e'
                  },
                  {
                    type: 'text',
                    text: `฿${totalBudget.toLocaleString('th-TH')}`,
                    size: 'md',
                    weight: 'bold',
                    color: '#b45309'
                  }
                ]
              }
            ]
          },
          {
            type: 'separator',
            margin: 'lg'
          },
          {
            type: 'text',
            text: 'รายการที่ต้องจัดซื้อโดยเร็ว:',
            size: 'xs',
            color: '#64748b',
            weight: 'bold',
            margin: 'md'
          },
          ...itemBoxes,
          ...(totalItems > 5 ? [{
            type: 'text',
            text: `... และอีก ${totalItems - 5} รายการในระบบ`,
            size: 'xxs',
            color: '#64748b',
            margin: 'md'
          }] : [])
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        paddingAll: 'md',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#0284c7',
            height: 'sm',
            action: {
              type: 'uri',
              label: 'เปิดดูรายละเอียด',
              uri: `${(process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost')) ? process.env.FRONTEND_URL : 'https://warsgate-bom.onrender.com'}?tab=procurement&filter=pending`
            }
          }
        ]
      }
    }
  };

  return flexMessage;
};

/**
 * Known unsupported properties that LINE Messaging API rejects.
 * Use a blacklist approach to strip these from any Flex Message payload.
 */
const LINE_UNSUPPORTED_FIELDS = new Set([
  'letterSpacing',
  'align',        // only valid on certain component types - strip globally to be safe
]);

/**
 * Recursively sanitize flex message payload to strip unknown/unsupported LINE properties
 */
export const sanitizeFlexPayload = (obj: any, parentType?: string): any => {
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeFlexPayload(item, parentType));
  } else if (obj !== null && typeof obj === 'object') {
    const currentType: string = obj.type || parentType || '';
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      // Skip globally unsupported fields
      if (key === 'letterSpacing') continue;
      // 'align' is only valid on text components at top level of bubble sections,
      // not nested inside box contents - strip it to avoid validation errors
      if (key === 'align' && currentType === 'text' && parentType === 'box') continue;
      cleaned[key] = sanitizeFlexPayload(obj[key], currentType);
    }
    return cleaned;
  }
  return obj;
};

/**
 * Dispatch LINE push message directly to LINE Messaging API
 */
export const pushLineMessage = async (
  token: string,
  to: string,
  messages: any[]
) => {
  if (!token) throw new Error('LINE Channel Access Token is required');
  if (!to) throw new Error('Target User ID / Group ID is required');

  const rawMessages = Array.isArray(messages) ? messages : [messages];
  const sanitizedMessages = sanitizeFlexPayload(rawMessages);

  const payload = {
    to,
    messages: sanitizedMessages
  };

  const response = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    let errorMsg = (data as any).message || `LINE API Error (${response.status}: ${response.statusText})`;
    if ((data as any).details && Array.isArray((data as any).details)) {
      const detailStrs = (data as any).details.map((d: any) => d.message ? `${d.property ? d.property + ': ' : ''}${d.message}` : JSON.stringify(d)).join(', ');
      errorMsg += ` (${detailStrs})`;
    }
    throw new Error(errorMsg);
  }

  return { success: true, status: response.status, data };
};

/**
 * Trigger check for pending parts and push notification
 */
export const triggerProcurementAlertNow = async (projectId?: string) => {
  const settings = getLineSettings();
  if (!settings.channelAccessToken || !settings.targetId) {
    throw new Error('LINE Channel Access Token and Target ID must be configured in settings');
  }

  // Query projects and pending parts
  const project = projectId 
    ? await prisma.project.findUnique({ where: { id: projectId } })
    : await prisma.project.findFirst({ where: { status: 'Active' }, orderBy: { updatedAt: 'desc' } });

  if (!project) {
    throw new Error('No active project found to check pending parts');
  }

  const pendingParts = await prisma.part.findMany({
    where: {
      projectId: project.id,
      status: {
        in: ['Planned', 'Pending', 'Waiting']
      }
    },
    orderBy: { totalAmount: 'desc' }
  });

  if (pendingParts.length === 0) {
    const clearMessage = {
      type: 'text',
      text: `✅ แจ้งเตือนจัดซื้อ (${project.code} - ${project.name})\nขณะนี้ไม่มีรายการอะไหล่ค้างสั่งซื้อ ทุกรายการได้รับการสั่งซื้อเรียบร้อยแล้วครับ!`
    };
    return await pushLineMessage(settings.channelAccessToken, settings.targetId, [clearMessage]);
  }

  const flexMessage = buildPendingPartsFlexMessage(project.name, project.code, pendingParts);
  return await pushLineMessage(settings.channelAccessToken, settings.targetId, [flexMessage]);
};

/**
 * Background Scheduler Runner (Checks current time in Asia/Bangkok every minute)
 */
let schedulerInterval: NodeJS.Timeout | null = null;

export const startLineScheduler = () => {
  if (schedulerInterval) clearInterval(schedulerInterval);

  console.log('⏰ LINE Notification Scheduler initialized. Configured times:', currentSettings.times);

  schedulerInterval = setInterval(async () => {
    try {
      if (!currentSettings.enabled || !currentSettings.channelAccessToken || !currentSettings.targetId) {
        return;
      }

      const now = new Date();
      // Format time in Asia/Bangkok timezone
      const timeStr = now.toLocaleTimeString('en-GB', {
        timeZone: 'Asia/Bangkok',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      const todayDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }); // YYYY-MM-DD

      // Check if current minute matches one of the scheduled times
      if (currentSettings.times.includes(timeStr)) {
        const triggerKey = `${todayDateStr}_${timeStr}`;
        if (currentSettings.lastTriggeredTimes?.includes(triggerKey)) {
          return;
        }

        console.log(`🚀 [LINE Cron] Triggering scheduled procurement alert at ${timeStr} (Bangkok Time)`);
        await triggerProcurementAlertNow();

        currentSettings.lastTriggeredDate = todayDateStr;
        currentSettings.lastTriggeredTimes = [
          ...(currentSettings.lastTriggeredTimes || []).slice(-10),
          triggerKey
        ];
      }
    } catch (err: any) {
      console.error('❌ [LINE Cron Error]:', err.message);
    }
  }, 60000);
};
