---
title: Pulling tables out of Hindi PDFs
description: How I added table detection and parsing to Samagra's PDF-to-Markdown pipeline, using a detector model for "where" and plain geometry for "what".
date: 2024-08-28
tags: [python, computer-vision, ocr, open-source]
---

[Samagra](https://github.com/Samagra-Development) builds open-source tooling for Indian government programs, and a lot of that work starts with PDFs: scanned circulars, scheme documents and reports, many of them in Hindi. Their AI group maintains a fork of [marker](https://github.com/BharatSahAIyak/marker), a tool that turns PDFs into Markdown so the text can feed search and LLM pipelines.

Paragraphs came out fine. **Tables didn't.** A table in a scanned PDF is just ink on a page, so it came out as a jumble of numbers with no rows or columns, which is useless for anything downstream.

In August 2024 I added table detection and parsing to the fork in two merged PRs ([#11](https://github.com/BharatSahAIyak/marker/pull/11), [#14](https://github.com/BharatSahAIyak/marker/pull/14)).

## The approach: a model for "where", geometry for "what"

I split the problem in two:

1. **Where is the table?** That's a fuzzy, visual question, so a model answers it.
2. **What are its rows and cells?** Bordered tables are made of straight lines, so plain computer vision and geometry answer that, and the results are explainable when they go wrong.

## Step 1: find the table

Each page is rendered at 180 DPI and passed to Microsoft's **Table Transformer** (`microsoft/table-transformer-detection`), a DETR-style object detector. Detections above 0.8 confidence are kept, and each table is cropped out with 30 px of padding so its border lines aren't clipped.

## Step 2: find the lines

On the cropped table:

- **Ruling lines:** grayscale, Gaussian blur, Canny edges, then a probabilistic Hough transform keeps only near-horizontal and near-vertical segments (within about 1°).
- **Text lines:** Tesseract runs with the Hindi model (`-l hin`) and returns word boxes. Words whose vertical centres are within half the average text height are grouped into text lines.

The text lines turn out to be the key to everything else, because **average text height is a natural unit for the whole page**. Instead of hard-coding pixel thresholds that break at a different scan resolution, the clustering and filtering tolerances are all fractions of it.

## Step 3: clean the lines up

Raw Hough output is messy: one printed border becomes several broken, overlapping segments, and underlines or strikethroughs look like borders. So:

- horizontal "lines" that overlap text are dropped, since a real border doesn't run through words;
- nearby segments are **clustered** (within one text height) and merged into a single line;
- horizontal lines that never cross a vertical line are dropped;
- lines are **extended** to snap onto their neighbours, closing the small gaps scanners leave at corners, and the crop's top and bottom edges are added as lines.

## Step 4: lines to cells to a table

- intersect every horizontal line with every vertical line, row by row, sorted left to right;
- walk adjacent intersection points to form boxes, matching corners within 10 px;
- map each box to row and column indexes, which also handles cells spanning several rows or columns;
- drop each OCR word into the cell whose box contains it, sorted in reading order;
- build a DataFrame, use the first row as the header, and emit a **Markdown table** back into marker's document as a `Table` block.

## The bug the second PR fixed

After the first version, tables appeared twice: once as the new clean table, and again as marker's original jumbled text blocks for the same region. The second PR removes any existing block whose box falls inside the detected table. The catch was coordinates: marker's blocks live in PDF points, while the table box lives in pixels of a 180 DPI render. Both had to be normalized to 0–1 and mapped back into the same space before comparing.

## What I'd do differently

- **Borderless tables** are out of reach for a line-based method. Today I'd add a structure-recognition model as a fallback for tables without ruling lines.
- **Measure.** I tuned this on real documents by eye. A small labelled set with cell-level accuracy would have made each change provable.
- **Clean up the debugging.** The code still wrote debug images and CSVs to disk on every page; in a pipeline those belong behind a flag.

## Also at Samagra: ColBERT fine-tuning

Earlier in 2024 I worked on fine-tuning **ColBERT** retrieval models for Samagra's model-training tooling. I wrote a [standalone fine-tuning script](https://github.com/TakshPanchal/colbert-finetune) on top of RAGatouille and the ColBERT library: prepare query and passage triples, start from `colbertv2.0`, and train with mixed precision and a warmup schedule. This was alongside the embedding-model training work in their autotune project.
