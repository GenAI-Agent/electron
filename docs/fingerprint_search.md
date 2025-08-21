# Fingerprint-Based Search（Zero-Training, Query-Time LLM Rulepack）設計與實作手冊

> 目標：在**完全不做訓練**、**不預先定義類別**、**不預先做資料蒐集/建表**的前提下，僅依賴查詢當下由 **LLM 產生規則包（rulepack）**，配合「指紋（fingerprints）」與通用索引，完成**可解釋、可審計、低耦合、可落地**的混合檢索。

---

## 0. 規格與不變條件

* **零訓練**：不微調任何模型；向量嵌入使用現成通用模型（可替換）。
* **零預定義類別**：不維護 taxonomy；類別與詞庫、正則、寄件者清單等皆由 LLM **在查詢時**產生。
* **零預先建表**：不需事先建立資料庫 schema 或人工標註集；索引與快取可在**首次查詢**或**文件首次被觸達**時動態建立（可選持久化）。
* **可解釋**：每個命中結果輸出「理由碼」與打分構成。
* **安全**：正則守門（RE2/RE2J）、HMAC 雜湊可搜尋、向量量化與加密-at-rest（選配）。

> 註：「不預先建表」指**不需人工規劃資料表/標註資料集**；為了速度與重用，系統可在第一次使用時**自動**建立輕量索引（例如 SQLite FTS5/FAISS in-memory），屬於「程式自建」而非「資料蒐集」。

---

## 1. 整體流程（Query → Rulepack → Fingerprints → 召回 → 融合 → 理由碼）

1. **輸入查詢** `q`（例如：「把所有財務相關的信列出來」或「Augment Code 在 8/8 的款項」）。
2. **LLM 產生 Rulepack（查詢時）**：輸出 YAML/JSON，含：

   * 同義詞/口語詞/縮寫（中英混）
   * 可安全編譯的正則（金額、日期、票據號碼、統編、卡號遮罩…）
   * 寄件者/網域線索（若查詢中含機構名）
   * 欄位權重、距離/片語條件、附件型態提示
   * 過濾條件（日期區間、檔案副檔名…）
3. **（如必要）即時建立/更新文件指紋**：每份文件/郵件切段後產生：

   * **Lexical 指紋**：tokens、bigrams、位置、BM25 統計；（可選）HMAC token-id、Bloom、SimHash。
   * **Semantic 指紋**：句向量（可量化/壓縮）；
   * **Entity 指紋**：以正則/校驗抽取的金額、日期、發票字軌、統編、ISIN、卡號遮罩…（敏感值以 HMAC 儲存）。
   * **Structural 指紋**：subject/from/to/date/has\_attachments/thread\_id…
4. **候選召回（兩路）**：

   * **Lexical/BM25 路**：把 Rulepack 編譯成布林/短語/欄位查詢 → 取 Top-K1。
   * **向量路**：將 `q` 向量化 → ANN（HNSW/IVF-PQ/Flat）取 Top-K2。
   * 合併去重後，按 Rulepack 的過濾器（日期/檔型/寄件者等）快速篩選。
5. **融合重排（無訓練版可用）**：線性/手調權重融合：BM25(subject) > BM25(body) + cos(q,d) + EntityMatch + Proximity + Recency + ThreadBoost。
6. **產物**：

   * 前 N 筆結果（ID、標題、日期、片段）
   * **理由碼**（哪條正則命中、哪個同義詞、是否命中金額/統編/ISIN、是否可信寄件者、距離/欄位權重等）
   * 可選：將本次指紋/向量/快取寫回，以提升後續查詢速度。

---

## 2. LLM Rulepack（查詢時動態生成）

> LLM 僅負責**產生規則與線索**；**不參與排序決策**。

### 2.1 產生 Prompt（模板）

