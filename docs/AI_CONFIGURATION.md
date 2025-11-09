# AI Configuration Guide

This guide explains how to configure and use AI features in the AI Social Media Manager.

## Supported AI Providers

1. **OpenAI** - GPT-4, GPT-3.5-turbo
2. **Anthropic** - Claude 3 (Opus, Sonnet, Haiku)

## Getting API Keys

### OpenAI

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to **API Keys**
4. Click **"Create new secret key"**
5. Copy and save the key securely
6. Add to `.env`:
   ```env
   OPENAI_API_KEY=sk-...your-key-here
   ```

**Pricing** (as of 2024):
- GPT-4 Turbo: $0.01/1K input tokens, $0.03/1K output tokens
- GPT-3.5 Turbo: $0.0005/1K input tokens, $0.0015/1K output tokens

### Anthropic Claude

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to **API Keys**
4. Create a new key
5. Copy and save the key securely
6. Add to `.env`:
   ```env
   ANTHROPIC_API_KEY=sk-ant-...your-key-here
   ```

**Pricing** (as of 2024):
- Claude 3 Opus: $15/1M input tokens, $75/1M output tokens
- Claude 3 Sonnet: $3/1M input tokens, $15/1M output tokens
- Claude 3 Haiku: $0.25/1M input tokens, $1.25/1M output tokens

## Configuration

### Environment Variables

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-key
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=2000

# Anthropic Configuration
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
ANTHROPIC_MODEL=claude-3-opus-20240229
ANTHROPIC_MAX_TOKENS=2000

# Default Provider
DEFAULT_AI_PROVIDER=openai  # or 'anthropic'
```

### Model Options

#### OpenAI Models
- `gpt-4-turbo-preview` - Most capable, best for complex tasks
- `gpt-4` - Stable GPT-4
- `gpt-3.5-turbo` - Faster, cheaper, good for simple tasks

#### Anthropic Models
- `claude-3-opus-20240229` - Most capable
- `claude-3-sonnet-20240229` - Balanced performance/cost
- `claude-3-haiku-20240307` - Fastest, most affordable

## AI Features

### 1. Content Generation

Generate social media posts from prompts:

```javascript
POST /api/ai/generate
{
  "prompt": "Write a post about productivity tips for remote workers",
  "provider": "openai",  // optional
  "temperature": 0.7,    // optional (0-2)
  "maxTokens": 500       // optional
}
```

**Use Cases**:
- Create original posts
- Generate ideas
- Write announcements
- Create promotional content

### 2. Content Improvement

Enhance existing content:

```javascript
POST /api/ai/improve
{
  "content": "Check out our new product!",
  "instructions": "Make it more engaging and professional",
  "provider": "anthropic"
}
```

**Use Cases**:
- Polish draft posts
- Improve clarity
- Adjust tone
- Fix grammar

### 3. Hashtag Generation

Get relevant hashtags:

```javascript
POST /api/ai/hashtags
{
  "content": "Just launched our new AI-powered analytics dashboard!"
}
```

Returns: `["AI", "Analytics", "ProductLaunch", "Tech", "Innovation"]`

### 4. Sentiment Analysis

Analyze comment/message sentiment:

```javascript
POST /api/ai/sentiment
{
  "text": "This is amazing! Love the new features!"
}
```

Returns:
```json
{
  "sentiment": "positive",
  "score": 0.95,
  "confidence": 0.98
}
```

### 5. Auto-Reply Generation

Generate replies to comments:

```javascript
POST /api/ai/reply
{
  "commentText": "How much does this cost?",
  "postContext": "Announcing our new pricing plans"
}
```

**Use Cases**:
- Automate customer support
- Reply to common questions
- Engage with audience
- Handle FAQs

## Advanced Configuration

### Custom System Prompts

Create custom AI behaviors:

```javascript
POST /api/ai/generate
{
  "prompt": "Write about our new feature",
  "systemPrompt": "You are a friendly, professional tech company. Write in a conversational tone with enthusiasm but maintain professionalism. Use emojis sparingly."
}
```

### Temperature Settings

Control creativity vs consistency:

- **0.0-0.3**: Focused, consistent, deterministic
- **0.4-0.7**: Balanced (recommended)
- **0.8-1.5**: Creative, varied
- **1.6-2.0**: Very creative, unpredictable

```javascript
{
  "temperature": 0.7  // Balanced
}
```

### Max Tokens

Limit response length:

- **50-100**: Short, concise responses
- **200-500**: Medium posts
- **500-1000**: Long-form content
- **1000+**: Articles, detailed content

## Best Practices

### Content Generation

1. **Be Specific**: Detailed prompts get better results
   ```
   Bad: "Write a post"
   Good: "Write an engaging LinkedIn post about the benefits of AI in customer service, targeting B2B SaaS companies, 150 words"
   ```

2. **Provide Context**: Include relevant information
   ```javascript
   {
     "prompt": "Write about our product launch",
     "systemPrompt": "Company: TechCorp. Product: AI Analytics. Target: Data scientists. Tone: Professional but approachable"
   }
   ```

3. **Iterate**: Refine prompts based on results
   - Start broad, then narrow
   - Save successful prompts
   - Build a prompt library

### Cost Optimization

1. **Choose the Right Model**
   - Simple tasks: GPT-3.5-turbo or Claude Haiku
   - Complex tasks: GPT-4 or Claude Opus
   - Balanced: Claude Sonnet

2. **Limit Max Tokens**
   - Set appropriate limits
   - Don't request more than needed
   - Monitor usage

3. **Cache Results**
   - Store generated content
   - Reuse similar content
   - Don't regenerate unnecessarily

4. **Batch Requests**
   - Generate multiple variations at once
   - Process multiple posts together
   - Minimize API calls

### Quality Control

1. **Review AI Output**: Always review before posting
2. **Fact-Check**: Verify claims and information
3. **Brand Voice**: Ensure consistency with your brand
4. **Legal**: Check for copyright or sensitive content
5. **Context**: Ensure content is appropriate for platform

## Usage Monitoring

### Track API Usage

Monitor your consumption:

```bash
# OpenAI usage
https://platform.openai.com/account/usage

