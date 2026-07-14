import { supabase } from "@/integrations/supabase/client";

type ProtectedInvokeOptions = {
  body?: unknown;
  headers?: Record<string, string>;
};

export const invokeProtectedFunction = async <T = unknown>(
  functionName: string,
  options: ProtectedInvokeOptions = {},
) => {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    return { data: null, error: sessionError ?? new Error("auth_required") };
  }

  const invokeOptions = {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      Authorization: `Bearer ${session.access_token}`,
    },
  } as Parameters<typeof supabase.functions.invoke<T>>[1];

  return supabase.functions.invoke<T>(functionName, invokeOptions);
};