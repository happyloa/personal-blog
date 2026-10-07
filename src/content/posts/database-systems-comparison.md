---
title: PostgreSQL、MySQL、SQLite、SQL Server、MongoDB 怎麼選？從需求到語法的比較筆記
description: 用商品、訂單、離線筆記與問卷等情境，比較常見資料庫的選型、資料型別、交易與併發特性，再對照自動編號、分頁、Upsert、JSON 查詢等語法差異。
date: 2026-10-07
category: tech-deep-dive
---

前一篇[資料庫規劃筆記](/posts/database-planning-interview-notes/)用 PostgreSQL 整理了搶票、商品分類和交易的做法。接著就會想到：如果專案用 MySQL，那些 SQL 能直接搬過去嗎？只是做一個離線筆記工具，有必要另外架一台資料庫伺服器嗎？

MongoDB 看起來又很像前端常用的 JSON。如果商品規格一直變，把物件直接存進去，是不是比較好處理？

這次想把幾種常見資料庫放在一起看。先用需求判斷，再拿同一組商品資料對照語法，看看換資料庫時，哪些觀念能沿用、哪些地方得重新確認。

SQL 範例以 PostgreSQL 18、MySQL 8.4 的 InnoDB、SQLite 3.45 以上，以及 SQL Server 2022 為基準；SQL Server 2025 的 JSON 功能另外補充。MongoDB 範例採用 8.x 的 `mongosh` 寫法。這些是比較用的版本基準，實際專案仍要核對自己的版本與設定。

另外也把 Cloudflare D1 放進比較。它使用 SQLite 的 SQL 語意，但由 Cloudflare 管理，使用方式與平台限制得另外看。

## 先看資料怎麼存、程式怎麼連

PostgreSQL 常簡稱 Postgres 或 PG；MSSQL 通常指 Microsoft SQL Server。這幾個名稱裡，PostgreSQL、MySQL、SQLite、SQL Server 都是關聯式資料庫，主要用資料表、欄位與 SQL 管理資料。

