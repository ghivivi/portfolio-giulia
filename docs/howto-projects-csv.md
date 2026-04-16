# Come usare `config/projects.csv`

Il file `config/projects.csv` permette di aggiungere e modificare i progetti del portfolio senza toccare direttamente il JSON. Basta compilare il CSV, fare push su GitHub, e il sito si aggiorna automaticamente.

---

## Flusso automatico

```
Modifica projects.csv → push su GitHub
  → GitHub Action esegue csv-to-json.js (aggiorna projects.json)
  → GitHub Action esegue build.js (rigenera it/, en/, fr/, index.html)
  → Auto-commit con tutte le modifiche
```

---

## Regole base del CSV

- **Separatore**: punto e virgola `;`
- **Testo con punto e virgola o virgole**: racchiudere tra virgolette doppie `"..."`
- **Virgolette nel testo**: raddoppiarle `""così""`
- **Codifica**: UTF-8
- **Righe vuote**: ignorate automaticamente

---

## Colonne

| Colonna | Obbligatorio | Valori | Note |
|---------|:-----------:|--------|------|
| `id` | ✓ | stringa slug | Chiave univoca. Usare solo lettere minuscole, numeri e trattini. Es: `sinai-reportage-2014` |
| `visible` | ✓ | `true` / `false` | `false` = il progetto esiste ma non è visibile sul sito |
| `order` | ✓ | numero intero | Ordine di visualizzazione all'interno della categoria (1 = primo) |
| `date` | ✓ | `YYYY-MM-DD` | Data di pubblicazione |
| `title_it` | ✓ | testo | Titolo in italiano |
| `title_en` | ✓ | testo | Titolo in inglese |
| `title_fr` | ✓ | testo | Titolo in francese |
| `section` | — | `journalism` / `ngo` | Necessario solo per **nuove categorie** (vedi sezione dedicata) |
| `categories` | ✓ | slug separati da virgola | Categorie a cui appartiene il progetto. Es: `longform-reportage` |
| `subcategory` | — | slug | Sottocategoria. Es: `migration-displacement` |
| `mainpage` | ✓ | `true` / `false` | `true` = appare nella sezione principale della home |
| `articleUrl` | — | URL | Link all'articolo/fonte esterna |
| `thumbnail_url` | — | URL o path relativo | Immagine di anteprima. Path relativi: `../media/thumbnails/nome.jpg` |
| `thumbnail_fallbackGradient` | — | CSS gradient | Sfondo se la thumbnail non si carica. Lasciare vuoto per usare il default |
| `video_type` | — | `youtube` / `vimeo` | Compilare solo se il progetto ha un video incorporato |
| `video_id` | — | stringa | ID del video su YouTube o Vimeo |
| `video_src` | — | URL | URL diretto al file video (alternativa a `video_id`) |
| `allegati` | — | `url\|label,url\|label,...` | Lista di allegati/link (vedi formato sotto) |
| `testo_it` | — | testo lungo | Corpo del testo in italiano |
| `testo_en` | — | testo lungo | Corpo del testo in inglese |
| `testo_fr` | — | testo lungo | Corpo del testo in francese |
| `description_it` | — | testo breve | Descrizione corta in italiano (usata nei meta e nelle card) |
| `description_en` | — | testo breve | Descrizione corta in inglese |
| `description_fr` | — | testo breve | Descrizione corta in francese |
| `tags_format` | — | testo | Formato del lavoro. Es: `Reportage scritto`, `Documentario 52'` |
| `tags_role` | — | testo | Ruolo. Es: `Giornalista`, `Regista` |
| `tags_location` | — | testo | Luogo. Es: `Egitto`, `Francia, Belgio` |

---

## Formato allegati

Gli allegati sono link aggiuntivi (PDF, articoli, versioni del lavoro). Formato:

```
url1|label1,url2|label2
```

Se il testo contiene virgole, racchiudere l'intera cella tra virgolette:

```
"../media/sinai.pdf|Articolo Left,https://limes.it/...|Limes"
```

Esempio reale:
```
"../media/longform-reportage/sinai.pdf|Sinai (Left),https://vimeo.com/207909226|Video (Vimeo)"
```

---

## Testi lunghi con paragrafi

Per testi con ritorni a capo, racchiudere l'intera cella tra virgolette e usare `\n\n` per i paragrafi:

```
"Primo paragrafo del testo.\n\nSecondo paragrafo."
```

---

## Aggiungere un nuovo progetto

Aggiungere una riga con un `id` che non esiste ancora nel sistema. Esempio minimo:

```
mio-nuovo-articolo;true;10;2026-03-15;Titolo IT;Title EN;Titre FR;;longform-reportage;;false;https://link-articolo.com;../media/thumbnails/mio-articolo.jpg;;;;;;;;;;;;;Reportage scritto;Giornalista;Turchia
```

---

## Modificare un progetto esistente

Aggiungere una riga con l'`id` esatto del progetto esistente. Lo script sovrascrive solo quel progetto, lasciando intatti tutti gli altri.

---

## Aggiungere una nuova categoria o sottocategoria

Se la categoria che si usa in `categories` **non esiste ancora** nel menu di navigazione, compilare anche la colonna `section` (`journalism` o `ngo`). Lo script la registra automaticamente.

**Esempio — nuova categoria `video-essays` nella sezione Journalism:**

```
mio-video;true;1;2026-04-01;Titolo;Title;Titre;journalism;video-essays;;false;;...
```

Risultato automatico in `projects.json`:
```json
"journalism": {
  "order": ["documentary-films", "multimedia-projects", "longform-reportage", "video-essays"]
}
```

La categoria apparirà nel menu come **Video Essays** (slug convertito). Per una label personalizzata in italiano/inglese/francese, aggiungere manualmente la chiave in `config/i18n/it.json`, `en.json`, `fr.json` sotto `"categories"`:
```json
"categories": {
  "video-essays": "Video Saggi"
}
```

**Esempio — nuova sottocategoria `refugees` dentro `longform-reportage`:**

```
mio-articolo;true;5;2026-04-01;Titolo;Title;Titre;journalism;longform-reportage;refugees;false;;...
```

---

## Categorie esistenti

### Journalism
| Slug | Label attuale |
|------|--------------|
| `documentary-films` | Documentary Films |
| `multimedia-projects` | Multimedia Projects |
| `longform-reportage` | Longform Reportage |

### NGO
| Slug | Label attuale |
|------|--------------|
| `documentary-series` | Documentary Series |
| `field-missions` | Field Missions |
| `multimedia-projects-coordination` | Multimedia Projects Coordination |

---

## Comportamento dello script

- **Riga con `id` già esistente** → il progetto viene aggiornato
- **Riga con `id` nuovo** → il progetto viene aggiunto in coda
- **CSV con solo header (nessuna riga dati)** → il JSON non viene toccato
- **Riga senza `id`** → ignorata con avviso nel log
- **Colonna `section` assente o vuota** → la categoria non viene auto-registrata (il progetto viene comunque salvato)
