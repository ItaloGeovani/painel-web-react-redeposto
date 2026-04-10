export function isoParaDatetimeLocal(iso) {
  if (!iso) {
    return "";
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function datetimeLocalParaIso(s) {
  if (!s) {
    return "";
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  return d.toISOString();
}
