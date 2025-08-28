多維度行事曆（Business／日常／活動）」的超邊 Event 格式一次定好，並給你Agent 可用的過濾與分析工具介面（DSL／函式規格＋回傳結構）。可直接拿去實作 API 或當資料庫 Schema（Postgres/Neo4j 皆可）。

一、資料格式（超邊 Event 與多型 Entity）
1) Event（超邊，統一格式）
{
  "id": "evt_20250903_roadmap",
  "kind": "business | personal | activity | public_event",
  "when": {
    "start": "2025-09-03T15:00:00+08:00",
    "end": "2025-09-03T15:45:00+08:00",
    "timezone": "Asia/Taipei",
    "all_day": false,
    "rrule": "FREQ=WEEKLY;BYDAY=WE;COUNT=8",
    "span": false
  },
  "roles": [
    {
      "entity_id": "person_alice",
      "role": "attendee | host | owner | speaker | vendor | organizer | audience",
      "required": true,
      "response_status": "needsAction | accepted | tentative | declined",
      "weight": 1.0
    }
  ],
  "place": {
    "entity_id": "place_roomA",
    "fallback_text": "Room A, Taipei HQ",
    "geo": { "lat": 25.04, "lon": 121.56 },
    "region": "Taipei/Songshan"
  },
  "facets": {
    "type": "meeting/roadmap | errand | workout | concert | trip | deadline",
    "topics": ["Roadmap","Q4"],
    "tags": ["internal","strategy"]
  },
  "status": "draft | planned | confirmed | canceled | done",
  "visibility": "private | team | public",
  "priority": 0.72,
  "confidence": 0.9,
  "constraints": {
    "no_weekend": true,
    "buffer_before_min": 10,
    "buffer_after_min": 5,
    "max_back_to_back": 3,
    "quiet_hours": ["22:00-08:00"]
  },
  "metrics": {
    "travel_min_est": 8,
    "cost_est": {"currency":"TWD","value":0},
    "impact_est": {"business":0.8,"wellbeing":0.2}
  },
  "links": {
    "conference": {"provider":"meet","url":"https://..."},
    "agenda_doc": "https://...",
    "attachments": [{"name":"slides.pdf","url":"https://..."}]
  },
  "notes": "Focus on mobile launch readiness",
  "provenance": {
    "source": "agent | email | import | manual",
    "created_by": "agent_v1",
    "created_at": "2025-08-28T10:01:00+08:00",
    "updated_at": "2025-08-28T10:05:00+08:00"
  }
}


說明

kind 用來分 Business / Personal / Activity / Public（展演、市集、比賽等）。

roles 是本模型的核心（超邊）：同一事件同時連結人/組織/供應商/講者等。

facets 裝主題、類型、自由標籤，方便高維分析與篩選。

constraints/metrics 讓 Agent 能做可行性與效益評估（例如通勤、影響分數）。

when.rrule 支援重複；when.span=true 對展期型活動（展覽、檔期、旅程）。

2) Entity（多型，單一路徑擴展）
{
  "id": "person_alice | place_roomA | org_pmteam | topic_roadmap | vendor_acme",
  "type": "person | place | org | topic | vendor | resource",
  "name": "Alice",
  "aliases": ["Alice W."],
  "labels": ["Design","TW"],
  "contacts": { "emails": ["alice@x.com"], "phones": [] },
  "geo": { "lat": null, "lon": null, "address": null, "floor": null },
  "meta": { "capacity": 8, "equipment": ["projector"] },
  "visibility": "private | team | public",
  "provenance": { "source": "manual", "created_at": "2025-08-20T11:00:00+08:00" }
}

3) 關聯表（關聯式設計建議）

events(id, jsonb)（索引：when.start/end、status、kind、visibility、facets->type/tags/topics）

entities(id, type, jsonb)（索引：type、name trigram、labels、geo GiST）

event_roles(event_id, entity_id, role, required, response_status, weight)（複合索引：event_id、entity_id、role）

二、Agent 的 Filter 與 Analysis 工具
A. 過濾（Filter）DSL / 函式
1) filter_events(query) -> Event[]

輸入

{
  "time": { "start": "2025-09-01T00:00:00+08:00", "end": "2025-09-30T23:59:59+08:00" },
  "kinds": ["business","activity"],
  "status_in": ["planned","confirmed"],
  "people": ["person_alice","person_bob"],               // 任一命中
  "must_have_roles": [{"role":"host","entity_id":"person_bob"}], // 必須同時命中
  "places": {"geo_within":"Taipei/Songshan"},
  "topics": ["Roadmap"],
  "types_like": ["meeting/%","concert"],
  "tags_all": ["internal"],                               // 全包含
  "priority_range": [0.6, 1.0],
  "confidence_min": 0.7,
  "text_search": "launch OR 上線",
  "overlap_with": { "entity_id": "person_alice", "range": ["2025-09-03T13:00:00+08:00","2025-09-03T18:00:00+08:00"] },
  "limit": 200,
  "order": [{"by":"when.start","dir":"asc"}]
}


回傳：符合的事件陣列（含必要欄位）；可加 page_token 分頁。

2) freebusy(participants, window, granularity_min) -> [{start,end,busy}]

用於產生可用性熱圖或推薦時段前置計算。

