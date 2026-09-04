"use client";

import { useEffect, useMemo, useState } from "react";

type CaseItem = {
  id: string; summary: string; company: string; location: string; area: string;
  sector: string; ai: string; subsidy: string; title: string;
  facts: Record<string, string>; detail: string; sources: { label: string; url: string }[];
};

const categoriesById: Record<string, string[]> = {
  "JP-MFG-AI-0001": ["人員及知識管理"],
  "JP-MFG-AI-0002": ["生產與品質管理"],
  "JP-MFG-AI-0003": ["生產與品質管理"],
  "JP-MFG-AI-0004": ["生產與品質管理", "行銷管理"],
  "JP-MFG-AI-0005": ["生產與品質管理"],
  "JP-MFG-AI-0006": ["原物料管理", "生產與品質管理"],
  "JP-MFG-AI-0007": ["人員及知識管理"],
  "JP-MFG-AI-0008": ["行銷管理"],
  "JP-MFG-AI-0009": ["生產與品質管理"],
  "JP-MFG-AI-0010": ["原物料管理", "生產與品質管理"],
  "JP-MFG-AI-0011": ["環境及設備管理"],
  "JP-MFG-AI-0012": ["生產與品質管理"],
  "JP-MFG-AI-0013": ["人員及知識管理"],
  "JP-MFG-AI-0014": ["生產與品質管理"],
  "JP-MFG-AI-0015": ["人員及知識管理", "生產與品質管理"],
  "JP-MFG-AI-0016": ["生產與品質管理"],
  "JP-MFG-AI-0017": ["生產與品質管理"],
  "JP-MFG-AI-0018": ["環境及設備管理", "生產與品質管理"],
  "JP-MFG-AI-0019": ["行銷管理"],
  "JP-MFG-AI-0020": ["綜合或其他", "行銷管理"],
  "JP-MFG-AI-0021": ["生產與品質管理"],
  "JP-MFG-AI-0022": ["生產與品質管理"],
};

const categoryOptions = [
  "人員及知識管理",
  "環境及設備管理",
  "原物料管理",
  "生產與品質管理",
  "行銷管理",
  "能源與碳排管理",
  "綜合或其他",
];

function cleanInline(value: string) {
  return value.replace(/\*\*/g, "").replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1").replace(/<br\s*\/?>/gi, " ").trim();
}

function getArea(location: string) {
  return location.match(/^(東京都|北海道|京都府|大阪府|.{2,4}縣)/)?.[1] ?? location.split(/[；;]/)[0];
}

function parseTableFacts(block: string) {
  const facts: Record<string, string> = {};
  for (const line of block.split("\n")) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").slice(1, -1).map(cleanInline);
    if (cells.length >= 2 && cells[0] && cells[0] !== "欄位" && !/^---+$/.test(cells[0])) facts[cells[0]] = cells[1];
  }
  return facts;
}

