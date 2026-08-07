import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController, NavController, ToastController } from '@ionic/angular';

import { MetodoCC } from '../../Shared/Models/catalog';
import { MetodoCCService } from '../../Shared/Services/metodo-cc.service';

@Component({
  selector: 'app-metodos-cc',
  templateUrl: './metodos-cc.page.html',
  styleUrls: ['./metodos-cc.page.scss'],
  standalone: false,
})
export class MetodosCCPage implements OnInit {
  loading = true;
  error: string | null = null;
  metodos: MetodoCC[] = [];

  constructor(
    private readonly metodoService: MetodoCCService,
    private readonly menuCtrl: MenuController,
    private readonly navCtrl: NavController,
    private readonly router: Router,
    private readonly toastCtrl: ToastController
  ) {}

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async openMenu(): Promise<void> {
    await this.menuCtrl.open('main-menu');
  }

  async goHome(): Promise<void> {
    await this.navCtrl.navigateRoot('/map');
  }

  async load(): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      this.metodos = await this.metodoService.list();
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'No se pudo cargar métodos';
      const toast = await this.toastCtrl.create({
        message: this.error,
        duration: 2500,
        color: 'danger',
      });
      await toast.present();
    } finally {
      this.loading = false;
    }
  }

  goCreate(): void {
    void this.router.navigateByUrl('/metodos-cc/new');
  }

  goEdit(metodo: MetodoCC): void {
    void this.router.navigateByUrl(`/metodos-cc/${metodo.id}/edit`);
  }
}
