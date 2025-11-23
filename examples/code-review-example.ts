import { TypedPrompt } from "../src/index";
import { HumanMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import * as dotenv from "dotenv";

dotenv.config();

interface CodeReviewInput {
  pullRequest: {
    id: number;
    title: string;
    author: string;
    description: string;
  };
  files: Array<{
    path: string;
    linesAdded: number;
    linesRemoved: number;
    changes: string;
  }>;
  context: {
    projectType: string;
    framework: string;
    testingRequired: boolean;
    performanceCritical: boolean;
  };
}

const codeReviewPrompt = `
# Code Review Request

## Pull Request Information
- **PR #{{pullRequest.id}}**: {{pullRequest.title}}
- **Author**: @{{pullRequest.author}}
- **Description**: {{pullRequest.description}}

## Project Context
- **Project Type**: {{context.projectType}}
- **Framework**: {{context.framework}}
- **Testing Required**: {{context.testingRequired}}
- **Performance Critical**: {{context.performanceCritical}}

## Files Changed ({{files.length}} files)
{{#each files}}
### {{path}}
- **Lines**: +{{linesAdded}} / -{{linesRemoved}}
- **Changes**:
\`\`\`
{{changes}}
\`\`\`

{{/each}}

## Review Guidelines

---

Please provide a comprehensive code review covering:
1. Code quality and maintainability
2. Security vulnerabilities
3. Performance implications
4. Test coverage
5. Documentation completeness
6. Adherence to style guidelines
7. Suggestions for improvement
`;

// Create the typed prompt template
const codeReviewPromptTemplate = TypedPrompt<CodeReviewInput>()(codeReviewPrompt);


const exampleInput: CodeReviewInput = {
  pullRequest: {
    id: 1234,
    title: "Add user authentication with JWT and OAuth2 support",
    author: "harry",
    description:
      "This PR implements a comprehensive authentication system with support for both JWT tokens and OAuth2 providers (Google, GitHub). Includes rate limiting, token refresh, and secure session management.",
  },
  files: [
    {
      path: "src/auth/AuthService.ts",
      linesAdded: 234,
      linesRemoved: 12,
      changes: `export class AuthService {
  private jwtSecret: string;
  private tokenExpiry: number = 3600;

  constructor(secret: string) {
    this.jwtSecret = secret;
  }

  async authenticate(username: string, password: string): Promise<AuthToken> {
    // Hash password using bcrypt
    const user = await this.userRepository.findByUsername(username);
    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      this.jwtSecret,
      { expiresIn: this.tokenExpiry }
    );

    // Store refresh token in database
    const refreshToken = await this.generateRefreshToken(user.id);
    
    return { accessToken: token, refreshToken, expiresIn: this.tokenExpiry };
  }

  async authenticateWithOAuth(provider: string, code: string): Promise<AuthToken> {
    const oauthService = this.getOAuthService(provider);
    const userInfo = await oauthService.exchangeCodeForToken(code);
    
    // Create or update user in database
    let user = await this.userRepository.findByEmail(userInfo.email);
    if (!user) {
      user = await this.userRepository.create({
        email: userInfo.email,
        name: userInfo.name,
        provider: provider
      });
    }

    return this.authenticate(user.email, null);
  }
}`,
    },
    {
      path: "src/middleware/rateLimiter.ts",
      linesAdded: 87,
      linesRemoved: 0,
      changes: `import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

export class RateLimiter {
  private redis: Redis;
  private maxRequests: number;
  private windowMs: number;

  constructor(redisClient: Redis, maxRequests = 100, windowMs = 60000) {
    this.redis = redisClient;
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const key = \`ratelimit:\${req.ip}:\${Date.now()}\`;
      const current = await this.redis.incr(key);
      
      if (current === 1) {
        await this.redis.expire(key, Math.ceil(this.windowMs / 1000));
      }

      if (current > this.maxRequests) {
        return res.status(429).json({ error: 'Too many requests' });
      }

      res.setHeader('X-RateLimit-Limit', this.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', (this.maxRequests - current).toString());
      
      next();
    };
  }
}`,
    },
    {
      path: "tests/auth/AuthService.test.ts",
      linesAdded: 156,
      linesRemoved: 0,
      changes: `describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepository = {
      findByUsername: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
    } as any;
    
    authService = new AuthService('test-secret', mockUserRepository);
  });

  describe('authenticate', () => {
    it('should return token for valid credentials', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        passwordHash: await bcrypt.hash('password123', 10),
        role: 'user'
      };
      mockUserRepository.findByUsername.mockResolvedValue(mockUser);

      const result = await authService.authenticate('testuser', 'password123');
      
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.expiresIn).toBe(3600);
    });

    it('should throw error for invalid credentials', async () => {
      mockUserRepository.findByUsername.mockResolvedValue(null);

      await expect(
        authService.authenticate('invalid', 'wrongpass')
      ).rejects.toThrow('Invalid credentials');
    });
  });
});`,
    },
  ],
  context: {
    projectType: "REST API Backend",
    framework: "Express.js with TypeScript",
    testingRequired: true,
    performanceCritical: true,
  },
};

// Compile the prompt
const compiledPrompt = codeReviewPromptTemplate.compile(exampleInput);

// Use with LangChain
async function performCodeReview() {
  console.log("Compiled Prompt:");
  console.log(compiledPrompt);

  const model = new ChatOpenAI(
    {
      model: 'gpt-5-mini',
      temperature: 0.8,
      apiKey: process.env.OPENROUTER_API_KEY,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
      },
    },
  );

  const message = new HumanMessage(compiledPrompt);
  const response = await model.invoke([message]);

  console.log("Code Review Result:");
  console.log(response.content);
}

performCodeReview()
