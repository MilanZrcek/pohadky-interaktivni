export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let body;
  try { body = await req.json(); } catch { body = {}; }

  const { postavy, mista, predmety, nalada, volba1, volba2 } = body;

  const detiInfo = `Pokud se mezi postavami vyskytují tato jména:
- Lukášek: živý pětiletý chlapec se zlatými vlasy
- Emmička: dvouletá holčička s blonďatými vlásky
- Marta: veselý chlapec s hnědými vlasy
- Editka: roční miminko s hnědými vlásky
- Přemek: dvouletý chlapec s hnědými vlasy
Piš o nich jako o skutečných dětech. Přizpůsob chování věku.`;

  // Fáze 1 — začátek + první větvení
  if (!volba1 && !volba2) {
    const prompt = `Jsi zkušený český pohádkář. Piš krásnou češtinou ve stylu klasických pohádek.

${detiInfo}

Postavy: ${postavy || 'odvážný hrdina'}
Místo: ${mista || 'kouzelná země'}
Kouzelné věci: ${predmety || 'kouzelný předmět'}
Vyznění: ${nalada || 'šťastný konec'}

Napiš začátek pohádky (150 slov) a pak zastav na PRVNÍM větvení.
Větvení musí být o tom CO POSTAVA ŘEKNE nebo UDĚLÁ — ne kam jde.
Příklady dobrých větvení: "Pozdraví staříčka nebo ho přejde?", "Podělí se o jídlo nebo si ho nechá?", "Řekne pravdu nebo zalže?"

Odpověz POUZE v tomto JSON formátu bez jakýchkoliv dalších znaků:
{
  "nazev": "název pohádky",
  "text1": "text začátku pohádky, končí těsně před rozhodnutím",
  "otazka1": "Krátká otázka větvení — co postava řekne nebo udělá?",
  "moznost1a": "První možnost (kratce, 5-8 slov)",
  "moznost1b": "Druhá možnost (kratce, 5-8 slov)",
  "moznost1c": "Třetí možnost (kratce, 5-8 slov)"
}`;

    try {
      const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 1200,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!apiRes.ok) {
        const err = await apiRes.json().catch(() => ({}));
        return Response.json({ error: err?.error?.message || 'Anthropic error' }, { status: apiRes.status });
      }
      const data = await apiRes.json();
      const raw = data.content?.map(b => b.text || '').join('') || '';
      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      return Response.json({ faze: 1, ...parsed });
    } catch (err) {
      return Response.json({ error: err.message }, { status: 500 });
    }
  }

  // Fáze 2 — střed příběhu + druhé větvení
  if (volba1 && !volba2) {
    const prompt = `Jsi zkušený český pohádkář. Piš krásnou češtinou ve stylu klasických pohádek.

${detiInfo}

Postavy: ${postavy || 'odvážný hrdina'}
Místo: ${mista || 'kouzelná země'}
Kouzelné věci: ${predmety || 'kouzelný předmět'}

Hráč si zvolil: "${volba1}"

Napiš střední část pohádky (120 slov). Ukaž přirozeně jak volba "${volba1}" ovlivnila příběh.
Pokud byla volba laskavá nebo odvážná — věci se daří. Pokud méně laskavá — postava narazí na drobnou překážku, ale nezažije nic zlého, jen se trošku zapotí nebo se za sebe stydí.
Pak zastav na DRUHÉM větvení — opět o tom co postava řekne nebo udělá.

Odpověz POUZE v tomto JSON formátu:
{
  "text2": "střední část pohádky, končí těsně před rozhodnutím",
  "otazka2": "Krátká otázka větvení — co postava řekne nebo udělá?",
  "moznost2a": "První možnost (kratce, 5-8 slov)",
  "moznost2b": "Druhá možnost (kratce, 5-8 slov)",
  "moznost2c": "Třetí možnost (kratce, 5-8 slov)"
}`;

    try {
      const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 1200,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!apiRes.ok) {
        const err = await apiRes.json().catch(() => ({}));
        return Response.json({ error: err?.error?.message || 'Anthropic error' }, { status: apiRes.status });
      }
      const data = await apiRes.json();
      const raw = data.content?.map(b => b.text || '').join('') || '';
      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      return Response.json({ faze: 2, ...parsed });
    } catch (err) {
      return Response.json({ error: err.message }, { status: 500 });
    }
  }

  // Fáze 3 — závěr s poučením
  if (volba1 && volba2) {
    const prompt = `Jsi zkušený český pohádkář. Piš krásnou češtinou ve stylu klasických pohádek.

${detiInfo}

Postavy: ${postavy || 'odvážný hrdina'}
Místo: ${mista || 'kouzelná země'}
Kouzelné věci: ${predmety || 'kouzelný předmět'}
Vyznění: ${nalada || 'šťastný konec'}

Hráč si zvolil: první volba "${volba1}", druhá volba "${volba2}"

Napiš závěr pohádky (150 slov). Ukaž jak obě volby dohromady ovlivnily výsledek.
Pohádka musí skončit pozitivně — i pokud byly volby méně laskavé, postava se poučí a situace se zlepší.
Na konci přidej krátké poučení (1-2 věty) začínající slovy "A tak se Lukášek naučil..." nebo podobně.

Odpověz POUZE v tomto JSON formátu:
{
  "text3": "závěr pohádky včetně poučení"
}`;

    try {
      const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 1200,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!apiRes.ok) {
        const err = await apiRes.json().catch(() => ({}));
        return Response.json({ error: err?.error?.message || 'Anthropic error' }, { status: apiRes.status });
      }
      const data = await apiRes.json();
      const raw = data.content?.map(b => b.text || '').join('') || '';
      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      return Response.json({ faze: 3, ...parsed });
    } catch (err) {
      return Response.json({ error: err.message }, { status: 500 });
    }
  }

  return Response.json({ error: 'Neplatny stav' }, { status: 400 });
}
