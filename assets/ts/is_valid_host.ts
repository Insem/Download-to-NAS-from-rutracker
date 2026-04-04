export default function is_valid_host(hostString: string): boolean {
  // Regular expression for validating host:port format
  // Supports IPv4, IPv6, hostnames, and ports
  const hostPattern = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])|(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})|(\[([0-9a-fA-F:]+)\]):(\d{1,5})$/;

  // Alternative simpler regex for common cases
  const simpleHostPattern = /^([a-zA-Z0-9.-]+|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|\[[0-9a-fA-F:]+\]):(\d{1,5})$/;

  // Check if string matches the pattern
  if (!simpleHostPattern.test(hostString)) {
    return false;
  }

  // Split into host and port parts
  const lastColonIndex = hostString.lastIndexOf(':');
  const host = hostString.substring(0, lastColonIndex);
  const portStr = hostString.substring(lastColonIndex + 1);

  // Validate port number (1-65535)
  const port = parseInt(portStr, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    return false;
  }

  // Special validation for IPv4 addresses
  if (host.startsWith("-") || host.endsWith("-") || /^\.|\.{2,}|\.$/.test(host)) {
    return false;
  }

  if (host.includes('.')) {
    const ipParts = host.split('.');
    if (ipParts.length === 4) {
      for (const part of ipParts) {
        const num = parseInt(part, 10);
        if (isNaN(num) || num < 0 || num > 255) {
          return false;
        }
      }
    }
  }

  return true;
}
