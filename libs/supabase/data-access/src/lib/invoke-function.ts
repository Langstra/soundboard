import { FunctionsHttpError } from '@supabase/supabase-js';
import { AppSupabaseClient } from './supabase-client';

export class FunctionCallError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

// Edge Functions answer errors as `{ error: '<code>' }`; callers branch on that code.
export async function invokeFunction<TResult>(
  client: AppSupabaseClient,
  name: string,
  body: Record<string, unknown>,
): Promise<TResult> {
  const { data, error } = await client.functions.invoke<TResult>(name, { body });

  if (error instanceof FunctionsHttpError) {
    const failure = (await error.context.json().catch(() => undefined)) as { error?: string } | undefined;
    throw new FunctionCallError(failure?.error ?? 'unknown');
  }

  if (error) {
    throw new FunctionCallError('network');
  }

  return data as TResult;
}
