import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { SupabaseService } from '../supabase/supabase.service';
import { ApprovalStatus, Profile } from '../../shared/models/fitness.models';

type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  pre_fill_mode: Profile['preFillMode'] | null;
  approval_status: ApprovalStatus | null;
  approved_at: string | null;
  approved_by: string | null;
  is_admin: boolean | null;
  created_at: string;
  updated_at: string;
};

type ServiceResult<T> = {
  data: T;
  error: string | null;
};

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private readonly authService = inject(AuthService);
  private readonly supabase = inject(SupabaseService).client;

  readonly currentProfile = signal<Profile | null>(null);

  async refreshCurrentProfile(): Promise<ServiceResult<Profile | null>> {
    const user = await this.authService.getCurrentUser();

    if (!user) {
      this.currentProfile.set(null);
      return { data: null, error: null };
    }

    const { data, error } = await this.supabase
      .from('profiles')
      .select(
        'id,email,display_name,avatar_url,pre_fill_mode,approval_status,approved_at,approved_by,is_admin,created_at,updated_at',
      )
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      this.currentProfile.set(null);
      return { data: null, error: error.message };
    }

    const profile = data ? mapProfile(data as ProfileRow) : null;
    this.currentProfile.set(profile);

    return { data: profile, error: null };
  }

  async getPendingProfiles(): Promise<ServiceResult<Profile[]>> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select(
        'id,email,display_name,avatar_url,pre_fill_mode,approval_status,approved_at,approved_by,is_admin,created_at,updated_at',
      )
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: ((data ?? []) as ProfileRow[]).map(mapProfile), error: null };
  }

  async getApprovedProfiles(): Promise<ServiceResult<Profile[]>> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select(
        'id,email,display_name,avatar_url,pre_fill_mode,approval_status,approved_at,approved_by,is_admin,created_at,updated_at',
      )
      .eq('approval_status', 'approved')
      .order('created_at', { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: ((data ?? []) as ProfileRow[]).map(mapProfile), error: null };
  }

  async approveProfile(profileId: string): Promise<ServiceResult<null>> {
    const approver = await this.authService.getCurrentUser();

    if (!approver) {
      return { data: null, error: 'You must be logged in to approve users.' };
    }

    const { error } = await this.supabase
      .from('profiles')
      .update({
        approval_status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: approver.id,
      })
      .eq('id', profileId);

    return { data: null, error: error?.message ?? null };
  }

  async rejectProfile(profileId: string): Promise<ServiceResult<null>> {
    const approver = await this.authService.getCurrentUser();

    if (!approver) {
      return { data: null, error: 'You must be logged in to reject users.' };
    }

    const { error } = await this.supabase
      .from('profiles')
      .update({
        approval_status: 'rejected',
        approved_at: new Date().toISOString(),
        approved_by: approver.id,
      })
      .eq('id', profileId);

    return { data: null, error: error?.message ?? null };
  }
}

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email ?? '',
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    preFillMode: row.pre_fill_mode ?? 'LAST_WORKOUT',
    approvalStatus: row.approval_status ?? 'pending',
    approvedAt: row.approved_at,
    approvedBy: row.approved_by,
    isAdmin: row.is_admin ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
