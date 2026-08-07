import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController, ToastController } from '@ionic/angular';

import { Crop, Network } from '../../Shared/Models/catalog';
import { CatalogSensorService } from '../../Shared/Services/catalog-sensor.service';
import { CropService } from '../../Shared/Services/crop.service';

@Component({
  selector: 'app-sensor-create',
  templateUrl: './sensor-create.page.html',
  styleUrls: ['./sensor-create.page.scss'],
  standalone: false,
})
export class SensorCreatePage implements OnInit {
  networks: Network[] = [];
  crops: Crop[] = [];
  saving = false;
  loading = false;
  editId: number | null = null;

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
    networkId: [null as number | null, Validators.required],
    cropId: [null as number | null],
    latitude: [null as number | null],
    longitude: [null as number | null],
    sensorStatus: ['desconocido'],
    connectivity: ['offline'],
    farm: [''],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly catalog: CatalogSensorService,
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
    return this.isEdit ? 'Editar sensor' : 'Nuevo sensor';
  }

  async ngOnInit(): Promise<void> {
    this.loading = true;
    try {
      const [networks, crops] = await Promise.all([
        this.catalog.listNetworks(),
        this.cropService.list(),
      ]);
      this.networks = networks;
      this.crops = crops;

      const idParam = this.route.snapshot.paramMap.get('id');
      if (idParam) {
        const id = Number(idParam);
        if (Number.isFinite(id)) {
          this.editId = id;
          const sensor = await this.catalog.getById(id);
          this.form.patchValue({
            name: sensor.name,
            networkId: sensor.networkId,
            cropId: sensor.cropId ?? null,
            latitude: sensor.latitude ?? null,
            longitude: sensor.longitude ?? null,
            sensorStatus: sensor.sensorStatus || 'desconocido',
            connectivity: sensor.connectivity || 'offline',
            farm: sensor.farm || '',
          });
        }
      }
    } catch (e) {
      const toast = await this.toastCtrl.create({
        message: e instanceof Error ? e.message : 'No se pudo cargar el sensor',
        duration: 2500,
        color: 'danger',
      });
      await toast.present();
      if (this.editId != null) {
        await this.router.navigateByUrl('/sensors');
      }
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
      networkId: Number(v.networkId),
      cropId: v.cropId != null ? Number(v.cropId) : null,
      latitude:
        v.latitude != null && v.latitude !== ('' as unknown)
          ? Number(v.latitude)
          : null,
      longitude:
        v.longitude != null && v.longitude !== ('' as unknown)
          ? Number(v.longitude)
          : null,
      sensorStatus: v.sensorStatus || 'desconocido',
      connectivity: v.connectivity || 'offline',
      farm: v.farm?.trim() || null,
    };
    try {
      if (this.editId != null) {
        await this.catalog.update(this.editId, payload);
      } else {
        await this.catalog.create(payload);
      }
      const toast = await this.toastCtrl.create({
        message: this.isEdit ? 'Sensor actualizado' : 'Sensor creado',
        duration: 2000,
        color: 'success',
      });
      await toast.present();
      await this.router.navigateByUrl('/sensors', { replaceUrl: true });
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
    void this.router.navigateByUrl('/sensors');
  }
}
