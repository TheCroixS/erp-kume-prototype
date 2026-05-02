export type NotifLevel = 'info' | 'warning' | 'critical';

class NotificationService {
  private permission: NotificationPermission = 'default';

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') { this.permission = 'granted'; return true; }
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    this.permission = result;
    return result === 'granted';
  }

  async send(title: string, body: string, level: NotifLevel = 'info', href?: string): Promise<void> {
    if (this.permission !== 'granted') {
      const ok = await this.requestPermission();
      if (!ok) return;
    }
    const icons: Record<NotifLevel, string> = {
      info: '/icons/icon-info.png',
      warning: '/icons/icon-warning.png',
      critical: '/icons/icon-critical.png',
    };
    const n = new Notification(title, {
      body,
      icon: icons[level],
      tag: `kume-${level}-${Date.now()}`,
      requireInteraction: level === 'critical',
    });
    if (href) n.onclick = () => { window.focus(); n.close(); };
  }

  async sendBatch(alerts: { title: string; description: string; level: NotifLevel; href?: string }[]): Promise<void> {
    if (alerts.length === 0) return;
    const ok = await this.requestPermission();
    if (!ok) return;
    if (alerts.length > 3) {
      await this.send(
        `Küme — ${alerts.length} alertas activas`,
        `${alerts.filter(a => a.level === 'critical').length} críticas, ${alerts.filter(a => a.level === 'warning').length} advertencias`,
        alerts.some(a => a.level === 'critical') ? 'critical' : 'warning'
      );
    } else {
      for (const a of alerts) await this.send(a.title, a.description, a.level, a.href);
    }
  }
}

export const notificationService = new NotificationService();
