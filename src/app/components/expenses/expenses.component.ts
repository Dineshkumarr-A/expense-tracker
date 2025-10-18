import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { take } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.css'],
})
export class ExpensesComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  message = '';
  expenses: any[] = [];
  user: any = null;

  constructor(
    private fb: FormBuilder,
    private sup: SupabaseService,
    private router: Router
  ) {
    // Initialize the form here so `this.fb` is available
    this.form = this.fb.group({
      title: ['', Validators.required],
      amount: ['', Validators.required],
      category: [''],
      date: [new Date().toISOString().slice(0, 10), Validators.required],
    });
  }

  async ngOnInit() {
    // wait until initAuth finished
    await firstValueFrom(this.sup.authReady$.pipe(take(1)));

    // now get the current user once
    const user = await this.sup.getUser();
    this.user = user;
    console.log('User after init:', user);
    if (!user) {
      this.router.navigate(['/login']);
    } else {
      this.load();
    }

    // also subscribe to future changes (optional)
    this.sup.user$.subscribe((u) => {
      this.user = u;
    });
  }

  async load() {
    this.loading = true;
    try {
      this.expenses = await this.sup.listExpenses();
    } catch (err) {
      console.error(err);
      alert('Failed to load expenses');
    } finally {
      this.loading = false;
    }
  }

  async add() {
    if (this.form.invalid) return;
    this.loading = true;
    try {
      const payload = {
        title: this.form.value.title,
        amount: parseFloat(this.form.value.amount),
        category: this.form.value.category,
        date: this.form.value.date,
      };
      await this.sup.addExpense(payload);
      this.form.reset({ date: new Date().toISOString().slice(0, 10) });
      await this.load();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Add failed');
    } finally {
      this.loading = false;
    }
  }

  async remove(id: string) {
    if (!confirm('Delete this expense?')) return;
    try {
      await this.sup.deleteExpense(id);
      await this.load();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Delete failed');
    }
  }

  async logout() {
    await this.sup.signOut();
    this.router.navigate(['/login']);
  }
}