MongoDB 則以文件為單位，資料存成 BSON，可以包含巢狀物件、陣列，也有 JSON 之外的型別，例如 `ObjectId`。一般應用程式使用 MongoDB 的查詢 API 和 aggregation pipeline，並不會把一段 SQL 原封不動交給它。詳見 [MongoDB 的文件結構說明](https://www.mongodb.com/docs/v8.0/core/document/)。

另一個差異是部署方式。SQLite 通常直接嵌在應用程式裡，由程式開啟本機資料庫檔案；其他四套通常由程式透過連線存取資料庫服務。

D1 則是託管的 serverless SQL 資料庫，應用程式可透過 Workers binding 或 HTTP API 查詢，詳見 [D1 的介紹](https://developers.cloudflare.com/d1/)。它可以沿用許多 SQLite 觀念，但應用程式不會直接開啟遠端的資料庫檔案。

<div class="table-wrapper" tabindex="0" role="group" aria-label="六種資料庫基本比較（可水平捲動）">

| 資料庫        | 資料組織方式                      | 一般使用方式                | 我會先評估的情境                                |
| ------------- | --------------------------------- | --------------------------- | ----------------------------------------------- |
| PostgreSQL    | 關聯式資料表，也有 `jsonb` 等型別 | 連線到資料庫服務            | 訂單、會員、複雜查詢，以及需要擴充功能的系統    |
| MySQL         | 關聯式資料表，支援 JSON           | 連線到資料庫服務            | 一般網站、購物系統，或已有 MySQL 維運流程的專案 |
| SQLite        | 關聯式資料表                      | 應用程式開啟本機檔案        | 離線 App、桌面工具、單機服務                    |
| Cloudflare D1 | 關聯式資料表，使用 SQLite 語意    | Workers binding 或 HTTP API | API 部署在 Workers、希望使用託管 SQL 的系統     |
| SQL Server    | 關聯式資料表，使用 T-SQL          | 連線到資料庫服務            | 已採用 SQL Server、相關報表與管理工具的企業系統 |
| MongoDB       | BSON 文件與 collection            | 連線到資料庫服務            | 常以完整文件讀寫、巢狀結構明確的資料            |

</div>

表裡的情境是選型起點。同一個購物網站，用 PostgreSQL、MySQL 或 SQL Server 都能實作；差別還包括團隊熟悉什麼、部署平台支援什麼，以及之後由誰備份、監控和處理故障。

## 換成具體需求，我會怎麼選？

### 商品、會員、訂單：先評估關聯式資料庫

假設一張訂單有多個商品，商品又能放進不同分類。後台還要查「某個會員買過哪些商品」、「某分類這個月賣了多少」。

這些資料會反覆互相對照，我會先考慮 PostgreSQL、MySQL 或 SQL Server，用外鍵和唯一限制管理關係，把必須一起成功的修改放進交易。

如果是新專案，團隊沒有既定選擇，又需要處理較多 JSON 條件查詢，我會先評估 PostgreSQL 的 `jsonb` 與索引。若專案已有 MySQL 的 migration、備份和維運流程，沿用 MySQL 也很合理。MySQL 的交易和外鍵能力要看儲存引擎；這篇使用的 [InnoDB](https://dev.mysql.com/doc/refman/8.4/en/innodb-storage-engine.html) 支援這些功能。

PostgreSQL 還能透過擴充功能處理特定需求。例如要找「距離某個位置最近的門市」，可以評估 [PostGIS 的空間資料與查詢能力](https://postgis.net/docs/using_postgis_dbmanagement.html)。採用託管服務時，也得先確認平台允許安裝需要的擴充。

### 離線筆記、桌面記帳工具：SQLite 很值得考慮

如果資料主要由同一台裝置上的 App 讀寫，SQLite 能省掉另外管理資料庫服務的工作。使用者沒有網路時，也能在本機新增和查詢資料。

SQLite 也能用於單機網站或 API。重點在寫入是否需要排隊、交易會持續多久，以及資料庫檔案是不是和執行 SQL 的程式放在同一台機器；不能只看網站有幾個使用者，就決定它行不行。[SQLite 的適用情境說明](https://www.sqlite.org/whentouse.html)也包含伺服器端使用方式。

但「本機有 SQLite」不會自動解決多裝置同步。手機與電腦同時改一篇筆記，版本怎麼比較、刪除怎麼同步，仍是應用程式要設計的事。

### API 已經放在 Workers：也可以評估 D1

假設要做文章後台、活動報名或小型商品管理，API 本來就部署在 Cloudflare Workers，又希望用 SQL 查資料，我會把 D1 列入評估。它能減少自行管理資料庫伺服器的工作，但仍要設計資料表、索引與 migration。

若是離線 App，還是需要裝置上的本機資料庫；若已經有 PostgreSQL 或 MySQL，也不必為了使用 Workers 就換掉資料庫。後面會再比較 D1 的交易、容量和讀取副本，看看需求是否適合。

### 已有企業資料庫與報表：先看 SQL Server 的既有環境

假設公司已經用 SQL Server 管理訂單，報表、權限、備份與維運人員也都圍繞它建立，新後台繼續使用 SQL Server，能沿用不少現有工作。

這時我會先確認資料庫版本、相容性層級、使用的版別和部署授權，再看需要哪些功能。也不用因為程式是 .NET，就認定只能用 SQL Server；選型仍要回到現有系統和需求。

### 問卷、設定文件：MongoDB 可以把常一起用的資料放在一起

假設一份問卷回覆有不同題型，平常都是打開一份回覆、顯示所有答案，再一起保存：

```javascript
db.responses.insertOne({
  formId: "event-feedback",
  schemaVersion: 1,
  answers: [
    { questionId: "rating", value: 5 },
    { questionId: "topics", value: ["database", "api"] },
    { questionId: "comment", value: "希望多一些實作範例" },
  ],
});
```

這種讀寫方式可以評估 MongoDB 的嵌入式文件設計。若要保留題目當時的文字，還要另外決定存問卷版本，或在回覆裡保留題目快照；只有 `questionId`，無法保證題目改名後還原得出原本內容。

但如果每次都要跨大量回覆找答案、按題目統計，這些查詢也得納入設計。MongoDB 能用參照連結不同文件，也支援 [`$lookup`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/lookup/)；嵌入或拆開，應該依平常怎麼查、怎麼更新來決定，詳見[官方資料建模說明](https://www.mongodb.com/docs/manual/data-modeling/)。

也別把一個會員的所有歷史紀錄，無限塞進同一個陣列。MongoDB 單份 BSON 文件有 [16 MiB 的大小限制](https://www.mongodb.com/docs/manual/reference/limits/#bson-documents)，資料會持續成長時，要考慮拆成獨立文件。

## int、bigint、boolean：常用資料型別怎麼對照？

`int`、`bigint`、`boolean` 是資料型別，用來決定一個欄位能存什麼值、接受多大的範圍，以及資料庫怎麼處理它。像是庫存要存整數、商品名稱要存文字、是否上架要存布林值。

先把常見的數字與布林型別放在一起：

<div class="table-wrapper" tabindex="0" role="group" aria-label="整數小數與布林資料型別比較（可水平捲動）">

| 資料庫        | 整數                                                                      | 精確十進位小數                          | 浮點數                     | 布林值                                   |
| ------------- | ------------------------------------------------------------------------- | --------------------------------------- | -------------------------- | ---------------------------------------- |
| PostgreSQL    | `smallint`、`integer`／`int`、`bigint`                                    | `numeric(p, s)`／`decimal(p, s)`        | `real`、`double precision` | `boolean`                                |
| MySQL         | `TINYINT`、`SMALLINT`、`MEDIUMINT`、`INT`、`BIGINT`，也有 `UNSIGNED` 版本 | `DECIMAL(p, s)`／`NUMERIC(p, s)`        | `FLOAT`、`DOUBLE`          | `BOOLEAN`／`BOOL` 是 `TINYINT(1)` 的別名 |
| SQLite        | `INTEGER` 的整數值可使用有號 64 位元範圍                                  | 沒有一般內建的固定精度 decimal 儲存型別 | `REAL` 是 64 位元浮點數    | 常用 `INTEGER` 存 0／1，搭配 `CHECK`     |
| Cloudflare D1 | 沿用 SQLite 的 `INTEGER`；API 另有 JavaScript 精度限制                    | 沒有一般內建的固定精度 decimal 儲存型別 | `REAL`                     | 存成 `INTEGER` 的 0／1                   |
| SQL Server    | `tinyint`、`smallint`、`int`、`bigint`                                    | `decimal(p, s)`／`numeric(p, s)`        | `real`、`float`            | `bit`                                    |
| MongoDB       | BSON 32-bit integer、64-bit integer（long）                               | BSON Decimal128                         | BSON double                | BSON boolean                             |

</div>

文字、二進位資料與較特殊的結構，則可以這樣對照。日期時間的時區差異，後面再用一張表補充。

<div class="table-wrapper" tabindex="0" role="group" aria-label="文字二進位與結構資料型別比較（可水平捲動）">

| 資料庫        | 文字                                                                  | 二進位資料                               | JSON／文件                                        | UUID 與陣列                                                      |
| ------------- | --------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------- |
| PostgreSQL    | `char(n)`、`varchar(n)`、`text`                                       | `bytea`                                  | `json`、`jsonb`                                   | 原生 `uuid`，也有 `integer[]`、`text[]` 等陣列                   |
| MySQL         | `CHAR(n)`、`VARCHAR(n)`、`TEXT` 系列                                  | `BINARY(n)`、`VARBINARY(n)`、`BLOB` 系列 | 原生 `JSON`                                       | UUID 常用 `BINARY(16)` 或 `CHAR(36)`；陣列可用 JSON 或另外建表   |
| SQLite        | `TEXT`                                                                | `BLOB`                                   | 可存 JSON 文字或 SQLite JSONB，再用 JSON 函式操作 | UUID 常用 `TEXT` 或 `BLOB`；陣列可存 JSON 或另外建表             |
| Cloudflare D1 | `TEXT`                                                                | `BLOB`                                   | 可存 JSON 文字，再用 JSON 函式操作                | UUID 可用 `TEXT` 或 `BLOB`；陣列可存 JSON 或另外建表             |
| SQL Server    | `char`、`varchar`、`nchar`、`nvarchar`；長文字可用 `nvarchar(max)` 等 | `binary`、`varbinary`                    | 2022 可用文字加 JSON 函式；2025 有原生 `json`     | 原生 `uniqueidentifier`；一般欄位沒有 PostgreSQL 式的陣列型別    |
| MongoDB       | BSON string                                                           | BSON binary data                         | 嵌入文件（object）                                | 原生 BSON array；UUID 通常使用 binary subtype 4，另有 `ObjectId` |

</div>

這些型別的長度、範圍與轉換規則並不完全相同。完整定義可查 [PostgreSQL](https://www.postgresql.org/docs/18/datatype.html)、[MySQL](https://dev.mysql.com/doc/refman/8.4/en/data-types.html)、[SQLite](https://www.sqlite.org/datatype3.html)、[SQL Server](https://learn.microsoft.com/en-us/sql/t-sql/data-types/data-types-transact-sql?view=sql-server-ver16)與 [MongoDB BSON](https://www.mongodb.com/docs/manual/reference/bson-types/) 的型別文件。`ObjectId` 和 UUID 也不同，不能直接拿兩者互換。

D1 的型別以 SQLite 為基礎，但程式透過 API 寫入、讀回時還有轉換規則。像布林值寫入後會變成整數 0／1，讀回來不會自動還原成 JavaScript `boolean`，見 [D1 Workers Binding API 的型別轉換](https://developers.cloudflare.com/d1/worker-api/#type-conversion)。

文字型別也要看用途。像商品代碼、名稱，可以先評估 `varchar`；文章正文通常會用 `text` 或相應的長文字型別。SQL Server 範例選 `nvarchar` 保存 Unicode 文字，MySQL 則搭配 `utf8mb4`。宣告長度的計算方式也要核對，不能假設 `varchar(200)`、`nvarchar(200)` 都代表相同的 200 個使用者可見字元。

二進位型別存的是位元組，例如圖片或 PDF 的檔案內容；它不會因為欄位叫 `BLOB`，就自動驗證那是一張合法圖片。若把檔案放在物件儲存，資料庫則可以保存檔案位置、大小與用途，選型時也要把備份和讀取方式一起考慮。

### int 和 bigint，差在能存多大的整數

例如商品庫存是 10，`int` 通常就夠用；如果主鍵或外部系統編號可能超過 32 位元整數範圍，就得評估 `bigint`。

PostgreSQL、MySQL 的有號 `INT`，以及 SQL Server 的 `int`，常見範圍都是 -2,147,483,648 到 2,147,483,647。這幾套的有號 `bigint` 則使用 64 位元整數範圍。MySQL 的 `UNSIGNED` 把範圍改成從 0 開始；例如 `INT UNSIGNED` 的上限是 4,294,967,295。

同名型別也有差異：MySQL 的 `TINYINT` 預設能存 -128 到 127，SQL Server 的 `tinyint` 則是 0 到 255。詳細範圍見 [PostgreSQL 數值型別](https://www.postgresql.org/docs/18/datatype-numeric.html)、[MySQL 整數型別](https://dev.mysql.com/doc/refman/8.4/en/integer-types.html)與 [SQL Server 整數型別](https://learn.microsoft.com/en-us/sql/t-sql/data-types/int-bigint-smallint-and-tinyint-transact-sql?view=sql-server-ver16)。

SQLite 的一般表即使宣告 `INT` 或 `BIGINT`，也不會因此變成兩種不同寬度的整數儲存型別；它們會影響欄位的 type affinity，也就是資料庫優先嘗試怎麼轉換值。後面建立商品表時，會用 `STRICT` 讓型別限制更明確。

### 金額用 decimal，還是像範例一樣存整數？

PostgreSQL、MySQL、SQL Server 都有精確十進位型別。像 `DECIMAL(10, 2)` 的 `10` 是總位數、`2` 是小數位數，在這個宣告下可以容納 8 位整數加 2 位小數。超出小數位數時，實際怎麼四捨五入、何時拒絕資料，也要按資料庫與設定確認。

例如保存成交價 1,290.50 元，可以用合適的 `decimal`；也能訂好單位，改用整數保存成 `129050`。後者適合小數位數固定、團隊願意在 API 和計算裡一致處理單位的情況。`float`、`double`、`real` 用的是近似的二進位浮點數，不能只因為畫面顯示兩位小數，就認為底層金額已經精確保存。

SQLite 這裡尤其容易誤會。一般表寫 `DECIMAL(10, 2)`，不會得到其他三套那樣的固定精度 decimal 欄位：

```sql
-- SQLite 一般表，刻意示範彈性型別。
CREATE TABLE type_demo (amount DECIMAL(10, 2));

INSERT INTO type_demo (amount)
VALUES (12.345), ('尚未付款');

SELECT amount, typeof(amount) AS stored_type
FROM type_demo;
```

這兩筆會分別得到 `12.345`／`real` 和「尚未付款」／`text`，沒有自動限制成兩位小數。需要金額精確時，可以像後面的範例保存固定單位的整數，並明確限制範圍，見 [SQLite 的型別與 affinity 說明](https://www.sqlite.org/datatype3.html)。

MongoDB 的 Decimal128 也能表示十進位數值，但不是 SQL `DECIMAL(10, 2)` 這種帶固定 scale 的欄位宣告。若規定最多兩位小數，仍要另外驗證。`mongosh` 可以明確指定 BSON 數字型別：

```javascript
db.type_examples.insertOne({
  counter: NumberInt(10),
  externalId: NumberLong("9007199254740993"),
  price: NumberDecimal("1290.50"),
  isActive: true,
  createdAt: ISODate("2026-10-07T02:00:00Z"),
  tags: ["wireless", "office"],
});
```

大型整數和十進位數字在這裡從字串建立，避免先被 JavaScript `Number` 轉成近似值。換成 Node.js 等語言的 driver 時，要使用該 driver 對應的 Long、Decimal128 等 API，詳見 [`mongosh` 資料型別文件](https://www.mongodb.com/docs/mongodb-shell/reference/data-types/)。

### 資料庫存得下 bigint，前端也可能讀錯

JavaScript `Number` 的最大安全整數是 9,007,199,254,740,991，比有號 64 位元整數的上限小。這表示資料庫能完整存下的 ID，轉成前端的 `Number` 時，可能已經失去精度：

```javascript
const id = 9007199254740993;
console.log(id); // 9007199254740992
```

我會先訂好 API 的大型 ID 用字串傳遞，前端也保留字串；需要整數運算時，再評估使用 `BigInt`。JavaScript 的 `BigInt` 和資料庫的 `bigint` 是不同層的型別，直接交給 `JSON.stringify()` 也會出錯，可以先轉成字串：

```javascript
const exactId = 9007199254740993n;
const payload = JSON.stringify({ id: exactId.toString() });
// payload 是 {"id":"9007199254740993"}
```

實際 driver 也可能把 `bigint` 或 `decimal` 回傳成字串、專用物件，或可設定的型別。要連同 API 序列化一起確認，參考 [JavaScript 的安全整數範圍](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER)與 [BigInt 的 JSON 序列化說明](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt#use_within_json)。

### 有陣列型別，也還是要決定資料關係

PostgreSQL 可以宣告 `text[]` 保存一組文字，MongoDB 則有 BSON array。MySQL、SQLite 與 SQL Server 也能用 JSON 表達陣列，但查詢、限制與索引方式不等同 PostgreSQL 的原生陣列。

例如只是保存商品的幾個展示標籤，可以評估陣列或 JSON；若標籤本身有 ID、描述，還需要從標籤找所有商品，則要再比較用配對表管理多對多關係。原生陣列不會自動提供每個元素對另一張資料表的外鍵，見 [PostgreSQL 的陣列設計提醒](https://www.postgresql.org/docs/18/arrays.html#ARRAYS-SEARCHING)。

## 同一張商品表，自動編號就有不同寫法

接下來用商品資料來比較：`sku` 是不能重複的商品代碼，`price_cents` 是以百分之一元儲存的整數價格，`stock` 是庫存。這個練習只使用新台幣，因此 `129000` 代表 1,290 元；正式系統還得訂好幣別與金額範圍。

先看自動產生主鍵的寫法：

<div class="table-wrapper" tabindex="0" role="group" aria-label="主鍵與自動編號語法比較（可水平捲動）">

| 資料庫        | 範例中的主鍵寫法                                  | 要留意的地方                                        |
| ------------- | ------------------------------------------------- | --------------------------------------------------- |
| PostgreSQL    | `bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY` | 自動產生值，仍用主鍵限制保證唯一                    |
| MySQL         | `BIGINT AUTO_INCREMENT PRIMARY KEY`               | 由 `AUTO_INCREMENT` 產生編號                        |
| SQLite        | `INTEGER PRIMARY KEY`                             | 一般 rowid 表裡，這個欄位是 rowid 的別名            |
| Cloudflare D1 | `INTEGER PRIMARY KEY`                             | 沿用 SQLite 的主鍵寫法，讀回大型 ID 時注意 API 精度 |
| SQL Server    | `bigint IDENTITY(1, 1) PRIMARY KEY`               | 從 1 開始，每次增加 1，仍要有唯一限制               |
| MongoDB       | 自動產生 `_id`，通常是 `ObjectId`                 | 並非 SQL 式的連續整數編號                           |

</div>

PostgreSQL 的 [Identity column](https://www.postgresql.org/docs/18/ddl-identity-columns.html) 和 SQL Server 的 [`IDENTITY`](https://learn.microsoft.com/en-us/sql/t-sql/statements/create-table-transact-sql-identity-property?view=sql-server-ver16) 都要搭配主鍵或唯一限制。自動編號也不適合拿來要求「訂單號完全不能跳號」，例如交易取消，就可能留下空號。

SQLite 的 `INTEGER PRIMARY KEY` 通常已能自動產生編號。額外加 `AUTOINCREMENT`，主要是避免重用曾經提交過的 rowid，會增加處理成本；它也不保證編號沒有缺口，詳見 [SQLite 的自動編號說明](https://www.sqlite.org/autoinc.html)。

D1 的商品表可以從下面的 SQLite 版本開始，再確認平台支援的 SQL、擴充與 PRAGMA，不要把本機 SQLite 的所有設定都照搬過去，見 [D1 的 SQL 支援說明](https://developers.cloudflare.com/d1/sql-api/sql-statements/)。

<details>
<summary>想動手試：四種 SQL 資料庫建立相同商品表</summary>

各資料庫選擇自己的那段執行，不要在同一個 SQL 視窗連續執行四份。這些表用於練習，尚未包含商品分類或訂單關係。

PostgreSQL：

```sql
CREATE TABLE products (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sku text NOT NULL UNIQUE,
    name text NOT NULL,
    price_cents integer NOT NULL CHECK (price_cents >= 0),
    stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
    specs jsonb
);
```

MySQL，使用 InnoDB 和能儲存完整 Unicode 的 `utf8mb4`：

```sql
CREATE TABLE products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    price_cents INT NOT NULL CHECK (price_cents >= 0),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    specs JSON
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

SQLite，這裡用 `STRICT` 要求欄位符合指定型別：

```sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    specs TEXT CHECK (specs IS NULL OR json_valid(specs))
) STRICT;
```

一般 SQLite 表採用彈性型別；`STRICT` 表則會在無法轉成指定型別時拒絕寫入，但不是完全禁止型別轉換。`STRICT` 只接受特定型別名稱，也不能直接宣告 `BOOLEAN` 或 `DATETIME`，詳見 [STRICT tables 文件](https://www.sqlite.org/stricttables.html)。

SQL Server，中文名稱使用 `nvarchar`：

```sql
CREATE TABLE products (
    id bigint IDENTITY(1, 1) PRIMARY KEY,
    sku nvarchar(64) NOT NULL UNIQUE,
    name nvarchar(200) NOT NULL,
    price_cents int NOT NULL CHECK (price_cents >= 0),
    stock int NOT NULL DEFAULT 0 CHECK (stock >= 0),
    specs nvarchar(max) NULL
        CHECK (specs IS NULL OR ISJSON(specs) = 1)
);
```

這裡的字串長度限制並不完全相同，尤其 SQLite 的 `TEXT` 沒有跟著 MySQL 的 `VARCHAR(200)` 限制長度。需要跨資料庫保持一致的規則時，要明確加上驗證與合適的資料庫限制。

</details>

MongoDB 可以先建立 `sku` 的唯一索引，再新增商品：

```javascript
db.products.createIndex({ sku: 1 }, { unique: true });

db.products.insertOne({
  sku: "P101",
  name: "無線滑鼠",
  priceCents: 129000,
  stock: 10,
  specs: { color: "black", weight: 120 },
});
```

`insertOne()` 的結果會帶回 `insertedId`。這裡用 camelCase 是範例的命名選擇，MongoDB 也可以使用 snake_case。

唯一索引只負責擋重複，還需要檢查價格型別、庫存範圍，以及哪些欄位一定要填。MongoDB 可以在資料庫層設定 [schema validation](https://www.mongodb.com/docs/manual/core/schema-validation/)；上面的簡短範例尚未設定這些規則，不能直接當成完整的商品 schema。

## 新增商品後，怎麼拿到它的 ID？

PostgreSQL 和 SQLite 可以用 `RETURNING`，新增的同時取得結果：

```sql
INSERT INTO products (sku, name, price_cents, stock)
VALUES ('P101', '無線滑鼠', 129000, 10)
RETURNING id;
```

這是 [PostgreSQL 的 `INSERT ... RETURNING`](https://www.postgresql.org/docs/18/sql-insert.html)與 [SQLite 的 `RETURNING`](https://www.sqlite.org/lang_returning.html)都支援的基本用法，不代表兩套系統在觸發器、子查詢等進階情境完全相同。

SQL Server 改用 `OUTPUT`，而且位置放在 `VALUES` 前面：

```sql
INSERT INTO products (sku, name, price_cents, stock)
OUTPUT inserted.id
VALUES (N'P101', N'無線滑鼠', 129000, 10);
```

`inserted` 代表這次操作的新資料，詳見 [`OUTPUT` 文件](https://learn.microsoft.com/en-us/sql/t-sql/queries/output-clause-transact-sql?view=sql-server-ver16)。SQL Server 可能在後續發生錯誤、回滾時仍回傳 `OUTPUT` 資料；在交易裡拿到 ID，也仍要等整筆交易成功提交，才回應使用者操作成功。

MySQL 8.4 的一般 `INSERT` 沒有同樣的 `RETURNING` 寫法。可以從 driver 的新增結果取得 ID，或在同一條連線執行：

```sql
INSERT INTO products (sku, name, price_cents, stock)
VALUES ('P101', '無線滑鼠', 129000, 10);

SELECT LAST_INSERT_ID();
```

`LAST_INSERT_ID()` 依連線記錄結果，連線池不能在兩行 SQL 中間換到另一條連線。也別用 `SELECT MAX(id)` 猜剛新增的資料，其他請求可能已經插入新資料。[MySQL 的自動編號文件](https://dev.mysql.com/doc/refman/8.4/en/example-auto-increment.html)有說明取得 ID 的方式。

## 查前十筆、翻下一頁，寫法也有差別

PostgreSQL、MySQL、SQLite 都能用這段基本分頁，略過前 20 筆，再取 10 筆：

```sql
SELECT id, name, price_cents
FROM products
WHERE stock > 0
ORDER BY id
LIMIT 10 OFFSET 20;
```

SQL Server 的 `OFFSET`、`FETCH` 跟在 `ORDER BY` 後面：

```sql
SELECT id, name, price_cents
FROM products
WHERE stock > 0
ORDER BY id
OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY;
```

只要前十筆時，SQL Server 也能寫 `SELECT TOP (10) ... ORDER BY id`。`TOP` 和 `OFFSET ... FETCH` 的規則可查 [SQL Server 的排序與分頁文件](https://learn.microsoft.com/en-us/sql/t-sql/queries/select-order-by-clause-transact-sql?view=sql-server-ver16)。

MongoDB 則用查詢方法串接：

```javascript
db.products
  .find({ stock: { $gt: 0 } }, { _id: 1, name: 1, priceCents: 1 })
  .sort({ _id: 1 })
  .skip(20)
  .limit(10);
```

`$gt` 表示大於，第二個物件選出要回傳的欄位。這裡按 `_id` 排序，是為了有明確且不重複的排序依據，不是在假設 `ObjectId` 等同精確的建立時間。

分頁都要先訂好排序。資料量大、頁碼很後面時，`OFFSET` 或 `skip()` 需要處理被略過的資料，可以再評估用上一頁最後的位置做游標分頁。這個差異在 [PostgreSQL 的分頁說明](https://www.postgresql.org/docs/18/queries-limit.html)與 [MongoDB 的 `skip()` 說明](https://www.mongodb.com/docs/manual/reference/method/cursor.skip/)都有提到。

## 商品已經存在，就更新：Upsert 要認得哪個欄位重複

假設匯入商品資料，遇到相同 `sku` 就更新名稱和價格。庫存由另一個流程管理，所以更新既有商品時，不把庫存重新設成 10。

PostgreSQL 和 SQLite 可以指定 `sku` 的唯一限制當作衝突判斷：

```sql
INSERT INTO products (sku, name, price_cents, stock)
VALUES ('P101', '無線滑鼠新版', 139000, 10)
ON CONFLICT (sku) DO UPDATE
SET name = excluded.name,
    price_cents = excluded.price_cents;
```

`excluded` 是這次準備新增的那筆資料。如果商品不存在，就新增；已存在時，只改 `SET` 裡列出的欄位。前提是 `sku` 真有主鍵或唯一限制，詳見 [PostgreSQL 的衝突處理](https://www.postgresql.org/docs/18/sql-insert.html#SQL-ON-CONFLICT)與 [SQLite 的 UPSERT](https://www.sqlite.org/lang_upsert.html)。

MySQL 使用 `ON DUPLICATE KEY UPDATE`：

```sql
INSERT INTO products (sku, name, price_cents, stock)
VALUES ('P101', '無線滑鼠新版', 139000, 10) AS incoming
ON DUPLICATE KEY UPDATE
    name = incoming.name,
    price_cents = incoming.price_cents;
```

這裡採用 MySQL 8.4 支援的 row alias 寫法。它會根據主鍵或唯一索引的衝突觸發更新，沒有像 `ON CONFLICT (sku)` 那樣只指定一個衝突目標；若表裡有多組唯一欄位，要特別確認結果。舊範例常用的 `VALUES(name)` 寫法已被標示為 deprecated，詳見 [MySQL 的官方說明](https://dev.mysql.com/doc/refman/8.4/en/insert-on-duplicate.html)。

<details>
<summary>SQL Server 的 MERGE 怎麼表達這個需求？</summary>

SQL Server 可以用 `MERGE` 比對來源與目標，分別指定找到、找不到時要做什麼：

```sql
MERGE INTO products WITH (HOLDLOCK) AS target
USING (VALUES (N'P101', N'無線滑鼠新版', 139000, 10))
    AS source (sku, name, price_cents, stock)
ON target.sku = source.sku
WHEN MATCHED THEN
    UPDATE SET name = source.name,
               price_cents = source.price_cents
WHEN NOT MATCHED THEN
    INSERT (sku, name, price_cents, stock)
    VALUES (source.sku, source.name, source.price_cents, source.stock);
```

這個範例搭配 `sku` 的唯一限制，並用 `HOLDLOCK` 保護比對與寫入時的範圍，避免其他請求在中間插入相同商品，但也可能增加等待。`MERGE` 有自己的鎖定與併發行為，不能只因為是一句 SQL 就忽略競爭；微軟也建議正式使用前充分測試，並在高併發情境評估分開的 `INSERT`、`UPDATE`，見 [MERGE 的併發注意事項](https://learn.microsoft.com/en-us/sql/t-sql/statements/merge-transact-sql?view=sql-server-ver16#concurrency-considerations-for-merge)。

若改成分開查詢、更新和新增，仍要設計交易與鎖定，不能退回「先查沒有，就直接新增」而忽略其他請求。

</details>

MongoDB 在 `updateOne()` 加上 `upsert: true`：

```javascript
db.products.updateOne(
  { sku: "P101" },
  {
    $set: { name: "無線滑鼠新版", priceCents: 139000 },
    $setOnInsert: { stock: 10 },
  },
  { upsert: true },
);
```

`$setOnInsert` 只在新增文件時設定庫存。也要保留前面建立的 `sku` 唯一索引，避免多個請求同時 Upsert 時產生重複資料；實際結果和錯誤仍要處理。可參考 [`updateOne()` 的 Upsert 說明](https://www.mongodb.com/docs/manual/reference/method/db.collection.updateOne/)與[唯一索引文件](https://www.mongodb.com/docs/manual/core/index-unique/)。

## 商品規格會變：SQL 資料庫也能存 JSON

滑鼠有重量和連線方式，螢幕有尺寸和解析度。這些規格不同，不一定得為每種商品增加一整排欄位。

前面的 SQL 商品表已留了 `specs`。先放一份相同規格，這段更新可以用在上述四份 SQL schema：

```sql
UPDATE products
SET specs = '{"color":"black","weight":120}'
WHERE sku = 'P101';
```

接著找黑色商品，語法就不同了：

```sql
-- PostgreSQL：->> 取出文字。
SELECT sku, name
FROM products
WHERE specs ->> 'color' = 'black';
```

```sql
-- MySQL：JSON path 指向 color，取值後去掉 JSON 字串引號。
SELECT sku, name
FROM products
WHERE JSON_UNQUOTE(JSON_EXTRACT(specs, '$.color')) = 'black';
```

```sql
-- SQLite：json_extract() 會把這個 JSON 字串值取成 SQL 文字。
SELECT sku, name
FROM products
WHERE json_extract(specs, '$.color') = 'black';
```

```sql
-- SQL Server：JSON_VALUE() 取得純量值。
SELECT sku, name
FROM products
WHERE JSON_VALUE(specs, '$.color') = N'black';
```

MongoDB 直接查巢狀欄位：

```javascript
db.products.find({ "specs.color": "black" }, { _id: 0, sku: 1, name: 1 });
```

名稱都叫 JSON 相關功能，儲存方式卻不同。PostgreSQL 的 `jsonb` 支援索引，也不保留原始文字的空白與物件鍵順序；MySQL 有原生 JSON 型別。SQLite 這個範例用 `TEXT` 加 `json_valid()`，另外也支援自己的 JSONB 二進位格式，但和 PostgreSQL 的 JSONB 不相容。分別可查 [PostgreSQL JSON 型別](https://www.postgresql.org/docs/18/datatype-json.html)、[MySQL JSON 型別](https://dev.mysql.com/doc/refman/8.4/en/json.html)與 [SQLite JSON 函式](https://www.sqlite.org/json1.html)。

SQL Server 2022 可以把 JSON 放在 `nvarchar(max)`，再用 JSON 函式查詢、用 `ISJSON` 檢查內容。SQL Server 2025 已有原生 `json` 型別，不能一概說 SQL Server 只能把 JSON 當文字存，詳見[版本與 JSON 功能說明](https://learn.microsoft.com/en-us/sql/relational-databases/json/json-data-sql-server?view=sql-server-ver17)。上面取純量的用法則見 [`JSON_VALUE`](https://learn.microsoft.com/en-us/sql/t-sql/functions/json-value-transact-sql?view=sql-server-ver17)。

不過，商品代碼、價格和庫存若經常篩選、排序，還要檢查範圍，我會先保留一般欄位。只有規格放 JSON，比整筆商品都塞成一包資料，更容易看清楚哪些規則由資料庫負責。

### 能查 JSON，不代表查詢已經有合適的索引

假設經常按顏色篩選，PostgreSQL 可以替這個取值運算建立索引：

```sql
CREATE INDEX products_color_idx
ON products ((specs ->> 'color'));
```

這是針對顏色等值查詢的 expression index，和替整份 `jsonb` 建 GIN 索引、用包含條件查詢，是不同做法。索引要配合實際運算，詳見 [PostgreSQL 的 JSON 索引說明](https://www.postgresql.org/docs/18/datatype-json.html#JSON-INDEXING)。

MongoDB 則能建立巢狀欄位索引：

```javascript
db.products.createIndex({ "specs.color": 1 });
```

MySQL 可以評估把 JSON 值取成 generated column 再建索引；SQL Server 2022 也能用 computed column 配合索引。這些設計要考慮取值型別、長度與查詢寫法，見 [MySQL 的 JSON 索引方式](https://dev.mysql.com/doc/refman/8.4/en/create-table-secondary-indexes.html#json-column-indirect-index)與 [SQL Server 的 JSON 索引方式](https://learn.microsoft.com/en-us/sql/relational-databases/json/index-json-data?view=sql-server-ver16)。

小型練習表有索引，也不代表資料庫一定會使用它。要拿接近實際的資料量和分布，看執行計畫，再判斷時間花在哪。

## 庫存只剩一個，六種資料庫都要處理競爭

回到搶最後一件商品的情境，可以先把「還有庫存」和「減少庫存」放在同一句更新裡：

```sql
UPDATE products
SET stock = stock - 1
WHERE sku = 'P101' AND stock > 0;
```

這個基本語法四種 SQL 資料庫都能表達。程式要檢查實際更新結果；PostgreSQL、SQLite 可以加 `RETURNING stock`，SQL Server 可以在 `WHERE` 前加 `OUTPUT inserted.stock`，MySQL 則從執行結果檢查更新筆數。只有更新成功，才往建立訂單的步驟走。

D1 也可以使用這種條件更新，並檢查 `run()` 回傳的 `meta.changes`，見 [D1 的回傳結果說明](https://developers.cloudflare.com/d1/worker-api/return-object/)。但若還要新增訂單，仍得處理兩個步驟的一致性，不能只看扣庫存的結果。

MongoDB 的單份文件更新，也能把條件和扣庫存放在一起：

```javascript
const result = db.products.updateOne(
  { sku: "P101", stock: { $gt: 0 } },
  { $inc: { stock: -1 } },
);

// 在本範例中，matchedCount 為 1 才表示找到仍有庫存的商品。
// 為 0 時，要再區分商品不存在，還是已經售完。
```

MongoDB 的單份文件寫入有原子性，更新時會確認查詢條件仍符合，詳見[原子更新文件](https://www.mongodb.com/docs/manual/core/write-operations-atomicity/)。這也不表示整張訂單已經安全存好：如果庫存和訂單是不同文件，仍要處理跨文件的一致性。

### 交易能沿用概念，鎖定方式不能直接照抄

扣庫存與建立訂單必須一起成功時，傳統 SQL 連線可以用同一筆交易包住它們；D1 則要依平台的批次交易 API 設計。常見寫法不同：

<div class="table-wrapper" tabindex="0" role="group" aria-label="交易與併發處理比較（可水平捲動）">

| 資料庫        | 開始交易的基本寫法                    | 併發處理要留意什麼                                                       |
| ------------- | ------------------------------------- | ------------------------------------------------------------------------ |
| PostgreSQL    | `BEGIN`                               | 需要先讀再改時，可評估 `SELECT ... FOR UPDATE`                           |
| MySQL／InnoDB | `START TRANSACTION`                   | 也有 `FOR UPDATE`，鎖定範圍受索引、查詢與隔離層級影響                    |
| SQLite        | `BEGIN`，或依需求用 `BEGIN IMMEDIATE` | 同一個資料庫一次只有一個 writer，沒有同樣的列鎖語法                      |
| Cloudflare D1 | `env.DB.batch([...])`                 | 批次中的 SQL 依序執行；SQL 失敗會回滾整批，不能跨 API 呼叫沿用連線式交易 |
| SQL Server    | `BEGIN TRANSACTION`                   | 使用隔離層級與 table hints 等機制，不能直接把 `FOR UPDATE` 搬過來        |
| MongoDB       | session 與 transaction API            | 多文件交易需要 replica set 或 sharded cluster                            |

</div>

SQLite 的 WAL 模式可以讓讀取和寫入同時進行，但同一個資料庫仍只有一個 writer。`BEGIN IMMEDIATE` 會提前取得寫入交易，其他寫入需要等待或遇到 busy 錯誤；交易要短，程式也得處理重試，詳見 [SQLite 的隔離與併發說明](https://www.sqlite.org/isolation.html)。也別把 WAL 模式的資料庫檔案放在網路磁碟，讓不同主機直接共用，見 [WAL 的限制](https://www.sqlite.org/wal.html)。

MongoDB 支援多文件 ACID 交易，並非沒有交易。只是需要對應的部署方式，還要考慮讀寫 concern、交易成本與失敗重試；一般 standalone 測試伺服器不能直接當成支援這類交易的環境，詳見 [MongoDB 的交易文件](https://www.mongodb.com/docs/manual/core/transactions/)。

隔離層級、等待與死鎖也要一起看。把「先讀庫存，再扣庫存」包進交易，不會自動讓所有資料庫、所有設定下的競爭都消失；換資料庫後，搶最後一件商品的測試得用新的系統重跑。

## SQL 看起來很像，這幾個地方搬家時容易漏掉

### 大小寫比對，會影響查詢與唯一限制

`P101` 和 `p101` 是不是同一個商品代碼？搜尋 `mouse` 能不能找到 `Mouse`？這些規則要先訂。

PostgreSQL 可以用 `ILIKE` 做依 locale 的不分大小寫比對；MySQL 和 SQL Server 的文字比較會受 collation 影響；SQLite 內建 `LIKE` 預設只對 ASCII 字元做不分大小寫比對，不能假設所有語言都一樣。分別見 [PostgreSQL 的比對運算](https://www.postgresql.org/docs/18/functions-matching.html)、[MySQL 的大小寫規則](https://dev.mysql.com/doc/refman/8.4/en/case-sensitivity.html)、[SQL Server 的 collation](https://learn.microsoft.com/en-us/sql/relational-databases/collations/collation-and-unicode-support?view=sql-server-ver16)與 [SQLite 的 `LIKE`](https://www.sqlite.org/lang_expr.html#like)。

選到不分大小寫的 collation 時，唯一限制也可能把 `P101` 和 `p101` 視為重複。想要固定結果，可以先訂商品代碼的格式與正規化規則，再核對資料庫如何比較；不能只改搜尋 SQL。

### 布林與時間型別，還要看轉換規則

<div class="table-wrapper" tabindex="0" role="group" aria-label="布林與時間型別比較（可水平捲動）">

| 資料庫        | 常見日期時間型別                                           | 時間資料要留意的地方                                         |
| ------------- | ---------------------------------------------------------- | ------------------------------------------------------------ |
| PostgreSQL    | `date`、`time`、`timestamp`、`timestamptz`                 | `timestamptz` 記錄時間點，依連線時區顯示，不保留原始時區名稱 |
| MySQL         | `DATE`、`TIME`、`DATETIME`、`TIMESTAMP`、`YEAR`            | `TIMESTAMP` 會按連線時區轉換，`DATETIME` 沒有相同轉換行為    |
| SQLite        | 沒有專用日期時間儲存型別；常用 `TEXT`、`INTEGER` 或 `REAL` | 可存日期文字、Unix 時間或 Julian day，格式與單位要訂好       |
| Cloudflare D1 | 沿用 SQLite 的時間表示方式                                 | 寫入前把 JavaScript `Date` 轉成約定的字串或數值              |
| SQL Server    | `date`、`time`、`datetime2`、`datetimeoffset`，另有舊型別  | `datetimeoffset` 保留 UTC offset；`timestamp` 不是日期時間   |
| MongoDB       | BSON Date                                                  | 記錄以毫秒表示的時間點，不會替你保留原始時區名稱             |

</div>

例如預約時間「2026 年 10 月 7 日，台北上午 10 點」，如果要在別的時區顯示同一個時間點，要約定時間點如何保存；如果還要知道預約原本使用 `Asia/Taipei`，就另外存時區名稱。每天當地上午 10 點的重複活動，又有不同需求，不能只把時間全部轉成 UTC 就算處理完。

PostgreSQL 與 MySQL 的細節可查[日期時間型別](https://www.postgresql.org/docs/18/datatype-datetime.html)和 [`DATETIME`／`TIMESTAMP` 的差異](https://dev.mysql.com/doc/refman/8.4/en/datetime.html)。SQL Server 的 `timestamp` 是 `rowversion` 的舊名稱，用來表示資料版本，並非建立時間，見 [`rowversion` 文件](https://learn.microsoft.com/en-us/sql/t-sql/data-types/rowversion-transact-sql?view=sql-server-ver16)。

SQLite 若用 0／1 存布林值，可以明確寫成 `is_active INTEGER NOT NULL CHECK (is_active IN (0, 1))`。MySQL 的 `BOOLEAN` 別名也不會自動把值限制在 0 和 1，需要規則時仍得加限制，不能只看型別名稱。

### 外鍵宣告好了，還要確認真的有啟用

SQLite 支援外鍵，但要在每條連線確認外鍵檢查已啟用，不要依賴未知的編譯或 driver 預設。在交易開始前設定並查核：

```sql
PRAGMA foreign_keys = ON;
PRAGMA foreign_keys;
```

查詢結果應為 `1`。這是連線層設定；連線池開出新連線，也要處理初始化，見 [SQLite 的外鍵文件](https://www.sqlite.org/foreignkeys.html#fk_enable)。

D1 已啟用外鍵檢查，使用者的查詢不能把它改成 `PRAGMA foreign_keys = OFF`。修改 schema 時若需要暫時延後檢查，要按 D1 的 `defer_foreign_keys` 規則處理，交易結束前仍需滿足限制，見 [D1 的外鍵說明](https://developers.cloudflare.com/d1/sql-api/foreign-keys/)。

MongoDB 的文件參照則不是 SQL 外鍵。存了 `productId`，不代表資料庫會替你擋住不存在的商品；要透過資料建模、應用程式檢查與必要的交易管理規則。

### Driver 的參數寫法，也要跟著確認

程式帶入商品代碼時，要使用 driver 的參數綁定，不把使用者輸入串成 SQL。常見例子像 PostgreSQL 的 `$1`、MySQL 的 `?`、SQLite 的 `?` 或具名參數，以及 SQL Server 的 `@sku`，但實際格式由使用的 driver 決定。

MongoDB 的查詢物件也要由伺服器按允許欄位建立，不能直接把使用者送來的任意物件當成查詢條件。更換 ORM 後，資料庫特有的 Upsert、JSON 運算、排序與鎖定規則，也仍然需要確認。

## Cloudflare D1：SQL 像 SQLite，平台規則要另外看

D1 用 SQLite 的查詢引擎，所以前面的 `INTEGER PRIMARY KEY`、`LIMIT ... OFFSET`、`ON CONFLICT` 與 `json_extract()` 都是熟悉的方向。它也支援 FTS5 等指定擴充，但能用哪些擴充與 PRAGMA，要按 [D1 的支援清單](https://developers.cloudflare.com/d1/sql-api/sql-statements/)確認。JSON 文字的查詢範例可看 [D1 JSON 文件](https://developers.cloudflare.com/d1/sql-api/query-json/)。

如果原本只想把單機工具的 `.sqlite` 檔放到雲端，還得想清楚應用程式要怎麼透過 API 讀寫、如何處理網路失敗，以及離線資料怎麼同步。換成 D1，這些工作不會自動完成。

<div class="table-wrapper" tabindex="0" role="group" aria-label="本機 SQLite 與 Cloudflare D1 比較（可水平捲動）">

| 項目            | 本機 SQLite                          | Cloudflare D1                              |
| --------------- | ------------------------------------ | ------------------------------------------ |
| 資料在哪裡      | 應用程式可開啟的資料庫檔案           | Cloudflare 管理的遠端資料庫                |
| 程式怎麼連      | SQLite driver 在本機執行 SQL         | Workers binding 或伺服器端 HTTP API        |
| 離線使用        | 裝置上的資料仍可讀寫                 | 存取遠端服務需要網路；本機開發資料是另一份 |
| 多句 SQL 的交易 | 在連線上使用 `BEGIN`、`COMMIT`       | 可用 `batch()` 執行一批事先準備好的 SQL    |
| 備份與還原      | 自行設計備份、保管與還原流程         | 有 Time Travel，保留時間依方案而異         |
| 擴充與設定      | 看使用的 SQLite 編譯版本與 driver    | 使用平台支援的擴充與 PRAGMA                |
| 容量與使用成本  | 受裝置、檔案系統和自己的維運方式影響 | 受平台容量、讀寫額度與儲存計費規則影響     |

</div>

Time Travel 能協助還原資料庫，但仍要確認保留期間與還原流程，見 [D1 的備份與復原文件](https://developers.cloudflare.com/d1/reference/time-travel/)。本機測試資料和遠端資料庫也要分清楚，不能把本機查得到一筆資料，當成已經成功寫入正式環境。

### Workers 裡怎麼查？型別轉換在哪一層發生？

假設已經把 D1 資料庫綁定到 Worker 的 `DB`，並建立前面的 SQLite 商品表，在 Worker 的請求處理函式裡可以這樣查：

```javascript
const product = await env.DB.prepare(
  "SELECT id, sku, name, price_cents, stock FROM products WHERE sku = ?",
)
  .bind("P101")
  .first();

// 找不到時，product 是 null。
```

`prepare()` 準備 SQL，`bind()` 綁定值，`first()` 取出第一筆資料。這裡的 `?` 不是字串插值，也不會把商品代碼接進 SQL 文字，詳見 [D1 prepared statement API](https://developers.cloudflare.com/d1/worker-api/prepared-statements/)。

D1 的儲存型別以 SQLite 的 `NULL`、`INTEGER`、`REAL`、`TEXT`、`BLOB` 為基礎。布林可存成 0／1，JSON 可存文字再用 JSON 函式查詢；日期時間先約定格式，例如把 JavaScript `Date` 用 `toISOString()` 轉成文字後再綁定。`undefined` 也不能拿來代替 SQL 的 `NULL`。

前面的 bigint 精度問題，在 D1 也要注意。資料庫內部能存有號 64 位元整數，但目前 Workers Binding API 不支援 JavaScript `BigInt`，讀回整數則使用 `Number`。若 ID 可能超過安全整數範圍，可以在資料庫裡先轉成文字再傳出來：

```sql
SELECT CAST(id AS TEXT) AS id, sku, name
FROM products
WHERE sku = 'P101';
```

如果來源編號本來就是一個很大的外部 ID，也可以直接設計成 `TEXT` 欄位，整段流程用字串傳遞。型別限制與 API 精度要一起看，見 [D1 的型別轉換與 BigInt 限制](https://developers.cloudflare.com/d1/worker-api/#type-conversion)。

### 批次交易可以一起回滾，仍要檢查業務條件

假設匯入兩個商品，可以重用一份 prepared statement，再用 `batch()` 送出：

```javascript
const statement = env.DB.prepare(`
  INSERT INTO products (sku, name, price_cents, stock)
  VALUES (?, ?, ?, ?)
  ON CONFLICT (sku) DO UPDATE
  SET name = excluded.name,
      price_cents = excluded.price_cents
`);

const results = await env.DB.batch([
  statement.bind("P101", "無線滑鼠新版", 139000, 10),
  statement.bind("P102", "有線鍵盤", 99000, 5),
]);
```

批次中的 SQL 會依序執行，任何一個 statement 發生 SQL 錯誤，整批都會中止並回滾。這個範例仍保留原本的規則：已存在的商品只更新名稱與價格，不重設庫存，見 [D1 的 `batch()` 說明](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch)。

不過，「扣庫存更新了 0 筆」通常是成功執行 SQL、只是沒有符合條件的資料，不是 SQL 錯誤。因此不能把扣庫存與新增訂單隨便放進 `batch()`，就認為缺貨時一定會自動回滾。要讓新增訂單也受成功扣庫存的結果約束，並驗證缺貨、重試與重複下單的流程。

D1 的 batch 需要一次送出已準備好的 SQL，不能像本機連線那樣，在 `BEGIN` 和 `COMMIT` 之間分開呼叫 API、持有同一筆交易。Sessions API 管理的則是讀取一致性；JavaScript 裡的多個操作仍需要另外決定如何一起成功或失敗。

### 讀取副本能分攤查詢，寫入仍會回到主要資料庫

D1 提供全球讀取副本。讀取可以由副本處理，寫入仍會送到主要資料庫；副本是非同步更新，使用時還要考慮剛寫入的資料是否已經讀得到，見 [D1 的 read replication 與 Sessions API](https://developers.cloudflare.com/d1/best-practices/read-replication/)。

要使用讀取副本，需要啟用相應功能並使用 Sessions API。若希望 session 的第一個查詢先讀主要資料庫的最新版本，可以寫：

```javascript
const session = env.DB.withSession("first-primary");

const product = await session
  .prepare("SELECT id, sku, stock FROM products WHERE sku = ?")
  .bind("P101")
  .first();
```

同一個 session 會透過 bookmark 維持循序一致性。若下一個 HTTP 請求也要接續先前的資料版本，還得把 bookmark 帶到新的 session；每次都重新建立 session，不會自動承接上一個請求。沒有使用 Sessions API 的查詢，仍會送到主要資料庫。

例如報名後立刻打開報名結果，就要設計這段讀取的一致性；若只是看一份可以接受更新延遲的活動介紹，要求又會不同。不能只因為 Worker 在離使用者近的節點執行，就假設所有資料庫寫入也在那裡完成。

### 容量、查詢時間與掃描筆數，會影響適用範圍

以 2026 年 10 月 7 日查到的 [D1 平台限制](https://developers.cloudflare.com/d1/platform/limits/)為準，Free 方案單一資料庫上限是 500 MB，Workers Paid 是 10 GB；單筆查詢還有 30 秒的執行時間限制。資料量超過單庫容量時，就得評估拆分方式；跨資料庫的查詢與一致性也要重新設計。

每個 D1 資料庫執行個體是單執行緒，查詢會排隊；讀取副本可以分攤讀取，但不會讓主要資料庫變成多個同時寫入的節點。若大量請求都搶同一份庫存，還是要拿實際資料和查詢測試等待、負載與失敗處理。

計費則看讀取列數、寫入列數與儲存量，不是只看 API 回傳幾筆。查詢最後回傳十筆資料，底層也可能掃描很多列；索引除了影響延遲，也會影響使用量。Free 方案有額度限制，Paid 超過內含額度會依用量計費，實際數值以 [D1 的價格與額度文件](https://developers.cloudflare.com/d1/platform/pricing/)為準。

所以我會先拿 D1 試文章後台、活動報名或分租戶的應用資料，再確認這些限制是否適合。如果已經需要 PostgreSQL 的擴充、特定交易流程，或已有 MySQL 的資料與維運工具，也可以保留原本資料庫，評估透過 [Hyperdrive](https://developers.cloudflare.com/hyperdrive/)讓 Workers 連接 PostgreSQL 或 MySQL。

## MariaDB、Redis、DuckDB 又放在哪裡？

MariaDB 與 MySQL 有共同歷史，很多語法相似，但不能當成完全相同的版本。像 MariaDB 的 `JSON` 是 `LONGTEXT` 的別名，和 MySQL 原生 JSON 的儲存方式不同，見 [MariaDB 的 JSON 文件](https://mariadb.com/docs/server/reference/data-types/string-data-types/json)。選好系統之後，教學、driver 與 migration 都要對應那一套。

Redis 可以用於快取、計數器、排行榜等需求，有字串、hash、sorted set 等不同資料結構，見 [Redis 的資料型別說明](https://redis.io/docs/latest/develop/data-types/)。例如先把熱門商品資訊放進快取，訂單仍寫入主要資料庫。若要把 Redis 當重要資料的主要儲存，則得另外評估持久化、記憶體容量與故障復原，不能直接沿用快取資料可以重建的假設。

DuckDB 則偏向分析工作。如果需求是讀取 CSV、Parquet，計算各分類的銷售總額，我會把它列入評估。它也是可嵌入的 SQL 資料庫，但主要針對分析查詢設計，和選一套資料庫來處理大量即時下單，是不同的使用情境，見 [DuckDB 的介紹](https://duckdb.org/)。

## 決定之前，先拿自己的查詢和失敗情境試一次

如果要做小型購物 API，我會先選團隊能維護的關聯式資料庫，把商品、訂單與訂單明細建好；若沒有既定系統，就先拿 PostgreSQL 試出一份設計。離線筆記工具則先評估 SQLite，需要文件式讀寫的問卷再比較 MongoDB。公司已有 SQL Server 與相關報表時，也把沿用環境的成本一起算進去。

如果 API 已經部署在 Workers，D1 也能列入這輪測試，再用交易方式、資料容量與讀寫量判斷是否適合。

接著拿幾個實際操作來確認：商品搜尋與分頁有沒有需要的索引？兩個請求搶最後一件商品，結果是否只有一筆成功？訂單存失敗，庫存會不會一起還原？重複商品代碼、錯誤型別與不存在的關聯，究竟是被資料庫拒絕，還是默默寫進去？

查詢速度要用接近實際的資料量、分布與硬體量測。除了平常成功的流程，我也會試備份能否還原、升級後舊程式是否還能讀資料，以及發生鎖定或交易失敗時，程式能不能正確處理。這些結果會直接影響後續維護，比只比較一段 SQL 的長短更有用。

## 站內相關文章

- [資料庫規劃筆記：從搶票、多對多關係到回歸測試](/posts/database-planning-interview-notes/)
- [從商品列表到建立訂單，API 要怎麼設計？](/posts/api-design-products-orders/)
- [用 Vue 的觀念理解 Laravel：前端工程師的後端入門筆記](/posts/laravel-php-first-backend/)

## 語法速查與延伸資料

動手寫的時候，我會先用速查資料找指令，再回官方文件確認版本、回傳值與限制。這裡整理幾個可以直接查的入口：

<div class="table-wrapper" tabindex="0" role="group" aria-label="資料庫語法速查與官方參考資料（可水平捲動）">

| 資料庫        | SQL、查詢方法與型別                                                                                                                                                                                                       | 速查或工具指令                                                                                                                                                                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PostgreSQL    | [SQL 指令索引](https://www.postgresql.org/docs/18/sql-commands.html)、[資料型別](https://www.postgresql.org/docs/18/datatype.html)                                                                                        | [`psql` 指令](https://www.postgresql.org/docs/18/app-psql.html)；互動模式可用 `\?` 查工具指令、`\h` 查 SQL 語法                                                                                                                                            |
| MySQL         | [SQL statements](https://dev.mysql.com/doc/refman/8.4/en/sql-statements.html)、[資料型別](https://dev.mysql.com/doc/refman/8.4/en/data-types.html)                                                                        | [`mysql` client 指令](https://dev.mysql.com/doc/refman/8.4/en/mysql-commands.html)；可用 `help` 查指令                                                                                                                                                     |
| SQLite        | [SQL 語法索引](https://www.sqlite.org/lang.html)、[型別與 affinity](https://www.sqlite.org/datatype3.html)                                                                                                                | [SQLite CLI 指令](https://www.sqlite.org/cli.html)；可用 `.help`、`.schema` 查操作與表結構                                                                                                                                                                 |
| SQL Server    | [T-SQL reference](https://learn.microsoft.com/en-us/sql/t-sql/language-reference?view=sql-server-ver16)、[資料型別](https://learn.microsoft.com/en-us/sql/t-sql/data-types/data-types-transact-sql?view=sql-server-ver16) | [排序與分頁](https://learn.microsoft.com/en-us/sql/t-sql/queries/select-order-by-clause-transact-sql?view=sql-server-ver16)、[新增後取值的 `OUTPUT`](https://learn.microsoft.com/en-us/sql/t-sql/queries/output-clause-transact-sql?view=sql-server-ver16) |
| MongoDB       | [`mongosh` 方法索引](https://www.mongodb.com/docs/mongodb-shell/reference/methods/)、[BSON 型別](https://www.mongodb.com/docs/manual/reference/bson-types/)                                                               | [MongoDB Shell Cheat Sheet](https://learn.mongodb.com/courses/mongodb-shell-cheatsheet)、[`mongosh` 內建 help](https://www.mongodb.com/docs/mongodb-shell/reference/access-mdb-shell-help/)                                                                |
| Cloudflare D1 | [支援的 SQL 與 PRAGMA](https://developers.cloudflare.com/d1/sql-api/sql-statements/)、[JSON 函式速查](https://developers.cloudflare.com/d1/sql-api/query-json/)                                                           | [Prepared statement API](https://developers.cloudflare.com/d1/worker-api/prepared-statements/)、[`batch()` 與 session](https://developers.cloudflare.com/d1/worker-api/d1-database/)                                                                       |

</div>

選 D1 時，我也會一起開著[容量與查詢限制](https://developers.cloudflare.com/d1/platform/limits/)、[價格與使用量](https://developers.cloudflare.com/d1/platform/pricing/)和[讀取副本的一致性說明](https://developers.cloudflare.com/d1/best-practices/read-replication/)。速查表裡的一句寫法，通常省略了版本、連線與部署條件；查到指令之後，還是要把這些條件對回自己的環境。