function parseDatabase(markdown: string): CaseItem[] {
  // The database ends with a commented-out authoring template. Remove HTML
  // comments first so placeholder IDs and fields can never overwrite cases.
  const content = markdown.replace(/<!--[\s\S]*?-->/g, "");
  const overview = content.match(/## 案例總覽([\s\S]*?)\n---/)?.[1] ?? "";
  const base = overview.split("\n").filter((line) => line.startsWith("| JP-MFG-AI-")).map((line) => {
    const cells = line.split("|").slice(1, -1).map(cleanInline);
    return { id: cells[0], summary: cells[1], company: cells[2], location: cells[3], area: getArea(cells[3]), sector: cells[4], ai: cells[5], subsidy: cells[6] };
  });
  const details = new Map<string, Pick<CaseItem, "title" | "facts" | "detail" | "sources">>();
  for (const block of content.split(/\n(?=### JP-MFG-AI-)/).slice(1)) {
    const heading = block.match(/^### (JP-MFG-AI-\d+)｜(.+)$/m);
    if (!heading) continue;
    const fullTitle = cleanInline(heading[2]);
    const title = fullTitle.includes("：") ? fullTitle.split("：").slice(1).join("：") : fullTitle;
    const detailMarkdown = block.match(/#### 案例詳細內容\s*([\s\S]*?)(?=\n#### 資料來源)/)?.[1] ?? "";
    const detail = detailMarkdown.replace(/^\*\*(.+?)\*\*\s*$/gm, "$1").replace(/\*\*/g, "").replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1").replace(/^[-*] /gm, "• ").replace(/\n{3,}/g, "\n\n").trim();
    const sourceBlock = block.match(/#### 資料來源\s*([\s\S]*?)(?=\n#### |\n---|$)/)?.[1] ?? "";
    const sources = Array.from(sourceBlock.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g)).map((match) => ({ label: match[1], url: match[2] })).filter((item, index, list) => list.findIndex((candidate) => candidate.url === item.url) === index);
    details.set(heading[1], { title, facts: parseTableFacts(block), detail, sources });
  }
  return base.map((item) => ({ ...item, title: details.get(item.id)?.title ?? item.ai, facts: details.get(item.id)?.facts ?? {}, detail: details.get(item.id)?.detail ?? item.summary, sources: details.get(item.id)?.sources ?? [] }));
}

export default function Home() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("全部地區");
  const [category, setCategory] = useState("全部類別");
  const [selected, setSelected] = useState<CaseItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch("cases.md").then((response) => response.text()).then((text) => setCases(parseDatabase(text))).finally(() => setLoading(false)); }, []);
  useEffect(() => {
    if (!selected) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setSelected(null);
    document.addEventListener("keydown", close); document.body.classList.add("modal-open");
    return () => { document.removeEventListener("keydown", close); document.body.classList.remove("modal-open"); };
  }, [selected]);

  const locations = useMemo(() => Array.from(new Set(cases.map((item) => item.area))).sort((a, b) => a.localeCompare(b, "zh-Hant")), [cases]);
  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return cases.filter((item) => {
      const locationMatch = location === "全部地區" || item.area === location;
      const categoryMatch = category === "全部類別" || (categoriesById[item.id] ?? ["綜合或其他"]).includes(category);
      const haystack = [item.id, item.company, item.title, item.summary, item.location, item.sector, item.ai, item.subsidy, item.detail].join(" ").toLocaleLowerCase();
      return locationMatch && categoryMatch && (!needle || haystack.includes(needle));
    });
  }, [cases, category, location, query]);
  const reset = () => { setQuery(""); setLocation("全部地區"); setCategory("全部類別"); };

  return <main>
    <header className="hero">
      <nav aria-label="網站導覽"><span className="brand-mark">製造 × AI</span><span>日本中小微企業案例庫</span></nav>
      <div className="hero-copy"><p className="eyebrow">JAPAN MSME MANUFACTURING AI CASES</p><h1>日本中小微企業<br /><em>AI 應用案例庫</em></h1><p>從政府、企業與合作夥伴的一手資料，整理可查證的導入方式、實施成果與補助資訊。</p></div>
      <div className="hero-note"><span>資料更新</span><strong>2026.09</strong></div>
    </header>

    <section className="catalog" aria-labelledby="catalog-title">
      <div className="catalog-head"><div><p className="eyebrow">CASE LIBRARY</p><h2 id="catalog-title">案例一覽</h2></div><div className="stats" aria-label="資料庫統計"><div><strong>{cases.length || 22}</strong><span>收錄案例</span></div><div><strong>{locations.length || "—"}</strong><span>涵蓋地區</span></div></div></div>
      <div className="toolbar">
        <label className="search-field"><span>關鍵字搜尋</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="公司、技術或應用場景" /></label>
        <label className="select-field"><span>所在地</span><select value={location} onChange={(event) => setLocation(event.target.value)}><option>全部地區</option>{locations.map((area) => <option key={area}>{area}</option>)}</select></label>
        <label className="select-field"><span>應用類別</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option>全部類別</option>{categoryOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
        <button className="reset" onClick={reset} disabled={!query && location === "全部地區" && category === "全部類別"}>清除條件</button>
      </div>
      <div className="result-row"><span>目前顯示 <strong>{visible.length}</strong> 案</span><span>點選卡片查看完整資料與來源</span></div>

      {loading ? <div className="state">正在載入案例資料…</div> : visible.length === 0 ? <div className="state"><strong>找不到相符案例</strong><span>請嘗試其他關鍵字或清除篩選條件。</span><button onClick={reset}>顯示全部案例</button></div> :
        <div className="case-grid">{visible.map((item) => <article className="case-card" key={item.id} onClick={() => setSelected(item)}>
          <div className="card-top"><span>{item.area}</span><span>{item.id}</span></div><h3>{item.title}</h3><p className="company">{item.company}</p><p>{item.summary}</p>
          <div className="tags" aria-label="AI 應用類別">{(categoriesById[item.id] ?? ["綜合或其他"]).map((category) => <span key={category}>{category}</span>)}</div>
          <button onClick={(event) => { event.stopPropagation(); setSelected(item); }}>查看案例詳情 <span aria-hidden="true">→</span></button>
        </article>)}</div>}
    </section>
    <footer><strong>日本中小微企業 AI 應用案例庫</strong><p>資料以原始來源為準；未經證實的補助關聯不作推定。</p></footer>

    {selected && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="detail-title">
      <button className="modal-close" aria-label="關閉案例詳情" onClick={() => setSelected(null)}>×</button>
      <div className="modal-heading"><div className="card-top"><span>{selected.area}</span><span>{selected.id}</span></div><h2 id="detail-title">{selected.title}</h2><p className="company">{selected.company}</p><p className="lead">{selected.summary}</p></div>
      <div className="fact-grid">{[["所在地", selected.location], ["製造領域", selected.facts["製造領域"] || selected.sector], ["資本額", selected.facts["資本額"] || "未公開"], ["員工人數", selected.facts["員工人數"] || "未公開"], ["AI 技術細節", selected.facts["AI 技術"] || selected.ai], ["補助金／支援", selected.subsidy]].map(([label, value]) => <div key={label}><span>{label}</span><p>{value}</p></div>)}</div>
      <div className="detail-copy"><h3>案例詳細內容</h3><p>{selected.detail}</p></div>
      {selected.sources.length > 0 && <div className="source-list"><h3>資料來源</h3>{selected.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}<span aria-hidden="true">↗</span></a>)}</div>}
    </section></div>}
  </main>;
}
