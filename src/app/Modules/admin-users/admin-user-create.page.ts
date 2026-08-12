import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MenuController, NavController, ToastController } from '@ionic/angular';

import { AdminUsersService } from '../../Shared/Services/admin-users.service';

@Component({
  selector: 'app-admin-user-create',
  templateUrl: './admin-user-create.page.html',
  styleUrls: ['./admin-user-create.page.scss'],
  standalone: false,
})
export class AdminUserCreatePage {
  form: FormGroup;
  submitting = false;
  showPassword = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly adminUsers: AdminUsersService,
    private readonly menuCtrl: MenuController,
    private readonly navCtrl: NavController,
    private readonly router: Router,
    private readonly toastCtrl: ToastController
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(120)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  async openMenu(): Promise<void> {
    await this.menuCtrl.open('main-menu');
  }

  async goHome(): Promise<void> {
    await this.navCtrl.navigateRoot('/map');
  }

  async goBack(): Promise<void> {
    await this.router.navigateByUrl('/admin-users');
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    try {
      await this.adminUsers.create({
        name: (this.form.value.name as string).trim(),
        email: (this.form.value.email as string).trim(),
        password: this.form.value.password as string,
      });
      const toast = await this.toastCtrl.create({
        message: 'Admin creado',
        duration: 2200,
        color: 'success',
      });
      await toast.present();
      await this.router.navigateByUrl('/admin-users', { replaceUrl: true });
    } catch (e) {
      const toast = await this.toastCtrl.create({
        message: e instanceof Error ? e.message : 'No se pudo crear el admin',
        duration: 3200,
        color: 'danger',
      });
      await toast.present();
    } finally {
      this.submitting = false;
    }
  }
}
