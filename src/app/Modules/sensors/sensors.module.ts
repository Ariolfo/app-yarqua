import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';

import { SensorCreatePage } from './sensor-create.page';
import { SensorsPage } from './sensors.page';

const routes: Routes = [
  { path: '', component: SensorsPage },
  { path: 'new', component: SensorCreatePage },
  { path: ':id/edit', component: SensorCreatePage },
];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  declarations: [SensorsPage, SensorCreatePage],
})
export class SensorsPageModule {}
