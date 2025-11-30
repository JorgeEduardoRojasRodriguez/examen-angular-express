import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/components/login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/components/register/register.component').then(m => m.RegisterComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'users',
        pathMatch: 'full'
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users/components/user-list/user-list.component').then(m => m.UserListComponent)
      },
      {
        path: 'tasks',
        loadComponent: () =>
          import('./features/tasks/components/task-list/task-list.component').then(m => m.TaskListComponent)
      },
      {
        path: 'notes',
        loadComponent: () =>
          import('./features/notes/components/note-list/note-list.component').then(m => m.NoteListComponent)
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/products/components/product-list/product-list.component').then(m => m.ProductListComponent)
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/orders/components/order-list/order-list.component').then(m => m.OrderListComponent)
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notifications/components/notification-list/notification-list.component').then(m => m.NotificationListComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
