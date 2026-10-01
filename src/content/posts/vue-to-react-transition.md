---
title: 從 Vue 跳到 React 的開發心得 — 兩個框架的差異與轉換經驗
description: 從 Vue 轉戰 React 的心路歷程。本文深入比較兩大框架在思維與語法上的核心差異，幫助你在轉換過程中少走彎路。
date: 2024-08-20
updated: 2026-07-28
category: learning
---

我做前端是從 Vue 入門，後來工作上也接觸了 React 專案。換框架時，有些概念可以沿用，有些習慣得重新適應。以下整理我實際開發時感受到的差異。

## 為什麼要學 React

老實說，Vue 用得很順手的時候，一開始對學 React 沒有太大的動力。但後來發現幾個現實的考量：

1. **工作機會**：看職缺的時候，React 的需求量確實比 Vue 多，而且很多外商缺也都是用 React
2. **生態系**：React 的社群資源和第三方套件非常豐富
3. **技術視野**：多學一個框架可以用不同角度思考問題

而且 Vue 和 React 的核心概念其實很類似，轉換的門檻沒有想像中高，尤其是到了 Vue 3 時代，Composition API 的概念都和 React Hooks 很像。

## 最明顯的差異：模板 vs JSX

Vue 用的是 template 語法，長這樣，其實就是 HTML 加上 Vue 的指令（directives）：

```vue
<template>
  <div>
    <h1>{{ title }}</h1>
    <ul>
      <li v-for="item in items" :key="item.id">
        {{ item.name }}
      </li>
    </ul>
    <button @click="handleClick">點我</button>
  </div>
</template>
```

React 用的是 JSX，邏輯和 UI 混在一起：

```jsx
function MyComponent() {
  return (
    <div>
      <h1>{title}</h1>
      <ul>
        {items.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
      <button onClick={handleClick}>點我</button>
    </div>
  );
}
```

剛開始看 JSX 會覺得很亂，怎麼 HTML 跟 JavaScript 攪在一起。但寫久了發現，這種寫法其實很靈活，複雜的條件渲染反而比 `v-if` 直覺。

