# Phase 2 Follow‑Up Implementation Plan (Consolidated)

This document consolidates the previously drafted eight follow‑up issues into a single structured implementation plan. Each former issue is treated as its own workstream (pseudo "mini‑phase"). Use this document for sequencing, dependency tracking, and milestone planning. Individual GitHub issues can still be generated from these sections if granular tracking is desired.

---

## Overview

| Workstream Key | Title | Primary Goal | Core Dependency | Target Start | Target Completion |
|----------------|-------|--------------|-----------------|--------------|-------------------|
| CF | Collaborative Filtering Trainer | Personalized embeddings | Scaffold + events ingestion | Week 1 | Week 3 |
| EMB | Content Feature Embedder | Cold-start + metadata signal | Feature store partial | Week 1 | Week 3 |
| HYB | Production Hybrid Blend + Re-Ranker | High-quality ranked list | CF + EMB | Week 3 | Week 5 |
| TRD | Trending Detector Job | Surface emerging content | Events enrichment | Week 4 | Week 6 |
| FBK | Feedback Enrichment & DLQ | Reliable learning signals | Base ingestion scaffold | Week 1 | Week 2 |
| EXP | Experiment Multi-Metric & Guardrails | Safe iterative optimization | Basic flag/assignment scaffold | Week 2 | Week 5 |
| PWA | PWA Push + Background Sync | Engagement & offline resilience | Existing PWA shell | Week 5 | Week 6 |
| FST | Feature Store Partial Impl + Benchmarking | Low-latency feature retrieval | Initial schemas + CF/EMB needs | Week 1 | Week 4 |

High-level dependency chain (simplified):
FBK → CF, EMB → HYB → EXP (advanced metrics)  
FBK → TRD  
FST underpins CF, EMB, HYB  
PWA mostly independent (light dependency on EXP for experiment event sync)

---

## 1. Collaborative Filtering Trainer (CF)

### Problem
No collaborative filtering (CF) model exists; hybrid pipeline requires user-item preference embeddings.

### Objectives
- Implement matrix factorization (initial: implicit ALS or BPR; fallback to library)
- Support batch retraining (daily) + incremental mini-batch (optional)
- Export user/item factors to feature store (or interim storage)
- Provide evaluation metrics (RMSE surrogate, CTR proxy via offline sampling)

### Scope
- Data preparation script (interaction matrix)
- Trainer module (`reco/ml/pipelines/cf_trainer.py`)
- Model artifact serialization + checksum generation
- Embedding export job
- Metrics & evaluation report generation

### Out of Scope
- Sequence models (RNN/Transformer)
- Real-time incremental updates (Phase 3+)

### Deliverables
- Training script + config
- Factor matrices (user_factors, item_factors)
- Metrics summary JSON
- Integration test covering inference path
- ADR update if divergence from earlier assumptions

### Acceptance Criteria
- Training finishes under configured budget ( baseline dataset)
- Coverage ≥90% active users, ≥95% active items
- RMSE or ranking metric improvement vs baseline dummy ≥ X% (define X=10%)
- Export latency per batch < 10 min
- Embeddings retrievable via feature store API stub

### Metrics
- cf.train.duration.seconds
- cf.user_factors.count / cf.item_factors.count
- cf.rmse
- cf.offline.ndcg@K

### Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Sparse matrix explosion | Filter ultra-rare items/users |
| Cold-start persists | Blend w/ content features (EMB) |

---

## 2. Content Feature Embedder (EMB)

### Problem
Cold-start items/users lack collaborative signal; need content embeddings (audio & metadata).

### Objectives
- Extract audio/metadata features (e.g., tempo, key, spectral features)
- Normalize and assemble embedding vectors
- Persist item embeddings (versioned)
- Provide schema for embedding features consumed by hybrid blend

### Scope
- Audio feature extraction pipeline
- Metadata enrichment (genre, artist popularity)
- Embedding assembler (`reco/ml/pipelines/content_embedder.py`)
- Storage & version manifest

### Out of Scope
- Deep neural audio models (Phase 4+)
- Real-time ingestion of new tracks

### Acceptance Criteria
- ≥80% catalog coverage processed
- p95 extraction time per track < 5s (batch)
- Embedding dimension documented & stable
- Checksum manifest produced

