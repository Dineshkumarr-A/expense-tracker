import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  form!: FormGroup; // declared, initialized in constructor
  loading = false;
  message = '';

  constructor(
    private fb: FormBuilder,
    private sup: SupabaseService,
    private router: Router
  ) {
    // initialize here so this.fb is available
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: [''],
    });
  }

  async sendMagicLink() {
    if (this.form.get('email')!.invalid) return;
    this.loading = true;
    this.message = '';
    try {
      const { error } = await this.sup.signInWithOtp(this.form.value.email);
      if (error) throw error;
      this.message = 'Magic link sent — open it in the same browser.';
    } catch (err: any) {
      this.message = err.message || 'Failed to send magic link';
    } finally {
      this.loading = false;
    }
  }

  async signInPassword() {
    if (this.form.invalid) return;

    this.loading = true;
    this.message = '';

    try {
      // call service method
      const { data, error } = await this.sup.signInWithPassword(
        this.form.value.email!,
        this.form.value.password!
      );

      if (error) {
        throw error;
      }
      if (!error) {
        // Supabase stores it automatically
        console.log('Session:', data.session);
      }

      if (data.session) {
        // ✅ Successfully logged in
        console.log('User logged in:', data.user);
        this.message = 'Login successful!';
        this.router.navigate(['/expenses']);
      } else {
        this.message = 'No session returned — check your credentials.';
      }
    } catch (err: any) {
      this.message = err.message || 'Login failed.';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }
  async signUpPassword() {
    if (this.form.get('email')!.invalid || !this.form.value.password) return;
    this.loading = true;
    try {
      const { error } = await this.sup.signUpWithPassword(
        this.form.value.email,
        this.form.value.password
      );
      if (error) throw error;
      this.message = 'Sign-up OK. Check email if confirmation required.';
    } catch (err: any) {
      this.message = err.message || 'Sign up failed';
    } finally {
      this.loading = false;
    }
  }
}
