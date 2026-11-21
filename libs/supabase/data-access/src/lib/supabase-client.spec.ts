import { TestBed } from '@angular/core/testing';
import { injectSupabase, provideSupabase } from './supabase-client';

describe('provideSupabase', () => {
  it('provides a client', () => {
    TestBed.configureTestingModule({ providers: [provideSupabase({ url: 'http://localhost:54321', anonKey: 'key' })] });
    expect(TestBed.runInInjectionContext(() => injectSupabase().from)).toBeTypeOf('function');
  });
});
