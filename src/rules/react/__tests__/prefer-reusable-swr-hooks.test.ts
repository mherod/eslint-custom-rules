import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../prefer-reusable-swr-hooks";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require("@typescript-eslint/parser"),
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});

ruleTester.run("prefer-reusable-swr-hooks", rule, {
  valid: [
    // Already in a custom hook - should not trigger
    {
      code: `
        function useTikTokEmbed(url: string) {
          const { data, error } = useSWR(
            url ? buildEmbedUrl(url) : null,
            enhancedFetcher,
            {
              dedupingInterval: 5 * 60 * 1000,
              revalidateOnFocus: true,
              onError: handleError,
              onSuccess: handleSuccess,
            }
          );
          return { data, error };
        }
      `,
    },
    // Simple useSWR usage with imported fetcher - should not trigger
    {
      code: `
        function Component() {
          const { data } = useSWR('/api/users', fetcher);
          return <div>{data}</div>;
        }
      `,
    },
    // useSWR with simple inline fetcher - should not trigger warning
    {
      code: `
        function Component() {
          const { data } = useSWR('/api/users', (url) => fetch(url).then(r => r.json()));
          return <div>{data}</div>;
        }
      `,
    },
    // useSWR with simple configuration - should not trigger warning
    {
      code: `
        function Component() {
          const { data } = useSWR('/api/posts', fetcher, { refreshInterval: 1000 });
          return <div>{data}</div>;
        }
      `,
    },
  ],
  invalid: [
    // Complex useSWR usage in component - should suggest custom hook
    {
      code: `
        function TikTokVideo() {
          const { data, error } = useSWR(
            url ? buildEmbedUrl(url) : null,
            async (url: string) => {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), timeout);
              const response = await fetch(url, { signal: controller.signal });
              return response.json();
            },
            {
              dedupingInterval: 5 * 60 * 1000,
              revalidateOnFocus: true,
              revalidateOnReconnect: false,
              onError: (err) => setRetryCount(prev => prev + 1),
              onSuccess: () => setRetryCount(0),
            }
          );
          return <div>{data}</div>;
        }
      `,
      errors: [
        {
          messageId: "preferReusableSwrHook",
        },
      ],
    },
    // useSWR with complex multi-statement fetcher - should suggest extraction
    {
      code: `
        function UserProfile() {
          const { userData } = useSWR(
            '/api/user',
            async (url) => {
              const response = await fetch(url);
              const data = await response.json();
              return data.user;
            }
          );
          return <div>{userData}</div>;
        }
      `,
      errors: [
        {
          messageId: "suggestCustomHook",
          data: {
            suggestedName: "User",
          },
        },
      ],
    },
    // Complex configuration options
    {
      code: `
        function Component() {
          const { embedData } = useSWR(
            key,
            fetcher,
            {
              dedupingInterval: 5000,
              revalidateOnFocus: true,
              revalidateOnReconnect: false,
              refreshInterval: 30000,
              onError: handleError,
            }
          );
          return <div>{embedData}</div>;
        }
      `,
      errors: [
        {
          messageId: "preferReusableSwrHook",
        },
      ],
    },
    // TikTok-like complex usage (based on the example file)
    {
      code: `
        function TikTokVideo() {
          const { embedData, isLoading, error, mutate } = useSWR(
            swrKey,
            enhancedFetcher,
            {
              dedupingInterval: 5 * 60 * 1000,
              revalidateOnFocus: true,
              revalidateOnReconnect: false,
              onError: (err, _key) => {
                setLastRetry(new Date());
                if (retryCount < maxRetries) {
                  const isRetriableError = err.message.includes("timeout");
                  if (isRetriableError) {
                    const retryDelay = Math.min(1000 * 2 ** retryCount, 10_000);
                    setTimeout(() => {
                      setRetryCount((prev) => prev + 1);
                      void mutate();
                    }, retryDelay);
                  }
                }
              },
              onSuccess: (_data) => {
                setRetryCount(0);
                setLastRetry(null);
              },
              refreshInterval: (data) => {
                if (data?.cache_age) {
                  return Math.max(data.cache_age * 1000, 60_000);
                }
                return 0;
              },
            }
          );
          return <div>{embedData}</div>;
        }
      `,
      errors: [
        {
          messageId: "preferReusableSwrHook",
        },
      ],
    },
  ],
});