React 使用 JavaScript 搭配 [JSX](https://react.dev/learn/writing-markup-with-jsx#the-rules-of-jsx) 描述 UI。它沒有 Vue 的模板指令（`v-if`、`v-for`、`v-model`），這些邏輯要用 JavaScript 來寫。因此，學 React 前需要熟悉 `map`、`filter`、三元運算子和解構賦值，寫 UI 時會經常用到。

## 狀態管理的差異

Vue 3 的 Composition API 和 React Hooks 其實很像：

**Vue 3:**

```javascript
const count = ref(0);
const doubled = computed(() => count.value * 2);

const increment = () => {
  count.value++;
};
```

**React:**

```javascript
const [count, setCount] = useState(0);
const doubled = useMemo(() => count * 2, [count]);

const increment = () => {
  setCount(count + 1);
};
```

主要差異是 Vue 的 `ref` 是響應式的，改值直接 `.value = xxx`。React 的 `useState` 要用 setter function，而且是不可變的（immutable）。

一開始常常忘記用 `setCount`，直接寫 `count++`，然後畫面就不會更新。這個習慣要適應一下。

## 生命週期的對應

Vue 和 React 的生命週期可以這樣對應：

<div class="table-wrapper" tabindex="0" role="group" aria-label="表格（可水平捲動）">

| Vue 3         | React                             | 常見陷阱／心智模型落差                                                                                                              |
| ------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `onMounted`   | `useEffect(() => {}, [])`         | Vue 只跑一次；React 在 StrictMode 開發環境會跑兩次（這是正常的！）                                                                  |
| `onUpdated`   | `useEffect(() => {})`             | 注意：這個寫法沒有 dependency array，第一次 render（也就是 mount）也會先執行一次，和 Vue 的 `onUpdated`（明確不含初次掛載）並不對等 |
| `onUnmounted` | `useEffect` 的 cleanup function   | 容易忘記 cleanup，導致 event listener 重複綁定                                                                                      |
| `watch`       | `useEffect` 搭配 dependency array | Vue 的 watch 預設是 lazy 的；useEffect 在 render 完一定會至少跑一次                                                                 |

</div>

React 用 `useEffect` 處理副作用，我一開始不太習慣。後來理解 dependency array 如何影響重新執行的時機，才比較知道該怎麼安排這些邏輯。

### 詳細的生命週期對照與陷阱

很多從 Vue 轉過來的人（包含我）最容易在 `useEffect` 踩坑，因為我們習慣了 `onMounted` 這種「時間點」的思考模式，但 React 的 Hooks 是「狀態同步」的思考模式。上面表格最後一欄整理了幾個最常見的落差，其中最容易誤用的是 `onUpdated` 對應的 `useEffect(() => {})`：因為沒有 dependency array，它在 mount 時也會執行一次；如果只是想模擬「只在更新時執行」的效果，需要自己用 `useRef` 記錄是否為首次渲染，在該次提前 return。

**最大的陷阱：Stale Closure**

在 Vue 裡面，你在任何地方讀 `count.value` 拿到的都是最新的值。但在 React 的 `useEffect` 或 `useCallback` 裡，如果你沒把變數放進 dependency array，你讀到的會是「舊的」變數。

```javascript
// React 陷阱題
useEffect(() => {
  const timer = setInterval(() => {
    console.log(count); // 這裡的 count 永遠是初始值 0！
  }, 1000);
  return () => clearInterval(timer);
}, []); // 因為 dependency 是空的
```

這花了我一些時間適應。以前習慣透過 Vue 的響應式系統讀取最新值，換到 React 後，就得留意 closure 和依賴設定。

## 心智模型的轉變：Mutable vs Immutable

這應該是兩個框架最核心的差異。

**Vue 的世界觀：你可以修改我，我會通知大家。**
Vue 的 data 是 mutable 的。你想改標題？`title.value = 'New'`。Vue 的 Reactivity system 會攔截這個 setter，然後去更新畫面。這很直覺，跟我們寫傳統 JS 物件導向一樣。

**React 的世界觀：你不能修改我，你要創造一個新的我。**
React 的 state 是 immutable 的。你想改標題？你不能改舊的 `title`，你要呼叫 `setTitle('New')`，這會告訴 React：「嘿，用這個新值重新畫一次 component」。

這個差異導致了寫 code 習慣的不同：

- **Vue**: `arr.push(item)`（開心！）
- **React**: `setArr([...arr, item])`（麻煩但安全）
- **Vue**: `obj.prop = 1`
- **React**: `setObj({ ...obj, prop: 1 })`

習慣 React 的 Immutable 模式後，你會發現 data flow 變得很容易預測。因為資料不會莫名其妙被改掉，一定是有某個 `setXXX` 被呼叫了。這在大型專案除錯時非常有幫助。

## Next.js vs Nuxt

如果要做 SSR，Vue 有 Nuxt，React 有 Next.js。兩個框架的概念很類似：

- 檔案系統路由
- 自動程式碼分割
- SSR / SSG / ISR 支援
- API Routes

用過 Nuxt 3 再去學 Next.js，上手很快。主要差異在一些 API 命名和寫法上。

**資料抓取：**

Nuxt 用 `useFetch` 或 `useAsyncData`：

```javascript
const { data } = await useFetch("/api/posts");
```

Next.js 的 App Router 用 async component：

```jsx
async function Page() {
  // Server Component 的 fetch 跑在伺服器上，沒有「目前網址」可以當基準，
  // 相對路徑會直接丟 TypeError，必須給絕對網址。
  const res = await fetch(`${process.env.API_BASE_URL}/api/posts`);
  const data = await res.json();
  return <div>{/* ... */}</div>;
}
```

這一點是從 Nuxt 過來最容易踩的坑：`useFetch("/api/posts")` 在 Nuxt 裡不管跑在伺服器還是瀏覽器都能正常運作，但 Next.js 的 Server Component 沒有這層包裝。

## 狀態管理工具

Vue 生態系用 Pinia，React 生態系選擇比較多：Redux、Zustand、Jotai、Recoil...

> **後記（2026 更新）**：Recoil 已於 2025 年初被 Meta 封存（archived），不再維護，新專案請不要再採用。下面提到的 Zustand、Jotai 都仍在活躍開發中。

我自己比較喜歡 Zustand，寫法簡潔，跟 Pinia 的感覺有點像：

```javascript
// Zustand
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// 使用
const { count, increment } = useStore();
```

比起 Redux 的 action、reducer、dispatch 那一套，Zustand 直接多了。

## 轉換時遇到的坑

### 1. 忘記 Immutable

React 的狀態更新要保持 immutable，不能直接修改原物件：

```javascript
// ❌ 錯誤
const handleClick = () => {
  items.push(newItem);
  setItems(items); // 不會觸發更新
};

// ✅ 正確
const handleClick = () => {
  setItems([...items, newItem]);
};
```

Vue 的響應式系統會幫你處理這些，React 要自己注意。

### 2. useEffect 的 Dependency Array

`useEffect` 的 dependency array 設錯，會造成無限迴圈或該更新的時候沒更新：

```javascript
// ⚠️ 小心無限迴圈
useEffect(() => {
  setCount(count + 1);
}, [count]); // count 變了就執行，執行又改 count...
```

### 3. Conditional Hooks

React Hooks 不能放在條件式裡面：

```javascript
// ❌ 錯誤
if (isLoggedIn) {
  const [user, setUser] = useState(null);
}

// ✅ 正確
const [user, setUser] = useState(null);
if (isLoggedIn) {
  // 使用 user
}
```

這個規則一開始會覺得很奇怪，但這是 React Hooks 的設計限制。

## 哪個比較好？

這個問題沒有標準答案。兩個框架都很成熟，都能做出好的產品。

**Vue 的優點：**

- 學習曲線較平緩
- 官方工具鏈完整（Vite、Pinia、Vue Router 都是官方出品）
- 模板語法對設計師比較友善

**React 的優點：**

- 生態系更龐大
- 工作機會較多
- JSX 的靈活度更高
- 社群資源豐富

我自己是兩個都用，看專案需求決定。已經有 Vue 基礎的人，學 React 不會太困難，反過來也是。

## 給想學 React 的 Vue 開發者

1. **先學好 JavaScript**：React 比較需要紮實的 JS 基礎，特別是 array methods、解構、spread operator

2. **接受 JSX**：一開始會不習慣，但寫久了會發現它的好

3. **理解 Immutable**：這是 React 的核心觀念，一定要搞懂

4. **不要硬套 Vue 思維**：有些東西在 Vue 很自然，在 React 要換一種方式思考

5. **從 Next.js 開始也行**：如果已經會 Nuxt，直接學 Next.js 會很有代入感，學得也快

## 結語

兩個框架各有適合的使用情境，我會依專案需求選擇。多學一個框架，也讓我能用不同方式理解狀態管理與 UI 開發，求職時多一些選擇。

如果你也從 Vue 起家，可以先沿用熟悉的元件概念，再把時間放在 JSX、Immutable 和 Hooks 上。這幾個差異理解之後，在兩個框架之間切換就會順很多。

---

站內相關文章：

- [Vue i18n 多語系開發](/posts/vue-i18n-multilingual/)
- [Figma to Code 工作流程分享](/posts/figma-to-code-workflow/)
- [前端測試實戰 — Vitest 入門](/posts/frontend-testing-vitest-guide/)
