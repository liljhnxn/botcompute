/**
 * BotNS-Ready Identity Abstraction.
 * In production or once BotNS is deployed on Botchain, this resolver will query the
 * BotNS registry contract or reverse resolver to resolve addresses to '.bot' domains.
 *
 * NOTE: As per protocol requirements, no synthetic or fake .bot domains are fabricated.
 * Currently returns formatted address or registered identity.
 */
export async function resolveIdentity(address?: string): Promise<{
  name: string;
  isBotNS: boolean;
  rawAddress: string;
}> {
  if (!address) {
    return { name: "Unknown", isBotNS: false, rawAddress: "" };
  }

  // Future BotNS integration placeholder:
  // const botNsName = await botNsResolver.reverseResolve(address);
  // if (botNsName) return { name: botNsName, isBotNS: true, rawAddress: address };

  return {
    name: address,
    isBotNS: false,
    rawAddress: address,
  };
}

/**
 * Format address for UI display (e.g. 0x1234...5678)
 */
export function formatAddress(address?: string, chars = 4): string {
  if (!address) return "";
  if (address.length <= chars * 2 + 2) return address;
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}
