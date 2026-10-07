---
title: PostgreSQL、MySQL、SQLite、SQL Server、MongoDB 怎麼選？從需求到語法的比較筆記
description: 用商品、訂單、離線筆記與問卷等情境，比較常見資料庫的選型、資料型別、交易與併發特性，再對照自動編號、分頁、Upsert、JSON 查詢等語法差異。
date: 2026-10-07
category: tech-deep-dive
---

做離線筆記，我不太想為了存幾篇文字再架一台資料庫伺服器；換成購物網站，就得考慮訂單、商品和會員怎麼互相對照。需求換了，選型也會跟著變。

前一篇[資料庫規劃筆記](/posts/database-planning-interview-notes/)用 PostgreSQL 談搶票與交易。接著想看看：換成 MySQL，SQL 能直接搬嗎？MongoDB、SQLite 或 Cloudflare D1 又適合用在哪裡？SQL Server 也一起放進來比較，下面簡稱 MSSQL，PostgreSQL 則簡稱 PG。

## 什麼情境，我會先考慮哪一套？

<div class="table-wrapper" tabindex="0" role="group" aria-label="六種資料庫選型比較（可水平捲動）">

| 資料庫        | 我會先評估的需求                              | 選之前要確認                                |
| ------------- | --------------------------------------------- | ------------------------------------------- |
| PostgreSQL    | 商品、訂單、複雜查詢；需要 `jsonb` 或 PostGIS | 團隊維運能力，託管平台允許哪些擴充          |
| MySQL         | 一般網站、購物系統；已有 MySQL 工具與經驗     | 儲存引擎與設定；這裡以 InnoDB 為準          |
| SQLite        | 離線筆記、桌面工具、單機服務                  | 同時只能有一個 writer，多裝置同步要另外設計 |
| SQL Server    | 公司已有相關資料庫、報表與管理工具            | 版本、版別、授權與相容性層級                |
| MongoDB       | 問卷回覆、設定文件，常整份讀寫的巢狀資料      | 跨文件查詢、驗證規則與文件成長方式          |
| Cloudflare D1 | API 已在 Workers，希望用託管 SQL              | 容量、用量、交易方式與讀取一致性            |

</div>

做訂單系統，我會先從關聯式資料庫開始。團隊沒有既定選擇的話，就拿 PG 試一份設計；如果 MySQL 或 SQL Server 的備份、維運流程都已經有了，我也沒有一定要換掉它的理由。

像問卷回覆，每份答案的結構可能不同，又常整份打開、整份保存，MongoDB 的 BSON 文件就值得考慮。但存一個商品 ID，不代表它會像 SQL 外鍵那樣替你確認商品存在。單份文件也有 16 MiB 上限，會員的歷史訂單不能一直往同一個陣列塞。

SQLite 則嵌在應用程式裡，不必另外架資料庫服務。它也能用於單機 API，是否適合要看寫入競爭與交易時間，不能只看使用者人數。

## int、bigint、boolean 等型別，有哪些差別？

這些名稱是「資料型別」。常見的還有文字、日期時間、二進位資料和 JSON；同名型別在不同系統裡，不一定有相同限制。

<div class="table-wrapper" tabindex="0" role="group" aria-label="常用資料型別比較（可水平捲動）">

| 資料庫     | 整數、金額與布林                                                                  | 文字、二進位資料                       | JSON、識別碼與陣列                                                |
| ---------- | --------------------------------------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------- |
| PG         | `smallint`、`int`、`bigint`；`numeric`／`decimal`；`boolean`                      | `varchar`、`text`；`bytea`             | `json`、`jsonb`；`uuid`；原生陣列                                 |
| MySQL      | `TINYINT` 到 `BIGINT`，可用 `UNSIGNED`；`DECIMAL`；`BOOLEAN` 是 `TINYINT(1)` 別名 | `VARCHAR`、`TEXT`；`VARBINARY`、`BLOB` | 原生 `JSON`；UUID 常存 `BINARY(16)` 或 `CHAR(36)`                 |
| SQLite／D1 | `INTEGER`；沒有一般內建的固定精度 decimal；布林常存 0／1                          | `TEXT`；`BLOB`                         | JSON 可存文字；UUID 常存 `TEXT` 或 `BLOB`                         |
| SQL Server | `tinyint`、`smallint`、`int`、`bigint`；`decimal`；`bit`                          | `varchar`、`nvarchar`；`varbinary`     | 2022 用文字搭配 JSON 函式；2025 有原生 `json`；`uniqueidentifier` |
| MongoDB    | BSON int32、int64、Decimal128、boolean                                            | string；binary                         | 文件、array；`ObjectId`；UUID 通常用 binary subtype 4             |

