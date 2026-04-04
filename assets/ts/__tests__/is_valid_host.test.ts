import is_valid_host from '../is_valid_host';

describe('is_valid_host', () => {
  describe('Valid hostnames with ports', () => {
    it('should validate simple domain with port', () => {
      expect(is_valid_host('localhost:8080')).toBe(true);
      expect(is_valid_host('example.com:3000')).toBe(true);
      expect(is_valid_host('my-server:5000')).toBe(true);
      expect(is_valid_host('api.example.com:443')).toBe(true);
    });

    it('should validate subdomains with port', () => {
      expect(is_valid_host('sub.domain.com:8080')).toBe(true);
      expect(is_valid_host('a.b.c.example.com:9000')).toBe(true);
      expect(is_valid_host('api-v2.example.com:3000')).toBe(true);
    });

    it('should validate hostnames with hyphens', () => {
      expect(is_valid_host('my-host:8000')).toBe(true);
      expect(is_valid_host('test-server-1:1234')).toBe(true);
      expect(is_valid_host('multi-word-host-name:9999')).toBe(true);
    });
  });

  describe('Valid IPv4 addresses with ports', () => {
    it('should validate standard IPv4 addresses', () => {
      expect(is_valid_host('192.168.1.1:8080')).toBe(true);
      expect(is_valid_host('10.0.0.1:3000')).toBe(true);
      expect(is_valid_host('172.16.0.1:5000')).toBe(true);
      expect(is_valid_host('8.8.8.8:53')).toBe(true);
    });

    it('should validate IPv4 edge cases', () => {
      expect(is_valid_host('0.0.0.0:8080')).toBe(true);
      expect(is_valid_host('255.255.255.255:65535')).toBe(true);
      expect(is_valid_host('127.0.0.1:22')).toBe(true);
    });

    it('should reject invalid IPv4 octets', () => {
      expect(is_valid_host('256.1.1.1:8080')).toBe(false);
      expect(is_valid_host('1.256.1.1:8080')).toBe(false);
      expect(is_valid_host('1.1.256.1:8080')).toBe(false);
      expect(is_valid_host('1.1.1.256:8080')).toBe(false);
      expect(is_valid_host('-1.1.1.1:8080')).toBe(false);
      expect(is_valid_host('abc.1.1.1:8080')).toBe(false);
    });
  });

  describe('Valid IPv6 addresses with ports', () => {
    it('should validate IPv6 addresses', () => {
      expect(is_valid_host('[::1]:8080')).toBe(true);
      expect(is_valid_host('[2001:db8::1]:3000')).toBe(true);
      expect(is_valid_host('[fe80::1]:5000')).toBe(true);
    });

    it('should validate full IPv6 addresses', () => {
      expect(is_valid_host('[2001:0db8:85a3:0000:0000:8a2e:0370:7334]:443')).toBe(true);
      expect(is_valid_host('[fe80:0:0:0:0:0:0:1]:22')).toBe(true);
    });
  });

  describe('Port validation', () => {
    it('should validate valid port numbers', () => {
      expect(is_valid_host('localhost:1')).toBe(true);
      expect(is_valid_host('localhost:80')).toBe(true);
      expect(is_valid_host('localhost:443')).toBe(true);
      expect(is_valid_host('localhost:1024')).toBe(true);
      expect(is_valid_host('localhost:49151')).toBe(true);
      expect(is_valid_host('localhost:65535')).toBe(true);
    });

    it('should reject invalid port numbers', () => {
      expect(is_valid_host('localhost:0')).toBe(false);
      expect(is_valid_host('localhost:65536')).toBe(false);
      expect(is_valid_host('localhost:99999')).toBe(false);
      expect(is_valid_host('localhost:-1')).toBe(false);
      expect(is_valid_host('localhost:abc')).toBe(false);
      expect(is_valid_host('localhost:80a')).toBe(false);
    });
  });

  describe('Invalid formats', () => {
    it('should reject missing port', () => {
      expect(is_valid_host('localhost')).toBe(false);
      expect(is_valid_host('192.168.1.1')).toBe(false);
      expect(is_valid_host('example.com')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(is_valid_host('')).toBe(false);
    });

    it('should reject malformed hostnames', () => {
      expect(is_valid_host('-host:8080')).toBe(false);
      expect(is_valid_host('host-:8080')).toBe(false);
      expect(is_valid_host('host..com:8080')).toBe(false);
      expect(is_valid_host('.host:8080')).toBe(false);
      expect(is_valid_host('host.:8080')).toBe(false);
    });

    it('should reject invalid characters', () => {
      expect(is_valid_host('host_name:8080')).toBe(false);
      expect(is_valid_host('host@name:8080')).toBe(false);
      expect(is_valid_host('host#name:8080')).toBe(false);
      expect(is_valid_host('host$name:8080')).toBe(false);
      expect(is_valid_host('host%name:8080')).toBe(false);
    });

    it('should reject multiple colons', () => {
      expect(is_valid_host('localhost:8080:80')).toBe(false);
      expect(is_valid_host('192.168.1.1:8080:80')).toBe(false);
    });

    it('should reject trailing or leading spaces', () => {
      expect(is_valid_host(' localhost:8080')).toBe(false);
      expect(is_valid_host('localhost:8080 ')).toBe(false);
      expect(is_valid_host(' localhost:8080 ')).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle single-letter hostnames', () => {
      expect(is_valid_host('a:8080')).toBe(true);
      expect(is_valid_host('x:3000')).toBe(true);
    });

    it('should handle numeric hostnames', () => {
      expect(is_valid_host('123:8080')).toBe(true);
      expect(is_valid_host('12345:3000')).toBe(true);
    });

    it('should handle mixed case domain names', () => {
      expect(is_valid_host('MyServer:8080')).toBe(true);
      expect(is_valid_host('API-Example.Com:443')).toBe(true);
    });

    it('should validate ports as numbers only', () => {
      expect(is_valid_host('localhost:80a')).toBe(false);
      expect(is_valid_host('localhost:80.5')).toBe(false);
      expect(is_valid_host('localhost:80/')).toBe(false);
    });
  });

  describe('Common use cases', () => {
    it('should validate qBittorrent host formats', () => {
      expect(is_valid_host('192.168.1.100:8080')).toBe(true);
      expect(is_valid_host('localhost:8080')).toBe(true);
      expect(is_valid_host('nas.local:8080')).toBe(true);
      expect(is_valid_host('qbittorrent-server:8080')).toBe(true);
    });

    it('should validate common service ports', () => {
      expect(is_valid_host('localhost:80')).toBe(true);   // HTTP
      expect(is_valid_host('localhost:443')).toBe(true);  // HTTPS
      expect(is_valid_host('localhost:22')).toBe(true);   // SSH
      expect(is_valid_host('localhost:3306')).toBe(true); // MySQL
      expect(is_valid_host('localhost:5432')).toBe(true); // PostgreSQL
      expect(is_valid_host('localhost:27017')).toBe(true); // MongoDB
    });

    it('should reject non-standard protocols', () => {
      expect(is_valid_host('http://localhost:8080')).toBe(false);
      expect(is_valid_host('https://localhost:443')).toBe(false);
      expect(is_valid_host('ftp://localhost:21')).toBe(false);
    });
  });

  describe('Performance and edge cases', () => {
    it('should handle boundary port numbers', () => {
      expect(is_valid_host('localhost:1')).toBe(true);
      expect(is_valid_host('localhost:65535')).toBe(true);
      expect(is_valid_host('localhost:0')).toBe(false);
      expect(is_valid_host('localhost:65536')).toBe(false);
    });

    it('should handle whitespace in input', () => {
      // The function doesn't trim whitespace, so these should be false
      expect(is_valid_host(' localhost:8080')).toBe(false);
      expect(is_valid_host('localhost:8080 ')).toBe(false);
    });

    it('should be consistent with same input', () => {
      const testCases = [
        '192.168.1.1:8080',
        'localhost:3000',
        'example.com:443',
        '[::1]:8080',
      ];

      testCases.forEach(host => {
        const firstResult = is_valid_host(host);
        const secondResult = is_valid_host(host);
        expect(firstResult).toBe(secondResult);
      });
    });
  });
});
