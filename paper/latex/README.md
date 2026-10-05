# paper: latex

the master version of the emergence-study paper. one set of sections; a thin "main" file per venue.

---

## what's here

```
main.tex            # the master paper (neutral template). compile this.
preamble.tex        # packages + the paper's own commands (\note, \anecdote, \code, \work, ...)
references.bib      # bibliography (bibtex)
sections/           # the text, one file per section
  00-abstract  01-introduction  02-background  03-system  04-method
  05-interpretations  06-revision  07-discussion  08-conclusion
  09-acknowledgments  10-appendix
figures/            # converted from the presentations repo (latex can't read .webp)
venues/             # (later) one wrapper per venue: acm, ieee, xcoax, ...
```

---

## latex in one minute

- you write plain-text `.tex` files; latex turns them into a pdf.
- `\section{...}`, `\emph{...}`, `\cite{key}` etc. are commands. `%` starts a comment (not printed).
- special characters need a backslash: `\&`, `\%`, `\#`, `\_`, `\$`.
- citations: add an entry to `references.bib`, then write `\cite{its-key}` in the text. the reference list builds itself.
- figures: put an image in `figures/`, then `\includegraphics{name}` (no extension needed).
- a pdf is made by "compiling". compiling twice (or with bibtex in between) fixes references & citations; overleaf does this for you.

---

## compiling

### option a: overleaf (easiest, nothing to install)

1. zip this folder: in a terminal, `cd paper && zip -r latex.zip latex`.
2. on [overleaf.com](https://www.overleaf.com): **new project → upload project**, choose `latex.zip`.
3. in the menu (top left): **compiler: pdfLaTeX**, **main document: main.tex**.
4. press **recompile**. the pdf appears on the right.

edit there, or keep editing here & re-upload. (overleaf's paid plan syncs with github; the free one doesn't.)

### option b: on your mac

1. install a latex distribution: `brew install --cask mactex-no-gui` (~5gb) or `brew install --cask basictex` (small; may need extra packages via `tlmgr`).
2. in vs code, install the **latex workshop** extension; it compiles on save.
3. or in a terminal, from this folder: `latexmk -pdf main.tex`.

---

## switches (top of `main.tex`)

- `\anonymousfalse` → `\anonymoustrue`: hides your name, affiliation, acknowledgments & repository link. **most venues review blind; use this for submission.**
- `\shownotestrue` → `\shownotesfalse`: hides every pink `note:` & `anecdote (to write):` box. **turn off before submitting.**

---

## what's left for you (search the .tex files for `\note{` & `\anecdote{`)

- **anecdotes**, one per interpretation + one in the introduction: why you thought of it. 3–5 sentences each; first person; specific (a place, a moment).
- **a still for #2, missed connections** (none exists yet).
- **re-run the slide graphs** (`assets/cde/analysis/slide.html`): they were measured before the day-length change.
- **check every reference** in `references.bib` against the real source (esp. the ones marked `todo: verify`).
- **check the figures' details** (cellular-automata rule; order of the mesh images).
- **#6's expression**: the code averages which side of the place a being stands on, not where it arrived from.
- **the repository link** & a git tag for the version the paper describes.

---

## porting to a venue

each venue has its own template & page limit. the sections stay the same; only the wrapper changes (& the text gets cut to fit). the templates & lengths below are from memory: check each year's call.

| venue | template | rough length | angle to lead with |
|---|---|---|---|
| xcoax | their own latex template (from the call) | 6–12 pages | the theory: instruction → interpretation; the artist as reader |
| isea | their own (often word / latex) | short paper / full paper | everyday life as rules; the artworks |
| ieee vis arts (visap) | ieee vgtc (`vgtc.cls`) | ~4 pages + refs | interpretation as data representation |
| alife (art track / papers) | mit press alife template | ~8 pages | the base system & its emergent behaviour (home!) |
| siggraph art papers | acm `acmart` (`sigconf`) | short, argument-led | one sharp claim: rules from life, not form |
| c&c pictorials | acm `acmart` (pictorial) | image-led | the six images + the format |
| eva london | their own (bcs ewic) | ~8 pages | practice-based account |
| evomusart | springer lncs (`llncs.cls`) | 16 pages | the population dynamics |

a venue wrapper is a copy of `main.tex` that loads the venue's class instead of `article`, keeps the commands at the bottom of `preamble.tex`, & `\input`s the sections. citations in `acmart` & ieee use the same `\cite{}`; only the bibliography style changes.

**one paper, one venue at a time.** sending the same paper to two venues at once breaks their dual-submission rules. if it's rejected, revise with the reviews & send it to the next. different papers from the same project (e.g. a visap paper on representation, an alife paper on the system) are fine, as long as each says something the other doesn't.
