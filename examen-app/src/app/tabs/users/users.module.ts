import { NgModule } from '@angular/core';
import { UsersPageRoutingModule } from './users-routing.module';
import { UsersPage } from './users.page';

@NgModule({
  imports: [
    UsersPageRoutingModule,
    UsersPage
  ]
})
export class UsersPageModule {}
