import { kvDel, kvGet, kvSet } from "@/lib/db";
import { linkedinConfig } from "@/lib/config";
import { AdapterError } from "@/lib/llm/types";

const TOKEN_KEY = "linkedin_oauth";

type LinkedInTokens = {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
  person_urn: string;
};

export async function getLinkedInTokens(): Promise<LinkedInTokens | undefined> {
  const raw = await kvGet(TOKEN_KEY);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as LinkedInTokens;
  } catch {
    return undefined;
  }
}

export async function linkedinConnected(): Promise<boolean> {
  const t = await getLinkedInTokens();
  return Boolean(t?.access_token && t?.person_urn);
}

export function linkedinAuthUrl(state: string): string {
  const { clientId, redirectUri } = linkedinConfig();
  if (!clientId) {
    throw new Error("LINKEDIN_CLIENT_ID is not set");
  }
  const u = new URL("https://www.linkedin.com/oauth/v2/authorization");
  u.searchParams.set("response_type", "code");
  u.searchParams.set("client_id", clientId);
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("state", state);
  u.searchParams.set("scope", "openid profile w_member_social");
  return u.toString();
}

export async function exchangeLinkedInCode(code: string): Promise<void> {
  const { clientId, clientSecret, redirectUri } = linkedinConfig();
  if (!clientId || !clientSecret) {
    throw new Error("LinkedIn client env vars missing");
  }
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });
  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error_description?: string;
  };
  if (!res.ok || !json.access_token) {
    throw new Error(json.error_description || "LinkedIn token exchange failed");
  }
  const me = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${json.access_token}` },
  });
  const profile = (await me.json()) as { sub?: string };
  if (!profile.sub) {
    throw new Error("LinkedIn userinfo missing sub");
  }
  const tokens: LinkedInTokens = {
    access_token: json.access_token,
    refresh_token: json.refresh_token,
    expires_at: Date.now() + (json.expires_in || 3600) * 1000,
    person_urn: `urn:li:person:${profile.sub}`,
  };
  await kvSet(TOKEN_KEY, JSON.stringify(tokens));
}

export async function disconnectLinkedIn(): Promise<void> {
  await kvDel(TOKEN_KEY);
}

async function registerImageUpload(token: string, personUrn: string) {
  const res = await fetch(
    "https://api.linkedin.com/v2/assets?action=registerUpload",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
          owner: personUrn,
          serviceRelationships: [
            {
              relationshipType: "OWNER",
              identifier: "urn:li:userGeneratedContent",
            },
          ],
        },
      }),
    },
  );
  const json = (await res.json()) as {
    value?: {
      asset?: string;
      uploadMechanism?: {
        "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"?: {
          uploadUrl?: string;
        };
      };
    };
  };
  const uploadUrl =
    json.value?.uploadMechanism?.[
      "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
    ]?.uploadUrl;
  const asset = json.value?.asset;
  if (!res.ok || !uploadUrl || !asset) {
    throw new AdapterError("LinkedIn image register failed");
  }
  return { uploadUrl, asset };
}

export async function publishLinkedInShare(opts: {
  caption: string;
  png: Buffer;
}): Promise<string> {
  const tokens = await getLinkedInTokens();
  if (!tokens) {
    throw new Error("LinkedIn is not connected");
  }
  const { uploadUrl, asset } = await registerImageUpload(
    tokens.access_token,
    tokens.person_urn,
  );
  const up = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      "Content-Type": "image/png",
    },
    body: new Uint8Array(opts.png),
  });
  if (!up.ok) {
    throw new Error(`LinkedIn image upload HTTP ${up.status}`);
  }

  const post = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: tokens.person_urn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: opts.caption },
          shareMediaCategory: "IMAGE",
          media: [
            {
              status: "READY",
              description: { text: opts.caption.slice(0, 200) },
              media: asset,
              title: { text: "Poster" },
            },
          ],
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    }),
  });
  const urn = post.headers.get("x-restli-id") || "";
  if (!post.ok) {
    const t = await post.text();
    throw new Error(`LinkedIn post failed: ${t.slice(0, 400)}`);
  }
  return urn;
}
