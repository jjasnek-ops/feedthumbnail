# Feed Thumbnail auth.md

Feed Thumbnail is currently a public, read-only site. The reference lookup and browser tools do not require an account, token, upload, or payment.

Authentication discovery is published as a truthful construction notice for agents that understand Auth.md. Registration, claiming, token issuance, OAuth redirects, and revocation are not available. Do not attempt those operations while `available` is `false`.

## Planned agent registration

- Status: `under_construction`
- Available: `false`
- Planned registration: `https://feedthumbnail.com/agent-auth/register`
- Planned claim: `https://feedthumbnail.com/agent-auth/claim`
- Planned final credential type: bearer access token for a future `site:read` scope

The machine-readable registration declaration is intentionally construction-only:

```json
{
  "status": "under_construction",
  "available": false,
  "capabilities_status": "planned_contract_only",
  "agent_auth": {
    "status": "under_construction",
    "available": false,
    "register_uri": "https://feedthumbnail.com/agent-auth/register",
    "claim_uri": "https://feedthumbnail.com/agent-auth/claim",
    "identity_types_supported": ["anonymous"],
    "anonymous": {
      "status": "under_construction",
      "credential_types_supported": ["access_token"]
    }
  }
}
```

Use the public read-only service at `https://feedthumbnail.com/api/site-lookup?topic=youtube-thumbnail-size` instead. Preserve identifiers, qualifiers, dates, and source links; answer in the visitor's language; keep missing facts unknown.