</div>

庫存用 `int` 通常夠用，長期成長的 ID 則要看是否需要 `bigint`。但 JavaScript `Number` 的安全整數範圍比有號 64 位元整數小，大型 ID 在 API 裡用字串傳遞，能避免前端讀錯。

金額可以用合適的 `decimal`，也能約定以分為單位存整數，例如 1,290.50 元存成 `129050`。`float`、`double`、`real` 是近似浮點數；SQLite 宣告 `DECIMAL(10, 2)` 也不會自動得到固定兩位小數的精確儲存。

布林值同樣要看限制。PG 有原生 `boolean`；MySQL 的別名、SQLite 的整數欄位，都不會光靠名稱就把資料限制成 0／1，必要時加上 `CHECK`。MongoDB 的 Decimal128 也沒有 SQL `DECIMAL(p, s)` 那種欄位宣告，固定小數位數仍需驗證。

時間型別尤其容易混淆：PG 的 `timestamptz` 表示時間點，不保留原始時區名稱；MySQL 的 `TIMESTAMP` 會按連線時區轉換，`DATETIME` 沒有相同行為。SQL Server 可用 `datetime2` 或 `datetimeoffset`，但它的 `timestamp` 是資料版本，不是日期。SQLite／D1 常用文字或數值，MongoDB 用 BSON Date；若還需要 `Asia/Taipei` 這類時區名稱，要另外保存。

## SQL 觀念能沿用，語法不一定能直接搬

以下以 PG 18、MySQL 8.4、SQLite 3.45 以上、SQL Server 2022 和 MongoDB 8.x 為基準。D1 採 SQLite 語意，支援範圍另依平台文件確認。

<div class="table-wrapper" tabindex="0" role="group" aria-label="常見查詢語法比較（可水平捲動）">

| 操作          | PG                          | MySQL                                          | SQLite／D1                       | SQL Server                               |
| ------------- | --------------------------- | ---------------------------------------------- | -------------------------------- | ---------------------------------------- |
| 自動編號      | `GENERATED ... AS IDENTITY` | `AUTO_INCREMENT`                               | `INTEGER PRIMARY KEY`            | `IDENTITY(1, 1)`                         |
| 分頁          | `LIMIT 10 OFFSET 20`        | `LIMIT 10 OFFSET 20`                           | `LIMIT 10 OFFSET 20`             | `OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY` |
| Upsert        | `ON CONFLICT ... DO UPDATE` | `ON DUPLICATE KEY UPDATE`                      | `ON CONFLICT ... DO UPDATE`      | 可用 `MERGE`，需確認鎖定與併發行為       |
| JSON 取文字值 | `specs ->> 'color'`         | `JSON_UNQUOTE(JSON_EXTRACT(specs, '$.color'))` | `json_extract(specs, '$.color')` | `JSON_VALUE(specs, '$.color')`           |

</div>

例如找有庫存的商品，PG、MySQL 和 SQLite 可以這樣分頁：

```sql
SELECT id, name FROM products
WHERE stock > 0
ORDER BY id
LIMIT 10 OFFSET 20;
```

SQL Server 把最後一行換成表裡的 `OFFSET ... FETCH`。MongoDB 則使用查詢 API：

```javascript
db.products
  .find({ stock: { $gt: 0 } })
  .sort({ _id: 1 })
  .skip(20)
  .limit(10);
```

分頁要有明確排序；很後面的頁碼可能需要掃過大量資料，再評估游標分頁。Upsert 也要有對應的唯一限制或索引，不能只寫「先查沒有，再新增」就忽略同時送來的請求。