# Anthropic usage
https://console.anthropic.com/settings/usage
```

### Set Spending Limits

1. **OpenAI**: Set hard and soft limits in account settings
2. **Anthropic**: Contact support for usage alerts

### Cost Estimation

Example for 100 posts/day:

**Using GPT-3.5-turbo** (avg 200 tokens):
- Input: 100 * 50 tokens * $0.0005/1K = $0.0025
- Output: 100 * 200 tokens * $0.0015/1K = $0.03
- **Daily**: ~$0.03
- **Monthly**: ~$0.90

**Using GPT-4-turbo** (avg 200 tokens):
- Input: 100 * 50 tokens * $0.01/1K = $0.05
- Output: 100 * 200 tokens * $0.03/1K = $0.60
- **Daily**: ~$0.65
- **Monthly**: ~$19.50

## Troubleshooting

### "Invalid API Key"
- Verify key is correct
- Check for extra spaces
- Ensure key is active
- Generate new key if needed

### "Rate Limit Exceeded"
- Reduce request frequency
- Implement exponential backoff
- Upgrade to higher tier

### "Context Length Exceeded"
- Reduce max_tokens
- Shorten prompts
- Use a model with larger context window

### Poor Quality Output
- Improve prompt specificity
- Adjust temperature
- Try different model
- Add more context

## Safety and Compliance

### Content Moderation

Both providers filter inappropriate content:
- OpenAI: Moderation API
- Anthropic: Built-in safety features

### Data Privacy

- API requests are not used for training (check provider policies)
- Don't send sensitive information
- Follow GDPR/privacy regulations
- Review provider's privacy policy

### Terms of Service

- Follow platform usage policies
- Don't use for spam
- Respect rate limits
- Attribute AI-generated content if required

## Examples

### Generate Twitter Thread

```javascript
{
  "prompt": "Create a 5-tweet thread about the importance of data privacy in 2024. Include statistics and actionable tips.",
  "provider": "openai",
  "model": "gpt-4-turbo-preview",
  "temperature": 0.7
}
```

### LinkedIn Professional Post

```javascript
{
  "prompt": "Write a LinkedIn post announcing our Series A funding round. $5M raised. Focus on our mission to democratize AI.",
  "systemPrompt": "Write in a professional, grateful tone. Include our vision and thank investors, team, and customers.",
  "temperature": 0.6
}
```

### Instagram Caption

```javascript
{
  "prompt": "Write an engaging Instagram caption for a photo of our team at a hackathon. Include relevant hashtags.",
  "provider": "anthropic",
  "model": "claude-3-sonnet-20240229",
  "temperature": 0.8
}
```

## Additional Resources

- [OpenAI Documentation](https://platform.openai.com/docs)
- [Anthropic Documentation](https://docs.anthropic.com/)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)
- [AI Content Best Practices](https://openai.com/blog/best-practices-for-deploying-language-models)

## Next Steps

1. Get API keys from OpenAI and/or Anthropic
2. Add to your `.env` file
3. Test with simple prompts
4. Build a prompt library
5. Configure auto-reply for common questions
6. Set up spending alerts
7. Monitor quality and adjust as needed
