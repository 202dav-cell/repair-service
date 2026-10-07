/* DAV Service — formatting helpers */
function formatRepairNumber(number) {
    if (number === null || number === undefined) return '—';
    return String(number).padStart(6, '0');
}

function formatDate(date) {
    if (!date) return '—';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
