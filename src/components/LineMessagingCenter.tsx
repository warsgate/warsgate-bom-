import React, { useState, useEffect, useMemo } from 'react';
import { 
  Send, 
  Smartphone, 
  Play, 
  Settings2, 
  Code2, 
  Copy, 
  Check, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Layers, 
  Receipt, 
  Calendar, 
  Package, 
  ExternalLink, 
  Eye, 
  Key, 
  User, 
  Terminal, 
  Sparkles, 
  BellRing,
  CreditCard,
  Building2,
  ChevronRight,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { ProjectItem, BomPartItem } from '../types/bom';
import { lineApi } from '../api/client';

interface LineMessagingCenterProps {
  projects: ProjectItem[];
  activeProjectId: string;
  parts: BomPartItem[];
}

type TemplateType = 'PROCUREMENT' | 'RECEIPT' | 'APPOINTMENT' | 'CUSTOM';

export const LineMessagingCenter: React.FC<LineMessagingCenterProps> = ({
  projects,
  activeProjectId,
  parts
}) => {
  // Mode selection: 'SIMULATOR' | 'REAL_PUSH'
  const [operatingMode, setOperatingMode] = useState<'SIMULATOR' | 'REAL_PUSH'>('SIMULATOR');
  const [activeTemplate, setActiveTemplate] = useState<TemplateType>('PROCUREMENT');
  const [activeDevTab, setActiveDevTab] = useState<'INSPECTOR' | 'CUSTOM_JSON' | 'CURL' | 'NODEJS'>('INSPECTOR');

  // LINE Credentials & Settings
  const [channelToken, setChannelToken] = useState('');
  const [targetId, setTargetId] = useState('');
  const [cronEnabled, setCronEnabled] = useState(true);
  const [cronTimes, setCronTimes] = useState<string[]>(['09:00', '14:00']);
  const [newTimeInput, setNewTimeInput] = useState('');
  
  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [botInfo, setBotInfo] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Toast Notification
  const [toast, setToast] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
    status?: number;
  } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', title: string, message: string, status?: number) => {
    setToast({ show: true, type, title, message, status });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Custom JSON editor state
  const [customJsonInput, setCustomJsonInput] = useState('');

  // Receipt Form interactive state
  const [receiptForm, setReceiptForm] = useState({
    orderNo: 'WG-PO-' + Math.floor(1000 + Math.random() * 9000),
    customerName: 'บริษัท วอร์สเกต ออโตเมชั่น จำกัด',
    itemName: 'อุปกรณ์ชุดขับเคลื่อนเซอร์โว (Servo Drive & Motor)',
    itemQty: 2,
    itemPrice: 18500,
    paymentMethod: 'โอนเงินผ่านธนาคาร (PromptPay)',
  });

  // Appointment Form interactive state
  const [appointmentForm, setAppointmentForm] = useState({
    title: 'นัดหมายส่งมอบ & ทดสอบระบบหน้างาน',
    date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    time: '10:30 น.',
    location: 'โรงงานลูกค้านิคมอุตสาหกรรมบางกะดี จ.ปทุมธานี',
    engineerName: 'นายธีรพัฒน์ (Lead Mechanical Eng.)',
    contactTel: '081-999-8888'
  });

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];

  // Filter pending parts for the active project
  const pendingParts = useMemo(() => {
    return parts.filter(p => 
      p.projectId === activeProjectId && 
      (p.status === 'Planned' || (p.status as string) === 'Pending')
    );
  }, [parts, activeProjectId]);

  const totalPendingAmount = useMemo(() => {
    return pendingParts.reduce((sum, p) => sum + (p.totalAmount || (p.qty * p.unitPrice)), 0);
  }, [pendingParts]);

  // ─── Load LINE Settings from Backend ───────────────────────────
  const loadSettings = async () => {
    try {
      const res = await lineApi.getSettings();
      if (res?.settings) {
        if (res.settings.channelAccessToken) setChannelToken(res.settings.channelAccessToken);
        if (res.settings.targetId) setTargetId(res.settings.targetId);
        if (res.settings.enabled !== undefined) setCronEnabled(res.settings.enabled);
        if (res.settings.times && Array.isArray(res.settings.times)) setCronTimes(res.settings.times);
      }
    } catch (err: any) {
      console.warn('Failed to load line settings from backend:', err.message);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // ─── Save Settings ─────────────────────────────────────────────
  const handleSaveSettings = async () => {
    try {
      setIsLoading(true);
      await lineApi.saveSettings({
        channelAccessToken: channelToken,
        targetId,
        enabled: cronEnabled,
        times: cronTimes
      });
      showToast('success', 'บันทึกสำเร็จ', 'บันทึกการตั้งค่า LINE Messaging เรียบร้อยแล้ว', 200);
    } catch (err: any) {
      showToast('error', 'บันทึกไม่สำเร็จ', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Test Connection ───────────────────────────────────────────
  const handleTestConnection = async () => {
    if (!channelToken) {
      showToast('error', 'กรุณาระบุ Token', 'กรุณากรอก Channel Access Token ก่อนทดสอบ');
      return;
    }
    try {
      setIsTestingConnection(true);
      const res = await lineApi.testConnection(channelToken);
      if (res.success && res.bot) {
        setBotInfo(res.bot);
        showToast('success', 'เชื่อมต่อสำเร็จ (200 OK)', `พบ LINE Official Account: ${res.bot.displayName}`, 200);
      }
    } catch (err: any) {
      setBotInfo(null);
      showToast('error', 'เชื่อมต่อไม่สำเร็จ', err.message, 401);
    } finally {
      setIsTestingConnection(false);
    }
  };

  // ─── Build Payloads for Templates ──────────────────────────────
  const currentPayload = useMemo(() => {
    if (activeTemplate === 'CUSTOM') {
      try {
        if (!customJsonInput.trim()) {
          return {
            type: 'text',
            text: 'กรุณากรอก JSON Payload ในแท็บ Custom Editor'
          };
        }
        return JSON.parse(customJsonInput);
      } catch (err) {
        return {
          type: 'text',
          text: '⚠️ JSON Format Error: รูปแบบ JSON ไม่ถูกต้อง'
        };
      }
    }

    if (activeTemplate === 'PROCUREMENT') {
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
                align: 'end',
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
                flex: 4,
                wrap: true
              },
              {
                type: 'text',
                text: `฿${(item.totalAmount || (item.qty * item.unitPrice)).toLocaleString('th-TH')}`,
                size: 'xs',
                color: '#ef4444',
                weight: 'bold',
                align: 'end',
                flex: 3
              }
            ]
          },
          ...(item.purchaseLink ? [{
            type: 'button',
            style: 'link',
            height: 'sm',
            action: {
              type: 'uri',
              label: '🔗 สั่งซื้อรายการนี้',
              uri: item.purchaseLink
            }
          }] : [])
        ]
      }));

      return {
        type: 'flex',
        altText: `⚠️ แจ้งเตือน: มีรายการอะไหล่ค้างสั่งซื้อ ${pendingParts.length} รายการ (${activeProject?.name || 'BOM'})`,
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
                type: 'box',
                layout: 'horizontal',
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
                    text: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
                    color: '#94a3b8',
                    size: 'xxs',
                    align: 'end'
                  }
                ]
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
                text: `โปรเจกต์: ${activeProject?.code || '-'} - ${activeProject?.name || '-'}`,
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
                        text: `${pendingParts.length} รายการ`,
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
                    align: 'end',
                    contents: [
                      {
                        type: 'text',
                        text: 'ยอดงบประมาณรวม',
                        size: 'xxs',
                        color: '#92400e',
                        align: 'end'
                      },
                      {
                        type: 'text',
                        text: `฿${totalPendingAmount.toLocaleString('th-TH')}`,
                        size: 'md',
                        weight: 'bold',
                        color: '#b45309',
                        align: 'end'
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
                text: pendingParts.length > 0 ? 'รายการที่ต้องจัดซื้อโดยเร็ว:' : '🎉 ไม่มีรายการค้างสั่งซื้อในระบบ',
                size: 'xs',
                color: '#64748b',
                weight: 'bold',
                margin: 'md'
              },
              ...itemBoxes,
              ...(pendingParts.length > 5 ? [{
                type: 'text',
                text: `... และอีก ${pendingParts.length - 5} รายการในระบบ`,
                size: 'xxs',
                color: '#64748b',
                align: 'center',
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
                  label: '📋 เปิดดูระบบจัดซื้อ (BOM)',
                  uri: window.location.origin
                }
              }
            ]
          }
        }
      };
    }

    if (activeTemplate === 'RECEIPT') {
      const total = receiptForm.itemQty * receiptForm.itemPrice;
      const vat = total * 0.07;
      const grandTotal = total + vat;

      return {
        type: 'flex',
        altText: `🧾 ใบเสร็จรับเงิน / คำสั่งซื้อ: ${receiptForm.orderNo}`,
        contents: {
          type: 'bubble',
          size: 'mega',
          header: {
            type: 'box',
            layout: 'vertical',
            backgroundColor: '#059669',
            paddingAll: 'lg',
            contents: [
              {
                type: 'text',
                text: 'OFFICIAL RECEIPT',
                color: '#a7f3d0',
                weight: 'bold',
                size: 'xs'
              },
              {
                type: 'text',
                text: 'ใบเสร็จรับเงิน / ใบสั่งซื้อ',
                weight: 'bold',
                size: 'xl',
                color: '#ffffff',
                margin: 'sm'
              },
              {
                type: 'text',
                text: `เลขที่: ${receiptForm.orderNo}`,
                size: 'xs',
                color: '#e2e8f0',
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
                contents: [
                  { type: 'text', text: 'ลูกค้า:', size: 'xs', color: '#64748b', flex: 2 },
                  { type: 'text', text: receiptForm.customerName, size: 'xs', color: '#1e293b', weight: 'bold', flex: 5, wrap: true }
                ]
              },
              {
                type: 'box',
                layout: 'horizontal',
                margin: 'sm',
                contents: [
                  { type: 'text', text: 'วันที่ชำระ:', size: 'xs', color: '#64748b', flex: 2 },
                  { type: 'text', text: new Date().toLocaleDateString('th-TH'), size: 'xs', color: '#1e293b', flex: 5 }
                ]
              },
              {
                type: 'box',
                layout: 'horizontal',
                margin: 'sm',
                contents: [
                  { type: 'text', text: 'ช่องทาง:', size: 'xs', color: '#64748b', flex: 2 },
                  { type: 'text', text: receiptForm.paymentMethod, size: 'xs', color: '#059669', weight: 'bold', flex: 5 }
                ]
              },
              { type: 'separator', margin: 'lg' },
              {
                type: 'box',
                layout: 'horizontal',
                margin: 'md',
                contents: [
                  { type: 'text', text: `${receiptForm.itemName} (x${receiptForm.itemQty})`, size: 'xs', color: '#334155', flex: 5, wrap: true },
                  { type: 'text', text: `฿${total.toLocaleString('th-TH')}`, size: 'xs', color: '#334155', align: 'end', flex: 3 }
                ]
              },
              {
                type: 'box',
                layout: 'horizontal',
                margin: 'xs',
                contents: [
                  { type: 'text', text: 'ภาษีมูลค่าเพิ่ม (VAT 7%)', size: 'xxs', color: '#94a3b8', flex: 5 },
                  { type: 'text', text: `฿${vat.toLocaleString('th-TH')}`, size: 'xxs', color: '#94a3b8', align: 'end', flex: 3 }
                ]
              },
              { type: 'separator', margin: 'md' },
              {
                type: 'box',
                layout: 'horizontal',
                margin: 'md',
                contents: [
                  { type: 'text', text: 'ยอดรวมสุทธิ (Grand Total)', size: 'sm', color: '#0f172a', weight: 'bold', flex: 4 },
                  { type: 'text', text: `฿${grandTotal.toLocaleString('th-TH')}`, size: 'lg', color: '#059669', weight: 'bold', align: 'end', flex: 4 }
                ]
              }
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
                color: '#059669',
                height: 'sm',
                action: {
                  type: 'uri',
                  label: '📄 ดาวน์โหลดใบเสร็จ (PDF)',
                  uri: window.location.origin
                }
              }
            ]
          }
        }
      };
    }

    if (activeTemplate === 'APPOINTMENT') {
      return {
        type: 'flex',
        altText: `📅 ใบนัดหมายส่งมอบงาน: ${appointmentForm.title}`,
        contents: {
          type: 'bubble',
          size: 'mega',
          header: {
            type: 'box',
            layout: 'vertical',
            backgroundColor: '#4f46e5',
            paddingAll: 'lg',
            contents: [
              {
                type: 'text',
                text: 'SCHEDULE & APPOINTMENT',
                color: '#c7d2fe',
                weight: 'bold',
                size: 'xs'
              },
              {
                type: 'text',
                text: appointmentForm.title,
                weight: 'bold',
                size: 'lg',
                color: '#ffffff',
                margin: 'sm',
                wrap: true
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
                contents: [
                  { type: 'text', text: '📅 วันที่:', size: 'xs', color: '#64748b', flex: 2 },
                  { type: 'text', text: appointmentForm.date, size: 'xs', color: '#1e293b', weight: 'bold', flex: 5 }
                ]
              },
              {
                type: 'box',
                layout: 'horizontal',
                margin: 'sm',
                contents: [
                  { type: 'text', text: '⏰ เวลา:', size: 'xs', color: '#64748b', flex: 2 },
                  { type: 'text', text: appointmentForm.time, size: 'xs', color: '#4f46e5', weight: 'bold', flex: 5 }
                ]
              },
              {
                type: 'box',
                layout: 'horizontal',
                margin: 'sm',
                contents: [
                  { type: 'text', text: '📍 สถานที่:', size: 'xs', color: '#64748b', flex: 2 },
                  { type: 'text', text: appointmentForm.location, size: 'xs', color: '#1e293b', flex: 5, wrap: true }
                ]
              },
              {
                type: 'box',
                layout: 'horizontal',
                margin: 'sm',
                contents: [
                  { type: 'text', text: '👷 วิศวกร:', size: 'xs', color: '#64748b', flex: 2 },
                  { type: 'text', text: `${appointmentForm.engineerName} (โทร: ${appointmentForm.contactTel})`, size: 'xs', color: '#1e293b', flex: 5, wrap: true }
                ]
              }
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
                color: '#4f46e5',
                height: 'sm',
                action: {
                  type: 'uri',
                  label: '📍 นำทางไปยังสถานที่ (Google Maps)',
                  uri: 'https://maps.google.com'
                }
              }
            ]
          }
        }
      };
    }

    return { type: 'text', text: 'Hello LINE' };
  }, [activeTemplate, pendingParts, totalPendingAmount, activeProject, receiptForm, appointmentForm, customJsonInput]);

  // Keep custom JSON editor synchronized with current template initially
  useEffect(() => {
    if (activeTemplate !== 'CUSTOM') {
      setCustomJsonInput(JSON.stringify(currentPayload, null, 2));
    }
  }, [activeTemplate]);

  // ─── Dispatch Message Action ───────────────────────────────────
  const handleDispatchMessage = async () => {
    if (operatingMode === 'SIMULATOR') {
      showToast(
        'success',
        'Simulator Sandbox: ทดสอบสำเร็จ! 🎉',
        'จำลองการส่งข้อความเสร็จสมบูรณ์ (โหมด Simulator จะไม่หักโควต้าและไม่ต้องใช้ API Key)',
        200
      );
      return;
    }

    // Real Push API Mode
    if (!channelToken || !targetId) {
      showToast('error', 'ข้อมูลไม่ครบถ้วน', 'กรุณาระบุ Channel Access Token และ Target ID');
      return;
    }

    try {
      setIsLoading(true);
      const res = await lineApi.push({
        token: channelToken,
        to: targetId,
        messages: currentPayload
      });

      if (res.success) {
        showToast('success', 'ส่งข้อความเข้า LINE สำเร็จ (200 OK)', 'ข้อความได้ถูกส่งตรงไปยังแอป LINE บนมือถือเรียบร้อยแล้ว!', 200);
      } else {
        showToast('error', 'ส่งข้อความไม่สำเร็จ', res.error || 'เกิดข้อผิดพลาด', res.status || 500);
      }
    } catch (err: any) {
      showToast('error', 'เกิดข้อผิดพลาดในการส่ง', err.message, 500);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Send Simple Test Text Message ─────────────────────────────
  const handleSendTestText = async () => {
    if (operatingMode === 'SIMULATOR') {
      showToast('success', 'Simulator: ทดสอบข้อความธรรมดาสำเร็จ', 'จำลองส่ง: 🔔 ทดสอบการเชื่อมต่อ WARSGATE BOT สำเร็จแล้ว!', 200);
      return;
    }

    if (!channelToken || !targetId) {
      showToast('error', 'ข้อมูลไม่ครบถ้วน', 'กรุณาระบุ Channel Access Token และ Target ID');
      return;
    }

    try {
      setIsLoading(true);
      const res = await lineApi.push({
        token: channelToken,
        to: targetId,
        messages: [{
          type: 'text',
          text: '🔔 ทดสอบการเชื่อมต่อ WARSGATE BOT: ระบบส่งข้อความเข้า LINE ทำงานได้ถูกต้องสมบูรณ์แล้วครับ! 🎉'
        }]
      });

      if (res.success) {
        showToast('success', 'ส่งข้อความทดสอบสำเร็จ (200 OK)', 'ข้อความทดสอบถูกส่งตรงเข้าแอป LINE บนมือถือแล้ว!', 200);
      } else {
        showToast('error', 'ส่งข้อความไม่สำเร็จ', res.error || 'เกิดข้อผิดพลาด', res.status || 500);
      }
    } catch (err: any) {
      showToast('error', 'เกิดข้อผิดพลาดในการส่ง', err.message, 500);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Trigger Scheduled Procurement Alert Instantly ──────────────
  const handleTriggerProcurementAlert = async () => {
    if (operatingMode === 'SIMULATOR') {
      setActiveTemplate('PROCUREMENT');
      showToast(
        'success',
        'Simulator Trigger: ทดสอบรอบเวลาสำเร็จ',
        `ดึงรายการค้างสั่งซื้อ ${pendingParts.length} รายการ ขึ้นจำลองบนหน้าจอมือถือเรียบร้อย`,
        200
      );
      return;
    }

    if (!channelToken || !targetId) {
      showToast('error', 'ข้อมูลไม่ครบถ้วน', 'กรุณาระบุ Channel Access Token และ Target ID ในการตั้งค่า');
      return;
    }

    try {
      setIsLoading(true);
      const res = await lineApi.triggerProcurementAlert(activeProjectId);
      if (res.success) {
        showToast('success', 'ยิงแจ้งเตือนเข้า LINE สำเร็จ (200 OK)', res.message, 200);
      } else {
        showToast('error', 'ยิงแจ้งเตือนไม่สำเร็จ', res.error);
      }
    } catch (err: any) {
      showToast('error', 'ส่งแจ้งเตือนไม่สำเร็จ', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Code Snippet Generators ───────────────────────────────────
  const curlCode = useMemo(() => {
    const jsonStr = JSON.stringify({
      to: targetId || 'USER_ID_HERE',
      messages: [currentPayload]
    }, null, 2).replace(/"/g, '\\"');

    return `curl -X POST https://api.line.me/v2/bot/message/push \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${channelToken || 'YOUR_CHANNEL_ACCESS_TOKEN'}" \\
  -d "${jsonStr}"`;
  }, [channelToken, targetId, currentPayload]);

  const nodejsCode = useMemo(() => {
    return `// Node.js (Fetch API) - Send LINE Flex Message
const pushMessage = async () => {
  const token = '${channelToken || 'YOUR_CHANNEL_ACCESS_TOKEN'}';
  const targetId = '${targetId || 'USER_OR_GROUP_ID'}';
  
  const payload = {
    to: targetId,
    messages: [
${JSON.stringify(currentPayload, null, 6)}
    ]
  };

  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${token}\`
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  console.log('LINE Response:', res.status, data);
};

pushMessage();`;
  }, [channelToken, targetId, currentPayload]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-2xl shadow-2xl border transition-all animate-bounce ${
          toast.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100' 
            : toast.type === 'error'
            ? 'bg-rose-950/90 border-rose-500/50 text-rose-100'
            : 'bg-slate-900/90 border-slate-700 text-slate-100'
        } backdrop-blur-md`}>
          <div className="flex items-start space-x-3">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-sky-400 mt-0.5 shrink-0" />
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm">{toast.title}</h4>
                {toast.status && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-black ${
                    toast.status === 200 ? 'bg-emerald-800 text-emerald-200' : 'bg-rose-800 text-rose-200'
                  }`}>
                    HTTP {toast.status}
                  </span>
                )}
              </div>
              <p className="text-xs mt-1 text-slate-300 dark:text-slate-400 leading-relaxed">{toast.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-500/30 text-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-black border border-emerald-400/30 flex items-center gap-1">
              <Zap className="w-3 h-3 text-emerald-300" /> LINE Messaging Center
            </span>
            <span className="text-xs text-emerald-200 font-mono">Real-time Webhook & Proxy</span>
          </div>
          <h1 className="text-2xl font-black mt-2 tracking-tight">ระบบส่งข้อความ & การ์ด Flex Message เข้า LINE</h1>
          <p className="text-sm text-emerald-100/80 mt-1 max-w-xl">
            จำลองการแสดงผล Flex Message บนมือถือ พร้อมระบบเชื่อมต่อ LINE Messaging API ยิงแจ้งเตือนอะไหล่ค้างสั่งซื้ออัตโนมัติวันละ 2 เวลา
          </p>
        </div>

        {/* Operating Mode Switcher */}
        <div className="bg-black/30 p-1.5 rounded-2xl border border-white/10 flex items-center space-x-1 shrink-0">
          <button
            onClick={() => setOperatingMode('SIMULATOR')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
              operatingMode === 'SIMULATOR'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/50'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Simulator Sandbox</span>
          </button>
          <button
            onClick={() => setOperatingMode('REAL_PUSH')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
              operatingMode === 'REAL_PUSH'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/50'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Real LINE API Push</span>
          </button>
        </div>
      </div>

      {/* Main Grid Layout: Controls & Mockup */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Template Selection, Form Triggers & Config (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Template Selector Tabs */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-500" /> เลือกเทมเพลตการ์ด Flex Message
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <button
                onClick={() => setActiveTemplate('PROCUREMENT')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  activeTemplate === 'PROCUREMENT'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-300 ring-2 ring-amber-500/20'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-2">
                  <Package className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold leading-snug">สินค้าค้างสั่งซื้อ</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Procurement Alert</div>
              </button>

              <button
                onClick={() => setActiveTemplate('RECEIPT')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  activeTemplate === 'RECEIPT'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-2">
                  <Receipt className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold leading-snug">ใบเสร็จรับเงิน</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Receipt & Payment</div>
              </button>

              <button
                onClick={() => setActiveTemplate('APPOINTMENT')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  activeTemplate === 'APPOINTMENT'
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="w-7 h-7 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-2">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold leading-snug">ใบนัดหมายส่งมอบ</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Schedule / Delivery</div>
              </button>

              <button
                onClick={() => setActiveTemplate('CUSTOM')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  activeTemplate === 'CUSTOM'
                    ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-900 dark:text-purple-300 ring-2 ring-purple-500/20'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-2">
                  <Code2 className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold leading-snug">Custom JSON</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Live Code Editor</div>
              </button>
            </div>

            {/* Template Specific Configuration Forms */}
            <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
              
              {/* 1. Procurement Trigger Details */}
              {activeTemplate === 'PROCUREMENT' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                        📦 รายการอะไหล่ค้างสั่งซื้อโปรเจกต์: {activeProject?.code} - {activeProject?.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        ดึงข้อมูลสดจาก BOM ที่มีสถานะยังไม่สั่งซื้อ (Planned/Pending)
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold rounded-xl text-xs">
                      {pendingParts.length} รายการ (฿{totalPendingAmount.toLocaleString('th-TH')})
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl max-h-36 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                    {pendingParts.length === 0 ? (
                      <p className="text-center text-slate-400 py-3">ไม่มีรายการค้างสั่งซื้อในโปรเจกต์นี้ 🎉</p>
                    ) : (
                      pendingParts.map((item, idx) => (
                        <div key={item.id} className="py-2 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{idx + 1}. {item.partName}</span>
                            <span className="text-[10px] text-slate-400 ml-2">({item.maker || item.typeSpec || '-'})</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-slate-600 dark:text-slate-300">{item.qty} {item.unit}</span>
                            <span className="text-rose-500 font-bold ml-2">฿{(item.totalAmount || (item.qty * item.unitPrice)).toLocaleString('th-TH')}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* 2. Receipt Interactive Form */}
              {activeTemplate === 'RECEIPT' && (
                <div className="space-y-3">
                  <h4 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                    🧾 ฟอร์มสร้างบิลชำระเงิน & ใบเสร็จ (Web Checkout Trigger)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-slate-500 dark:text-slate-400 font-bold">เลขที่ใบเสร็จ / PO</label>
                      <input
                        type="text"
                        value={receiptForm.orderNo}
                        onChange={e => setReceiptForm({ ...receiptForm, orderNo: e.target.value })}
                        className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 dark:text-slate-400 font-bold">ชื่อลูกค้า / บริษัท</label>
                      <input
                        type="text"
                        value={receiptForm.customerName}
                        onChange={e => setReceiptForm({ ...receiptForm, customerName: e.target.value })}
                        className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 dark:text-slate-400 font-bold">ชื่อรายการสินค้า</label>
                      <input
                        type="text"
                        value={receiptForm.itemName}
                        onChange={e => setReceiptForm({ ...receiptForm, itemName: e.target.value })}
                        className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-500 dark:text-slate-400 font-bold">จำนวน</label>
                        <input
                          type="number"
                          value={receiptForm.itemQty}
                          onChange={e => setReceiptForm({ ...receiptForm, itemQty: Number(e.target.value) })}
                          className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500 dark:text-slate-400 font-bold">ราคาต่อหน่วย (฿)</label>
                        <input
                          type="number"
                          value={receiptForm.itemPrice}
                          onChange={e => setReceiptForm({ ...receiptForm, itemPrice: Number(e.target.value) })}
                          className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Appointment Form */}
              {activeTemplate === 'APPOINTMENT' && (
                <div className="space-y-3">
                  <h4 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                    📅 ฟอร์มกำหนดการนัดหมายส่งมอบ & ทดสอบงาน
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-slate-500 dark:text-slate-400 font-bold">หัวข้อนัดหมาย</label>
                      <input
                        type="text"
                        value={appointmentForm.title}
                        onChange={e => setAppointmentForm({ ...appointmentForm, title: e.target.value })}
                        className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-500 dark:text-slate-400 font-bold">วันที่</label>
                        <input
                          type="date"
                          value={appointmentForm.date}
                          onChange={e => setAppointmentForm({ ...appointmentForm, date: e.target.value })}
                          className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500 dark:text-slate-400 font-bold">เวลา</label>
                        <input
                          type="text"
                          value={appointmentForm.time}
                          onChange={e => setAppointmentForm({ ...appointmentForm, time: e.target.value })}
                          className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-slate-500 dark:text-slate-400 font-bold">สถานที่ / โรงงาน</label>
                      <input
                        type="text"
                        value={appointmentForm.location}
                        onChange={e => setAppointmentForm({ ...appointmentForm, location: e.target.value })}
                        className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 dark:text-slate-400 font-bold">วิศวกรผู้รับผิดชอบ & เบอร์โทร</label>
                      <input
                        type="text"
                        value={appointmentForm.engineerName}
                        onChange={e => setAppointmentForm({ ...appointmentForm, engineerName: e.target.value })}
                        className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleDispatchMessage}
                  disabled={isLoading}
                  className={`px-5 py-3 rounded-2xl font-black text-xs flex items-center space-x-2 text-white shadow-lg transition-all ${
                    operatingMode === 'SIMULATOR'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/30'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/30'
                  }`}
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : operatingMode === 'SIMULATOR' ? <Play className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                  <span>{operatingMode === 'SIMULATOR' ? 'ทดสอบจำลองส่ง (Simulator Run)' : 'ยิงเข้า LINE จริง (Push Message)'}</span>
                </button>

                <button
                  onClick={handleSendTestText}
                  disabled={isLoading}
                  className="px-4 py-3 bg-slate-700 hover:bg-slate-800 text-white rounded-2xl font-black text-xs flex items-center space-x-1.5 shadow-sm transition-all"
                  title="ทดสอบส่งข้อความธรรมดาเพื่อตรวจเช็คการเชื่อมต่อ"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>ทดสอบส่งข้อความสั้น (Test Text)</span>
                </button>

                {activeTemplate === 'PROCUREMENT' && (
                  <button
                    onClick={handleTriggerProcurementAlert}
                    disabled={isLoading}
                    className="px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-black text-xs flex items-center space-x-2 shadow-lg shadow-amber-900/20 transition-all"
                  >
                    <BellRing className="w-4 h-4" />
                    <span>ทดสอบยิงสรุปค้างสั่งซื้อทันที (Trigger Now)</span>
                  </button>
                )}
              </div>

            </div>
          </div>

          {/* Automated Schedule & Cron Settings (2x / Day) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">ระบบแจ้งเตือนอัตโนมัติวันละ 2 เวลา (Cron Job)</h3>
                  <p className="text-xs text-slate-500">ตรวจสอบอะไหล่ค้างสั่งซื้อและยิงสรุปเข้า LINE ตามเวลาที่กำหนด</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={cronEnabled} 
                  onChange={e => setCronEnabled(e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Scheduled Times List */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>รอบเวลาแจ้งเตือนประจำวัน (Timezone: Asia/Bangkok):</span>
                <span className="text-[10px] text-slate-400 font-mono">ระบบจะวนลูปตรวจจับทุก 1 นาที</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {cronTimes.map((time, idx) => (
                  <div key={idx} className="flex items-center space-x-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-xs font-black text-slate-800 dark:text-slate-200 shadow-sm">
                    <Clock className="w-3.5 h-3.5 text-sky-500" />
                    <span>{time} น.</span>
                    {cronTimes.length > 1 && (
                      <button 
                        onClick={() => setCronTimes(cronTimes.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-500 ml-1"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}

                <div className="flex items-center space-x-1">
                  <input
                    type="time"
                    value={newTimeInput}
                    onChange={e => setNewTimeInput(e.target.value)}
                    className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white"
                  />
                  <button
                    onClick={() => {
                      if (newTimeInput && !cronTimes.includes(newTimeInput)) {
                        setCronTimes([...cronTimes, newTimeInput].sort());
                        setNewTimeInput('');
                      }
                    }}
                    className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-xs font-bold rounded-xl"
                  >
                    + เพิ่มเวลา
                  </button>
                </div>
              </div>
            </div>

            {/* Real LINE API Credentials Form */}
            {operatingMode === 'REAL_PUSH' && (
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-500" /> ตั้งค่า LINE Messaging API Credentials
                  </h4>
                  <a
                    href="https://developers.line.biz/console/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-bold text-[11px]"
                  >
                    <span>LINE Developers Console</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div>
                  <label className="text-slate-500 dark:text-slate-400 font-bold">Channel Access Token (Long-lived)</label>
                  <input
                    type="password"
                    value={channelToken}
                    onChange={e => setChannelToken(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiJ9..."
                    className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-slate-500 dark:text-slate-400 font-bold">Target User ID / Group ID (ขึ้นต้นด้วย U... หรือ C...)</label>
                  <input
                    type="text"
                    value={targetId}
                    onChange={e => setTargetId(e.target.value)}
                    placeholder="U1234567890abcdef1234567890abcdef"
                    className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {botInfo && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center space-x-2">
                    <img src={botInfo.pictureUrl || 'https://via.placeholder.com/40'} alt="Bot" className="w-8 h-8 rounded-full border" />
                    <div>
                      <div className="font-bold text-emerald-900 dark:text-emerald-300">{botInfo.displayName}</div>
                      <div className="text-[10px] text-emerald-600">ID: {botInfo.basicId}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2 pt-2">
                  <button
                    onClick={handleTestConnection}
                    disabled={isTestingConnection}
                    className="px-3 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl font-bold flex items-center space-x-1.5"
                  >
                    {isTestingConnection ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
                    <span>ทดสอบ Token (Verify)</span>
                  </button>
                  <button
                    onClick={handleSaveSettings}
                    disabled={isLoading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center space-x-1.5 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>บันทึกการตั้งค่า</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Developer Tools: Payload Inspector, Custom JSON, Code Generator */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-purple-500" /> Developer Tools & HTTP Inspector
              </h3>

              <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setActiveDevTab('INSPECTOR')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    activeDevTab === 'INSPECTOR' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
                  }`}
                >
                  JSON Payload
                </button>
                <button
                  onClick={() => setActiveDevTab('CUSTOM_JSON')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    activeDevTab === 'CUSTOM_JSON' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Custom Editor
                </button>
                <button
                  onClick={() => setActiveDevTab('CURL')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    activeDevTab === 'CURL' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
                  }`}
                >
                  cURL
                </button>
                <button
                  onClick={() => setActiveDevTab('NODEJS')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    activeDevTab === 'NODEJS' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Node.js
                </button>
              </div>
            </div>

            {/* Dev Tools Tab Content */}
            <div className="relative">
              {activeDevTab === 'INSPECTOR' && (
                <div className="relative">
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(currentPayload, null, 2), 'payload')}
                    className="absolute top-2 right-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-mono flex items-center space-x-1 shadow"
                  >
                    {copiedKey === 'payload' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'payload' ? 'คัดลอกแล้ว' : 'Copy JSON'}</span>
                  </button>
                  <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-2xl max-h-64 overflow-y-auto leading-relaxed">
                    {JSON.stringify(currentPayload, null, 2)}
                  </pre>
                </div>
              )}

              {activeDevTab === 'CUSTOM_JSON' && (
                <div className="space-y-2">
                  <textarea
                    value={customJsonInput}
                    onChange={e => {
                      setCustomJsonInput(e.target.value);
                      setActiveTemplate('CUSTOM');
                    }}
                    rows={10}
                    placeholder="วาง LINE Flex Message JSON ที่นี่..."
                    className="w-full p-4 bg-slate-950 text-purple-300 font-mono text-[11px] rounded-2xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-[10px] text-slate-400">
                    💡 เคล็ดลับ: คุณสามารถก๊อปปี้โครงสร้างจาก <a href="https://developers.line.biz/flex-simulator/" target="_blank" rel="noopener noreferrer" className="text-purple-400 underline">LINE Flex Message Simulator</a> มาวางและทดลองส่งได้ทันที
                  </p>
                </div>
              )}

              {activeDevTab === 'CURL' && (
                <div className="relative">
                  <button
                    onClick={() => copyToClipboard(curlCode, 'curl')}
                    className="absolute top-2 right-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-mono flex items-center space-x-1 shadow"
                  >
                    {copiedKey === 'curl' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'curl' ? 'คัดลอกแล้ว' : 'Copy cURL'}</span>
                  </button>
                  <pre className="p-4 bg-slate-950 text-sky-300 font-mono text-[11px] rounded-2xl max-h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    {curlCode}
                  </pre>
                </div>
              )}

              {activeDevTab === 'NODEJS' && (
                <div className="relative">
                  <button
                    onClick={() => copyToClipboard(nodejsCode, 'nodejs')}
                    className="absolute top-2 right-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-mono flex items-center space-x-1 shadow"
                  >
                    {copiedKey === 'nodejs' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'nodejs' ? 'คัดลอกแล้ว' : 'Copy Node.js'}</span>
                  </button>
                  <pre className="p-4 bg-slate-950 text-amber-300 font-mono text-[11px] rounded-2xl max-h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    {nodejsCode}
                  </pre>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Realistic Smartphone Mockup (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="sticky top-24 w-full max-w-sm">
            
            {/* Phone Outer Shell */}
            <div className="relative bg-slate-900 p-3.5 rounded-[44px] shadow-2xl border-4 border-slate-800 ring-1 ring-white/10">
              
              {/* Dynamic Island / Notch */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-4 bg-black rounded-full z-30 flex items-center justify-end px-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              </div>

              {/* Phone Screen Container */}
              <div className="bg-[#8c9cad] dark:bg-[#1a2332] rounded-[34px] overflow-hidden flex flex-col h-[640px] border border-black/20 shadow-inner">
                
                {/* Top Status Bar */}
                <div className="pt-2 px-6 flex items-center justify-between text-black dark:text-white text-[11px] font-bold z-20">
                  <span>{new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                  <div className="flex items-center space-x-1.5 text-[10px]">
                    <span>5G</span>
                    <div className="w-4 h-2 border border-current rounded-sm p-0.5 flex items-center">
                      <div className="w-full h-full bg-current"></div>
                    </div>
                  </div>
                </div>

                {/* LINE Chat Header */}
                <div className="bg-[#243447] text-white px-4 py-3 flex items-center justify-between shadow-md z-10">
                  <div className="flex items-center space-x-2.5">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center font-black text-xs text-white shadow">
                        WG
                      </div>
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#243447]"></div>
                    </div>
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1">
                        <span>WARSGATE BOT</span>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 fill-emerald-400 text-white" />
                      </div>
                      <div className="text-[9px] text-slate-400">LINE Official Account</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Sandbox Mode
                  </div>
                </div>

                {/* Chat Scroll Area */}
                <div className="flex-1 p-3 overflow-y-auto space-y-3 flex flex-col justify-end">
                  
                  {/* Timestamp divider */}
                  <div className="flex justify-center">
                    <span className="bg-black/20 text-white/90 text-[9px] px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                      วันนี้ {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                    </span>
                  </div>

                  {/* Render Mock Flex Bubble */}
                  <div className="max-w-[95%] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-black/10 transition-all hover:scale-[1.01]">
                    
                    {/* Header */}
                    {currentPayload?.contents?.header && (
                      <div 
                        className="p-3.5 text-white"
                        style={{ backgroundColor: currentPayload.contents.header.backgroundColor || '#0f172a' }}
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-amber-400 tracking-wider">
                            {currentPayload.contents.header.contents?.[0]?.contents?.[0]?.text || 'NOTIFICATION'}
                          </span>
                          <span className="text-slate-400 text-[9px]">
                            {currentPayload.contents.header.contents?.[0]?.contents?.[1]?.text || ''}
                          </span>
                        </div>
                        <div className="text-sm font-black mt-1 leading-snug">
                          {currentPayload.contents.header.contents?.[1]?.text || 'Message Title'}
                        </div>
                        <div className="text-[10px] text-slate-300 mt-0.5">
                          {currentPayload.contents.header.contents?.[2]?.text || ''}
                        </div>
                      </div>
                    )}

                    {/* Body */}
                    <div className="p-3.5 space-y-2.5 text-slate-900 dark:text-white">
                      {activeTemplate === 'PROCUREMENT' && (
                        <>
                          <div className="bg-amber-50 dark:bg-amber-950/50 p-2 rounded-xl flex items-center justify-between text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
                            <div>
                              <div className="text-[9px] opacity-75">จำนวนค้างสั่ง</div>
                              <div className="text-xs font-black">{pendingParts.length} รายการ</div>
                            </div>
                            <div className="text-right">
                              <div className="text-[9px] opacity-75">งบประมาณรวม</div>
                              <div className="text-xs font-black">฿{totalPendingAmount.toLocaleString('th-TH')}</div>
                            </div>
                          </div>

                          <div className="text-[10px] font-bold text-slate-500 pt-1">รายการด่วน:</div>
                          <div className="space-y-2 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                            {pendingParts.slice(0, 4).map((item, idx) => (
                              <div key={item.id} className="pt-1.5 text-[10px]">
                                <div className="flex justify-between font-bold">
                                  <span className="truncate max-w-[140px]">{idx + 1}. {item.partName}</span>
                                  <span className="text-rose-600 font-mono">฿{(item.totalAmount || (item.qty * item.unitPrice)).toLocaleString('th-TH')}</span>
                                </div>
                                <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                                  <span>{item.maker || item.typeSpec || '-'}</span>
                                  <span>{item.qty} {item.unit}</span>
                                </div>
                                {item.purchaseLink && (
                                  <a
                                    href={item.purchaseLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-1 inline-flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900"
                                  >
                                    <span>🔗 สั่งซื้อ</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {activeTemplate === 'RECEIPT' && (
                        <div className="space-y-1.5 text-[10px]">
                          <div className="flex justify-between">
                            <span className="text-slate-500">ลูกค้า:</span>
                            <span className="font-bold">{receiptForm.customerName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">ช่องทาง:</span>
                            <span className="font-bold text-emerald-600">{receiptForm.paymentMethod}</span>
                          </div>
                          <div className="border-t pt-1.5 mt-1">
                            <div className="flex justify-between">
                              <span>{receiptForm.itemName} (x{receiptForm.itemQty})</span>
                              <span className="font-bold font-mono">฿{(receiptForm.itemQty * receiptForm.itemPrice).toLocaleString('th-TH')}</span>
                            </div>
                          </div>
                          <div className="border-t pt-1.5 flex justify-between font-bold text-xs text-emerald-600">
                            <span>ยอดรวมสุทธิ</span>
                            <span>฿{((receiptForm.itemQty * receiptForm.itemPrice) * 1.07).toLocaleString('th-TH')}</span>
                          </div>
                        </div>
                      )}

                      {activeTemplate === 'APPOINTMENT' && (
                        <div className="space-y-1.5 text-[10px]">
                          <div className="flex justify-between">
                            <span className="text-slate-500">📅 วันที่:</span>
                            <span className="font-bold">{appointmentForm.date} ({appointmentForm.time})</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">📍 สถานที่:</span>
                            <span className="font-bold text-right max-w-[140px] truncate">{appointmentForm.location}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">👷 วิศวกร:</span>
                            <span className="font-bold">{appointmentForm.engineerName}</span>
                          </div>
                        </div>
                      )}

                      {activeTemplate === 'CUSTOM' && (
                        <div className="text-[10px] text-slate-600 dark:text-slate-300 font-mono">
                          {currentPayload?.altText || 'Custom Flex Message'}
                        </div>
                      )}
                    </div>

                    {/* Footer CTA Button */}
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
                      <button 
                        onClick={() => showToast('info', 'Interaction Test', 'ปุ่ม Action ในการ์ด Flex Message ทำงานถูกต้อง')}
                        className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1 shadow-sm transition-all"
                      >
                        <span>เปิดดูรายละเอียด</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>

                  {/* Read timestamp */}
                  <div className="flex justify-end pr-1">
                    <span className="text-[8px] text-slate-400">อ่านแล้ว 14:02</span>
                  </div>

                </div>

                {/* Simulated LINE Input Bar */}
                <div className="p-2 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-2">
                  <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full px-3 py-1 text-[10px] text-slate-400">
                    พิมพ์ข้อความ...
                  </div>
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                    <Send className="w-3 h-3" />
                  </div>
                </div>

              </div>
            </div>

            <div className="text-center mt-3 text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
              <span>Interactive Simulator (Live Preview)</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
