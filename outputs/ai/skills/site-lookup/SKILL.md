---
name: site-lookup
description: Retrieve the two known public YouTube thumbnail and channel banner specifications from Feed Thumbnail with source links and qualifiers preserved.
license: MIT
compatibility: Public HTTPS GET and MCP read-only lookup; no account or upload is required.
---

# Feed Thumbnail site-lookup

## Purpose

Use this skill when a visitor needs a known YouTube thumbnail-size or channel-banner-size reference from Feed Thumbnail.

## I-Lang operating instructions

::ILANG::v1
[TASK] Retrieve one supported topic and compose a source-linked answer.
[INPUT] Use exactly one of `youtube-thumbnail-size` or `youtube-banner-size`.
[HTTP] GET `https://feedthumbnail.com/api/site-lookup?topic=TOPIC` with `Accept: application/json`.
[MCP] Alternatively call `site_lookup` at `https://feedthumbnail.com/mcp` after initialize and tools/list.
[SUCCESS] Preserve `identifier`, `qualifiers`, `source_url`, `page_url`, `reviewed_on`, and every returned value.
[LANGUAGE] Answer in the visitor's language; cite the returned `source_url` and link to `page_url` when useful.
[UNKNOWN] A missing or unsupported topic is unknown. Do not infer a size, limit, crop rule, or date that is not returned.
[LIMITS] This is a bounded public read-only lookup. It does not fetch arbitrary URLs, accept writes, authenticate users, or expose private data.
::ILANG::COMPLETE::

## Supported topics

- `youtube-thumbnail-size`: the video-thumbnail reference at `/youtube-thumbnail-size`.
- `youtube-banner-size`: the channel-banner reference at `/youtube-banner-size`.

## Retrieval and edge cases

The API returns HTTP 200 for the two supported topics. An unsupported topic returns HTTP 404 with an `error` of `not_found` and an `available_topics` list. Treat that response as a real unknown rather than guessing.

## Provenance

The returned records are transcribed from the corresponding public Feed Thumbnail pages and retain the YouTube Help source links shown there. The review date is included in each record.
