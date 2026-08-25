import { Router, Request, Response } from 'express';
import { 
  getLineSettings, 
  updateLineSettings, 
  pushLineMessage, 
  triggerProcurementAlertNow 
} from '../services/lineScheduler';

const router = Router();

// ─── POST /api/line/push ──────────────────────────────────────────
// Proxy endpoint to push messages to LINE user/group (Solves CORS)
router.post('/push', async (req: Request, res: Response) => {
  try {
    const { token, to, messages } = req.body;
    const settings = getLineSettings();
    const effectiveToken = token || settings.channelAccessToken;
    const effectiveTo = to || settings.targetId;

    if (!effectiveToken) {
      return res.status(400).json({ error: 'Missing LINE Channel Access Token' });
    }
    if (!effectiveTo) {
      return res.status(400).json({ error: 'Missing target User ID / Group ID' });
    }
    if (!messages) {
      return res.status(400).json({ error: 'Missing messages payload' });
    }

    const result = await pushLineMessage(effectiveToken, effectiveTo, messages);
    res.json({
      success: true,
      status: 200,
      message: 'ข้อความถูกส่งไปยัง LINE เรียบร้อยแล้ว (200 OK)',
      data: result.data
    });
  } catch (err: any) {
    console.error('❌ LINE Push Error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to push LINE message',
      status: 500
    });
  }
});

// ─── POST /api/line/broadcast ─────────────────────────────────────
router.post('/broadcast', async (req: Request, res: Response) => {
  try {
    const { token, messages } = req.body;
    const settings = getLineSettings();
    const effectiveToken = token || settings.channelAccessToken;

    if (!effectiveToken) {
      return res.status(400).json({ error: 'Missing LINE Channel Access Token' });
    }
    if (!messages) {
      return res.status(400).json({ error: 'Missing messages payload' });
    }

    const payload = {
      messages: Array.isArray(messages) ? messages : [messages]
    };

    const response = await fetch('https://api.line.me/v2/bot/message/broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${effectiveToken}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = (data as any).message || `LINE API Error (${response.status})`;
      return res.status(response.status).json({ success: false, error: errorMsg });
    }

    res.json({
      success: true,
      status: 200,
      message: 'ส่งข้อความกระจาย (Broadcast) ถึงทุกคนสำเร็จ (200 OK)',
      data
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/line/test-connection ──────────────────────────────
router.post('/test-connection', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const settings = getLineSettings();
    const effectiveToken = token || settings.channelAccessToken;

    if (!effectiveToken) {
      return res.status(400).json({ error: 'กรุณาระบุ LINE Channel Access Token' });
    }

    const response = await fetch('https://api.line.me/v2/bot/info', {
      headers: {
        'Authorization': `Bearer ${effectiveToken}`
      }
    });

    const data: any = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data.message || `เชื่อมต่อไม่สำเร็จ (HTTP ${response.status}) กรุณาตรวจสอบ Token อีกครั้ง`
      });
    }

    res.json({
      success: true,
      status: 200,
      bot: {
        userId: data.userId,
        basicId: data.basicId,
        displayName: data.displayName,
        pictureUrl: data.pictureUrl,
        chatMode: data.chatMode,
        markAsReadMode: data.markAsReadMode
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/line/settings ──────────────────────────────────────
router.get('/settings', (_req: Request, res: Response) => {
  const settings = getLineSettings();
  // Mask the token partially for security in UI if desired
  res.json({
    success: true,
    settings: {
      ...settings,
      hasToken: !!settings.channelAccessToken
    }
  });
});

// ─── POST /api/line/settings ─────────────────────────────────────
router.post('/settings', (req: Request, res: Response) => {
  try {
    const { channelAccessToken, targetId, enabled, times } = req.body;
    const updated = updateLineSettings({
      channelAccessToken,
      targetId,
      enabled: enabled !== undefined ? Boolean(enabled) : undefined,
      times: Array.isArray(times) ? times : undefined
    });

    res.json({
      success: true,
      message: 'บันทึกการตั้งค่า LINE เรียบร้อยแล้ว',
      settings: updated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/line/trigger-procurement-alert ────────────────────
router.post('/trigger-procurement-alert', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.body;
    const result = await triggerProcurementAlertNow(projectId);
    res.json({
      success: true,
      message: 'ส่งการ์ดสรุปรายการค้างสั่งซื้อเข้า LINE สำเร็จ!',
      data: result.data
    });
  } catch (err: any) {
    console.error('Trigger procurement alert error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to trigger procurement alert'
    });
  }
});

export default router;
