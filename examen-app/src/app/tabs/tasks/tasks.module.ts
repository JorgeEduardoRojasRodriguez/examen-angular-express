import { NgModule } from '@angular/core';
import { TasksPageRoutingModule } from './tasks-routing.module';
import { TasksPage } from './tasks.page';

@NgModule({
  imports: [
    TasksPageRoutingModule,
    TasksPage
  ]
})
export class TasksPageModule {}
