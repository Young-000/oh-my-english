import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/infrastructure/supabase/server';
import type { Database } from '@/infrastructure/supabase/types';

const SCHEMA = 'oh_my_english';

type Profile = Database['oh_my_english']['Tables']['profiles']['Row'];
type ProfileInsert = Database['oh_my_english']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['oh_my_english']['Tables']['profiles']['Update'];

interface UserSettings {
  dailyGoal: number;
  preferredStyle: 'casual' | 'neutral' | 'formal';
  notificationEnabled: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  dailyGoal: 10,
  preferredStyle: 'neutral',
  notificationEnabled: false,
};

function mapProfileToResponse(profile: Profile, providers: string[]) {
  const settings = profile.settings || DEFAULT_SETTINGS;
  return {
    id: profile.id,
    email: profile.email,
    displayName: profile.display_name,
    settings: {
      dailyGoal: settings.dailyGoal ?? DEFAULT_SETTINGS.dailyGoal,
      preferredStyle: settings.preferredStyle ?? DEFAULT_SETTINGS.preferredStyle,
      notificationEnabled: settings.notificationEnabled ?? DEFAULT_SETTINGS.notificationEnabled,
    },
    createdAt: profile.created_at,
    providers,
  };
}

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get profile from database
    const { data: profile, error: profileError } = await supabase
      .schema(SCHEMA)
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('[Profile API] Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    // If profile doesn't exist, create one
    if (!profile) {
      const serviceClient = await createServiceRoleClient();

      const newProfile: ProfileInsert = {
        id: user.id,
        email: user.email || null,
        display_name: user.user_metadata?.full_name || user.email || null,
        settings: DEFAULT_SETTINGS,
      };

      const { data: insertedProfile, error: insertError } = await serviceClient
        .schema(SCHEMA)
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (insertError) {
        console.error('[Profile API] Error creating profile:', insertError);
        return NextResponse.json(
          { error: 'Failed to create profile' },
          { status: 500 }
        );
      }

      // Get providers from user identities
      const providers = user.identities?.map((i) => i.provider) || [];

      return NextResponse.json({
        profile: mapProfileToResponse(insertedProfile, providers),
      });
    }

    // Get providers from user identities
    const providers = user.identities?.map((i) => i.provider) || [];

    return NextResponse.json({
      profile: mapProfileToResponse(profile, providers),
    });
  } catch (error) {
    console.error('[Profile API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { displayName, settings } = body as {
      displayName?: string;
      settings?: Partial<UserSettings>;
    };

    // Validate settings if provided
    if (settings) {
      if (settings.dailyGoal !== undefined) {
        const validGoals = [5, 10, 15, 20];
        if (!validGoals.includes(settings.dailyGoal)) {
          return NextResponse.json(
            { error: 'Invalid daily goal value' },
            { status: 400 }
          );
        }
      }

      if (settings.preferredStyle !== undefined) {
        const validStyles = ['casual', 'neutral', 'formal'];
        if (!validStyles.includes(settings.preferredStyle)) {
          return NextResponse.json(
            { error: 'Invalid preferred style value' },
            { status: 400 }
          );
        }
      }

      if (settings.notificationEnabled !== undefined) {
        if (typeof settings.notificationEnabled !== 'boolean') {
          return NextResponse.json(
            { error: 'Invalid notification enabled value' },
            { status: 400 }
          );
        }
      }
    }

    // Get current profile
    const { data: currentProfile, error: fetchError } = await supabase
      .schema(SCHEMA)
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[Profile API] Error fetching current profile:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    // Use service client for updates (bypass RLS)
    const serviceClient = await createServiceRoleClient();

    if (!currentProfile) {
      // Create profile if it doesn't exist
      const newProfile: ProfileInsert = {
        id: user.id,
        email: user.email || null,
        display_name: displayName || user.user_metadata?.full_name || user.email || null,
        settings: settings ? { ...DEFAULT_SETTINGS, ...settings } : DEFAULT_SETTINGS,
      };

      const { data: insertedProfile, error: insertError } = await serviceClient
        .schema(SCHEMA)
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (insertError) {
        console.error('[Profile API] Error creating profile:', insertError);
        return NextResponse.json(
          { error: 'Failed to create profile' },
          { status: 500 }
        );
      }

      const providers = user.identities?.map((i) => i.provider) || [];

      return NextResponse.json({
        profile: mapProfileToResponse(insertedProfile, providers),
      });
    }

    // Build update object
    const updateData: ProfileUpdate = {};

    if (displayName !== undefined) {
      updateData.display_name = displayName;
    }

    if (settings) {
      const currentSettings = currentProfile.settings || DEFAULT_SETTINGS;
      updateData.settings = {
        dailyGoal: settings.dailyGoal ?? currentSettings.dailyGoal ?? DEFAULT_SETTINGS.dailyGoal,
        preferredStyle: settings.preferredStyle ?? currentSettings.preferredStyle ?? DEFAULT_SETTINGS.preferredStyle,
        notificationEnabled: settings.notificationEnabled ?? currentSettings.notificationEnabled ?? DEFAULT_SETTINGS.notificationEnabled,
      };
    }

    const { data: updatedProfile, error: updateError } = await serviceClient
      .schema(SCHEMA)
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('[Profile API] Error updating profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    const providers = user.identities?.map((i) => i.provider) || [];

    return NextResponse.json({
      profile: mapProfileToResponse(updatedProfile, providers),
    });
  } catch (error) {
    console.error('[Profile API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(): Promise<NextResponse> {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const serviceClient = await createServiceRoleClient();

    // Delete all user data in order (respecting foreign key constraints)
    // 1. Delete quiz attempts
    await serviceClient
      .schema(SCHEMA)
      .from('quiz_attempts')
      .delete()
      .eq('user_id', user.id);

    // 2. Delete vocabulary progress
    await serviceClient
      .schema(SCHEMA)
      .from('vocabulary_progress')
      .delete()
      .eq('user_id', user.id);

    // 3. Delete learning records
    await serviceClient
      .schema(SCHEMA)
      .from('learning_records')
      .delete()
      .eq('user_id', user.id);

    // 4. Delete daily stats
    await serviceClient
      .schema(SCHEMA)
      .from('daily_stats')
      .delete()
      .eq('user_id', user.id);

    // 5. Delete user's vocabulary books
    await serviceClient
      .schema(SCHEMA)
      .from('vocabulary_books')
      .delete()
      .eq('user_id', user.id);

    // 6. Delete profile
    const { error: profileDeleteError } = await serviceClient
      .schema(SCHEMA)
      .from('profiles')
      .delete()
      .eq('id', user.id);

    if (profileDeleteError) {
      console.error('[Profile API] Error deleting profile:', profileDeleteError);
      return NextResponse.json(
        { error: 'Failed to delete profile' },
        { status: 500 }
      );
    }

    // 7. Delete the auth user (using admin API)
    // Note: This requires service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const deleteUserResponse = await fetch(
      `${supabaseUrl}/auth/v1/admin/users/${user.id}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
      }
    );

    if (!deleteUserResponse.ok) {
      console.error('[Profile API] Error deleting auth user:', await deleteUserResponse.text());
      // Don't return error since profile data is already deleted
    }

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('[Profile API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
