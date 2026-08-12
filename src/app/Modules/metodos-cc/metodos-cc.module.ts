import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';

import { MetodosCCPage } from './metodos-cc.page';

const routes: Routes = [{ path: '', component: MetodosCCPage }];

@NgModule({
  imports: [CommonModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [MetodosCCPage],
})
export class MetodosCCPageModule {}
