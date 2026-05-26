# Fine-Tuning Plan

This project includes a synthetic spend categorization dataset for a future Mistral 7B fine-tune.

## Dataset

Run:

```bash
node scripts/generate_synthetic_categorization_dataset.js
```

Output:

```text
data/synthetic_spend_categorization.jsonl
```

The dataset contains 600 examples with vendor, amount, description, target category, and reimbursable label.

## Baseline

Current categorization uses deterministic rules in the deployed `/api/agent` and `/api/extract` routes.

Expected baseline accuracy on the synthetic set:

```text
82-88%
```

## Fine-Tuned Model Target

Fine-tune Mistral 7B or another small instruction model on the JSONL rows for the `completion` category label.

Expected fine-tuned accuracy target:

```text
92-96%
```

## Swap-In Point

Replace the `categorizeSpend(transaction)` function in `frontend/api/index.js` with a call to the fine-tuned model endpoint for categorization tasks only.
