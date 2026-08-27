import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface LineSettings {
  channelAccessToken: string;
  targetId: string; // User ID or Group ID (for PUSH mode)
  sendMode: 'BROADCAST' | 'PUSH'; // 'BROADCAST' sends to all followers, 'PUSH' sends to specific targetId
  enabled: boolean;
  times: string[]; // e.g. ["09:00", "14:00"]
  lastTriggeredDate?: string;
  lastTriggeredTimes?: string[];
}

let currentSettings: LineSettings = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  targetId: process.env.LINE_TARGET_ID || '',
  sendMode: (process.env.LINE_SEND_MODE as any) || 'BROADCAST',
  enabled: true,
  times: ['09:00', '14:00'],
  lastTriggeredTimes: []
};

/**
 * Load LINE settings from PostgreSQL database table SystemSetting
 */
export const loadLineSettingsFromDb = async () => {
  try {
    const record = await prisma.systemSetting.findUnique({
      where: { key: 'LINE_SETTINGS' }
    });
    if (record && record.value) {
      const parsed = JSON.parse(record.value);
      currentSettings = {
        ...currentSettings,
        ...parsed,
        channelAccessToken: parsed.channelAccessToken || process.env.LINE_CHANNEL_ACCESS_TOKEN || currentSettings.channelAccessToken,
        targetId: parsed.targetId || process.env.LINE_TARGET_ID || currentSettings.targetId
      };
      console.log('✅ Loaded LINE Settings from DB:', {
        hasToken: !!currentSettings.channelAccessToken,
        hasTargetId: !!currentSettings.targetId,
        enabled: currentSettings.enabled,
        times: currentSettings.times
      });
    }
  } catch (err: any) {
    console.error('⚠️ Could not load LINE settings from DB:', err.message);
  }
};

/**
 * Save LINE settings to PostgreSQL database table SystemSetting
 */
export const saveLineSettingsToDb = async (settings: LineSettings) => {
  try {
    await prisma.systemSetting.upsert({
      where: { key: 'LINE_SETTINGS' },
      update: { value: JSON.stringify(settings) },
      create: { key: 'LINE_SETTINGS', value: JSON.stringify(settings) }
    });
    console.log('💾 Saved LINE Settings to Database successfully');
  } catch (err: any) {
    console.error('⚠️ Could not save LINE settings to DB:', err.message);
  }
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

  // Persist to database asynchronously
  saveLineSettingsToDb(currentSettings).catch(console.error);

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
  }>,
  projectId?: string
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
              uri: `${(process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost')) ? process.env.FRONTEND_URL : 'https://warsgate-bom.onrender.com'}?tab=procurement&filter=pending${projectId ? `&projectId=${projectId}` : ''}`
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
 * Dispatch LINE broadcast message directly to LINE Messaging API (Sends to all followers/friends)
 */
export const broadcastLineMessage = async (
  token: string,
  messages: any[]
) => {
  if (!token) throw new Error('LINE Channel Access Token is required');

  const rawMessages = Array.isArray(messages) ? messages : [messages];
  const sanitizedMessages = sanitizeFlexPayload(rawMessages);

  const payload = {
    messages: sanitizedMessages
  };

  const response = await fetch('https://api.line.me/v2/bot/message/broadcast', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const data: any = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error('❌ LINE Broadcast API Error Details:', data);
    const details = Array.isArray(data.details) ? data.details.map((d: any) => `${d.property}: ${d.message}`).join(', ') : '';
    throw new Error(`${data.message || response.statusText}${details ? ` (${details})` : ''}`);
  }

  return { success: true, status: response.status, data };
};

/**
 * Trigger check for pending parts and push/broadcast notification across all workspaces
 */
