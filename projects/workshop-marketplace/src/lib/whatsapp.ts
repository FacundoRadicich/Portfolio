export function buildWhatsAppUrl(phone: string, message: string): string {
  const cleaned = phone.replace(/\D/g, '')
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${cleaned}?text=${encoded}`
}

export function buildWorkshopWhatsAppUrl(params: {
  phone: string
  workshopTitle: string
  date: Date
  city: string
}): string {
  const dateStr = params.date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const message = `Hola! Me interesa el taller "${params.workshopTitle}" del ${dateStr} en ${params.city}. ¿Hay cupos disponibles?`
  return buildWhatsAppUrl(params.phone, message)
}
