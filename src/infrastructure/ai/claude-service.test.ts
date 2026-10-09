import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ClaudeTranslationService } from './claude-service'
import { ParseError } from '@/domain/errors/translation-errors'

const { createMock, streamMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
  streamMock: vi.fn(),
}))

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { create: createMock, stream: streamMock }
  },
}))

const VALID_JSON = JSON.stringify({
  mainExpression: { english: "I'm starving", formality: 'casual' },
  explanation: { context: 'ctx', nuance: 'nuance' },
  alternatives: [],
  relatedVocabulary: [],
  category: '일상대화',
})

const REQUEST = { koreanInput: '배고파 죽겠어', context: undefined }

describe('ClaudeTranslationService', () => {
  let service: ClaudeTranslationService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new ClaudeTranslationService('test-key')
  })

  describe('translate', () => {
    it('should call Haiku 5.5 with thinking disabled and no sampling params', async () => {
      createMock.mockResolvedValue({ content: [{ type: 'text', text: VALID_JSON }] })

      await service.translate(REQUEST)

      const params = createMock.mock.calls[0][0]
      expect(params.model).toBe('claude-haiku-5-5')
      expect(params.thinking).toEqual({ type: 'disabled' })
      expect(params.max_tokens).toBe(1000)
      expect(params).not.toHaveProperty('temperature')
      expect(params).not.toHaveProperty('top_p')
      expect(params).not.toHaveProperty('top_k')
    })

    it('should use the first text block even when it is not content[0]', async () => {
      createMock.mockResolvedValue({
        content: [{ type: 'thinking', thinking: '...', signature: 's' }, { type: 'text', text: VALID_JSON }],
      })

      const result = await service.translate(REQUEST)

      expect(result.mainExpression.english).toBe("I'm starving")
    })

    it('should throw ParseError when the response has no text block', async () => {
      createMock.mockResolvedValue({ content: [{ type: 'tool_use', id: 't', name: 'n', input: {} }] })

      await expect(service.translate(REQUEST)).rejects.toBeInstanceOf(ParseError)
    })
  })

  describe('translateStream', () => {
    it('should call Haiku 5.5 with thinking disabled and no sampling params', async () => {
      streamMock.mockReturnValue(
        (async function* () {
          yield { type: 'content_block_delta', delta: { type: 'text_delta', text: VALID_JSON } }
        })(),
      )

      const generator = service.translateStream(REQUEST)
      for await (const chunk of generator) void chunk

      const params = streamMock.mock.calls[0][0]
      expect(params.model).toBe('claude-haiku-5-5')
      expect(params.thinking).toEqual({ type: 'disabled' })
      expect(params.max_tokens).toBe(1000)
      expect(params).not.toHaveProperty('temperature')
      expect(params).not.toHaveProperty('top_p')
      expect(params).not.toHaveProperty('top_k')
    })
  })
})
