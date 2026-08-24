import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, NavController, ToastController } from '@ionic/angular';

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
    private readonly toastCtrl: ToastController,
    private readonly alertCtrl: AlertController
  ) {}

  get isEdit(): boolean {
    return this.editId != null;
  }

  get pageTitle(): string {
    return this.isEdit ? 'Consultar sensor' : 'Nuevo sensor';
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      void this.loadFromRoute(params.get('id'));
    });
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
        await this.toast('Sensor actualizado', 'success');
      } else {
        const created = await this.catalog.create(payload);
        await this.toast('Sensor creado', 'success');
        await this.router.navigateByUrl(`/sensors/${created.id}/edit`, {
          replaceUrl: true,
        });
      }
    } catch (e) {
      await this.toast(
        e instanceof Error ? e.message : 'No se pudo guardar',
        'danger'
      );
    } finally {
      this.saving = false;
    }
  }

  async confirmDelete(): Promise<void> {
    if (this.editId == null) {
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Eliminar sensor',
      message: '¿Desea eliminar este sensor del catálogo?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            void this.deleteSensor();
          },
        },
      ],
    });
    await alert.present();
  }

  goToList(): void {
    void this.router.navigateByUrl('/sensors');
  }

  private async loadFromRoute(idParam: string | null): Promise<void> {
    this.loading = true;
    try {
      const [networks, crops] = await Promise.all([
        this.catalog.listNetworks(),
        this.cropService.list(),
      ]);
      this.networks = networks;
      this.crops = crops;

      if (!idParam) {
        this.editId = null;
        this.form.reset({
          name: '',
          networkId: null,
          cropId: null,
          latitude: null,
          longitude: null,
          sensorStatus: 'desconocido',
          connectivity: 'offline',
          farm: '',
        });
        return;
      }

      const id = Number(idParam);
      if (!Number.isFinite(id)) {
        return;
      }

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
    } catch (e) {
      await this.toast(
        e instanceof Error ? e.message : 'No se pudo cargar el sensor',
        'danger'
      );
      if (this.editId != null) {
        await this.router.navigateByUrl('/sensors');
      }
    } finally {
      this.loading = false;
    }
  }

  private async deleteSensor(): Promise<void> {
    if (this.editId == null) {
      return;
    }

    try {
      await this.catalog.remove(this.editId);
      await this.toast('Sensor eliminado', 'success');
      await this.router.navigateByUrl('/sensors', { replaceUrl: true });
    } catch (e) {
      await this.toast(
        e instanceof Error ? e.message : 'No se pudo eliminar',
        'danger'
      );
    }
  }

  private async toast(
    message: string,
    color: 'danger' | 'success' | 'warning'
  ): Promise<void> {
    const t = await this.toastCtrl.create({ message, duration: 2500, color });
    await t.present();
  }
}
