import { Component } from '@angular/core';
import { MenuController, NavController } from '@ionic/angular';

/**
 * Entrada de menú Admin para Métodos CC (sin catálogo ni formularios por ahora).
 */
@Component({
  selector: 'app-metodos-cc',
  templateUrl: './metodos-cc.page.html',
  styleUrls: ['./metodos-cc.page.scss'],
  standalone: false,
})
export class MetodosCCPage {
  constructor(
    private readonly menuCtrl: MenuController,
    private readonly navCtrl: NavController
  ) {}

  async openMenu(): Promise<void> {
    await this.menuCtrl.open('main-menu');
  }

  async goHome(): Promise<void> {
    await this.navCtrl.navigateRoot('/map');
  }
}