### Metrics
- content.embed.processed.count
- content.embed.fail.count
- content.embed.latency.ms (histogram)
- content.embed.coverage.ratio

### Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Inconsistent audio formats | Failed extraction | Pre-flight validation |
| Large batch windows cause drift | Latency in freshness | Staggered incremental batches |

---

## 3. Production Hybrid Blending & Diversity/Recency Re-Ranking (HYB)

### Problem
Current hybrid logic is a stub; need tunable production pipeline.

### Objectives
- Implement blend(collab_rank, content_rank, α)
- Diversity re-ranking (penalize topical/item repetition)
- Recency freshness boost (bounded)
- Configurable via experiment parameters

### Scope
- Pipeline module (`reco/service/ranking/hybrid.py`)
- Re-ranking heuristics (MMR-like diversity, recency decay)
- Latency optimization (vectorization)
- Experiment hooks for α and diversity weight

### Acceptance Criteria
- p95 pipeline latency (post-feature retrieval) < 120ms
- Diversity score uplift vs baseline stub ≥ defined threshold
- No single artist > X% (configurable cap)
- Parameter change via flag without redeploy

### Metrics
- reco.hybrid.blend_ratio
- reco.hybrid.diversity.score
- reco.hybrid.recency.weight.avg
- reco.hybrid.latency.ms

### Risks
| Risk | Mitigation |
|------|------------|
| Over-penalizing popular items | Bounded diversity weight |
| Parameter sprawl | Central experiment config |

---

## 4. Trending Detector Job (TRD)

### Problem
Cannot surface emerging tracks; no trending pipeline exists.

### Objectives
- Identify items with velocity (recent engagement delta)
- Provide trending list for downstream modules
- Persist trending scores & expose metrics

### Scope
- Batch job (e.g., hourly) computing z-score vs historical baseline
- Optional exponential smoothing
- Output: top N trending tracks per category

### Acceptance Criteria
- Job completes < 5 min on sample dataset
- Trending output API or file accessible
- False positive rate documented (manual audit)

### Metrics
- trending.job.duration.seconds
- trending.items.candidate.count
- trending.items.final.count

### Risks
| Risk | Mitigation |
|------|------------|
| Seasonal spikes misclassified | Use baseline windows (7d vs 24h) |
| Data delay | Add freshness guard |

---

## 5. Feedback Event Enrichment & DLQ Handling (FBK)

### Problem
Raw feedback lacks context (session/device); failures risk silent loss.

### Objectives
- Enrichment pipeline (session_id, device_type, locale)
- DLQ for failed validations
- Retry mechanism with backoff
- Monitoring & alert thresholds

### Scope
- Enrichment module
- DLQ storage abstraction
- Retry worker
- Schema version increment

### Acceptance Criteria
- Enrichment success rate ≥ 99%
- DLQ < 0.5% of events sustained
- Retry recovers ≥80% of transient failures
- Alert when DLQ spike > threshold

### Metrics
- feedback.enriched.count
- feedback.enrich.fail.count
- feedback.dlq.count
- feedback.retry.success.count

### Risks
| Risk | Mitigation |
|------|------------|
| DLQ growth unbounded | TTL & cap enforcement |
| Schema drift | Versioned JSON schema validation |

---

## 6. Experiment Multi-Metric Evaluation & Guardrails (EXP)

### Problem
Assignment only; no automated metric analysis or guardrail enforcement.

### Objectives
- Multi-metric evaluation engine (CTR, latency, diversity)
- Guardrail definitions (e.g., latency p95 ceiling)
- Breach detection + alerting
- Report generation

### Scope
- Manifest extension (metrics, guardrails)
- Aggregation job (batch or streaming)
- Breach logging + optional flag auto-disable (Phase 3 optional)

### Acceptance Criteria
- Metrics aggregated within delay < 10 minutes (batch)
- Guardrail breach detection accuracy (manual test) 100% for seeded cases
- Dashboard panels reflect metrics

### Metrics
- experiment.metric.compute.duration
- experiment.guardrail.breach.total
- experiment.report.generated.count

### Risks
| Risk | Mitigation |
|------|------------|
| Metric noise | Sufficient sample thresholds before evaluation |
| Over-disabling variants | Manual review gate before auto-disable (first iteration) |

---

## 7. PWA Push Notifications & Background Sync (PWA)

### Problem
No push or sync; offline feedback may be lost; engagement lower.

