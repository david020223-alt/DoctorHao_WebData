import raw from '@/data/medical-visuals.json';
export interface MedicalVisual {
  slug: string; scene: string; title: string; articleTitle: string; category: string;
  alt: string; cover: string; coverSmall: string; coverMedium: string;
  figure: string; figureRaster: string; og: string; model: string; poster: string;
  modelNotes: string; caution: string; camera: number[]; reviewStatus: string;
  points: { heading: string; text: string }[]; structures: string[][]; sourceIds: string[];
}
interface Model { src: string; poster: string; notes: string; camera: number[]; bytes: number; }
interface Registry {
  articles: Record<string, MedicalVisual>; models: Record<string, Model>;
  sources: Record<string, {label: string; url: string; checkedOn: string}>;
}
export const medicalVisuals = raw as unknown as Registry;
// Preserve the source briefs while adapting model-specific wording for flat diagrams.
for (const visual of Object.values(medicalVisuals.articles)) {
  visual.caution = visual.caution.replaceAll('模型', '圖解').replaceAll('人偶', '動作');
  visual.points = visual.points.map(p => ({ ...p, text: p.text.replaceAll('模型', '圖解').replace('圖中部分結構移開', '圖中省略部分結構') }));
}
/** New/unmapped articles keep the existing CategoryCover; never guess a medical illustration. */
export const getMedicalVisual = (slug: string): MedicalVisual | undefined => medicalVisuals.articles[slug];
