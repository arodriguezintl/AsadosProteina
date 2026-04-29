/**
 * Utility for formatting numbers and currency according to the system standard.
 * Uses 'en-US' locale to ensure commas for thousands and dots for decimals.
 */

export const formatNumber = (num: number | string | undefined | null): string => {
    if (num === undefined || num === null) return '0.00';
    const value = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(value)) return '0.00';
    
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
};

export const formatCurrency = (num: number | string | undefined | null): string => {
    return `$${formatNumber(num)}`;
};

/**
 * Formats a percentage value with specified precision.
 */
export const formatPercent = (num: number | string | undefined | null, precision: number = 1): string => {
    if (num === undefined || num === null) return `0${precision > 0 ? '.' + '0'.repeat(precision) : ''}%`;
    const value = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(value)) return `0${precision > 0 ? '.' + '0'.repeat(precision) : ''}%`;

    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision
    }).format(value) + '%';
};
