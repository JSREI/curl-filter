import { describe, it, expect } from 'vitest'
import { parseCurl, type ParsedCurl } from '../curlParser'

describe('curlParser', () => {
  describe('parseCurl', () => {
    it('should parse basic GET request', () => {
      const curl = 'curl https://api.example.com/users'
      const result = parseCurl(curl)
      
      expect(result.url).toBe('https://api.example.com/users')
      expect(result.method).toBe('GET')
      expect(result.headers).toEqual({})
      expect(result.queryParams).toEqual({})
      expect(result.formData).toEqual({})
      expect(result.jsonBody).toBeNull()
    })

    it('should parse POST request with JSON data', () => {
      const curl = `curl -X POST https://api.example.com/users \\
        -H "Content-Type: application/json" \\
        -d '{"name": "John", "email": "john@example.com"}'`
      
      const result = parseCurl(curl)
      
      expect(result.url).toBe('https://api.example.com/users')
      expect(result.method).toBe('POST')
      expect(result.headers['content-type']).toBe('application/json')
      expect(result.jsonBody).toEqual({
        name: 'John',
        email: 'john@example.com'
      })
    })

    it('should parse request with multiple headers', () => {
      const curl = `curl https://api.example.com/data \\
        -H "Authorization: Bearer token123" \\
        -H "User-Agent: MyApp/1.0" \\
        -H "Accept: application/json"`
      
      const result = parseCurl(curl)
      
      expect(result.headers).toEqual({
        'authorization': 'Bearer token123',
        'user-agent': 'MyApp/1.0',
        'accept': 'application/json'
      })
    })

    it('should parse request with query parameters', () => {
      const curl = 'curl "https://api.example.com/search?q=test&limit=10&sort=date"'
      const result = parseCurl(curl)
      
      expect(result.url).toBe('https://api.example.com/search?q=test&limit=10&sort=date')
      expect(result.queryParams).toEqual({
        q: 'test',
        limit: '10',
        sort: 'date'
      })
    })

    it('should parse request with form data', () => {
      const curl = `curl -X POST https://api.example.com/form \\
        -H "Content-Type: application/x-www-form-urlencoded" \\
        -d "username=john&password=secret&remember=true"`
      
      const result = parseCurl(curl)
      
      expect(result.method).toBe('POST')
      expect(result.headers['content-type']).toBe('application/x-www-form-urlencoded')
      expect(result.formData).toEqual({
        username: 'john',
        password: 'secret',
        remember: 'true'
      })
    })

    it('should handle malformed JSON gracefully', () => {
      const curl = `curl -X POST https://api.example.com/users \\
        -H "Content-Type: application/json" \\
        -d '{"name": "John", invalid json}'`
      
      const result = parseCurl(curl)
      
      expect(result.jsonBody).toBeNull()
      expect(result.data).toBe('{"name": "John", invalid json}')
    })

    it('should parse complex curl with multiple options', () => {
      const curl = `curl -X PUT "https://api.example.com/users/123?version=2" \\
        -H "Authorization: Bearer abc123" \\
        -H "Content-Type: application/json" \\
        -H "X-Custom-Header: custom-value" \\
        -d '{"name": "Updated Name", "status": "active"}' \\
        --compressed \\
        --location`
      
      const result = parseCurl(curl)
      
      expect(result.method).toBe('PUT')
      expect(result.url).toBe('https://api.example.com/users/123?version=2')
      expect(result.headers).toEqual({
        'authorization': 'Bearer abc123',
        'content-type': 'application/json',
        'x-custom-header': 'custom-value'
      })
      expect(result.queryParams).toEqual({
        version: '2'
      })
      expect(result.jsonBody).toEqual({
        name: 'Updated Name',
        status: 'active'
      })
      expect(result.otherOptions).toContain('--compressed')
      expect(result.otherOptions).toContain('--location')
    })

    it('should handle empty or invalid curl commands', () => {
      expect(() => parseCurl('')).not.toThrow()
      expect(() => parseCurl('invalid command')).not.toThrow()
      expect(() => parseCurl('curl')).not.toThrow()
      
      const result = parseCurl('curl')
      expect(result.url).toBe('')
      expect(result.method).toBe('GET')
    })

    it('should normalize header names to lowercase', () => {
      const curl = `curl https://api.example.com \\
        -H "X-API-Key: secret" \\
        -H "x-custom-header: value"`

      const result = parseCurl(curl)

      expect(result.headers['x-api-key']).toBe('secret')
      expect(result.headers['x-custom-header']).toBe('value')
    })

    it('should handle quoted URLs with spaces', () => {
      const curl = 'curl "https://api.example.com/search?q=hello world&type=all"'
      const result = parseCurl(curl)
      
      expect(result.url).toBe('https://api.example.com/search?q=hello world&type=all')
      expect(result.queryParams).toEqual({
        q: 'hello world',
        type: 'all'
      })
    })
  })
})
