import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'splash',
    pathMatch: 'full',
  },
  {
    path: 'splash',
    loadChildren: () =>
      import('./pages/splash/splash.module').then((m) => m.SplashPageModule),
  },
  {
    path: 'register',
    loadChildren: () =>
      import('./pages/register/register.module').then(
        (m) => m.RegisterPageModule
      ),
  },
  {
    path: 'map',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./pages/map/map.module').then((m) => m.MapPageModule),
  },
  {
    path: 'sensor/:id',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./pages/sensor-detail/sensor-detail.module').then(
        (m) => m.SensorDetailPageModule
      ),
  },
  {
    path: 'irrigation-calculator',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./pages/irrigation-calculator/irrigation-calculator.module').then(
        (m) => m.IrrigationCalculatorPageModule
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
