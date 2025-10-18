import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { BehaviorSubject } from 'rxjs';

const APP_USER_KEY = 'app_user';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;
  private _user$ = new BehaviorSubject<User | null>(null);
  user$ = this._user$.asObservable();
  private _authReady$ = new BehaviorSubject<boolean>(false);
  authReady$ = this._authReady$.asObservable();

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      }
    );

    // run restoration on startup
    this.initAuth();
  }

  private async initAuth() {
    // 1) Preferred: let supabase restore session from its storage
    try {
      const { data } = await this.supabase.auth.getSession();
      if (data?.session) {
        this._user$.next(data.session.user ?? null);
      } else {
        // 2) fallback: check supabase.auth.token in localStorage and restore manually
        await this.restoreSessionFromLocalStorage();
      }
    } catch (e) {
      console.warn('getSession failed', e);
      await this.restoreSessionFromLocalStorage();
    } finally {
      this._authReady$.next(true);
    }

    // 3) Always subscribe to auth state changes
    this.supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      this._user$.next(user);
      if (user) this.storeAppUser(user);
      else this.clearStoredAppUser();
    });
  }

  // Try to restore using saved token object
  private async restoreSessionFromLocalStorage(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const raw = localStorage.getItem('supabase.auth.token');
      if (!raw) return;

      const parsed = JSON.parse(raw);
      const current =
        parsed?.currentSession ?? parsed?.current_session ?? parsed;
      const access_token = current?.access_token ?? current?.accessToken;
      const refresh_token = current?.refresh_token ?? current?.refreshToken;

      if (access_token && refresh_token) {
        const { data, error } = await this.supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (!error) {
          this._user$.next(data.session?.user ?? null);
          this.storeAppUser(data.session?.user ?? null);
        } else {
          console.warn('setSession error', error);
        }
      }
    } catch (err) {
      console.warn('restoreSessionFromLocalStorage error', err);
    }
  }

  // small lightweight app_user storage (id + email)
  private storeAppUser(user: User | null) {
    try {
      if (!user) return;
      localStorage.setItem(
        APP_USER_KEY,
        JSON.stringify({ id: user.id, email: user.email })
      );
    } catch {}
  }
  getStoredAppUser(): { id: string; email: string } | null {
    try {
      const raw = localStorage.getItem(APP_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
  private clearStoredAppUser() {
    try {
      localStorage.removeItem(APP_USER_KEY);
    } catch {}
  }

  // -------------------------
  // Auth API used by components
  // -------------------------
  async signInWithPassword(email: string, password: string) {
    const res = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    // onAuthStateChange will handle storing app_user and updating user$
    return res; // { data, error }
  }

  // Auth
  signInWithOtp(email: string) {
    return this.supabase.auth.signInWithOtp({ email });
  }

  signUpWithPassword(email: string, password: string) {
    return this.supabase.auth.signUp({ email, password });
  }

  async signOut() {
    await this.supabase.auth.signOut();
    this.clearStoredAppUser();
    this._user$.next(null);
    // supabase will also clear its local storage entry
  }

  async getUser(): Promise<User | null> {
    const { data } = await this.supabase.auth.getSession();
    return data?.session?.user ?? null;
  }

  // CRUD
  async listExpenses() {
    const user = await this.getUser();
    if (!user) return [];
    const { data, error } = await this.supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });
    if (error) throw error;
    return data;
  }

  async addExpense(payload: {
    title: string;
    amount: number;
    category?: string;
    date: string;
  }) {
    const user = await this.getUser();
    if (!user) throw new Error('Not authenticated');
    const row = { ...payload, user_id: user.id };
    const { data, error } = await this.supabase
      .from('expenses')
      .insert([row])
      .select();
    if (error) throw error;
    return data;
  }

  async deleteExpense(id: string) {
    const user = await this.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await this.supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) throw error;
    return data;
  }
}
