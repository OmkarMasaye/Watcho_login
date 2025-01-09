import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { UserComponent } from './user/user.component';

export const routes: Routes = [{ path: 'login', component: LoginComponent },  // Login page
    { path: '', redirectTo: 'login', pathMatch: 'full' },  // Default to login
    { path: 'users', component: UserComponent },];