3) search_entities(query) -> Entity[]

支援 type[] / name / aliases / labels / region / capacity 等條件。

B. 分析（Analysis）工具
1) aggregate(dimensions, filters, time_bucket?)

用途：做人×地×主題×時間統計、密度圖、趨勢線。
輸入

{
  "dimensions": ["person","place.region","facets.type"], 
  "filters": {
    "time": {"start":"2025-09-01T00:00:00+08:00","end":"2025-09-30T23:59:59+08:00"},
    "kinds": ["business","activity"]
  },
  "time_bucket": "1w"   // 可為 null / 1d / 1w / 1M
}


回傳（例）

{
  "buckets": [
    {
      "time": "2025-09-01",
      "groups": [
        {"person":"person_alice","place.region":"Taipei/Songshan","facets.type":"meeting/roadmap","count":3}
      ]
    }
  ],
  "total": 42
}

2) co_occurrence(left_dim, right_dim, filters, top_k)

用途：找「人×主題」「人×地」「地×活動類型」的共現關係（畫矩陣或Chord）。

{
  "left_dim": "person",
  "right_dim": "topic",
  "filters": { "time": {"start":"2025-09-01","end":"2025-09-30"} },
  "top_k": 50
}


回傳：[{left:"person_alice", right:"topic_roadmap", weight:7}]

3) load_factor(target, time_window)

用途：負載率/忙碌度（人或地點）。

{ "target": {"type":"person","id":"person_alice"}, "time_window":{"start":"2025-09-01","end":"2025-09-30"} }


回傳：{"occupied_minutes": 1240, "window_minutes": 2880, "utilization": 0.43, "back_to_back_max": 4}

4) travel_feasibility(sequence, mode)

用途：檢查一串事件或草案在空間與時間上的可行性（通勤＋緩衝）。

{
  "sequence": [
    {"place":"place_roomA","start":"2025-09-03T14:00:00+08:00","end":"2025-09-03T14:45:00+08:00"},
    {"place":"place_roomB","start":"2025-09-03T15:00:00+08:00","end":"2025-09-03T15:30:00+08:00"}
  ],
  "mode": "walking | driving | transit"
}


回傳：{"ok": false, "violations": ["insufficient_travel_buffer(10min required)"], "min_buffer_needed_min": 5}

5) recommend_insert_slots(constraints) -> options[]

用途：多維（人、地、主題、禁時段、緩衝、優先權）找可插入的最佳時段。

{
  "participants": ["person_alice","person_bob"],
  "place_candidates": ["place_roomA","place_roomB"],
  "duration_min": 45,
  "window": {"start":"2025-09-03T13:00:00+08:00","end":"2025-09-03T18:00:00+08:00"},
  "hard": { "no_weekend": true, "quiet_hours": ["22:00-08:00"], "buffers": {"before":10,"after":5} },
  "soft": { "prefer_mornings": false, "minimize_travel": true, "avoid_back_to_back": true },
  "facets": { "type": "meeting/roadmap", "topics": ["Roadmap"] },
  "limit": 5
}


回傳（例）

[
  {
    "start": "2025-09-03T15:00:00+08:00",
    "end": "2025-09-03T15:45:00+08:00",
    "place": "place_roomA",
    "score": 0.86,
    "reasons": ["all participants free","keeps 10min buffer","min travel"],
    "conflicts": []
  }
]

6) policy_check(draft_event) -> {ok, violations[]}

審查跨時區禮儀、週末禁、會議長度、需要主持人、資源容量等。

7) deduplicate_events(candidates) -> merges[]

用於從多來源（email/爬蟲/手動）合併重複事件。

三、你會用到的主鍵（Key）清單總覽

Event 必備：id, kind, when.start, when.end, when.timezone, roles[], status, visibility

強烈建議：facets.type, facets.topics[], place.entity_id||fallback_text, priority, confidence, constraints.buffer_*

分析向：metrics.travel_min_est, metrics.impact_est, provenance.source, tags

活動向（public/activity）：when.span=true 或 rrule、place.region、facets.type=festival/concert/expo/run

Business 向：roles(role=host/owner) 必備、links.conference/agenda_doc、constraints.max_back_to_back

四、典型使用情境（端到端）

情境 A：查「下月台北、Alice 參與的 Roadmap 會議」

用 filter_events with：time=下月, people=[alice], topics=[Roadmap], places.geo_within=Taipei

視圖：People-Lanes + Map + Timeline，並呼叫 aggregate(["place.region","facets.type"], …) 畫熱力分布。

情境 B：把音樂季（活動）加入行事曆並避免撞期

建立 kind=public_event, facets.type=concert, when.span=true

用 travel_feasibility 檢查與既有活動的通勤／緩衝。

再跑 recommend_insert_slots 幫你在活動空檔插入「見客戶」或「運動」時段。

五、落地建議（索引與驗證）

索引：when.start, when.end（btree）、event_roles(entity_id, role)、facets->'type'、facets->'topics'（GIN）、place.geo（GiST）。

驗證：

when.start < when.end；timezone 合法。

roles 至少一個 host/owner（business 類）。

span=true 則 end-start >= 1d；rrule 與 all_day 互斥檢查視需求。

priority/confidence ∈ [0,1]。