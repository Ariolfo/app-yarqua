import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { MenuController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  helpCircleOutline,
  homeOutline,
  logOutOutline,
  mapOutline,
  menuOutline,
  refreshOutline,
  waterOutline,
} from 'ionicons/icons';

import { AuthService } from './Shared/Services/auth.service';

addIcons({
  'menu-outline': menuOutline,
  'home-outline': homeOutline,
  'refresh-outline': refreshOutline,
  'map-outline': mapOutline,
  'water-outline': waterOutline,
  'log-out-outline': logOutOutline,
  'help-circle-outline': helpCircleOutline,
});

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  readonly appPages = [
    { title: 'Mapa', url: '/map', icon: 'map-outline' },
    {
      title: 'Calculadora de riego',
      url: '/irrigation-calculator',
      icon: 'water-outline',
    },
  ];

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly menuCtrl: MenuController
  ) {}

  async ngOnInit(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    try {
      await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: '#ffffff' });
    } catch {
      // Emuladores sin plugin StatusBar: ignorar.
    }
  }

  /**
   * Navega a una ruta del menú y cierra el panel.
   */
  async openPage(url: string): Promise<void> {
    await this.menuCtrl.close('main-menu');
    await this.router.navigateByUrl(url);
  }

  /**
   * Cierra sesión y vuelve a la pantalla de registro.
   */
  async logout(): Promise<void> {
    await this.auth.logout();
    await this.menuCtrl.close('main-menu');
    await this.router.navigateByUrl('/register', { replaceUrl: true });
  }
}
