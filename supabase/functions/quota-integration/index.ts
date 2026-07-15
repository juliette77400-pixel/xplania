// Placeholder function used solely as a host for the Deno integration tests
// in `index_test.ts`. It is never deployed to serve real traffic — the tests
// exercise the database RLS on `usage_counters` and the `consume_quota` RPC
// directly against Supabase.
Deno.serve(() => new Response("test-only", { status: 404 }));