export const triggerProcurementAlertNow = async (targetProjectId?: string) => {
  const settings = getLineSettings();
  if (!settings.channelAccessToken) {
    throw new Error('LINE Channel Access Token must be configured in settings');
  }

  // Determine send method: Broadcast (all followers) vs Push (specific targetId)
  const isBroadcast = settings.sendMode === 'BROADCAST' || !settings.targetId;

  const dispatchAlert = async (msgs: any[]) => {
    if (isBroadcast) {
      console.log('📢 Dispatching LINE alert via BROADCAST (all followers)...');
      return await broadcastLineMessage(settings.channelAccessToken, msgs);
    } else {
      console.log(`🎯 Dispatching LINE alert via PUSH to ${settings.targetId}...`);
      return await pushLineMessage(settings.channelAccessToken, settings.targetId, msgs);
    }
  };

  // 1. If a specific projectId is requested (e.g. single workspace test)
  if (targetProjectId) {
    const project = await prisma.project.findUnique({ where: { id: targetProjectId } });
    if (!project) {
      throw new Error('Project not found');
    }

    const pendingParts = await prisma.part.findMany({
      where: {
        projectId: project.id,
        status: { in: ['Planned', 'Pending', 'Waiting'] }
      },
      orderBy: { totalAmount: 'desc' }
    });

    if (pendingParts.length === 0) {
      const clearMessage = {
        type: 'text',
        text: `✅ แจ้งเตือนจัดซื้อ (${project.code} - ${project.name})\nขณะนี้ไม่มีรายการอะไหล่ค้างสั่งซื้อใน Workspace นี้ ทุกรายการสั่งซื้อเรียบร้อยแล้วครับ!`
      };
      return await dispatchAlert([clearMessage]);
    }

    const flexMessage = buildPendingPartsFlexMessage(project.name, project.code, pendingParts, project.id);
    return await dispatchAlert([flexMessage]);
  }

  // 2. Scan ALL Active Projects / Workspaces
  const allProjects = await prisma.project.findMany({
    where: { status: 'Active' },
    orderBy: { updatedAt: 'desc' }
  });

  if (allProjects.length === 0) {
    throw new Error('No active workspaces found in system');
  }

  // Collect workspaces with pending parts
  const workspacesWithPending: Array<{ project: any; parts: any[] }> = [];

  for (const proj of allProjects) {
    const parts = await prisma.part.findMany({
      where: {
        projectId: proj.id,
        status: { in: ['Planned', 'Pending', 'Waiting'] }
      },
      orderBy: { totalAmount: 'desc' }
    });

    if (parts.length > 0) {
      workspacesWithPending.push({ project: proj, parts });
    }
  }

  // If no workspaces have pending parts
  if (workspacesWithPending.length === 0) {
    const clearMessage = {
      type: 'text',
      text: `✅ แจ้งเตือนจัดซื้อ (ทุก Workspace)\nตรวจสอบแล้วทั้ง ${allProjects.length} Workspace ไม่มีรายการอะไหล่ค้างสั่งซื้อครับ!`
    };
    return await dispatchAlert([clearMessage]);
  }

  // Build Flex Message cards for each workspace that has pending items
  const flexMessages = workspacesWithPending.map(({ project, parts }) =>
    buildPendingPartsFlexMessage(project.name, project.code, parts, project.id)
  );

  // Send in batches of up to 5 messages per LINE API call
  let lastResult: any = null;
  for (let i = 0; i < flexMessages.length; i += 5) {
    const batch = flexMessages.slice(i, i + 5);
    lastResult = await dispatchAlert(batch);
  }

  return {
    success: true,
    mode: isBroadcast ? 'BROADCAST' : 'PUSH',
    totalWorkspacesScanned: allProjects.length,
    workspacesAlerted: workspacesWithPending.length,
    data: lastResult?.data
  };
};

/**
 * Background Scheduler Runner (Checks current time in Asia/Bangkok every minute)
 */
let schedulerInterval: NodeJS.Timeout | null = null;

export const startLineScheduler = async () => {
  if (schedulerInterval) clearInterval(schedulerInterval);

  // Load persistent settings from database
  await loadLineSettingsFromDb();

  console.log('⏰ LINE Notification Scheduler initialized. Configured times:', currentSettings.times, 'Mode:', currentSettings.sendMode);

  schedulerInterval = setInterval(async () => {
    try {
      if (!currentSettings.enabled || !currentSettings.channelAccessToken) {
        return;
      }
      if (currentSettings.sendMode === 'PUSH' && !currentSettings.targetId) {
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

        console.log(`🚀 [LINE Cron] Triggering scheduled procurement alert (${currentSettings.sendMode}) at ${timeStr} (Bangkok Time)`);
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
