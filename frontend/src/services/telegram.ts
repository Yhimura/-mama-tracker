declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
}

class TelegramService {
  private tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;

  init() {
    if (!this.tg) {
      console.log('Running outside Telegram WebApp. Using mock environment.');
      return;
    }

    try {
      this.tg.ready();
      this.tg.expand();
      
      // Set pastel header & background matching the app
      if (this.tg.setHeaderColor) {
        this.tg.setHeaderColor('#FFF9F9');
      }
      if (this.tg.setBackgroundColor) {
        this.tg.setBackgroundColor('#FFF9F9');
      }
      if (this.tg.enableClosingConfirmation) {
        this.tg.enableClosingConfirmation();
      }
    } catch (e) {
      console.error('Error initializing Telegram WebApp:', e);
    }
  }

  get initData(): string {
    return this.tg?.initData || '';
  }

  get user() {
    return this.tg?.initDataUnsafe?.user || {
      id: 999999999,
      first_name: 'Мама',
      username: 'future_mom',
      language_code: 'ru',
    };
  }

  hapticImpact(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light') {
    try {
      this.tg?.HapticFeedback?.impactOccurred(style);
    } catch (e) {
      // Ignore if not supported
    }
  }

  hapticNotification(type: 'error' | 'success' | 'warning' = 'success') {
    try {
      this.tg?.HapticFeedback?.notificationOccurred(type);
    } catch (e) {
      // Ignore
    }
  }

  hapticSelection() {
    try {
      this.tg?.HapticFeedback?.selectionChanged();
    } catch (e) {
      // Ignore
    }
  }

  showMainButton(text: string, onClick: () => void) {
    if (!this.tg?.MainButton) return;
    try {
      this.tg.MainButton.setText(text);
      this.tg.MainButton.setParams({
        color: '#FB7193',
        text_color: '#FFFFFF',
      });
      this.tg.MainButton.onClick(onClick);
      this.tg.MainButton.show();
    } catch (e) {
      console.error('Error showing MainButton:', e);
    }
  }

  hideMainButton() {
    if (!this.tg?.MainButton) return;
    try {
      this.tg.MainButton.hide();
    } catch (e) {
      // Ignore
    }
  }

  close() {
    this.tg?.close();
  }
}

export const tg = new TelegramService();
