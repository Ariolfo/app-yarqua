import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController, ToastController } from '@ionic/angular';

import { CropService } from '../../Shared/Services/crop.service';

@Component({
  selector: 'app-crop-create',
  templateUrl: './crop-create.page.html',
  styleUrls: ['./crop-create.page.scss'],
  standalone: false,
})
export class CropCreatePage implements OnInit {
  saving = false;
  loading = false;
  editId: number | null = null;

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    fieldCapacity: [null as number | null, [Validators.required]],
    maxIrrigationLimit: [null as number | null, [Validators.required]],
    irrigationDecision: [null as number | null, [Validators.required]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly cropService: CropService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly navCtrl: NavController,
    private readonly toastCtrl: ToastController
  ) {}

  get isEdit(): boolean {
    return this.editId != null;
  }

  get pageTitle(): string {
    return this.isEdit ? 'Editar cultivo' : 'Nuevo cultivo';
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
      const crop = await this.cropService.getById(id);
      this.form.patchValue({
        name: crop.name,
        fieldCapacity: crop.fieldCapacity,
        maxIrrigationLimit: crop.maxIrrigationLimit,
        irrigationDecision: crop.irrigationDecision,
      });
    } catch (e) {
      const toast = await this.toastCtrl.create({
        message: e instanceof Error ? e.message : 'No se pudo cargar el cultivo',
        duration: 2500,
        color: 'danger',
      });
      await toast.present();
      await this.router.navigateByUrl('/crops');
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
      fieldCapacity: Number(v.fieldCapacity),
      maxIrrigationLimit: Number(v.maxIrrigationLimit),
      irrigationDecision: Number(v.irrigationDecision),
    };
    try {
      if (this.editId != null) {
        await this.cropService.update(this.editId, payload);
      } else {
        await this.cropService.create(payload);
      }
      const toast = await this.toastCtrl.create({
        message: this.isEdit ? 'Cultivo actualizado' : 'Cultivo creado',
        duration: 2000,
        color: 'success',
      });
      await toast.present();
      await this.router.navigateByUrl('/crops', { replaceUrl: true });
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
    void this.router.navigateByUrl('/crops');
  }
}
