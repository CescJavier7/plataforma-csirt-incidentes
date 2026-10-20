const { z } = require('zod');

const PrioridadEnum = z.enum(['BAJA', 'MEDIA', 'ALTA', 'CRITICA'], {
  errorMap: () => ({ message: 'La prioridad debe ser BAJA, MEDIA, ALTA o CRITICA' }),
});

const EstadoEnum = z.enum(['ABIERTO', 'EN_PROCESO', 'RESUELTO', 'CERRADO'], {
  errorMap: () => ({ message: 'El estado debe ser ABIERTO, EN_PROCESO, RESUELTO o CERRADO' }),
});

const crearIncidenteSchema = z.object({
  titulo: z
    .string({ required_error: 'El título es obligatorio', invalid_type_error: 'El título debe ser texto' })
    .trim()
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(120, 'El título no puede exceder 120 caracteres'),
  descripcion: z
    .string({ required_error: 'La descripción es obligatoria', invalid_type_error: 'La descripción debe ser texto' })
    .trim()
    .min(10, 'La descripción debe tener al menos 10 caracteres'),
  prioridad: PrioridadEnum.optional().default('MEDIA'),
  estado: EstadoEnum.optional().default('ABIERTO'),
});

const actualizarIncidenteSchema = z
  .object({
    titulo: z
      .string()
      .trim()
      .min(5, 'El título debe tener al menos 5 caracteres')
      .max(120, 'El título no puede exceder 120 caracteres')
      .optional(),
    descripcion: z
      .string()
      .trim()
      .min(10, 'La descripción debe tener al menos 10 caracteres')
      .optional(),
    prioridad: PrioridadEnum.optional(),
    estado: EstadoEnum.optional(),
    resolucion: z.string().trim().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar',
  });

const filtrosIncidenteSchema = z.object({
  estado: EstadoEnum.optional(),
  prioridad: PrioridadEnum.optional(),
});

module.exports = {
  crearIncidenteSchema,
  actualizarIncidenteSchema,
  filtrosIncidenteSchema,
  PrioridadEnum,
  EstadoEnum,
};
