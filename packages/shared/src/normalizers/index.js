const serviceAliases = {
    'disney plus': 'Disney+',
    'disney+': 'Disney+',
    spotify: 'Spotify',
    hulu: 'Hulu',
    espn: 'ESPN+',
    'espn+': 'ESPN+',
    'apple tv': 'Apple TV+',
    'apple tv+': 'Apple TV+',
};
const currencyLocaleFallback = {
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    CAD: 'en-CA',
    AUD: 'en-AU',
};
export function canonicalizeServiceName(value) {
    const key = value.trim().toLowerCase();
    return serviceAliases[key] ?? value.trim();
}
export function uniqueCanonicalServices(services) {
    const deduped = new Set();
    services.forEach((service) => deduped.add(canonicalizeServiceName(service)));
    return Array.from(deduped);
}
export function formatCurrency(amount, currency, locale) {
    const formatter = new Intl.NumberFormat(locale ?? currencyLocaleFallback[currency] ?? 'en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
    });
    return formatter.format(amount);
}
export function formatPrice(bundle, locale) {
    const formatted = formatCurrency(bundle.price, bundle.currency, locale);
    return `${formatted}/${bundle.billingCycle} ${bundle.currency}`;
}
export function normalizeSearchText(value) {
    return value.trim().toLowerCase();
}
//# sourceMappingURL=index.js.map