```
You are generating a SAFE rulepack for hybrid search. Output strict YAML only.
Constraints:
- Only include synonyms/phrases, safe regex (RE2-compatible), sender/domain hints, attachment hints, field weights.
- Regex must avoid backreferences/lookbehind and catastrophic patterns; 200 chars max each.
- Provide Chinese and English variants when relevant.
- Provide simple range/date hints if the query implies time windows.

User query: "{{q}}"

YAML keys: synonyms, regexes, sender_domains, attachment_hints, field_weights, filters.
```

### 2.2 期望輸出（範例）

```yaml
synonyms:
  payment: ["付款", "入帳", "撥款", "匯款", "扣款", "對帳", "payment", "remittance"]
  invoice: ["發票", "請款", "發票號", "eInvoice", "invoice"]
regexes:
  amount: "\b(?:NT\$|\$|USD|TWD)\s?\d[\d,]*(?:\.\d{1,2})?\b"
  tw_tax_id: "\b\d{8}\b"
  isin: "\b[A-Z]{2}[A-Z0-9]{9}\d\b"
  date_common: "\b20\d{2}[-/](?:0?[1-9]|1[0-2])[-/](?:0?[1-9]|[12]\d|3[01])\b"
sender_domains: ["*.bank.com", "*.securities.com", "einvoice.nat.gov.tw"]
attachment_hints: ["invoice*.pdf", "*statement*.csv", "*.xlsx"]
field_weights:
  subject: 2.4
  body: 1.0
filters:
  date_hint: "last_90_days"  # 可選
```

### 2.3 安全守門

* 以 **RE2/RE2J** 驗證 regex；拒絕不合規正則。
* 長度上限、關鍵字黑名單、字元類別白名單。
* 將 rulepack 以內容雜湊做 **TTL 快取** 是可選項，但本設計不強制。

---

## 3. 指紋（Fingerprints）—即時/懶建立

> 不做標註、不做監督訓練；純計算生成。首次觸達文件或首次查詢時建立，也可寫回快取以利後續查詢。

### 3.1 Lexical 指紋

* Tokenize（中英混、數字、單位）；unigram/bigram、term positions。
* BM25 統計（tf/df/doc\_len）。
* （可選）**Feature Hashing with HMAC**：`token_id = HMAC(secret, normalized_token)`；索引側僅見雜湊值，查詢側同法雜湊即可匹配。
* （可選）**Bloom Filter**：做「可能含有 X」的快速剪枝。
* （可選）**SimHash(64-bit)**：近重與去雜訊。

### 3.2 Semantic 指紋

* 通用句向量（無需訓練）；可 **float16/INT8 量化** 降成本。
* 建立 **ANN 索引**（HNSW/IVF-PQ/Flat），內存或臨時檔。

### 3.3 Entity 指紋（正則/校驗）

* 金額/貨幣、日期、台灣統編、發票字軌、ISIN/TICKER、卡號遮罩（Luhn 檢核）、稅務詞。
* 以 **HMAC** 儲存敏感值（可搜尋、難逆推）。

### 3.4 Structural 指紋

* subject/from/to/cc/date/message\_id/thread/has\_attachments/mime\_types/length。

---

## 4. 召回與融合（無訓練版即可）

### 4.1 候選召回

* **Lexical**：將 rulepack 編譯為布林/短語/欄位查詢 → FTS/BM25 取 Top-K₁。
* **向量**：`q` 向量化 → ANN 取 Top-K₂。
* **合併去重**，再依 `filters`（日期/寄件者/副檔名/是否含附件）篩選。

### 4.2 融合打分（手調即可）

> 可解釋且不依賴學習。

$$
\text{Score} = 2.4\cdot BM25_{subject}
+ 1.2\cdot BM25_{body}
+ 1.5\cdot \cos(q,d)
+ 1.0\cdot EntityMatch
+ 0.6\cdot Proximity
+ f_{recency}(\Delta days)
+ 0.4\cdot ThreadBoost
$$

