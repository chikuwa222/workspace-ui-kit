/**
 * 行動評価のマスターデータ。
 * プロセス評価（業務遂行力・期待されるスキル・基本事項）と
 * 行動指針評価（理念・価値観・行動指針・会社への貢献）を収録。
 * 評価入力ポップオーバーのドロップダウン選択肢として使用する。
 */

export type EvaluationMasterItem = {
  category: string;
  item: string;
};

export const EVALUATION_MASTER: EvaluationMasterItem[] = [
  // ── プロセス評価：業務遂行力 ──
  { category: "業務遂行力", item: "専門知識" },
  { category: "業務遂行力", item: "顧客対応力" },
  { category: "業務遂行力", item: "新規開拓能力" },
  { category: "業務遂行力", item: "チーム連携" },
  { category: "業務遂行力", item: "問題解決力" },
  // ── プロセス評価：期待されるスキル ──
  { category: "期待されるスキル", item: "データ活用力" },
  { category: "期待されるスキル", item: "ITスキル" },
  // ── プロセス評価：基本事項 ──
  { category: "基本事項", item: "法令遵守" },
  { category: "基本事項", item: "時間管理" },
  { category: "基本事項", item: "身だしなみ" },
  { category: "基本事項", item: "報連相の徹底" },
  // ── 行動指針評価：理念 ──
  { category: "理念", item: "経営理念を理解し、仕事や意思決定を理念に合致させようと取り組んでいる" },
  { category: "理念", item: "ローカルサービスプロフェッショナルの定義を理解し、使命感を持って仕事に取り組む" },
  { category: "理念", item: "組織のカルチャーとしての現場力を高めている" },
  // ── 行動指針評価：価値観 ──
  { category: "価値観", item: "仕事はお客様と従業員の豊かさと充実した人生を実現する場であることを理解し行動する" },
  { category: "価値観", item: "中期計画の目指す姿に合致した行動をする" },
  { category: "価値観", item: "正しい目的を定め、目標を立てて行動をする" },
  { category: "価値観", item: "リーダーを理解し正しい行動をする" },
  // ── 行動指針評価：行動指針 ──
  { category: "行動指針", item: "先義後利にそった活動をする" },
  { category: "行動指針", item: "変化への挑戦を行う" },
  { category: "行動指針", item: "変化こそ不変の法則にそった活動をする" },
  // ── 行動指針評価：会社への貢献 ──
  { category: "会社への貢献", item: "相馬グループで働く仲間に強く必要とされる存在となっている" },
  { category: "会社への貢献", item: "知恵を出し、工夫を行い目標達成に向けた強い責任感を持っている" },
  { category: "会社への貢献", item: "チームや他部署と円滑に連携し、組織の成長を支える協調性やリーダーシップを発揮" },
  { category: "会社への貢献", item: "現状に満足せず、業務改善や新しい提案を積極的に行い、会社の成長や競争力強化に寄与" },
];

/** マスターデータをカテゴリごとにグループ化して返す。 */
export function groupedEvaluationMaster(): { category: string; items: { index: number; item: string }[] }[] {
  const seen = new Set<string>();
  const order: string[] = [];
  for (const m of EVALUATION_MASTER) {
    if (!seen.has(m.category)) {
      seen.add(m.category);
      order.push(m.category);
    }
  }
  return order.map((category) => ({
    category,
    items: EVALUATION_MASTER.flatMap((m, i) =>
      m.category === category ? [{ index: i, item: m.item }] : [],
    ),
  }));
}
