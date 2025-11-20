# TypedPrompt

A fully type-safe prompt templating library for TypeScript built on Handlebars/Mustache syntax.

## Features

- **Full TypeScript type safety** - Validates template variables against your data types at compile time
- **Handlebars/Mustache syntax** - All standard Mustache functionality is supported
- **Zero runtime overhead** - Type checking happens at compile time only
- **Nested property access** - Supports dot notation like `{{user.name}}`
- **Conditional blocks** - Use `{{#if}}` blocks with type checking
- **Iteration** - Use `{{#each}}` blocks (v1 validates array property exists)

## Installation

```bash
npm install typed-prompt
```

## Usage

```typescript
import { TypedPrompt } from 'typed-prompt';

// Define your data type
interface UserData {
  name: string;
  age: number;
}

// Create a typed prompt - TypeScript validates the template at compile time
const prompt = TypedPrompt<UserData>()('Hello {{name}}, you are {{age}} years old!');

// Compile with data - TypeScript ensures the data matches the type
const result = prompt.compile({ name: 'Harry', age: 25 });
console.log(result); // "Hello Harry, you are 25 years old!"
```

### Type Safety

TypeScript will catch template errors at compile time:

```typescript
interface User {
  name: string;
}

// ✅ This works
const validPrompt = TypedPrompt<User>()('Hello {{name}}!');

// ❌ TypeScript Error: Variable "email" does not exist in input type
const invalidPrompt = TypedPrompt<User>()('Your email is {{email}}');
```

### Nested Properties

```typescript
interface BlogPost {
  title: string;
  author: {
    name: string;
    email: string;
  };
}

const prompt = TypedPrompt<BlogPost>()(
  '{{title}} by {{author.name}} ({{author.email}})'
);

prompt.compile({
  title: 'TypeScript Tips',
  author: { 
    name: 'Alice', 
    email: 'alice@example.com' 
  }
});
// Output: "TypeScript Tips by Alice (alice@example.com)"
```

### Conditional Blocks

```typescript
interface Product {
  name: string;
  price: number;
  onSale: boolean;
}

const prompt = TypedPrompt<Product>()(
  '{{name}}: ${{price}}{{#if onSale}} (ON SALE!){{/if}}'
);

prompt.compile({ name: 'Widget', price: 9.99, onSale: true });
// Output: "Widget: $9.99 (ON SALE!)"
```

## Limitations (v1)

- Inside `{{#each}}` blocks, the library currently only validates that the array property exists, not the properties accessed within the loop context
- Advanced Handlebars helpers are not yet type-checked

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test
npm run test:types
```

## License

MIT