## 庫存競爭與 D1 的交易方式

兩個人搶最後一件商品時，可以把庫存條件放進更新：

```sql
UPDATE products SET stock = stock - 1
WHERE sku = 'P101' AND stock > 0;
```

程式必須檢查實際更新筆數，再讓扣庫存和新增訂單一起成功或失敗。PG、MySQL InnoDB、SQLite 和 SQL Server 都支援交易；MongoDB 的單文件更新具原子性，多文件交易則需要 replica set 或 sharded cluster 等部署條件。

D1 由 Cloudflare 管理，透過 Workers binding 或 HTTP API 存取。`batch()` 能依序執行一批 SQL，發生 SQL 錯誤時整批回滾；但「更新了 0 筆」通常不是 SQL 錯誤，缺貨邏輯仍得自己約束，不能以為放進 batch 就完成了交易設計。

D1 的寫入會回主要資料庫，讀取副本的一致性由 Sessions API 管理。它還有容量、查詢時間及讀寫額度限制；Workers binding 不支援 JavaScript `BigInt`，大型 ID 可以用文字欄位，或先 `CAST(id AS TEXT)` 再讀回。已有 PG 或 MySQL 的專案，也可以評估 Hyperdrive，讓 Workers 連接原本的資料庫。

選好之後，還是得拿自己的查詢試一次。兩個請求搶最後一件商品，是否只有一筆成功？訂單沒存成，庫存有沒有還原？我也會實際試著還原備份，確認資料真的取得回來。

## 語法速查與相關資料

