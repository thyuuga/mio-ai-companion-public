---

Hard Write integration rules:

1) profile_cmd and addressing stay as-is.
2) Replace current memory_cmd block with maybeHandleHardWrite().
3) maybeHandleHardWrite() may return:
   - null: continue normal flow
   - handled + stopPipeline=true: write assistant reply and return early
   - handled + stopPipeline=false: do NOT return early (PLAN / blocked), continue downstream modules
4) PLAN is handled downstream by planned_events module; hard write must not call upsertPlannedEventFromMessage.
5) soft memory candidates/promotion pipeline must remain unchanged.

---
