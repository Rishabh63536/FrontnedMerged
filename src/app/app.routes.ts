import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { roleGuard } from './core/guards/role-guard';
import { ProductDetailsComponent } from './pages/Customer/components/product-details/product-details';
import { MyOrdersComponent } from './pages/Customer/components/my-orders/my-orders';
import { OrderDetailComponent } from './pages/Customer/components/order-detail/order-detail';
import { LandingPage } from './pages/Customer/components/landing-page/landing-page';
import { RegisterComponent } from './pages/Customer/components/register/register';
import { DashboardComponent } from './pages/Admin/components/dashboard/dashboard';
import { OrdersComponent } from './pages/Admin/components/orders/orders';
import { ReturnsComponent } from './pages/Admin/components/returns/returns';
import { WarehousesComponent } from './pages/Admin/components/warehouses/warehouses';
import { CreateUserComponent } from './pages/Admin/components/create-user/create-user';
import { ManageUsersComponent } from './pages/Admin/components/manage-users/manage-users';
import { ProductsComponent } from './pages/Admin/components/products/products';
import { AdminShellComponent } from './pages/Admin/components/admin-shell/admin-shell';

// Pattern for every role section:
//   {
//     path: '<role-prefix>',
//     canActivate: [roleGuard],
//     data: { roles: ['<ROLE_ENUM_VALUE>'] },
//     children: [ ...that role's own routes, paths WITHOUT a leading slash... ]
//   }
//
// Example once the Customer module is merged in:
  // {
  //   path: 'customer',
  //   canActivate: [roleGuard],
  //   data: { roles: ['CUSTOMER'] },                                        //read in roleguard.ts to guard role specific
  //   children: [
  //     { path: '', component: LandingPage, pathMatch: 'full' },
  //     { path: 'products/:id', component: ProductDetailsComponent },
  //     { path: 'orders', component: MyOrdersComponent },
  //     { path: 'orders/:id', component: OrderDetailComponent },
  //   ],                                                                  //with children all routes in array inherits the same guard
  // }
//
// Each role's OWN existing routes stay almost identical ,just remove their
// individual canActivate/authGuard (replaced by the parent's roleGuard) and
// nest them as children here instead of top-level routes.

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent }, // Customer self-registration, public

  { path: 'customer', canActivate: [roleGuard], data: { roles: ['CUSTOMER'] }, children: [
      { path: '', component: LandingPage, pathMatch: 'full' },
      { path: 'products/:id', component: ProductDetailsComponent },
      { path: 'orders', component: MyOrdersComponent },
      { path: 'orders/:id', component: OrderDetailComponent },
    ] },

    { path: 'admin', component:AdminShellComponent, canActivate: [roleGuard], data: { roles: ['ADMIN'] }, children: [
      {path:'', component: DashboardComponent, pathMatch:'full'},
      {path:'orders', component: OrdersComponent},
      {path: 'returns', component: ReturnsComponent},
      {path: 'warehouses', component:  WarehousesComponent},
      {path: 'create-user', component: CreateUserComponent},
      {path: 'manage-users', component: ManageUsersComponent},
      {path: 'products', component: ProductsComponent}
    ] },



    
  // { path: 'warehouse-manager', canActivate: [roleGuard], data: { roles: ['WAREHOUSE_MANAGER'] }, children: [...] },
  // { path: 'vendor', canActivate: [roleGuard], data: { roles: ['VENDOR'] }, children: [...] },
  // { path: 'driver', canActivate: [roleGuard], data: { roles: ['DRIVER'] }, children: [...] },
  // { path: 'admin', canActivate: [roleGuard], data: { roles: ['ADMIN'] }, children: [...] },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