- PostgreSQL：[SQL 指令](https://www.postgresql.org/docs/18/sql-commands.html)、[`psql` help](https://www.postgresql.org/docs/18/app-psql.html)
- MySQL：[SQL statements](https://dev.mysql.com/doc/refman/8.4/en/sql-statements.html)、[client 指令](https://dev.mysql.com/doc/refman/8.4/en/mysql-commands.html)
- SQLite：[SQL 語法](https://www.sqlite.org/lang.html)、[CLI 指令](https://www.sqlite.org/cli.html)
- SQL Server：[T-SQL reference](https://learn.microsoft.com/en-us/sql/t-sql/language-reference?view=sql-server-ver16)
- MongoDB：[Shell Cheat Sheet](https://learn.mongodb.com/courses/mongodb-shell-cheatsheet)
- Cloudflare D1：[SQL／PRAGMA](https://developers.cloudflare.com/d1/sql-api/sql-statements/)、[Prepared statement API](https://developers.cloudflare.com/d1/worker-api/prepared-statements/)

<details>
<summary>各系統的型別、交易與平台限制文件</summary>

<p>MongoDB：<a href="https://www.mongodb.com/docs/v8.0/core/document/">MongoDB 的文件結構說明</a>、<a href="https://www.mongodb.com/docs/manual/reference/operator/aggregation/lookup/">$lookup</a>、<a href="https://www.mongodb.com/docs/manual/data-modeling/">官方資料建模說明</a>、<a href="https://www.mongodb.com/docs/manual/reference/limits/#bson-documents">16 MiB 的大小限制</a>、<a href="https://www.mongodb.com/docs/manual/reference/bson-types/">BSON 型別</a>、<a href="https://www.mongodb.com/docs/mongodb-shell/reference/data-types/">mongosh 資料型別文件</a>、<a href="https://www.mongodb.com/docs/manual/core/schema-validation/">schema validation</a>、<a href="https://www.mongodb.com/docs/manual/reference/method/cursor.skip/">MongoDB 的 skip() 說明</a>、<a href="https://www.mongodb.com/docs/manual/reference/method/db.collection.updateOne/">updateOne() 的 Upsert 說明</a>、<a href="https://www.mongodb.com/docs/manual/core/index-unique/">唯一索引文件</a>、<a href="https://www.mongodb.com/docs/manual/core/write-operations-atomicity/">原子更新文件</a>、<a href="https://www.mongodb.com/docs/manual/core/transactions/">MongoDB 的交易文件</a>、<a href="https://www.mongodb.com/docs/mongodb-shell/reference/methods/">mongosh 方法索引</a>、<a href="https://www.mongodb.com/docs/mongodb-shell/reference/access-mdb-shell-help/">mongosh 內建 help</a>。</p>

<p>Cloudflare D1 與 Workers：<a href="https://developers.cloudflare.com/d1/">D1 的介紹</a>、<a href="https://developers.cloudflare.com/d1/worker-api/#type-conversion">D1 的型別轉換與 BigInt 限制</a>、<a href="https://developers.cloudflare.com/d1/worker-api/return-object/">D1 的回傳結果說明</a>、<a href="https://developers.cloudflare.com/d1/sql-api/foreign-keys/">D1 的外鍵說明</a>、<a href="https://developers.cloudflare.com/d1/sql-api/query-json/">JSON 函式速查</a>、<a href="https://developers.cloudflare.com/d1/reference/time-travel/">D1 的備份與復原文件</a>、<a href="https://developers.cloudflare.com/d1/worker-api/d1-database/#batch">D1 的 batch() 說明</a>、<a href="https://developers.cloudflare.com/d1/best-practices/read-replication/">讀取副本的一致性說明</a>、<a href="https://developers.cloudflare.com/d1/platform/limits/">容量與查詢限制</a>、<a href="https://developers.cloudflare.com/d1/platform/pricing/">價格與使用量</a>、<a href="https://developers.cloudflare.com/hyperdrive/">Hyperdrive</a>、<a href="https://developers.cloudflare.com/d1/worker-api/d1-database/">batch() 與 session</a>。</p>

<p>MySQL：<a href="https://dev.mysql.com/doc/refman/8.4/en/innodb-storage-engine.html">InnoDB</a>、<a href="https://dev.mysql.com/doc/refman/8.4/en/data-types.html">資料型別</a>、<a href="https://dev.mysql.com/doc/refman/8.4/en/integer-types.html">MySQL 整數型別</a>、<a href="https://dev.mysql.com/doc/refman/8.4/en/example-auto-increment.html">MySQL 的自動編號文件</a>、<a href="https://dev.mysql.com/doc/refman/8.4/en/insert-on-duplicate.html">MySQL 的官方說明</a>、<a href="https://dev.mysql.com/doc/refman/8.4/en/json.html">MySQL JSON 型別</a>、<a href="https://dev.mysql.com/doc/refman/8.4/en/create-table-secondary-indexes.html#json-column-indirect-index">MySQL 的 JSON 索引方式</a>、<a href="https://dev.mysql.com/doc/refman/8.4/en/case-sensitivity.html">MySQL 的大小寫規則</a>、<a href="https://dev.mysql.com/doc/refman/8.4/en/datetime.html">DATETIME／TIMESTAMP 的差異</a>。</p>

<p>PostgreSQL：<a href="https://postgis.net/docs/using_postgis_dbmanagement.html">PostGIS 的空間資料與查詢能力</a>、<a href="https://www.postgresql.org/docs/18/datatype.html">資料型別</a>、<a href="https://www.postgresql.org/docs/18/datatype-numeric.html">PostgreSQL 數值型別</a>、<a href="https://www.postgresql.org/docs/18/arrays.html#ARRAYS-SEARCHING">PostgreSQL 的陣列設計提醒</a>、<a href="https://www.postgresql.org/docs/18/ddl-identity-columns.html">Identity column</a>、<a href="https://www.postgresql.org/docs/18/sql-insert.html">PostgreSQL 的 INSERT ... RETURNING</a>、<a href="https://www.postgresql.org/docs/18/queries-limit.html">PostgreSQL 的分頁說明</a>、<a href="https://www.postgresql.org/docs/18/sql-insert.html#SQL-ON-CONFLICT">PostgreSQL 的衝突處理</a>、<a href="https://www.postgresql.org/docs/18/datatype-json.html">PostgreSQL JSON 型別</a>、<a href="https://www.postgresql.org/docs/18/datatype-json.html#JSON-INDEXING">PostgreSQL 的 JSON 索引說明</a>、<a href="https://www.postgresql.org/docs/18/functions-matching.html">PostgreSQL 的比對運算</a>、<a href="https://www.postgresql.org/docs/18/datatype-datetime.html">日期時間型別</a>。</p>

<p>SQLite：<a href="https://www.sqlite.org/whentouse.html">SQLite 的適用情境說明</a>、<a href="https://www.sqlite.org/datatype3.html">型別與 affinity</a>、<a href="https://www.sqlite.org/autoinc.html">SQLite 的自動編號說明</a>、<a href="https://www.sqlite.org/stricttables.html">STRICT tables 文件</a>、<a href="https://www.sqlite.org/lang_returning.html">SQLite 的 RETURNING</a>、<a href="https://www.sqlite.org/lang_upsert.html">SQLite 的 UPSERT</a>、<a href="https://www.sqlite.org/json1.html">SQLite JSON 函式</a>、<a href="https://www.sqlite.org/isolation.html">SQLite 的隔離與併發說明</a>、<a href="https://www.sqlite.org/wal.html">WAL 的限制</a>、<a href="https://www.sqlite.org/lang_expr.html#like">SQLite 的 LIKE</a>、<a href="https://www.sqlite.org/foreignkeys.html#fk_enable">SQLite 的外鍵文件</a>。</p>

<p>SQL Server：<a href="https://learn.microsoft.com/en-us/sql/t-sql/data-types/data-types-transact-sql?view=sql-server-ver16">資料型別</a>、<a href="https://learn.microsoft.com/en-us/sql/t-sql/data-types/int-bigint-smallint-and-tinyint-transact-sql?view=sql-server-ver16">SQL Server 整數型別</a>、<a href="https://learn.microsoft.com/en-us/sql/t-sql/statements/create-table-transact-sql-identity-property?view=sql-server-ver16">IDENTITY</a>、<a href="https://learn.microsoft.com/en-us/sql/t-sql/queries/output-clause-transact-sql?view=sql-server-ver16">新增後取值的 OUTPUT</a>、<a href="https://learn.microsoft.com/en-us/sql/t-sql/queries/select-order-by-clause-transact-sql?view=sql-server-ver16">排序與分頁</a>、<a href="https://learn.microsoft.com/en-us/sql/t-sql/statements/merge-transact-sql?view=sql-server-ver16#concurrency-considerations-for-merge">MERGE 的併發注意事項</a>、<a href="https://learn.microsoft.com/en-us/sql/relational-databases/json/json-data-sql-server?view=sql-server-ver17">版本與 JSON 功能說明</a>、<a href="https://learn.microsoft.com/en-us/sql/t-sql/functions/json-value-transact-sql?view=sql-server-ver17">JSON_VALUE</a>、<a href="https://learn.microsoft.com/en-us/sql/relational-databases/json/index-json-data?view=sql-server-ver16">SQL Server 的 JSON 索引方式</a>、<a href="https://learn.microsoft.com/en-us/sql/relational-databases/collations/collation-and-unicode-support?view=sql-server-ver16">SQL Server 的 collation</a>、<a href="https://learn.microsoft.com/en-us/sql/t-sql/data-types/rowversion-transact-sql?view=sql-server-ver16">rowversion 文件</a>。</p>

<p>JavaScript 與其他資料庫：<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER">JavaScript 的安全整數範圍</a>、<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt#use_within_json">BigInt 的 JSON 序列化說明</a>、<a href="https://mariadb.com/docs/server/reference/data-types/string-data-types/json">MariaDB 的 JSON 文件</a>、<a href="https://redis.io/docs/latest/develop/data-types/">Redis 的資料型別說明</a>、<a href="https://duckdb.org/">DuckDB 的介紹</a>。</p>

</details>

站內相關文章：

- [資料庫規劃筆記：從搶票、多對多關係到回歸測試](/posts/database-planning-interview-notes/)
- [從商品列表到建立訂單，API 要怎麼設計？](/posts/api-design-products-orders/)
- [用 Vue 的觀念理解 Laravel：前端工程師的後端入門筆記](/posts/laravel-php-first-backend/)
