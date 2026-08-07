import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';

import { MetodoCCCreatePage } from './metodo-cc-create.page';
import { MetodosCCPage } from './metodos-cc.page';

const routes: Routes = [
  { path: '', component: MetodosCCPage },
  { path: 'new', component: MetodoCCCreatePage },
  { path: ':id/edit', component: MetodoCCCreatePage },
];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  declarations: [MetodosCCPage, MetodoCCCreatePage],
})
export class MetodosCCPageModule {}