### Objectives
- Implement service worker push subscription flow
- Background sync queue for feedback + experiment events
- User opt-in & privacy compliance

### Scope
- Update service_worker.js
- Push permission UX
- Offline queue with IndexedDB
- Sync retry strategy

### Acceptance Criteria
- Sync success rate after reconnection ≥ 95%
- No push delivery with user opt-out
- Lighthouse PWA score unaffected (≥ existing baseline)

### Metrics
- pwa.push.subscriptions.count
- pwa.sync.queue.size
- pwa.sync.success.count / fail.count

### Risks
| Risk | Mitigation |
|------|------------|
| Notification fatigue | Frequency capping |
| Privacy compliance gaps | Clear settings UI |

---

## 8. Feature Store Partial Implementation & Benchmarking (FST)

### Problem
Feature retrieval stub insufficient for latency + consistency goals.

### Objectives
- Implement registry, ingestion, transformation, online KV layer
- Benchmark latency & cache hit ratio
- Daily offline/online parity job

### Scope
- Minimal registry (YAML/JSON manifests)
- Ingestion pipeline for user_engagement, item_audio
- Redis (or chosen store) prototype
- Benchmark harness

### Acceptance Criteria
- get_features p95 < 15ms (single user, ≤20 items)
- Cache hit ratio initial ≥ 80% (target)
- Parity job diff rate < 2%

### Metrics
- feature.latency.ms
- feature.cache.hit.ratio
- feature.parity.diff.count
- feature.freshness.seconds

### Risks
| Risk | Mitigation |
|------|------------|
| Low cache hit ratio | Pre-warm hot entities |
| Data staleness | Freshness alerts |

---

## Cross-Cutting Concerns

### Observability
All workstreams must:
- Emit standardized metrics (domain.metric.unit)
- Propagate trace context
- Log structured JSON (trace_id, span_id, entity keys where safe)

### Security & Compliance
- Input validation on all new APIs / ingestion points
- Model & artifact integrity (where relevant)
- Access control for feature store endpoints (Phase 3 hardening)

### Performance Budgets
| Layer | p95 Budget |
|-------|------------|
| Feature retrieval | < 15ms |
| Hybrid pipeline | < 120ms |
| Event ingestion | < 50ms |
| Trending detection | < 5min (batch) |

---

## Appendix A: Implementation Sequence

### Week 1-2 Foundation (Parallel)
- **FBK**: Event enrichment foundation
- **CF**: Data prep + initial training scaffold
- **EMB**: Audio feature extraction setup
- **FST**: Registry + basic ingestion

### Week 3-4 Core Models
- **CF**: Training pipeline completion
- **EMB**: Content embedding pipeline
- **HYB**: Initial hybrid blending
- **EXP**: Basic multi-metric evaluation

### Week 5-6 Advanced Features
- **HYB**: Diversity/recency re-ranking
- **TRD**: Trending detection
- **PWA**: Push notifications + sync
- **EXP**: Guardrail enforcement

---

## Appendix B: Schema Examples

### Event Schema V2
```json
{
  "feedback_event_v2": {
    "user_id": "string",
    "item_id": "string",
    "event_type": "play|skip|like",
    "timestamp": "iso8601",
    "session_id": "string",
    "device_type": "web|mobile|other",
    "locale": "en-US",
    "schema_version": 2
  }
}
```

### CF Embedding Manifest
```json
{
  "cf_embedding_manifest": {
    "model_version": "cf_v1.2.0",
    "created_at": "iso8601",
    "user_count": 120345,
    "item_count": 34567,
    "embedding_dim": 64,
    "checksum": "sha256:..."
  }
}
```

### Content Embedding Schema
```json
{
  "content_embedding_schema": {
    "version": "emb_v1.0.0",
    "fields": ["tempo","key","spectral_centroid","mfcc_1","mfcc_2","genre_one_hot_*","duration_sec"],
    "dimension": 128
  }
}
```

---

## Appendix C: Benchmark Harness Outline

```bash
python benchmarks/feature_store_latency.py --requests 5000 --concurrency 25
python benchmarks/hybrid_pipeline_latency.py --requests 2000 --concurrency 10
```

Expected outputs:
- JSON summary (latency distribution)
- Fail non-zero if p95 budgets exceeded (later gating)

---

End of Document.