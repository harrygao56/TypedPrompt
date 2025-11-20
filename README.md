# TypedPrompt

A fully type-safe prompt templating library for TypeScript built on Handlebars/Mustache syntax. Keep your LLM prompts separated from code without the risk of silent breakages or data drift.

## Features

- Validates template variables and inputs against your data types at compile time
- All standard Mustache functionality is supported

## Installation

```bash
npm install typed-prompt
```

## Usage

```typescript
import { TypedPrompt } from "typed-prompt";

// Define your prompt input type
interface CodeReviewInput {
  language: string;
  code: string;
  focusAreas: string[];
}

// Create a typed prompt - TypeScript validates the template at compile time
const reviewPrompt = TypedPrompt<CodeReviewInput>()(
  `You are an expert code reviewer. Review the following {{language}} code:

\`\`\`{{language}}
{{code}}
\`\`\`

Focus on:
{{#each focusAreas}}
- {{this}}
{{/each}}`
);

// Compile with data - TypeScript ensures the data matches the type
const prompt = reviewPrompt.compile({
  language: "typescript",
  code: "const x = 1;",
  focusAreas: ["security", "performance", "readability"],
});

// Send prompt to your LLM...
```

### Type Safety

TypeScript will catch template errors at compile time:

```typescript
interface SummarizeInput {
  text: string;
  maxWords: number;
}

// ✅ This works
const validPrompt = TypedPrompt<SummarizeInput>()(
  "Summarize in {{maxWords}} words: {{text}}"
);

// ❌ TypeScript Error: Variable "maxLength" does not exist in input type
const invalidPrompt = TypedPrompt<SummarizeInput>()(
  "Summarize in {{maxLength}} words: {{text}}"
);
```
