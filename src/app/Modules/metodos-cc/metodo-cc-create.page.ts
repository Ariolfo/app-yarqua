import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController, ToastController } from '@ionic/angular';

import { MetodoCCService } from '../../Shared/Services/metodo-cc.service';

@Component({
  selector: 'app-metodo-cc-create',
  templateUrl: './metodo-cc-create.page.html',
  styleUrls: ['./metodo-cc-create.page.scss'],
  standalone: false,
})
export class MetodoCCCreatePage implements OnInit {
  saving = false;
  loading = false;
  editId: number | null = null;

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', [Validators.maxLength(500)]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly metodoService: MetodoCCService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly navCtrl: NavController,
    private readonly toastCtrl: ToastController
  ) {}

  get isEdit(): boolean {
    return this.editId != null;
  }

  get pageTitle(): string {
    return this.isEdit ? 'Editar método' : 'Nuevo método';
  }

  async ngOnInit(): Promise<void> {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      return;
    }
    const id = Number(idParam);
    if (!Number.isFinite(id)) {
      return;
    }
    this.editId = id;
    this.loading = true;
    try {
      const metodo = await this.metodoService.getById(id);
      this.form.patchValue({
        name: metodo.name,
        description: metodo.description || '',
      });
    } catch (e) {
      const toast = await this.toastCtrl.create({
        message: e instanceof Error ? e.message : 'No se pudo cargar el método',
        duration: 2500,
        color: 'danger',
      });
      await toast.present();
      await this.router.navigateByUrl('/metodos-cc');
    } finally {
      this.loading = false;
    }
  }

  async goHome(): Promise<void> {
    await this.navCtrl.navigateRoot('/map');
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const v = this.form.getRawValue();
    const payload = {
      name: (v.name ?? '').trim(),
      description: v.description?.trim() || null,
    };
    try {
      if (this.editId != null) {
        await this.metodoService.update(this.editId, payload);
      } else {
        await this.metodoService.create(payload);
      }
      const toast = await this.toastCtrl.create({
        message: this.isEdit ? 'Método actualizado' : 'Método creado',
        duration: 2000,
        color: 'success',
      });
      await toast.present();
      await this.router.navigateByUrl('/metodos-cc', { replaceUrl: true });
    } catch (e) {
      const toast = await this.toastCtrl.create({
        message: e instanceof Error ? e.message : 'No se pudo guardar',
        duration: 2500,
        color: 'danger',
      });
      await toast.present();
    } finally {
      this.saving = false;
    }
  }

  cancel(): void {
    void this.router.navigateByUrl('/metodos-cc');
  }
}
