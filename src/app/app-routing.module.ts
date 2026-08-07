import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './Shared/Guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'splash',
    pathMatch: 'full',
  },
  {
    path: 'splash',
    loadChildren: () =>
      import('./Modules/splash/splash.module').then((m) => m.SplashPageModule),
  },
  {
    path: 'register',
    loadChildren: () =>
      import('./Modules/register/register.module').then(
        (m) => m.RegisterPageModule
      ),
  },
  {
    path: 'map',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./Modules/map/map.module').then((m) => m.MapPageModule),
  },
  {
    path: 'sensor/:id',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./Modules/sensor-detail/sensor-detail.module').then(
        (m) => m.SensorDetailPageModule
      ),
  },
  {
    path: 'irrigation-calculator',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./Modules/irrigation-calculator/irrigation-calculator.module').then(
        (m) => m.IrrigationCalculatorPageModule
      ),
  },
  {
    path: 'sensors',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./Modules/sensors/sensors.module').then((m) => m.SensorsPageModule),
  },
  {
    path: 'crops',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./Modules/crops/crops.module').then((m) => m.CropsPageModule),
  },
  {
    path: 'metodos-cc',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./Modules/metodos-cc/metodos-cc.module').then(
        (m) => m.MetodosCCPageModule
      ),
  },
  {
    path: 'home',
    redirectTo: 'map',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