* **EntityMatch**：命中金額/統編/ISIN/卡號遮罩/日期等（可分級）。
* **Proximity**：查詢詞間距、是否為短語命中。
* **Recency**：時間衰減或日期貼合加分。
* **ThreadBoost**：同討論串回覆鍊加分。

### 4.3 理由碼（Explain）

* 命中的同義詞/關鍵字/欄位/距離/實體/寄件者/附件。
* 哪條 regex 觸發、哪個範圍過濾生效。

---

## 5. 最小可行實作（Pseudo/Python-ish）

### 5.1 介面

```python
class FingerprintSearch:
    def __init__(self, store):
        self.store = store  # 提供文件流與寫回介面（可是檔案系統/郵件API）
        self.lex = EphemeralFTS()   # 例：SQLite FTS5 / Tantivy in-mem
        self.vec = EphemeralANN()   # 例：FAISS HNSW/IVF in-mem
        self.meta = EphemeralKV()   # 例：SQLite / LMDB / dict

    def query(self, q: str, topn: int = 50) -> list:
        rp = llm_generate_rulepack(q)           # 查詢時動態生成
        self._ensure_fingerprints()             # 懶建立：首次觸達才算
        plan = compile_rulepack(rp)             # 編譯為 FTS/regex/filters
        cand_lex = self.lex.search(plan, k=3000)
        q_vec    = embed(q)
        cand_vec = self.vec.search(q_vec, k=800)
        cands = dedup_union(cand_lex, cand_vec)
        cands = fast_filter(cands, plan.filters, self.meta)
        topK  = take_top(cands, 200)
        rescored = rerank(q, topK, plan.weights, self.meta)
        return build_results_with_explanations(q, rescored, plan)

    def _ensure_fingerprints(self):
        for doc in self.store.iter_new_docs():
            fp = build_fingerprints(doc)        # Lex/Sem/Ent/Struct
            self.lex.add(doc.id, fp)
            self.vec.add(doc.id, fp["sem"]["vec"])  # 可量化
            self.meta.put(doc.id, fp["meta"], fp["ent"])  # 含 HMAC 實體
```

### 5.2 指紋生成（簡化）

```python
def build_fingerprints(doc):
    text = normalize(doc.text)
    tokens, positions = tokenize(text)         # 支援中文/英文/數字
    bm25_stats = compute_bm25(tokens)
    bigrams = list(zip(tokens, tokens[1:]))
    h_tokens = [hmac_sha(t) for t in tokens]
    h_bigrams = [hmac_sha(a+"_"+b) for a,b in bigrams]
    simhash64 = simhash_shingles(text, k=3)

    emb = embed(text)                           # 通用模型，無需訓練
    emb_q = quantize(emb, scheme="int8")      # 選配

    ents = extract_entities(text)               # 正則+校驗
    ents_h = {k:[hmac_sha(v) for v in vals] for k,vals in ents.items()}

    meta = {
        "subject": doc.subject,
        "from_domain": domain_of(doc.from_addr),
        "date": doc.date,
        "has_attachments": bool(doc.attachments),
        "len": len(tokens),
        "simhash": simhash64,
    }
    lex = {"tokens": h_tokens, "bigrams": h_bigrams,
           "positions": positions, "bm25": bm25_stats}
    sem = {"vec": emb_q}
    return {"lex": lex, "sem": sem, "ent": ents_h, "meta": meta}
```

### 5.3 Rulepack 編譯 → 檢索計畫

```python
def compile_rulepack(rp):
    # 生成 FTS 查詢（subject 權重大於 body）與安全 regex、filters
    return SearchPlan(
        fts_should=[
            phrase("subject", rp.synonyms.get("payment", [])),
            phrase("subject", rp.synonyms.get("invoice", [])),
            terms("body", flat(rp.synonyms.values())),
        ],
        regex=list(rp.regexes.values()),
        sender_domains=rp.sender_domains,
        attachments=rp.attachment_hints,
        weights=rp.field_weights or {"subject":2.4, "body":1.0},
        filters=rp.filters,
    )
```
