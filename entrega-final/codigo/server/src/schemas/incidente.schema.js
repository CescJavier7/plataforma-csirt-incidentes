const { z } = require('zod');
const sanitizeHtml = require('sanitize-html');

const sanitizarTexto = (valor) => {
  if (typeof valor !== 'string') return valor;
  return sanitizeHtml(valor, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
};

const PrioridadEnum = z.enum(['BAJA', 'MEDIA', 'ALTA', 'CRITICA'], {
  errorMap: () => ({
    message: 'Prioridad debe ser BAJA, MEDIA, ALTA o CRITICA',
  }),
});

const EstadoEnum = z.enum(['ABIERTO', 'EN_PROCESO', 'RESUELTO', 'CERRADO'], {
  errorMap: () => ({
    message: 'Estado debe ser ABIERTO, EN_PROCESO, RESUELTO o CERRADO',
  }),
});

const incidenteSchema = z.object({
  titulo: z
    .string({ required_error: 'El título es obligatorio' })
    .trim()
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(120, 'El título no puede superar los 120 caracteres')
    .transform(sanitizarTexto),

  descripcion: z
    .string({ required_error: 'La descripción requiere mínimo 10 caracteres' })
    .trim()
    .min(10, 'La descripción requiere mínimo 10 caracteres')
    .max(2000, 'La descripción no puede superar los 2000 caracteres')
    .transform(sanitizarTexto),

  prioridad: PrioridadEnum.default('MEDIA'),
  estado: EstadoEnum.default('ABIERTO'),
  resolucion: z.string().trim().max(1000).transform(sanitizarTexto).optional(),
});

const crearIncidenteSchema = incidenteSchema;

const actualizarIncidenteSchema = z
  .object({
    titulo: z
      .string()
      .trim()
      .min(5, 'El título debe tener al menos 5 caracteres')
      .max(120, 'El título no puede superar los 120 caracteres')
      .transform(sanitizarTexto)
      .optional(),
    descripcion: z
      .string()
      .trim()
      .min(10, 'La descripción requiere mínimo 10 caracteres')
      .max(2000, 'La descripción no puede superar los 2000 caracteres')
      .transform(sanitizarTexto)
      .optional(),
    prioridad: PrioridadEnum.optional(),
    estado: EstadoEnum.optional(),
    resolucion: z.string().trim().max(1000).transform(sanitizarTexto).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar',
  });

const listarIncidentesQuerySchema = z.object({
  estado: EstadoEnum.optional(),
  prioridad: PrioridadEnum.optional(),
});

module.exports = {
  incidenteSchema,
  crearIncidenteSchema,
  actualizarIncidenteSchema,
  listarIncidentesQuerySchema,
  sanitizarTexto,
};
