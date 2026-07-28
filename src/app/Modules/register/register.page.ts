import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

import { GeoCity, GeoCountry, GeoDepartment } from '../../Shared/Models/geo';
import { AuthService } from '../../Shared/Services/auth.service';
import { GeoService } from '../../Shared/Services/geo.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false,
})
export class RegisterPage implements OnInit {
  form: FormGroup;
  countries: GeoCountry[] = [];
  departments: GeoDepartment[] = [];
  cities: GeoCity[] = [];
  catalogLoading = true;
  catalogError: string | null = null;
  submitting = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly geo: GeoService,
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly toastCtrl: ToastController
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      countryId: [null as number | null, Validators.required],
      departmentId: [null as number | null, Validators.required],
      cityId: [null as number | null, Validators.required],
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadCountries();
  }

  /**
   * Carga países y reintenta si hubo error de red.
   */
  async loadCountries(): Promise<void> {
    this.catalogLoading = true;
    this.catalogError = null;
    try {
      this.countries = await this.geo.getCountries();
      const colombia = this.countries.find((c) =>
        c.name.toLowerCase().includes('colombia')
      );
      if (colombia) {
        this.form.patchValue({ countryId: colombia.id });
        await this.onCountryChange(colombia.id);
      }
    } catch (e) {
      this.catalogError =
        e instanceof Error
          ? e.message
          : 'No pudimos cargar el catálogo geográfico.';
    } finally {
      this.catalogLoading = false;
    }
  }

  /**
   * Al cambiar país, recarga departamentos y limpia ciudad.
   */
  async onCountryChange(paisId: number | null): Promise<void> {
    this.departments = [];
    this.cities = [];
    this.form.patchValue({ departmentId: null, cityId: null });
    if (paisId == null) {
      return;
    }
    try {
      this.departments = await this.geo.getDepartments(paisId);
      const valle = this.departments.find((d) =>
        d.name.toLowerCase().includes('valle')
      );
      if (valle) {
        this.form.patchValue({ departmentId: valle.id });
        await this.onDepartmentChange(valle.id);
      }
    } catch (e) {
      await this.showToast(
        e instanceof Error ? e.message : 'Error al cargar departamentos'
      );
    }
  }

  /**
   * Al cambiar departamento, recarga ciudades.
   */
  async onDepartmentChange(depoId: number | null): Promise<void> {
    this.cities = [];
    this.form.patchValue({ cityId: null });
    if (depoId == null) {
      return;
    }
    try {
      this.cities = await this.geo.getCities(depoId);
    } catch (e) {
      await this.showToast(
        e instanceof Error ? e.message : 'Error al cargar ciudades'
      );
    }
  }

  /**
   * Envía el registro y navega al mapa.
   */
  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      await this.showToast('Completa nombre, país, departamento y ciudad.');
      return;
    }

    const country = this.countries.find(
      (c) => c.id === this.form.value.countryId
    );
    const department = this.departments.find(
      (d) => d.id === this.form.value.departmentId
    );
    const city = this.cities.find((c) => c.id === this.form.value.cityId);
    if (!country || !department || !city) {
      await this.showToast('Selecciona país, departamento y ciudad válidos.');
      return;
    }

    this.submitting = true;
    try {
      await this.auth.register({
        name: this.form.value.name as string,
        country: country.name,
        department: department.name,
        city: city.name,
      });
      await this.router.navigateByUrl('/map', { replaceUrl: true });
    } catch (e) {
      await this.showToast(
        e instanceof Error ? e.message : 'No se pudo completar el registro'
      );
    } finally {
      this.submitting = false;
    }
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3200,
      color: 'danger',
      position: 'bottom',
    });
    await toast.present();
  }
}
