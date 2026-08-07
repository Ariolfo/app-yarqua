import { Component, OnInit } from '@angular/core';
import { AlertController, MenuController, NavController } from '@ionic/angular';

import { IrrigationCropProfile } from '../../Shared/Models/irrigation';
import { IrrigationCalculatorService } from '../../Shared/Services/irrigation-calculator.service';

@Component({
  selector: 'app-irrigation-calculator',
  templateUrl: './irrigation-calculator.page.html',
  styleUrls: ['./irrigation-calculator.page.scss'],
  standalone: false,
})
export class IrrigationCalculatorPage implements OnInit {
  crops: readonly IrrigationCropProfile[] = [];
  selectedCrop!: IrrigationCropProfile;

  fieldCapacity = '';
  maxIrrigationLimit = '';
  irrigationDecision = '';
  morningMoisture = '';
  afternoonMoisture = '';
  observation = '';
  irrigationAction: string | null = null;
  consultationDate = new Date().toISOString().slice(0, 10);

  constructor(
    private readonly calculator: IrrigationCalculatorService,
    private readonly alertCtrl: AlertController,
    private readonly menuCtrl: MenuController,
    private readonly navCtrl: NavController
  ) {}

  async ngOnInit(): Promise<void> {
    this.crops = await this.calculator.loadProfiles();
    if (this.crops.length) {
      this.selectCrop(this.crops[0]);
    }
  }

  /**
   * Abre el menú lateral.
   */
  async openMenu(): Promise<void> {
    await this.menuCtrl.open('main-menu');
  }

  /** Vuelve al mapa principal. */
  async goHome(): Promise<void> {
    await this.navCtrl.navigateRoot('/map');
  }

  /**
   * Selecciona un cultivo y rellena los parámetros sugeridos.
   */
  selectCrop(crop: IrrigationCropProfile): void {
    this.selectedCrop = crop;
    this.fieldCapacity = this.formatNumber(crop.fieldCapacity);
    this.maxIrrigationLimit = this.formatNumber(crop.maxIrrigationLimit);
    this.irrigationDecision = this.formatNumber(crop.irrigationDecision);
    this.morningMoisture = '';
    this.afternoonMoisture = '';
    this.observation = '';
    this.irrigationAction = null;
  }

  /**
   * Recomendación actual o null si faltan lecturas válidas.
   */
  get recommendation(): string | null {
    const morning = this.parsePercent(this.morningMoisture);
    const afternoon = this.parsePercent(this.afternoonMoisture);
    const decision = this.parsePercent(this.irrigationDecision);
    if (morning == null || afternoon == null || decision == null) {
      return null;
    }
    return this.calculator.recommendation(morning, afternoon, decision);
  }

  get resultClass(): string {
    if (this.recommendation === 'No regar') {
      return 'result-ok';
    }
    if (this.recommendation === 'Regar') {
      return 'result-irrigate';
    }
    return 'result-neutral';
  }

  /**
   * Muestra ayuda contextual.
   */
  async showHelp(title: string, message: string): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: title,
      message,
      buttons: ['Entendido'],
    });
    await alert.present();
  }

  private formatNumber(value: number): string {
    const text = value.toFixed(2);
    return text.replace(/\.?0+$/, '');
  }

  private parsePercent(raw: string): number | null {
    const value = Number(String(raw).trim().replace(',', '.'));
    if (Number.isNaN(value) || value < 0 || value > 100) {
      return null;
    }
    return value;
  }
}
